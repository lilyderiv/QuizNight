/**
 * roomManager.js  (v3.0)
 * ─────────────────────────────────────────────────────────────
 * MySQL ve Redis operasyonlarını koordine eden üst seviye yönetici.
 * Socket.io event handler'ları doğrudan bu modülü çağırır.
 *
 *   Socket.io Events  →  roomManager
 *   roomManager       →  redisOperations  (gerçek zamanlı)
 *   roomManager       →  mysqlOperations  (kalıcı)
 *
 */

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
//  [ADD-1] SUNUCU BELLEK CACHE
//  pin → { questions: Map<questionId, { correctAnswerId, timeLimitMs }> }
//  Oyun başlar → dolar | Oyun biter → temizlenir
// ─────────────────────────────────────────────────────────────
const questionCache = new Map(); // pin → Map<questionId, answerInfo>

// ─────────────────────────────────────────────────────────────
//  PIN ÜRETİCİ
// ─────────────────────────────────────────────────────────────

/**
 * [FIX-1] Frontend ile uyumlu: A-Z + 0-9, 6 karakter.
 * EnterPin.js: .toUpperCase() + maxLength={6}
 * QuizSelect.js: generateRandomPin() aynı charset kullanıyor.
 * @returns {string} örn. "AB3K7Z"
 */
function generatePin() {
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let pin = "";
  for (let i = 0; i < 6; i++) {
    pin += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return pin;
}

// ─────────────────────────────────────────────────────────────
//  ODA KURULUMU  (REST API: POST /api/rooms)
// ─────────────────────────────────────────────────────────────

/**
 * Host quizi başlattığında:
 *  1. Quiz varlığı + sahiplik doğrulanır.
 *  2. MySQL'de game_session oluşturulur.
 *  3. Redis'te oda kurulur (totalQuestions dahil).
 *
 * [FIX-5] totalQuestions hem Redis'e hem MySQL'e yazılır.
 *
 * @param {string} hostId  - JWT'den gelen kullanıcı UUID
 * @param {number} quizId
 * @returns {{ pin, sessionId, quiz, totalQuestions }}
 */
async function createRoom(hostId, quizId) {
  const quiz = await QuizOperations.getQuizById(quizId);
  if (!quiz) throw new Error("Quiz bulunamadı.");

  // Soruları sayımla al (cache için henüz erken; startGame'de dolar)
  const questions = await QuestionOperations.getQuestionsWithAnswers(quizId);
  const totalQuestions = questions.length;
  if (totalQuestions === 0) throw new Error("Bu quizde henüz soru yok.");

  const pin = generatePin();
  const sessionId = await GameSessionOperations.createSession(
    quizId,
    hostId,
    pin,
    totalQuestions, // [ADD-1] totalQuestions
  );

  // [FIX-5] totalQuestions Redis'e de yazılır
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
 * @param {string}  pin
 * @param {string}  playerId   - kayıtlı user UUID veya "guest:{uuid}"
 * @param {string}  nickname   - EnterPin.js playerNickname / QuizPinDetails hostNickname
 * @param {string}  socketId
 * @param {boolean} isGuest
 * @returns {{ success: boolean, roomData?: object, players?: Array, error?: string }}
 */
async function joinRoom(pin, playerId, nickname, socketId, isGuest = false) {
  const roomData = await RoomOperations.getRoom(pin);

  if (!roomData)
    return { success: false, error: "Geçersiz PIN veya oda bulunamadı." };
  if (roomData.status !== "waiting")
    return { success: false, error: "Oyun zaten başladı." };

  await RoomOperations.joinRoom(pin, playerId, nickname, socketId, isGuest);
  const players = await RoomOperations.getPlayersWithScores(pin);

  return { success: true, roomData, players };
}

// ─────────────────────────────────────────────────────────────
//  OYUN BAŞLAT  (Socket.io: start_game — yalnızca host)
// ─────────────────────────────────────────────────────────────

/**
 * Soruları yükler, sunucu cache'ine alır ve sanitize eder.
 * İstemcilere is_correct GÖNDERİLMEZ.
 *
 * [ADD-1] questionCache doldurulur → submitAnswer MySQL'e gitmez.
 *
 * @param {string} pin
 * @returns {{ sanitizedQuestions: Array, timeLimitMs: number }}
 */
async function startGame(pin) {
  const roomData = await RoomOperations.getRoom(pin);
  if (!roomData) throw new Error("Oda bulunamadı.");

  const quizId = parseInt(roomData.quizId, 10);
  const questions = await QuestionOperations.getQuestionsWithAnswers(quizId);
  if (questions.length === 0) throw new Error("Bu quizde soru yok.");

  const timeLimitMs =
    parseInt(roomData.timeLimitMs || 0, 10) ||
    (await QuizOperations.getQuizById(quizId)).time_per_q_s * 1000 ||
    30000;

  // [ADD-1] Sunucu cache: questionId → { correctAnswerId, timeLimitMs }
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

  // İstemciye güvenli format (is_correct çıkartıldı)
  const sanitizedQuestions = questions.map((q) => ({
    id: q.id,
    text: q.text, // question_text alias
    imageUrl: q.image_url,
    time: timeLimitMs / 1000,
    // Sadece metin dizisi — PlayingQuiz.js answers.map(ans => ...) ile eşleşir
    answers: q.answers.map((a) => a.text),
  }));

  return { sanitizedQuestions, timeLimitMs };
}

// ─────────────────────────────────────────────────────────────
//  SORU BAŞLAT  (Socket.io: host her soruya geçtiğinde)
// ─────────────────────────────────────────────────────────────

/**
 * [FIX-4] timeLimitMs artık ScoringOperations.startQuestion'a iletiliyor.
 * Eski implementasyonda parametre alınıyor ama kullanılmıyordu.
 *
 * @param {string} pin
 * @param {number} questionId
 * @param {number} questionIdx
 * @param {number} timeLimitMs
 * @returns {number} serverTime (ms)
 */
async function startQuestion(pin, questionId, questionIdx, timeLimitMs) {
  // timeLimitMs'yi oda hash'ine kaydet (submitAnswer'da kullanılır)
  await require("./redisClient").hset(
    `room:${pin}`,
    "timeLimitMs",
    String(timeLimitMs),
  );
  return ScoringOperations.startQuestion(pin, questionId, questionIdx);
}

// ─────────────────────────────────────────────────────────────
//  CEVAP İŞLE  (Socket.io: submit_answer)
// ─────────────────────────────────────────────────────────────

/**
 * [FIX-2] mysql.createPool() her çağrıda açılmıyor — connection leak giderildi.
 * [FIX-3] Hatalı require destructure kaldırıldı.
 * [ADD-1] Doğrulama önce bellek cache'inden yapılır; cache yoksa MySQL fallback.
 *
 * @param {string} pin
 * @param {string} playerId
 * @param {number} selectedAnswerId
 * @param {number} questionId          - manipülasyon önlemi
 * @param {number} timeLimitMs
 * @returns {{ points, isCorrect, alreadyAnswered, leaderboard }}
 */
async function submitAnswer(
  pin,
  playerId,
  selectedAnswerId,
  questionId,
  timeLimitMs = 30000,
) {
  // [ADD-1] Önce bellek cache'i dene
  let isCorrect = false;
  const qMap = questionCache.get(pin);

  if (qMap && qMap.has(questionId)) {
    const cached = qMap.get(questionId);
    isCorrect = cached.correctAnswerId === selectedAnswerId;
    timeLimitMs = cached.timeLimitMs || timeLimitMs;
  } else {
    // Fallback: MySQL doğrulama (cache ısınmamışsa veya sunucu restart sonrası)
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
  );

  const leaderboard = await ScoringOperations.getLeaderboard(pin);
  return { points, isCorrect, alreadyAnswered, leaderboard };
}

// ─────────────────────────────────────────────────────────────
//  OYUN BİTİŞİ  (Tüm sorular tamamlandıktan sonra)
// ─────────────────────────────────────────────────────────────

/**
 * [FIX-6] totalQuestions ve isGuest bilgisi MySQL'e iletiliyor.
 *
 * Akış:
 *  1. Redis leaderboard okunur.
 *  2. game_sessions güncellenir (ended_at, player_count, total_questions).
 *  3. Her oyuncu için player_results INSERT (misafir → user_id NULL).
 *  4. Redis temizlenir.
 *  5. Bellek cache'i temizlenir.
 *
 * @param {string} pin
 * @returns {Array} finalLeaderboard — Leaderboard.js payload'ı
 */
async function finalizeAndDestroy(pin) {
  const roomData = await RoomOperations.getRoom(pin);
  if (!roomData) return [];

  const sessionId = parseInt(roomData.sessionId, 10);
  const totalQuestions = parseInt(roomData.totalQuestions, 10) || 0;
  const leaderboard = await ScoringOperations.getLeaderboard(pin);

  // MySQL'e kalıcı kayıt
  await GameSessionOperations.finalizeSession(
    sessionId,
    leaderboard,
    totalQuestions,
  );

  // Redis + bellek temizliği
  await CleanupOperations.destroyRoom(pin);
  questionCache.delete(pin); // [ADD-1]

  // Frontend Leaderboard.js payload'ı:
  // [{ id (rank), name, score, total }]
  return leaderboard.map((p) => ({
    id: p.rank,
    name: p.nickname,
    score: p.score, // Zaman bonuslı toplam puan
    total: totalQuestions, // Leaderboard.js score/total gösterimi için
  }));
}

// ─────────────────────────────────────────────────────────────
//  BAĞLANTI KESİLME / YENİDEN BAĞLANMA
// ─────────────────────────────────────────────────────────────

/**
 * @param {string} socketId
 * @returns {{ playerId, roomPin, isGuest }|null}
 */
async function handleDisconnect(socketId) {
  return SessionOperations.handleDisconnect(socketId);
}

/**
 * @param {string}  newSocketId
 * @param {string}  playerId
 * @param {string}  pin
 * @param {boolean} isGuest
 */
async function handleReconnect(newSocketId, playerId, pin, isGuest = false) {
  return SessionOperations.refreshSession(newSocketId, playerId, pin, isGuest);
}

module.exports = {
  generatePin,
  createRoom,
  joinRoom,
  startGame,
  startQuestion,
  submitAnswer,
  finalizeAndDestroy,
  handleDisconnect,
  handleReconnect,
};
