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
