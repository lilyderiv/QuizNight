const redis = require("./redisClient");

class ScoringManager {
  // 1. Sorunun Başlaması (Server Saati Alınır)
  static async startQuestion(roomId, questionId) {
    const serverTime = Date.now(); // İstemci saati değil, Node.js sunucu saati

    await redis.hset(`room:${roomId}`, {
      status: "playing",
      currentQuestionId: questionId,
      questionStartTime: serverTime,
    });

    return serverTime; // İstemcilere referans olarak gönderilecek
  }

  // 2. Cevap Gönderimi ve Puan Hesaplama
  static async submitAnswer(roomId, playerId, isCorrect) {
    if (!isCorrect) return 0; // Yanlışsa puan yok

    // Odanın güncel durumunu ve sorunun ne zaman başladığını alıyoruz
    const roomData = await redis.hgetall(`room:${roomId}`);
    if (roomData.status !== "playing") return 0;

    const answerTime = Date.now();
    const startTime = parseInt(roomData.questionStartTime);

    // Hız hesaplaması (Milisaniye cinsinden geçen süre)
    const timeTaken = answerTime - startTime;

    // Örnek Puan Algoritması: 10 saniye (10000ms) üzerinden azalan puan
    const maxTimeLimit = 10000;
    let points = 1000 - Math.floor((timeTaken / maxTimeLimit) * 1000);

    // Negatif puanı engelle, en az 10 puan garanti olsun
    points = Math.max(10, points);

    // Redis üzerinde skoru atomik olarak (ZINCRBY) artırıyoruz
    await redis.zincrby(`leaderboard:${roomId}`, points, playerId);

    return points;
  }

  // 3. Güncel Puan Tablosunu Çekme
  static async getLeaderboard(roomId) {
    // En yüksekten en düşüğe (ZREVRANGE) skorlarla beraber (WITHSCORES) getir
    const results = await redis.zrevrange(
      `leaderboard:${roomId}`,
      0,
      -1,
      "WITHSCORES",
    );

    const leaderboard = [];
    // Redis bu veriyi düz bir array olarak döner: ["player1", "900", "player2", "850"]
    // Bunu JSON formatına dönüştürüyoruz
    for (let i = 0; i < results.length; i += 2) {
      leaderboard.push({
        playerId: results[i],
        score: parseInt(results[i + 1]),
      });
    }

    return leaderboard;
  }
}

module.exports = ScoringManager;
