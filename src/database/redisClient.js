const Redis = require("ioredis");

// Docker üzerindeki Redis'e bağlanıyoruz
const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
  // İşletim Riskleri: Olası bir anlık kopmada yeniden bağlanma stratejisi
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on("connect", () => {
  console.log("✅ Redis bağlantısı başarıyla sağlandı.");
});

redis.on("error", (err) => {
  console.error("❌ Redis bağlantı hatası:", err);
});

module.exports = redis;
