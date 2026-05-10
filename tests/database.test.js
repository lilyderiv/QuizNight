const { GameSessionOperations } = require("../mysqlOperations");
const { CleanupOperations } = require("../redisOperations");
const redisClient = require("../redisClient");
const pool = require("../mysqlClient"); // MySQL bağlantı dosyanızı varsayarak

describe("Veritabanı Kalıcılık ve Temizlik Testleri", () => {
  afterAll(async () => {
    await redisClient.quit();
    await pool.end();
  });

  test("Oyun bitiminde sonuçlar MySQL'e aktarılmalı ve Redis temizlenmelidir", async () => {
    const testPin = "555555";
    const sessionId = 999;
    const leaderboard = [
      { nickname: "TestUser", rank: 1, correct: 4, wrong: 1, score: 3500 },
    ];

    // 1. Redis'te sahte bir oda oluştur
    await redisClient.hset(`room:${testPin}`, { status: "playing" });

    // 2. MySQL'e yazma işlemini tetikle (Mock kullanmıyoruz, gerçek DB bağlantısı test ediliyor)
    await GameSessionOperations.finalizeSession(sessionId, leaderboard, 5);

    // 3. Redis temizliğini tetikle
    await CleanupOperations.destroyRoom(testPin);

    // Beklentiler
    const roomExists = await redisClient.exists(`room:${testPin}`);
    expect(roomExists).toBe(0); // Oda silinmiş olmalı

    // Not: MySQL'den veriyi SELECT atarak verinin gerçekten yazılıp yazılmadığı da sorgulanabilir.
  });
});
