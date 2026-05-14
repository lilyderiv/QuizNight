"use strict";

const redis = require("./redisClient");

const ROOM_TTL_S = 7200; // 2 saat

class RoomOperations {
  /**
   * Yeni oda oluşturur (Host quizi başlattığında, REST endpoint'ten).
   *
   * [ADD-2] totalQuestions parametresi eklendi.
   *
   * @param {string} pin
   * @param {string} hostId
   * @param {number} quizId
   * @param {number} sessionId
   * @param {number} totalQuestions  - Leaderboard { total } için
   */
  static async createRoom(pin, hostId, quizId, sessionId, totalQuestions = 0) {
    const roomKey = `room:${pin}`;
    const pipe = redis.pipeline();

    pipe.hset(roomKey, {
      status: "waiting",
      hostId,
      quizId: String(quizId),
      sessionId: String(sessionId),
      totalQuestions: String(totalQuestions), // [ADD-2]
      currentQuestionIdx: "0",
      currentQuestionId: "null",
      questionStartTime: "0",
    });
    pipe.expire(roomKey, ROOM_TTL_S);

    await pipe.exec();
  }

  /**
   * Oda meta verisini getirir.
   * @param {string} pin
   * @returns {object|null}
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
   *
   * [FIX-3] isGuest parametresi eklendi.
   *         Misafir bilgisi player_meta HASH'ine yazılır.
   *
   * @param {string}  pin
   * @param {string}  playerId   - kayıtlı user UUID veya "guest:{uuid}"
   * @param {string}  nickname
   * @param {string}  socketId
   * @param {boolean} isGuest
   */
  static async joinRoom(pin, playerId, nickname, socketId, isGuest = false) {
    const pipe = redis.pipeline();

    // Oyuncu kümesi
    pipe.sadd(`room:${pin}:players`, playerId);

    // Nickname HASH — [FIX-2] ayrı string key yerine HASH
    pipe.hset(`room:${pin}:player_names`, playerId, nickname);

    // Misafir meta — [FIX-3]
    pipe.hset(`room:${pin}:player_meta`, playerId, JSON.stringify({ isGuest }));

    // Başlangıç skoru (NX: varsa dokunma)
    pipe.zadd(`leaderboard:${pin}`, "NX", 0, playerId);

    // Socket session
    if (socketId) {
      pipe.hset(`session:${socketId}`, {
        playerId,
        roomPin: pin,
        isGuest: isGuest ? "1" : "0",
      });
      pipe.expire(`session:${socketId}`, ROOM_TTL_S);
    }

    // TTL yenile (katılımla oda aktif kalır)
    pipe.expire(`room:${pin}`, ROOM_TTL_S);
    pipe.expire(`room:${pin}:players`, ROOM_TTL_S);
    pipe.expire(`room:${pin}:player_names`, ROOM_TTL_S);
    pipe.expire(`room:${pin}:player_meta`, ROOM_TTL_S);
    pipe.expire(`leaderboard:${pin}`, ROOM_TTL_S);

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
   * Leaderboard push, WaitingRoom listesi ve finalizeSession için.
   *
   * [FIX-1] N+1 giderildi: nickname'ler HGETALL ile tek çekim.
   * [ADD-1] isGuest alanı eklendi.
   *
   * @param {string} pin
   * @returns {Array} [{ playerId, nickname, score, rank, isGuest }]
   */
  static async getPlayersWithScores(pin) {
    // Paralel: skor sıralaması + nickname haritası + meta haritası
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
        isGuest: meta.isGuest || false, // [ADD-1]
      });
    }
    return players;
  }
}

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

class ScoringOperations {
  /**
   * Yeni soruyu başlatır; sunucu saatini referans alır.
   * Soru değiştiğinde cevap kümesi temizlenir.
   *
   * @param {string} pin
   * @param {number} questionId
   * @param {number} questionIdx
   * @returns {number} serverTime (ms) — istemcilere referans
   */
  static async startQuestion(pin, questionId, questionIdx) {
    // Zaten bu soruda isek tekrar sıfırlama — idempotent
    const currentId = await redis.hget(`room:${pin}`, "currentQuestionId");
    if (currentId === String(questionId)) return;

    const serverTime = Date.now();
    await redis.hset(`room:${pin}`, {
      status: "playing",
      currentQuestionId: String(questionId),
      currentQuestionIdx: String(questionIdx),
      questionStartTime: String(serverTime),
    });
    return serverTime;
  }

  /**
   * Oyuncu cevabını işler ve puan hesaplar.
   *
   * - Her soru için ayrı cevap kümesi (room:{pin}:q{questionId}:answers)
   *   kullanılır; bu sayede sorular arası "alreadyAnswered" hatası olmaz.
   * - İstemciden gelen timeElapsedMs öncelikli kullanılır (doğru zamanlama).
   *   Yoksa sunucu-taraflı questionStartTime ile hesaplanır.
   *
   * Puan formülü: max(10, 1000 − floor(elapsed/limit × 1000))
   *
   * @param {string}  pin
   * @param {string}  playerId
   * @param {boolean} isCorrect
   * @param {number}  timeLimitMs    - Soru başına toplam süre (ms)
   * @param {number|null} questionId - Soru ID'si (per-question key için)
   * @param {number|null} timeElapsedMs - İstemcinin geçen süre ölçümü (ms)
   * @returns {{ points: number, alreadyAnswered: boolean }}
   */
  static async submitAnswer(
    pin,
    playerId,
    isCorrect,
    timeLimitMs = 30000,
    questionId = null,
    timeElapsedMs = null,
  ) {
    // Her soru için bağımsız cevap kümesi — sorular arası karışma olmaz
    const answersKey = questionId
      ? `room:${pin}:q${questionId}:answers`
      : `room:${pin}:answers`;

    const isNew = await redis.sadd(answersKey, playerId);
    if (isNew) await redis.expire(answersKey, ROOM_TTL_S);

    if (!isNew) return { points: 0, alreadyAnswered: true };
    if (!isCorrect) return { points: 0, alreadyAnswered: false };

    // Geçen süreyi belirle: istemci ölçümü > sunucu hesabı
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
   * Anlık liderlik tablosu.
   *
   * [FIX-1] N+1 giderildi: HGETALL ile tüm nickname'ler tek komut.
   *
   * @param {string} pin
   * @returns {Array} [{ rank, playerId, nickname, score, isGuest }]
   */
  static async getLeaderboard(pin) {
    // ZREVRANGE + player_names HGETALL + player_meta HGETALL paralel
    const [scoreData, nameMap, metaMap] = await Promise.all([
      redis.zrevrange(`leaderboard:${pin}`, 0, -1, "WITHSCORES"),
      redis.hgetall(`room:${pin}:player_names`),
      redis.hgetall(`room:${pin}:player_meta`),
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

      leaderboard.push({
        rank: leaderboard.length + 1,
        playerId,
        nickname,
        score,
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
  /**
   * Socket ID'den oturum bilgisi getirir.
   * @param {string} socketId
   * @returns {{ playerId, roomPin, isGuest }|null}
   */
  static async getSession(socketId) {
    const data = await redis.hgetall(`session:${socketId}`);
    if (!data || !data.playerId) return null;
    return {
      playerId: data.playerId,
      roomPin: data.roomPin,
      isGuest: data.isGuest === "1",
    };
  }

  /**
   * Bağlantı kesildiğinde çağrılır.
   * Oyuncu odadan atılmaz (reconnect için 60s beklenir).
   */
  static async handleDisconnect(socketId) {
    const session = await SessionOperations.getSession(socketId);
    if (session) await redis.del(`session:${socketId}`);
    return session;
  }

  /**
   * Yeniden bağlanma sonrası session yeniler.
   * @param {string} newSocketId
   * @param {string} playerId
   * @param {string} pin
   * @param {boolean} isGuest
   */
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
   *
   * [FIX-4] Dinamik nickname SCAN döngüsü kaldırıldı.
   *         Tüm oyuncu adları room:{pin}:player_names HASH'inde;
   *         tek DEL ile temizlenir.
   *
   * @param {string} pin
   */
  static async destroyRoom(pin) {
    await redis.del(
      `room:${pin}`,
      `room:${pin}:players`,
      `room:${pin}:player_names`, // [FIX-4]
      `room:${pin}:player_meta`,
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
