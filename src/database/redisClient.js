/**
 * redisClient.js  (REFACTORED v2.0)
 * ─────────────────────────────────────────────────────────────
 * Paylaşılan Redis bağlantı instance'ı.
 * Tüm operasyon modülleri bu dosyadan import eder.
 * ─────────────────────────────────────────────────────────────
 */

"use strict";

const Redis = require("ioredis");

const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT) || 6379,

  // Geçici kopmalarda katlanarak artan bekleme süresi (max 2s)
  retryStrategy: (times) => {
    if (times > 20) {
      console.error("❌ Redis: 20 denemeden sonra vazgeçildi.");
      return null; // null döndürmek yeniden denemeyi durdurur
    }
    return Math.min(times * 50, 2000);
  },

  // Komut zaman aşımı (ms) — takılı kalan komutların tespit edilmesi
  commandTimeout: 5000,
});

redis.on("connect", () => {
  console.log("Redis bağlantısı başarıyla sağlandı.");
});

redis.on("error", (err) => {
  console.error("Redis bağlantı hatası:", err.message);
});

redis.on("reconnecting", (delay) => {
  console.warn(` Redis yeniden bağlanıyor... (${delay}ms sonra)`);
});

module.exports = redis;
