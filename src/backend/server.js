require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Yerel modüllerin içe aktarılması
const roomManager = require('./roomManager');
const { UserOperations, QuizOperations } = require('./mysqlOperations');

const app = express();
const server = http.createServer(app);

// Frontend bağlantıları için Socket.io ve CORS ayarları
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
// Resim verileri (base64) gönderileceği için limit artırıldı
app.use(express.json({ limit: '10mb' }));

const JWT_SECRET = process.env.JWT_SECRET || 'quiz_night_secret_2025';

// ─────────────────────────────────────────────────────────────
//  KULLANICI KİMLİK DOĞRULAMA (AUTH) ROTALARI
// ─────────────────────────────────────────────────────────────

// Kayıt Olma
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    // mysqlOperations.js içindeki createUser'ı çağırır
    const user = await UserOperations.createUser(name, email, hashedPassword);
    res.status(201).json({ success: true, user });
  } catch (err) {
    console.error("Kayıt Hatası:", err);
    res.status(500).json({ success: false, message: "Kayıt başarısız. E-posta zaten kullanımda olabilir." });
  }
});

// Giriş Yapma
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserOperations.getUserByEmail(email);

    if (!user) {
      return res.status(404).json({ success: false, message: "Kullanıcı bulunamadı." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Hatalı şifre." });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ 
      success: true, 
      token, 
      user: { id: user.id, display_name: user.display_name, email: user.email } 
    });
  } catch (err) {
    console.error("Giriş Hatası:", err);
    res.status(500).json({ success: false, message: "Giriş işlemi sırasında bir hata oluştu." });
  }
});

// ─────────────────────────────────────────────────────────────
//  QUİZ VE ODA YÖNETİMİ ROTALARI
// ─────────────────────────────────────────────────────────────

// Tüm herkese açık quizleri listele
app.get('/api/quizzes', async (req, res) => {
  try {
    const quizzes = await QuizOperations.getPublicQuizzes();
    res.json({ success: true, quizzes });
  } catch (err) {
    res.status(500).json({ success: false, message: "Quizler yüklenemedi." });
  }
});

// Yeni bir quiz ve sorularını kaydet
app.post('/api/quizzes', async (req, res) => {
  try {
    const { quizData, questionsData } = req.body;
    const quizId = await QuizOperations.createQuiz(quizData, questionsData);
    res.status(201).json({ success: true, quizId });
  } catch (err) {
    console.error("Quiz Oluşturma Hatası:", err);
    res.status(500).json({ success: false, message: "Quiz kaydedilemedi." });
  }
});

// Yeni bir yarışma odası oluştur (PIN üret)
app.post('/api/rooms', async (req, res) => {
  try {
    const { hostId, quizId } = req.body;
    // roomManager üzerinden odayı ve PIN'i oluşturur
    const result = await roomManager.createRoom(hostId, quizId);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
//  GERÇEK ZAMANLI SOCKET.IO İŞLEMLERİ
// ─────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log('✅ Yeni bağlantı:', socket.id);

  // Odaya katılma (Host veya Oyuncu)
  socket.on('join_room', async (data) => {
    try {
      let { pin, playerId, nickname, isGuest } = data;
      
      // Misafir oyuncu için ID üretimi
      if (isGuest && !playerId) {
        playerId = `guest:${uuidv4()}`;
      }

      const result = await roomManager.joinRoom(pin, playerId, nickname, socket.id, isGuest);
      
      if (result.success) {
        socket.join(pin);
        // Odadaki herkese güncel oyuncu listesini yayınla
        io.to(pin).emit('player_joined', { 
          nickname, 
          players: result.players 
        });
      } else {
        socket.emit('error_msg', { message: result.error });
      }
    } catch (err) {
      socket.emit('error_msg', { message: "Odaya katılım sırasında teknik bir hata oluştu." });
    }
  });

  // Oyunu başlatma (Sadece Host)
  socket.on('start_game', async (data) => {
    try {
      const { pin } = data;
      const { sanitizedQuestions, timeLimitMs } = await roomManager.startGame(pin);
      
      // Tüm oyunculara soruları gönder ve yarışmayı başlat
      io.to(pin).emit('game_started', { 
        questions: sanitizedQuestions, 
        timeLimitMs 
      });
    } catch (err) {
      socket.emit('error_msg', { message: err.message });
    }
  });

  // Cevap gönderme ve puanlama
  socket.on('submit_answer', async (data) => {
    try {
      const { pin, playerId, selectedAnswerId, questionId, timeLimitMs } = data;
      const result = await roomManager.submitAnswer(pin, playerId, selectedAnswerId, questionId, timeLimitMs);
      
      // Oyuncuya kendi sonucunu bildir
      socket.emit('answer_feedback', { 
        isCorrect: result.isCorrect, 
        points: result.points, 
        alreadyAnswered: result.alreadyAnswered 
      });

      // Tüm odaya güncel liderlik tablosunu gönder
      io.to(pin).emit('leaderboard_update', { 
        leaderboard: result.leaderboard 
      });
    } catch (err) {
      console.error("Cevap İşleme Hatası:", err);
    }
  });

  // Yarışmayı sonlandırma ve verileri kaydetme
  socket.on('finalize_game', async (data) => {
    try {
      const { pin } = data;
      // roomManager.finalizeAndDestroy verileri MySQL'e yazar ve odayı siler
      const finalLeaderboard = await roomManager.finalizeAndDestroy(pin);
      
      // Herkese final sonuçlarını gönder
      io.to(pin).emit('game_finished', { 
        leaderboard: finalLeaderboard 
      });
    } catch (err) {
      console.error("Oyun Kapatma Hatası:", err);
    }
  });

  // Bağlantı kesilmesi
  socket.on('disconnect', async () => {
    const session = await roomManager.handleDisconnect(socket.id);
    if (session) {
      console.log(`❌ Oyuncu ayrıldı: ${session.playerId} (Oda: ${session.roomPin})`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Sunucu ${PORT} portunda başarıyla başlatıldı!`);
});