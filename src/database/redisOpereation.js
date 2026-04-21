const Redis = require("ioredis");

const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

class RedisOperations {
  // --- ODA (ROOM) YÖNETİMİ ---

  static async createRoom(roomId, hostId) {
    const roomKey = `room:${roomId}`;
    await redis.hset(roomKey, {
      status: "waiting",
      hostId: hostId,
      currentQuestionId: "null",
      questionStartTime: 0,
    });
    await redis.expire(roomKey, 7200); // 2 saat sonra RAM'den otomatik temizle
    return true;
  }

  static async joinRoom(roomId, playerId, socketId) {
    const pipeline = redis.pipeline();

    // Oyuncuyu listeye ekle ve 0 puanla başlat
    pipeline.sadd(`room:${roomId}:players`, playerId);
    pipeline.zadd(`leaderboard:${roomId}`, "NX", 0, playerId);

    // Kopma durumunda (reconnect) oyuncuyu bulabilmek için session map
    if (socketId) {
      pipeline.hset(`session:${socketId}`, "playerId", playerId);
    }

    await pipeline.exec();
  }

  static async setPlayerReady(roomId, playerId) {
    await redis.sadd(`room:${roomId}:ready_players`, playerId);
  }

  static async checkAllReady(roomId) {
    const totalPlayers = await redis.scard(`room:${roomId}:players`);
    const readyPlayers = await redis.scard(`room:${roomId}:ready_players`);
    return totalPlayers > 0 && totalPlayers === readyPlayers;
  }

  // --- SENKRONİZASYON VE PUANLAMA ---

  static async startQuestion(roomId, questionId) {
    const serverTime = Date.now(); // İstemci saati bypass edilir (Hack önlemi)
    await redis.hset(`room:${roomId}`, {
      status: "playing",
      currentQuestionId: questionId,
      questionStartTime: serverTime,
    });
    return serverTime;
  }

  static async submitAnswer(roomId, playerId, isCorrect) {
    if (!isCorrect) return 0;

    const roomData = await redis.hgetall(`room:${roomId}`);
    if (roomData.status !== "playing") return 0;

    const answerTime = Date.now();
    const startTime = parseInt(roomData.questionStartTime);
    const timeTaken = answerTime - startTime;

    const maxTimeLimit = 10000; // 10 saniye
    let points = 1000 - Math.floor((timeTaken / maxTimeLimit) * 1000);
    points = Math.max(10, points); // Minimum 10 puan garantisi

    // Atomik skor artırımı (Race condition önlemi)
    await redis.zincrby(`leaderboard:${roomId}`, points, playerId);
    return points;
  }

  static async getLeaderboard(roomId) {
    const results = await redis.zrevrange(
      `leaderboard:${roomId}`,
      0,
      -1,
      "WITHSCORES",
    );
    const leaderboard = [];

    for (let i = 0; i < results.length; i += 2) {
      leaderboard.push({
        playerId: results[i],
        score: parseInt(results[i + 1]),
      });
    }
    return leaderboard;
  }

  // --- SİSTEM TEMİZLİĞİ ---

  static async handleDisconnect(socketId) {
    const playerId = await redis.hget(`session:${socketId}`, "playerId");
    if (playerId) {
      // Reconnect ihtimaline karşı oyuncu odadan atılmaz, sadece session silinir
      await redis.del(`session:${socketId}`);
    }
    return playerId;
  }

  static async destroyRoom(roomId) {
    await redis.del(
      `room:${roomId}`,
      `room:${roomId}:players`,
      `room:${roomId}:ready_players`,
      `leaderboard:${roomId}`,
    );
  }
}

module.exports = RedisOperations;
