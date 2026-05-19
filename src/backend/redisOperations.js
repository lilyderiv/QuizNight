"use strict";

const redis = require("./redisClient");

const ROOM_TTL_S = 7200; // 2 saat

// ─────────────────────────────────────────────────────────────
//  ODA İŞLEMLERİ
// ─────────────────────────────────────────────────────────────

class RoomOperations {
  /**
   * Yeni oda oluşturur.
   */
  static async createRoom(pin, hostId, quizId, sessionId, totalQuestions = 0) {
    const roomKey = `room:${pin}`;
    const pipe = redis.pipeline();

    pipe.hset(roomKey, {
      status: "waiting",
      hostId,
      quizId: String(quizId),
      sessionId: String(sessionId),
      totalQuestions: String(totalQuestions),
      currentQuestionIdx: "0",
      currentQuestionId: "null",
      questionStartTime: "0",
    });
    pipe.expire(roomKey, ROOM_TTL_S);

    await pipe.exec();
  }

  /**
   * Oda meta verisini getirir.
   */
  static async getRoom(pin) {
    const data = await redis.hgetall(`room:${pin}`);
    if (!data || !data.hostId) return null;
    return data;
  }

  static async setRoomStatus(pin, status) {
    await redis.hset(`room:${pin}`, "status", status);
  }

  /**
   * Oyuncu odaya katılır.
   * Race-condition güvenli: SADD idempotent, ZADD NX yeniden sıfırlamaz.
   */
  static async joinRoom(pin, playerId, nickname, socketId, isGuest = false) {
    const pipe = redis.pipeline();

    pipe.sadd(`room:${pin}:players`, playerId);
    pipe.hset(`room:${pin}:player_names`, playerId, nickname);
    pipe.hset(`room:${pin}:player_meta`, playerId, JSON.stringify({ isGuest }));

    // Başlangıç skoru (NX: varsa dokunma)
    pipe.zadd(`leaderboard:${pin}`, "NX", 0, playerId);

    // Doğru/yanlış sayacı — başlangıç
    pipe.hsetnx(
      `room:${pin}:player_stats`,
      playerId,
      JSON.stringify({ correct: 0, wrong: 0 }),
    );

    if (socketId) {
      pipe.hset(`session:${socketId}`, {
        playerId,
        roomPin: pin,
        isGuest: isGuest ? "1" : "0",
      });
      pipe.expire(`session:${socketId}`, ROOM_TTL_S);
    }

    pipe.expire(`room:${pin}`, ROOM_TTL_S);
    pipe.expire(`room:${pin}:players`, ROOM_TTL_S);
    pipe.expire(`room:${pin}:player_names`, ROOM_TTL_S);
    pipe.expire(`room:${pin}:player_meta`, ROOM_TTL_S);
    pipe.expire(`room:${pin}:player_stats`, ROOM_TTL_S);
    pipe.expire(`leaderboard:${pin}`, ROOM_TTL_S);

    await pipe.exec();
  }

  /**
   * Odadan oyuncuyu çıkar (bekleme odasından ayrılma).
   */
  static async leaveRoom(pin, playerId, socketId) {
    const pipe = redis.pipeline();
    pipe.srem(`room:${pin}:players`, playerId);
    pipe.hdel(`room:${pin}:player_names`, playerId);
    pipe.hdel(`room:${pin}:player_meta`, playerId);
    pipe.hdel(`room:${pin}:player_stats`, playerId);
    pipe.zrem(`leaderboard:${pin}`, playerId);
    if (socketId) pipe.del(`session:${socketId}`);
    await pipe.exec();
  }

  /**
   * Odadaki oyuncu sayısı.
   */
  static async getPlayerCount(pin) {
    return redis.scard(`room:${pin}:players`);
  }

  /**
   * Tüm oyuncuları anlık skorlarıyla döner.
   */
  static async getPlayersWithScores(pin) {
    const [scoreData, nameMap, metaMap] = await Promise.all([
      redis.zrevrange(`leaderboard:${pin}`, 0, -1, "WITHSCORES"),
      redis.hgetall(`room:${pin}:player_names`),
      redis.hgetall(`room:${pin}:player_meta`),
    ]);

    const players = [];
    for (let i = 0; i < scoreData.length; i += 2) {
      const playerId = scoreData[i];
      const score = parseInt(scoreData[i + 1], 10);
      const nickname = (nameMap && nameMap[playerId]) || playerId;
      const meta =
        metaMap && metaMap[playerId]
          ? JSON.parse(metaMap[playerId])
          : { isGuest: false };

      players.push({
        rank: players.length + 1,
        playerId,
        nickname,
        score,
        isGuest: meta.isGuest || false,
      });
    }
    return players;
  }
}

// ─────────────────────────────────────────────────────────────
//  HAZIR KONTROLÜ
// ─────────────────────────────────────────────────────────────

class ReadyOperations {
  static async setPlayerReady(pin, playerId) {
    await redis.sadd(`room:${pin}:ready`, playerId);
  }

  static async checkAllReady(pin) {
    const [total, ready] = await Promise.all([
      redis.scard(`room:${pin}:players`),
      redis.scard(`room:${pin}:ready`),
    ]);
    return total > 0 && total === ready;
  }

  static async resetReady(pin) {
    await redis.del(`room:${pin}:ready`);
  }
}

// ─────────────────────────────────────────────────────────────
//  PUANLAMA İŞLEMLERİ
// ─────────────────────────────────────────────────────────────

class ScoringOperations {
  /**
   * Yeni soruyu başlatır.
   * İDEMPOTENT: Aynı soru için tekrar çağrılırsa işlem yapmaz.
   * Bu sayede ağ sorunlarından kaynaklanan çift tetiklemeler güvenlidir.
   */
  static async startQuestion(pin, questionId, questionIdx) {
    // Zaten bu soruda isek tekrar sıfırlama
    const currentId = await redis.hget(`room:${pin}`, "currentQuestionId");
    if (currentId === String(questionId)) {
      // Mevcut sunucu zamanını döndür (istemci referansı için)
      const existingTime = await redis.hget(`room:${pin}`, "questionStartTime");
      return parseInt(existingTime || Date.now(), 10);
    }

    const serverTime = Date.now();
    await redis.hset(`room:${pin}`, {
      status: "playing",
      currentQuestionId: String(questionId),
      currentQuestionIdx: String(questionIdx),
      questionStartTime: String(serverTime),
    });
    // Per-question cevap seti — önceki sorularla karışmaz
    // (Her soru kendi key'ini kullanıyor: room:{pin}:q{questionId}:answers)
    return serverTime;
  }

  /**
   * Oyuncu cevabını işler ve puan hesaplar.
   *
   * - Her soru için ayrı cevap kümesi kullanılır (per-question key).
   *   Bu sayede soru değişiminde geçmiş cevaplar temizlenmeden
   *   yeni soruda "alreadyAnswered" hatası oluşmaz.
   * - isCorrect ve doğru/yanlış sayacı güncellenir.
   *
   * @param {string}  pin
   * @param {string}  playerId
   * @param {boolean} isCorrect
   * @param {number}  timeLimitMs
   * @param {number}  questionId        - per-question key için
   * @param {number|null} timeElapsedMs - istemci ölçümü
   * @returns {{ points, alreadyAnswered }}
   */
  static async submitAnswer(
    pin,
    playerId,
    isCorrect,
    timeLimitMs = 30000,
    questionId = null,
    timeElapsedMs = null,
  ) {
    // Per-question cevap kümesi
    const answersKey = questionId
      ? `room:${pin}:q${questionId}:answers`
      : `room:${pin}:answers`;

    const isNew = await redis.sadd(answersKey, playerId);
    if (isNew) await redis.expire(answersKey, ROOM_TTL_S);

    if (!isNew) return { points: 0, alreadyAnswered: true };

    // Doğru/yanlış sayacını güncelle
    const statsRaw = await redis.hget(`room:${pin}:player_stats`, playerId);
    const stats = statsRaw ? JSON.parse(statsRaw) : { correct: 0, wrong: 0 };

    if (isCorrect) {
      stats.correct += 1;
    } else {
      stats.wrong += 1;
    }
    await redis.hset(
      `room:${pin}:player_stats`,
      playerId,
      JSON.stringify(stats),
    );

    if (!isCorrect) return { points: 0, alreadyAnswered: false };

    // Geçen süreyi belirle: istemci ölçümü öncelikli
    let timeTaken;
    if (timeElapsedMs !== null && timeElapsedMs >= 0) {
      timeTaken = Math.min(timeElapsedMs, timeLimitMs);
    } else {
      const roomData = await redis.hgetall(`room:${pin}`);
      if (!roomData || roomData.status !== "playing") {
        return { points: 0, alreadyAnswered: false };
      }
      timeTaken = Date.now() - parseInt(roomData.questionStartTime || 0, 10);
    }

    const points = Math.max(
      10,
      1000 - Math.floor((timeTaken / timeLimitMs) * 1000),
    );

    await redis.zincrby(`leaderboard:${pin}`, points, playerId);
    return { points, alreadyAnswered: false };
  }

  /**
   * Anlık liderlik tablosu — doğru/yanlış sayılarıyla birlikte.
   */
  static async getLeaderboard(pin) {
    const [scoreData, nameMap, metaMap, statsMap] = await Promise.all([
      redis.zrevrange(`leaderboard:${pin}`, 0, -1, "WITHSCORES"),
      redis.hgetall(`room:${pin}:player_names`),
      redis.hgetall(`room:${pin}:player_meta`),
      redis.hgetall(`room:${pin}:player_stats`),
    ]);

    const leaderboard = [];
    for (let i = 0; i < scoreData.length; i += 2) {
      const playerId = scoreData[i];
      const score = parseInt(scoreData[i + 1], 10);
      const nickname = (nameMap && nameMap[playerId]) || playerId;
      const meta =
        metaMap && metaMap[playerId]
          ? JSON.parse(metaMap[playerId])
          : { isGuest: false };
      const stats =
        statsMap && statsMap[playerId]
          ? JSON.parse(statsMap[playerId])
          : { correct: 0, wrong: 0 };

      leaderboard.push({
        rank: leaderboard.length + 1,
        playerId,
        nickname,
        score,
        correct: stats.correct,
        wrong: stats.wrong,
        isGuest: meta.isGuest || false,
      });
    }
    return leaderboard;
  }
}

// ─────────────────────────────────────────────────────────────
//  OTURUM & BAĞLANTI KESİLME
// ─────────────────────────────────────────────────────────────

class SessionOperations {
  static async getSession(socketId) {
    const data = await redis.hgetall(`session:${socketId}`);
    if (!data || !data.playerId) return null;
    return {
      playerId: data.playerId,
      roomPin: data.roomPin,
      isGuest: data.isGuest === "1",
    };
  }

  static async handleDisconnect(socketId) {
    const session = await SessionOperations.getSession(socketId);
    if (session) await redis.del(`session:${socketId}`);
    return session;
  }

  static async refreshSession(newSocketId, playerId, pin, isGuest = false) {
    await redis.hset(`session:${newSocketId}`, {
      playerId,
      roomPin: pin,
      isGuest: isGuest ? "1" : "0",
    });
    await redis.expire(`session:${newSocketId}`, ROOM_TTL_S);
  }
}

// ─────────────────────────────────────────────────────────────
//  ODA TEMİZLİĞİ
// ─────────────────────────────────────────────────────────────

class CleanupOperations {
  /**
   * Oyun bitiminde tüm Redis key'lerini temizler.
   * MySQL'e yazma BU ÇAĞRIDAN ÖNCE tamamlanmış olmalıdır.
   * Per-question cevap keyleri TTL ile otomatik silinir;
   * burada yalnızca ana keyler temizlenir.
   */
  static async destroyRoom(pin) {
    await redis.del(
      `room:${pin}`,
      `room:${pin}:players`,
      `room:${pin}:player_names`,
      `room:${pin}:player_meta`,
      `room:${pin}:player_stats`,
      `room:${pin}:ready`,
      `room:${pin}:answers`,
      `leaderboard:${pin}`,
    );
  }
}

module.exports = {
  RoomOperations,
  ReadyOperations,
  ScoringOperations,
  SessionOperations,
  CleanupOperations,
};
