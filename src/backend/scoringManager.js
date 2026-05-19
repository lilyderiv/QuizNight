/**
 * scoringManager.js  (REFACTORED v2.0)
 * ─────────────────────────────────────────────────────────────
 * Düşük seviyeli puan hesaplama yardımcısı.
 * Bu modül artık doğrudan Redis'e değil, redisOperations.js
 * üzerinden erişir. Socket.io handler'ları bu modülü değil,
 * roomManager.js'yi çağırmalıdır.
 * ─────────────────────────────────────────────────────────────
 */

"use strict";

const { ScoringOperations } = require("./redisOperations");

class ScoringManager {
  /**
   * Soruyu başlatır, sunucu saatini döner.
   * @param {string} pin
   * @param {number} questionId
   * @param {number} questionIdx
   * @returns {number} serverTime (ms) — istemcilere referans olarak gönderilir
   */
  static async startQuestion(pin, questionId, questionIdx = 0) {
    return ScoringOperations.startQuestion(pin, questionId, questionIdx);
  }

  /**
   * Cevabı işler, puanı hesaplar ve Redis'e yazar.
   * @param {string}  pin
   * @param {string}  playerId
   * @param {boolean} isCorrect      — doğruluk dışarıda (MySQL'de) belirlenir
   * @param {number}  timeLimitMs    — quizden gelen süre limiti
   * @returns {{ points: number, alreadyAnswered: boolean }}
   */
  static async submitAnswer(pin, playerId, isCorrect, timeLimitMs = 30000) {
    return ScoringOperations.submitAnswer(
      pin,
      playerId,
      isCorrect,
      timeLimitMs,
    );
  }

  /**
   * Anlık liderlik tablosunu döner (sıralı, nicknameli).
   * @param {string} pin
   * @returns {Array} [{ rank, playerId, nickname, score }]
   */
  static async getLeaderboard(pin) {
    return ScoringOperations.getLeaderboard(pin);
  }
}

module.exports = ScoringManager;
