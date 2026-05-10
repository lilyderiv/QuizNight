const { ScoringOperations } = require("../redisOperations");
const redisClient = require("../redisClient");

describe("Puanlama (Scoring) Entegrasyon Testleri", () => {
  const testPin = "987654";
  const testPlayer = "user_123";

  beforeAll(async () => {
    // Test odasını ve oyuncuyu Redis'te manuel başlat
    await redisClient.hset(`room:${testPin}`, {
      currentQuestionIdx: "1",
      questionStartTime: Date.now().toString(),
    });
    await redisClient.hset(
      `room:${testPin}:players`,
      testPlayer,
      JSON.stringify({ score: 0 }),
    );
  });

  afterAll(async () => {
    await redisClient.del(`room:${testPin}`);
    await redisClient.del(`room:${testPin}:players`);
    await redisClient.quit();
  });

  test("Doğru cevap verildiğinde, kalan süreye göre puan eklenmelidir", async () => {
    const timeLimitMs = 30000;
    // Puanlama algoritmasını tetikle (doğru cevap kabul ediyoruz)
    const result = await ScoringOperations.submitAnswer(
      testPin,
      testPlayer,
      true,
      timeLimitMs,
    );

    expect(result.points).toBeGreaterThan(0);
    expect(result.alreadyAnswered).toBe(false);

    // Redis'teki güncel puana bak
    const playerRaw = await redisClient.hget(
      `room:${testPin}:players`,
      testPlayer,
    );
    const playerData = JSON.parse(playerRaw);
    expect(playerData.score).toBe(result.points);
  });
});
