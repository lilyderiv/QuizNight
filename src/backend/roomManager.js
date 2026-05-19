"use strict";

const {
  RoomOperations,
  ReadyOperations,
  ScoringOperations,
  SessionOperations,
  CleanupOperations,
} = require("./redisOperations");

const {
  QuizOperations,
  QuestionOperations,
  GameSessionOperations,
} = require("./mysqlOperations");

// ─────────────────────────────────────────────────────────────
//  SUNUCU BELLEK CACHE
//  pin → Map<questionId, { correctAnswerId, timeLimitMs }>
//  Oyun başlar → dolar | Oyun biter → temizlenir
// ─────────────────────────────────────────────────────────────
const questionCache = new Map();

// ─────────────────────────────────────────────────────────────
//  PIN ÜRETİCİ — BENZERSİZ PIN KONTROLÜ İLE
// ─────────────────────────────────────────────────────────────

function generatePin() {
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let pin = "";
  for (let i = 0; i < 6; i++) {
    pin += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return pin;
}

/**
 * Çakışma olmayan benzersiz PIN üretir.
 * Redis'te mevcut odayı kontrol eder; varsa yeniden dener.
 */
async function generateUniquePin() {
  let pin;
  let tries = 0;
  do {
    pin = generatePin();
    tries++;
    if (tries > 20)
      throw new Error("Benzersiz PIN üretilemedi. Lütfen tekrar deneyin.");
  } while (await RoomOperations.getRoom(pin));
  return pin;
}

// ─────────────────────────────────────────────────────────────
//  ODA KURULUMU  (REST API: POST /api/rooms)
// ─────────────────────────────────────────────────────────────

/**
 * Host quizi başlattığında:
 *  1. Quiz varlığı + HOST SAHİPLİĞİ doğrulanır.
 *  2. BENZERSİZ PIN üretilir (çakışma kontrolü ile).
 *  3. MySQL'de game_session oluşturulur.
 *  4. Redis'te oda kurulur.
 *
 * @param {string} hostId  - JWT'den gelen kullanıcı UUID
 * @param {number} quizId
 * @returns {{ pin, sessionId, quiz, totalQuestions }}
 */
async function createRoom(hostId, quizId) {
  const quiz = await QuizOperations.getQuizById(quizId);
  if (!quiz) throw new Error("Quiz bulunamadı.");

  // [KRİTİK] Host yetki kontrolü — başkasının quizini başlatmayı engelle
  if (quiz.owner_id !== hostId) {
    throw new Error("Bu quizi başlatma yetkiniz yok.");
  }

  const questions = await QuestionOperations.getQuestionsWithAnswers(quizId);
  const totalQuestions = questions.length;
  if (totalQuestions === 0) throw new Error("Bu quizde henüz soru yok.");

  // [KRİTİK] Benzersiz PIN — çakışma kontrolü ile
  const pin = await generateUniquePin();

  const sessionId = await GameSessionOperations.createSession(
    quizId,
    hostId,
    pin,
    totalQuestions,
  );

  await RoomOperations.createRoom(
    pin,
    hostId,
    quizId,
    sessionId,
    totalQuestions,
  );

  return { pin, sessionId, quiz, totalQuestions };
}

// ─────────────────────────────────────────────────────────────
//  ODAYA KATILIM  (Socket.io: join_room)
// ─────────────────────────────────────────────────────────────

/**
 * @returns {{ success, roomData?, players?, assignedPlayerId?, error? }}
 *   assignedPlayerId: misafir için backend'in atadığı ID döner
 */
async function joinRoom(pin, playerId, nickname, socketId, isGuest = false) {
  const roomData = await RoomOperations.getRoom(pin);

  if (!roomData)
    return { success: false, error: "Geçersiz PIN veya oda bulunamadı." };
  if (roomData.status !== "waiting")
    return { success: false, error: "Oyun zaten başladı." };

  await RoomOperations.joinRoom(pin, playerId, nickname, socketId, isGuest);
  const players = await RoomOperations.getPlayersWithScores(pin);

  return { success: true, roomData, players, assignedPlayerId: playerId };
}

/**
 * Bekleme odasından ayrılma.
 */
async function leaveRoom(pin, playerId, socketId) {
  await RoomOperations.leaveRoom(pin, playerId, socketId);
}

// ─────────────────────────────────────────────────────────────
//  OYUN BAŞLAT  (Socket.io: start_game — yalnızca host)
// ─────────────────────────────────────────────────────────────

/**
 * Soruları yükler, sunucu cache'ine alır ve sanitize eder.
 * istemcilere is_correct GÖNDERİLMEZ.
 */
async function startGame(pin) {
  const roomData = await RoomOperations.getRoom(pin);
  if (!roomData) throw new Error("Oda bulunamadı.");

  const quizId = parseInt(roomData.quizId, 10);
  const questions = await QuestionOperations.getQuestionsWithAnswers(quizId);
  if (questions.length === 0) throw new Error("Bu quizde soru yok.");

  const quizInfo = await QuizOperations.getQuizById(quizId);
  const timeLimitMs = quizInfo.time_per_q_s * 1000 || 30000;

  // Sunucu cache: questionId → { correctAnswerId, timeLimitMs }
  const qMap = new Map();
  for (const q of questions) {
    const correctAnswer = q.answers.find((a) => a.is_correct);
    qMap.set(q.id, {
      correctAnswerId: correctAnswer ? correctAnswer.id : null,
      timeLimitMs,
    });
  }
  questionCache.set(pin, qMap);

  await RoomOperations.setRoomStatus(pin, "playing");

  // İstemciye güvenli format (is_correct ve cevap ID'leri çıkartıldı)
  const sanitizedQuestions = questions.map((q) => ({
    id: q.id,
    text: q.text,
    imageUrl: q.image_url,
    time: timeLimitMs / 1000,
    answers: q.answers.map((a) => ({ id: a.id, text: a.text })),
  }));

  return { sanitizedQuestions, timeLimitMs };
}

// ─────────────────────────────────────────────────────────────
//  CEVAP İŞLE  (Socket.io: submit_answer)
// ─────────────────────────────────────────────────────────────

/**
 * @param {string} pin
 * @param {string} playerId
 * @param {number} selectedAnswerId
 * @param {number} questionId
 * @param {number} timeLimitMs
 * @param {number|null} timeElapsedMs - istemci ölçümü
 * @returns {{ points, isCorrect, alreadyAnswered, leaderboard }}
 */
async function submitAnswer(
  pin,
  playerId,
  selectedAnswerId,
  questionId,
  timeLimitMs = 30000,
  timeElapsedMs = null,
) {
  let isCorrect = false;
  const qMap = questionCache.get(pin);

  if (qMap && qMap.has(questionId)) {
    const cached = qMap.get(questionId);
    isCorrect = cached.correctAnswerId === selectedAnswerId;
    timeLimitMs = cached.timeLimitMs || timeLimitMs;
  } else {
    // Fallback: MySQL (cache ısınmamışsa veya sunucu restart sonrası)
    isCorrect = await QuestionOperations.checkAnswer(
      selectedAnswerId,
      questionId,
    );
  }

  const { points, alreadyAnswered } = await ScoringOperations.submitAnswer(
    pin,
    playerId,
    isCorrect,
    timeLimitMs,
    questionId,
    timeElapsedMs,
  );

  const leaderboard = await ScoringOperations.getLeaderboard(pin);
  return { points, isCorrect, alreadyAnswered, leaderboard };
}

// ─────────────────────────────────────────────────────────────
//  OYUN BİTİŞİ
// ─────────────────────────────────────────────────────────────

/**
 * Akış:
 *  1. Redis leaderboard okunur (correct/wrong dahil).
 *  2. game_sessions güncellenir (ended_at, player_count, total_questions).
 *  3. Her oyuncu için player_results INSERT (correct_count, wrong_count ile).
 *  4. Redis temizlenir.
 *  5. Bellek cache'i temizlenir.
 *
 * @returns {Array} finalLeaderboard — Leaderboard.js payload'ı
 */
async function finalizeAndDestroy(pin) {
  const roomData = await RoomOperations.getRoom(pin);
  if (!roomData) return [];

  const sessionId = parseInt(roomData.sessionId, 10);
  const totalQuestions = parseInt(roomData.totalQuestions, 10) || 0;

  // correct ve wrong alanları artık leaderboard içinde geliyor
  const leaderboard = await ScoringOperations.getLeaderboard(pin);

  await GameSessionOperations.finalizeSession(
    sessionId,
    leaderboard,
    totalQuestions,
  );
  await CleanupOperations.destroyRoom(pin);
  questionCache.delete(pin);

  // Frontend Leaderboard.js payload'ı
  return leaderboard.map((p) => ({
    id: p.rank,
    name: p.nickname,
    score: p.score,
    correct: p.correct,
    wrong: p.wrong,
    total: totalQuestions,
  }));
}

// ─────────────────────────────────────────────────────────────
//  BAĞLANTI KESİLME / YENİDEN BAĞLANMA
// ─────────────────────────────────────────────────────────────

async function handleDisconnect(socketId) {
  return SessionOperations.handleDisconnect(socketId);
}

async function handleReconnect(newSocketId, playerId, pin, isGuest = false) {
  return SessionOperations.refreshSession(newSocketId, playerId, pin, isGuest);
}

module.exports = {
  generateUniquePin,
  createRoom,
  joinRoom,
  leaveRoom,
  startGame,
  submitAnswer,
  finalizeAndDestroy,
  handleDisconnect,
  handleReconnect,
};
