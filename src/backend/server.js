require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const roomManager = require("./roomManager");
const { UserOperations, QuizOperations } = require("./mysqlOperations");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const JWT_SECRET = process.env.JWT_SECRET || "quiz_night_secret_2025";

// ─────────────────────────────────────────────────────────────
//  JWT MIDDLEWARE — Korunan endpoint'ler için
// ─────────────────────────────────────────────────────────────
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ success: false, message: "Token gerekli." });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(403)
        .json({ success: false, message: "Geçersiz token." });
    }
    req.userId = decoded.id; // Sonraki handler'larda kullanılabilir
    next();
  });
}

// ─────────────────────────────────────────────────────────────
//  AUTH ROTALARI
// ─────────────────────────────────────────────────────────────

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Tüm alanlar zorunludur." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await UserOperations.createUser(name, email, hashedPassword);

    // Kayıt sonrası otomatik token ver
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "24h" });
    res.status(201).json({ success: true, token, user });
  } catch (err) {
    console.error("Kayıt Hatası:", err);
    const message =
      err.code === "ER_DUP_ENTRY"
        ? "Bu e-posta adresi zaten kayıtlı."
        : "Kayıt başarısız.";
    res.status(500).json({ success: false, message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "E-posta ve şifre gerekli." });
    }

    const user = await UserOperations.getUserByEmail(email);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Kullanıcı bulunamadı." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Hatalı şifre." });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "24h" });
    res.json({
      success: true,
      token,
      user: { id: user.id, display_name: user.display_name, email: user.email },
    });
  } catch (err) {
    console.error("Giriş Hatası:", err);
    res
      .status(500)
      .json({ success: false, message: "Giriş sırasında hata oluştu." });
  }
});

// ─────────────────────────────────────────────────────────────
//  QUİZ ROTALARI
// ─────────────────────────────────────────────────────────────

// Herkese açık quizleri listele (giriş gerekmez)
app.get("/api/quizzes", async (req, res) => {
  try {
    const quizzes = await QuizOperations.getPublicQuizzes();
    res.json({ success: true, quizzes });
  } catch (err) {
    res.status(500).json({ success: false, message: "Quizler yüklenemedi." });
  }
});

// Kullanıcının kendi quizlerini listele (giriş gerekir)
app.get("/api/quizzes/my", authenticateToken, async (req, res) => {
  try {
    const quizzes = await QuizOperations.getQuizzesByOwner(req.userId);
    res.json({ success: true, quizzes });
  } catch (err) {
    res.status(500).json({ success: false, message: "Quizler yüklenemedi." });
  }
});

// Yeni quiz oluştur (giriş gerekir)
app.post("/api/quizzes", authenticateToken, async (req, res) => {
  try {
    const { quizData, questionsData } = req.body;
    // DÜZELTME: ownerId token'dan alınıyor, client'tan değil
    quizData.ownerId = req.userId;
    const quizId = await QuizOperations.createQuiz(quizData, questionsData);
    res.status(201).json({ success: true, quizId });
  } catch (err) {
    console.error("Quiz Oluşturma Hatası:", err);
    res
      .status(500)
      .json({ success: false, message: err.message || "Quiz kaydedilemedi." });
  }
});

// Yeni oda oluştur (giriş gerekir)
app.post("/api/rooms", authenticateToken, async (req, res) => {
  try {
    const { quizId } = req.body;
    // DÜZELTME: hostId token'dan alınıyor
    const result = await roomManager.createRoom(req.userId, quizId);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
//  SOCKET.IO
// ─────────────────────────────────────────────────────────────

io.on("connection", (socket) => {
  console.log("✅ Yeni bağlantı:", socket.id);

  socket.on("join_room", async (data) => {
    try {
      let { pin, playerId, nickname, isGuest } = data;
      if (isGuest && !playerId) {
        playerId = `guest:${uuidv4()}`;
      }

      const result = await roomManager.joinRoom(
        pin,
        playerId,
        nickname,
        socket.id,
        isGuest,
      );

      if (result.success) {
        socket.join(pin);
        io.to(pin).emit("player_joined", {
          nickname,
          players: result.players,
        });
      } else {
        socket.emit("error_msg", { message: result.error });
      }
    } catch (err) {
      socket.emit("error_msg", {
        message: "Odaya katılım sırasında hata oluştu.",
      });
    }
  });

  socket.on("start_game", async (data) => {
    try {
      const { pin } = data;
      const { sanitizedQuestions, timeLimitMs } =
        await roomManager.startGame(pin);
      io.to(pin).emit("game_started", {
        questions: sanitizedQuestions,
        timeLimitMs,
      });
    } catch (err) {
      socket.emit("error_msg", { message: err.message });
    }
  });

  socket.on("submit_answer", async (data) => {
    try {
      const { pin, playerId, selectedAnswerId, questionId, timeLimitMs } = data;
      const result = await roomManager.submitAnswer(
        pin,
        playerId,
        selectedAnswerId,
        questionId,
        timeLimitMs,
      );

      socket.emit("answer_feedback", {
        isCorrect: result.isCorrect,
        points: result.points,
        alreadyAnswered: result.alreadyAnswered,
      });

      io.to(pin).emit("leaderboard_update", {
        leaderboard: result.leaderboard,
      });
    } catch (err) {
      console.error("Cevap İşleme Hatası:", err);
    }
  });

  socket.on("finalize_game", async (data) => {
    try {
      const { pin } = data;
      const finalLeaderboard = await roomManager.finalizeAndDestroy(pin);
      io.to(pin).emit("game_finished", { leaderboard: finalLeaderboard });
    } catch (err) {
      console.error("Oyun Kapatma Hatası:", err);
    }
  });

  socket.on("disconnect", async () => {
    const session = await roomManager.handleDisconnect(socket.id);
    if (session) {
      console.log(
        `!Oyuncu ayrıldı: ${session.playerId} (Oda: ${session.roomPin})`,
      );
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda başlatıldı!`);
});
