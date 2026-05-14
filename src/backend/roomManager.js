"use strict";

// Redis operasyonlarının içe aktarılması
const {
  RoomOperations,
  ReadyOperations,
  ScoringOperations,
  SessionOperations,
  CleanupOperations,
} = require("./redisOperations");

// MySQL operasyonlarının içe aktarılması
const {
  QuizOperations,
  QuestionOperations,
  GameSessionOperations,
} = require("./mysqlOperations");

// Hızlı cevap kontrolü için sunucu taraflı cache
const questionCache = new Map();

/**
 * 6 haneli benzersiz bir oda PIN kodu üretir.
 */
function generatePin() {
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let pin = "";
  for (let i = 0; i < 6; i++) {
    pin += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return pin;
}

/**
 * Yeni bir yarışma odası oluşturur ve MySQL tarafında oturumu başlatır.
 */
async function createRoom(hostId, quizId) {
  // Quiz bilgilerini MySQL'den çek
  const quiz = await QuizOperations.getQuizById(quizId);
  if (!quiz) throw new Error("Quiz bulunamadı.");

  // Soruları ve cevapları çek
  const questions = await QuestionOperations.getQuestionsWithAnswers(quizId);
  const totalQuestions = questions.length;
  if (totalQuestions === 0) throw new Error("Bu quizde henüz soru yok.");

  const pin = generatePin();
  
  // MySQL'de game_sessions kaydı oluştur
  const sessionId = await GameSessionOperations.createSession(
    quizId,
    hostId,
    pin,
    totalQuestions,
  );

  // Redis'te odayı tanımla
  await RoomOperations.createRoom(
    pin,
    hostId,
    quizId,
    sessionId,
    totalQuestions,
  );

  return { pin, sessionId, quiz, totalQuestions };
}

/**
 * Bir oyuncuyu odaya ekler ve oyuncu listesini döndürür.
 */
async function joinRoom(pin, playerId, nickname, socketId, isGuest = false) {
  const roomData = await RoomOperations.getRoom(pin);
  if (!roomData) return { success: false, error: "Geçersiz PIN kodu." };
  
  // Sadece bekleme aşamasındaki odalara girilebilir
  if (roomData.status !== "waiting") {
    return { success: false, error: "Yarışma çoktan başladı." };
  }

  // Oyuncuyu Redis'e kaydet
  await RoomOperations.joinRoom(pin, playerId, nickname, socketId, isGuest);
  
  // Güncel oyuncu listesini ve skorları getir
  const players = await RoomOperations.getPlayersWithScores(pin);
  return { success: true, roomData, players };
}

/**
 * Yarışmayı başlatır, soruları hazırlar ve frontend'e uygun hale getirir.
 */
async function startGame(pin) {
  const roomData = await RoomOperations.getRoom(pin);
  if (!roomData) throw new Error("Oda bulunamadı.");

  const quizId = parseInt(roomData.quizId, 10);
  const questions = await QuestionOperations.getQuestionsWithAnswers(quizId);
  
  // Quiz başına veya soru başına belirlenen süreyi çek
  const quizInfo = await QuizOperations.getQuizById(quizId);
  const timeLimitMs = (quizInfo.time_per_q_s * 1000) || 30000;

  // Doğru cevapları sunucu tarafında cache'e al (Güvenlik ve hız için)
  const qMap = new Map();
  for (const q of questions) {
    const correctAnswer = q.answers.find((a) => a.is_correct);
    qMap.set(q.id, {
      correctAnswerId: correctAnswer ? correctAnswer.id : null,
      timeLimitMs,
    });
  }
  questionCache.set(pin, qMap);

  // Oda durumunu Redis'te "playing" olarak güncelle
  await RoomOperations.setRoomStatus(pin, "playing");

  // Frontend'e gidecek soruları temizle (Doğru şık bilgisini gizle)
  const sanitizedQuestions = questions.map((q) => ({
    id: q.id,
    text: q.text,
    imageUrl: q.image_url,
    time: timeLimitMs / 1000,
    // Sadece cevap metinlerini ve ID'lerini gönder
    answers: q.answers.map((a) => ({ id: a.id, text: a.text })),
  }));

  return { sanitizedQuestions, timeLimitMs };
}

/**
 * Oyuncunun verdiği cevabı değerlendirir ve puanı hesaplar.
 * timeElapsedMs: istemcinin bu soru için harcadığı süre (doğru zamanlama).
 */
async function submitAnswer(pin, playerId, selectedAnswerId, questionId, timeLimitMs = 30000, timeElapsedMs = null) {
  let isCorrect = false;
  const qMap = questionCache.get(pin);

  // Cache'den hızlıca kontrol et
  if (qMap && qMap.has(questionId)) {
    const cached = qMap.get(questionId);
    isCorrect = cached.correctAnswerId === selectedAnswerId;
  } else {
    // Cache yoksa MySQL'den doğrula
    isCorrect = await QuestionOperations.checkAnswer(selectedAnswerId, questionId);
  }

  // Puan hesaplama — questionId ve timeElapsedMs geçiriliyor
  const { points, alreadyAnswered } = await ScoringOperations.submitAnswer(
    pin,
    playerId,
    isCorrect,
    timeLimitMs,
    questionId,
    timeElapsedMs,
  );

  // Güncel liderlik tablosunu çek
  const leaderboard = await ScoringOperations.getLeaderboard(pin);
  
  return { points, isCorrect, alreadyAnswered, leaderboard };
}

/**
 * Yarışmayı bitirir, sonuçları MySQL'e kaydeder ve odayı Redis'ten siler.
 */
async function finalizeAndDestroy(pin) {
  const roomData = await RoomOperations.getRoom(pin);
  if (!roomData) return [];

  const sessionId = parseInt(roomData.sessionId, 10);
  const totalQuestions = parseInt(roomData.totalQuestions, 10) || 0;
  
  // Final skorlarını Redis'ten al
  const leaderboard = await ScoringOperations.getLeaderboard(pin);

  // MySQL'de player_results tablosuna sonuçları yaz
  await GameSessionOperations.finalizeSession(sessionId, leaderboard, totalQuestions);
  
  // Redis üzerindeki tüm oda verilerini temizle
  await CleanupOperations.destroyRoom(pin);
  questionCache.delete(pin);

  // Leaderboard.js için uygun veri formatına dönüştür
  return leaderboard.map((p) => ({
    rank: p.rank,
    name: p.nickname,
    score: p.score,
    total: totalQuestions,
  }));
}

/**
 * Bir oyuncunun bağlantısı koptuğunda durumu yönetir.
 */
async function handleDisconnect(socketId) {
  // SessionOperations üzerinden ayrılan oyuncunun verilerini yönet
  return SessionOperations.handleDisconnect(socketId);
}

module.exports = {
  createRoom,
  joinRoom,
  startGame,
  submitAnswer,   // (pin, playerId, selectedAnswerId, questionId, timeLimitMs, timeElapsedMs)
  finalizeAndDestroy,
  handleDisconnect,
};