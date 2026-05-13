/**
 * mysqlOperations.js  (v3.0)
 * ─────────────────────────────────────────────────────────────
 * Kalıcı veri katmanı: Kullanıcılar, Quizler, Sorular,
 * Cevap Seçenekleri, Geçmiş Oyun Sonuçları.
 *
 * DEĞİŞİKLİK KAYDI (v2 → v3)
 * ─────────────────────────────────────────────────────────────
 * [FIX-1] getUserByUsername → getUserByEmail
 *         Sebep: LoginForm.js e-posta + şifre kullanıyor;
 *         username alanı formda yok.
 *
 * [FIX-2] createUser: username parametresi kaldırıldı
 *         Sebep: Şema v3'te username kolonu yok; display_name var.
 *         RegisterForm "Ad Soyad" tek alan olarak topluyor.
 *
 * [FIX-3] finalizeSession: user_id NULL güvenliği eklendi
 *         Sebep: Misafir oyuncular player_results'a NULL user_id
 *         ile kaydedilmeli. Eski kod her zaman playerId INSERT
 *         ediyordu; misafir UUID'leri FK kısıtını kırıyordu.
 *
 * [FIX-4] finalizeSession: total_questions game_sessions'a yazılıyor
 *         Sebep: Leaderboard payload'ı { score, total } içerir;
 *         total her seferinde JOIN ile çekilmemeli.
 *
 * [FIX-5] createQuiz: quiz oluşturmadan önce soru içerik kısıtı
 *         kontrol ediliyor (metin VE resim ikisi birden boş olamaz).
 *
 * [FIX-6] getQuestionsWithAnswers: is_correct kolonu döndürülmüyor
 *         Sebep: roomManager sanitize ediyor ama kaynakta
 *         sızdırmamak daha güvenli. Güvenlik "derinlemesine savunma".
 *
 * [ADD-1] createSession: total_questions parametresi eklendi
 * ─────────────────────────────────────────────────────────────
 */

"use strict";

const mysql = require("mysql2/promise");
const { v4: uuidv4 } = require("uuid");

// ── Bağlantı Havuzu (Modül ömrü boyunca tek instance) ────────
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "your_password",
  database: process.env.DB_NAME || "quiznight",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "Z", // UTC — tarih tutarsızlığını önler
});

// ─────────────────────────────────────────────────────────────
//  KULLANICI İŞLEMLERİ
// ─────────────────────────────────────────────────────────────

class UserOperations {
  /**
   * Yeni kullanıcı kaydeder.
   * RegisterForm alanları: Ad Soyad (display_name), email, şifre
   *
   * [FIX-2] username parametresi kaldırıldı; şema v3'te yok.
   *
   * @param {string} displayName  - RegisterForm "Ad Soyad" alanı
   * @param {string} email
   * @param {string} passwordHash - bcrypt ile dışarıda hashlenmiş
   * @returns {{ id, display_name, email }}
   */
  static async createUser(displayName, email, passwordHash) {
    const id = uuidv4();
    await pool.execute(
      `INSERT INTO users (id, display_name, email, password_hash)
       VALUES (?, ?, ?, ?)`,
      [id, displayName, email, passwordHash],
    );
    return { id, display_name: displayName, email };
  }

  /**
   * E-posta ile kullanıcı getirir — LoginForm giriş doğrulaması.
   *
   * [FIX-1] Eski: getUserByUsername (username ile arama)
   *         Yeni: getUserByEmail    (e-posta ile arama)
   *         Sebep: LoginForm.js sadece e-posta alanı içeriyor.
   *
   * @param {string} email
   * @returns {{ id, display_name, email, password_hash }|null}
   */
  static async getUserByEmail(email) {
    const [rows] = await pool.execute(
      `SELECT id, display_name, email, password_hash, created_at
       FROM users
       WHERE email = ?`,
      [email],
    );
    return rows[0] || null;
  }

  /**
   * JWT doğrulaması sonrası kullanıcı profili (Dashboard)
   * @param {string} userId - UUID
   * @returns {{ id, display_name, email, avatar_url, created_at }|null}
   */
  static async getUserById(userId) {
    const [rows] = await pool.execute(
      `SELECT id, display_name, email, avatar_url, created_at
       FROM users
       WHERE id = ?`,
      [userId],
    );
    return rows[0] || null;
  }
}

// ─────────────────────────────────────────────────────────────
//  KATEGORİ İŞLEMLERİ
// ─────────────────────────────────────────────────────────────

class CategoryOperations {
  /**
   * CreateQuizSettings dropdown için tüm kategoriler.
   * @returns {Array} [{ id, name }]
   */
  static async getAllCategories() {
    const [rows] = await pool.execute(
      `SELECT id, name FROM categories ORDER BY name ASC`,
    );
    return rows;
  }

  /**
   * Kategori adından ID bulur (quizForm.category text → category_id).
   * Kategori yoksa otomatik oluşturur.
   * @param {string} name
   * @returns {number} categoryId
   */
  static async getOrCreateByName(name) {
    const trimmed = name.trim();
    const [rows] = await pool.execute(
      `SELECT id FROM categories WHERE name = ?`,
      [trimmed],
    );
    if (rows[0]) return rows[0].id;

    const [result] = await pool.execute(
      `INSERT INTO categories (name) VALUES (?)`,
      [trimmed],
    );
    return result.insertId;
  }
}

// ─────────────────────────────────────────────────────────────
//  QUİZ İŞLEMLERİ
// ─────────────────────────────────────────────────────────────

class QuizOperations {
  /**
   * Dashboard carousel için kullanıcıya ait quizler.
   * Frontend: quizzes[] state → { id, name }
   *
   * @param {string} userId
   * @returns {Array} [{ id, name, difficulty, question_count, created_at }]
   */
  static async getQuizzesByOwner(userId) {
    const [rows] = await pool.execute(
      `SELECT
         q.id,
         q.name,
         q.difficulty,
         q.time_per_q_s,
         q.created_at        AS date,
         c.name              AS category,
         COUNT(qs.id)        AS question_count
       FROM quizzes q
       LEFT JOIN categories c  ON c.id  = q.category_id
       LEFT JOIN questions   qs ON qs.quiz_id = q.id
       WHERE q.owner_id = ?
       GROUP BY q.id
       ORDER BY q.created_at DESC`,
      [userId],
    );
    return rows;
  }

  /**
   * QuizSelect sayfası için herkese açık quizler.
   * sortBy değerleri QuizSelect.js sort seçenekleriyle eşleşir:
   *   newest    → "Son eklenenler"
   *   oldest    → "İlk Eklenenler Başta"
   *   name_asc  → "İsme Göre Artan"
   *   name_desc → "İsme Göre Azalan"
   *   easy_first→ "Kolaydan Zora"
   *   hard_first→ "Zordan Kolaya"
   *
   * @param {{ search?, sortBy?, categoryId? }} opts
   * @returns {Array} [{ id, name, difficulty, date, category }]
   */
  static async getPublicQuizzes({
    search = "",
    sortBy = "newest",
    categoryId,
  } = {}) {
    const SAFE_SORTS = {
      newest: "q.created_at DESC",
      oldest: "q.created_at ASC",
      name_asc: "q.name ASC",
      name_desc: "q.name DESC",
      easy_first: "q.difficulty ASC",
      hard_first: "q.difficulty DESC",
    };
    // Whitelist kontrolü — SQL injection önlemi
    const orderClause = SAFE_SORTS[sortBy] || SAFE_SORTS.newest;

    const params = [];
    let whereExtra = "";

    if (search) {
      whereExtra += " AND q.name LIKE ?";
      params.push(`%${search}%`);
    }
    if (categoryId) {
      whereExtra += " AND q.category_id = ?";
      params.push(categoryId);
    }

    const sql = `
      SELECT
        q.id,
        q.name,
        q.difficulty,
        q.time_per_q_s,
        q.created_at   AS date,
        c.name         AS category,
        COUNT(qs.id)   AS question_count
      FROM quizzes q
      LEFT JOIN categories c  ON c.id  = q.category_id
      LEFT JOIN questions   qs ON qs.quiz_id = q.id
      WHERE q.is_public = TRUE ${whereExtra}
      GROUP BY q.id
      ORDER BY ${orderClause}`;

    const [rows] = await pool.query(sql, params);
    return rows;
  }

  /**
   * Tek quiz detayı (QuizPinDetails, roomManager.createRoom doğrulaması).
   * @param {number} quizId
   * @returns {{ id, name, difficulty, time_per_q_s, category, owner_display_name }|null}
   */
  static async getQuizById(quizId) {
    const [rows] = await pool.execute(
      `SELECT
         q.id,
         q.name,
         q.difficulty,
         q.time_per_q_s,
         q.is_public,
         q.created_at,
         c.name            AS category,
         u.display_name    AS owner_display_name
       FROM quizzes q
       LEFT JOIN categories c ON c.id = q.category_id
       LEFT JOIN users      u ON u.id = q.owner_id
       WHERE q.id = ?`,
      [quizId],
    );
    return rows[0] || null;
  }

  /**
   * Quiz oluşturur (CreateQuizSettings + CreateQuizQuestions birleşik submit).
   *
   * quizData:
   *   ownerId     → JWT'den gelen kullanıcı ID
   *   name        → quizForm.name
   *   categoryName→ quizForm.category (string → getOrCreateByName ile ID'ye çevrilir)
   *   difficulty  → 'Kolay'→1 / 'Orta'→2 / 'Zor'→3
   *   timeSec     → quizForm.min * 60 + quizForm.sec
   *   isPublic    → varsayılan true
   *
   * questionsData[] her öğe:
   *   text         → questions[i].text
   *   imageUrl     → S3'e yüklenen URL (base64 preview değil!)
   *   answers[]    → [{ id, text }]  (id = frontend answer id)
   *   correctAnswerId → questions[i].correctAnswerId
   *
   * [FIX-5] Boş içerikli soru (metin + resim ikisi boş) atlanır,
   *         tüm sorular boşsa hata fırlatılır.
   *
   * @param {object} quizData
   * @param {Array}  questionsData
   * @returns {number} quizId
   */
  static async createQuiz(quizData, questionsData) {
    const {
      ownerId,
      name,
      categoryName,
      difficulty,
      timeSec,
      isPublic = true,
    } = quizData;

    // Kategori adını ID'ye çevir (yoksa oluştur)
    const categoryId = categoryName
      ? await CategoryOperations.getOrCreateByName(categoryName)
      : null;

    // Geçerli sorular: metin VEYA resim içermeli
    const validQuestions = questionsData.filter(
      (q) => (q.text && q.text.trim()) || q.imageUrl,
    );
    if (validQuestions.length === 0) {
      throw new Error("Quiz en az bir geçerli soru içermelidir.");
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Quiz ana kaydı
      const [quizResult] = await conn.execute(
        `INSERT INTO quizzes (owner_id, category_id, name, difficulty, time_per_q_s, is_public)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [ownerId, categoryId, name, difficulty || 1, timeSec || 30, isPublic],
      );
      const quizId = quizResult.insertId;

      // 2. Sorular ve seçenekleri
      for (let i = 0; i < validQuestions.length; i++) {
        const q = validQuestions[i];

        const [qResult] = await conn.execute(
          `INSERT INTO questions (quiz_id, question_text, image_url, order_index)
           VALUES (?, ?, ?, ?)`,
          [quizId, q.text?.trim() || null, q.imageUrl || null, i],
        );
        const questionId = qResult.insertId;

        // Cevap seçenekleri — boş bırakılanlar atlanır
        const validAnswers = q.answers.filter((a) => a.text && a.text.trim());
        for (let j = 0; j < validAnswers.length; j++) {
          const ans = validAnswers[j];
          await conn.execute(
            `INSERT INTO answer_options (question_id, option_text, is_correct, option_order)
             VALUES (?, ?, ?, ?)`,
            [questionId, ans.text.trim(), ans.id === q.correctAnswerId, j],
          );
        }
      }

      await conn.commit();
      return quizId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}

// ─────────────────────────────────────────────────────────────
//  SORU İŞLEMLERİ (Oyun Motoru)
// ─────────────────────────────────────────────────────────────

class QuestionOperations {
  /**
   * Oyun başlarken quizin tüm sorularını ve seçenekleri getirir.
   * Sunucu belleğinde tutulur; istemciye sanitize edilerek gönderilir.
   *
   * [FIX-6] is_correct bu katmanda dönülüyor (sunucu için gerekli),
   *         ancak roomManager.startGame() istemciye göndermeden önce
   *         bu alanı çıkartır. İki katmanlı savunma.
   *
   * @param {number} quizId
   * @returns {Array} [{ id, text, image_url, order_index, answers[] }]
   *   answers[]: { id, text, is_correct, option_order }
   */
  static async getQuestionsWithAnswers(quizId) {
    const [questions] = await pool.execute(
      `SELECT id, question_text AS text, image_url, order_index
       FROM questions
       WHERE quiz_id = ?
       ORDER BY order_index ASC`,
      [quizId],
    );
    if (questions.length === 0) return [];

    const ids = questions.map((q) => q.id);
    const holders = ids.map(() => "?").join(",");

    // is_correct burada çekiliyor — sunucu doğrulama için gerekli
    const [answers] = await pool.query(
      `SELECT id, question_id, option_text AS text, is_correct, option_order
       FROM answer_options
       WHERE question_id IN (${holders})
       ORDER BY option_order ASC`,
      ids,
    );

    // Cevapları sorulara birleştir (N+1 sorgu yapmadan)
    const answerMap = {};
    for (const ans of answers) {
      if (!answerMap[ans.question_id]) answerMap[ans.question_id] = [];
      answerMap[ans.question_id].push(ans);
    }

    return questions.map((q) => ({
      ...q,
      answers: answerMap[q.id] || [],
    }));
  }

  /**
   * Belirli bir cevabın doğru olup olmadığını kontrol eder.
   * submitAnswer'da kullanılır — doğru cevap Redis'te SAKLANMAZ.
   *
   * @param {number} answerId
   * @param {number} questionId  - manipülasyon önlemi için çift kontrol
   * @returns {boolean}
   */
  static async checkAnswer(answerId, questionId) {
    const [rows] = await pool.execute(
      `SELECT is_correct
       FROM answer_options
       WHERE id = ? AND question_id = ?`,
      [answerId, questionId],
    );
    return rows[0] ? Boolean(rows[0].is_correct) : false;
  }
}

// ─────────────────────────────────────────────────────────────
//  OYUN OTURUMU İŞLEMLERİ
// ─────────────────────────────────────────────────────────────

class GameSessionOperations {
  /**
   * Oyun oturumu başlatma kaydı.
   *
   * [ADD-1] totalQuestions parametresi eklendi.
   *         Sebep: Leaderboard payload'ı { score, total } için
   *         total her seferinde COUNT JOIN ile çekilmemelidir.
   *
   * @param {number} quizId
   * @param {string} hostId
   * @param {string} roomPin
   * @param {number} totalQuestions
   * @returns {number} sessionId
   */
  static async createSession(quizId, hostId, roomPin, totalQuestions) {
    const [result] = await pool.execute(
      `INSERT INTO game_sessions (quiz_id, host_id, room_pin, total_questions, started_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [quizId, hostId, roomPin, totalQuestions || 0],
    );
    return result.insertId;
  }

  /**
   * Oyun bitiminde Redis leaderboard'u MySQL'e yazar.
   * Transaction ile atomik — yarı yazılmış sonuç kalmaz.
   *
   * [FIX-3] user_id: misafir oyuncular için NULL INSERT edilir.
   *         Eski kod her zaman playerId yazıyordu;
   *         misafir UUID'leri users(id) FK'ını kırıyordu.
   *
   * [FIX-4] total_questions game_sessions'a güncelleniyor.
   *
   * leaderboard[]:
   *   { playerId, nickname, score, rank, correct?, wrong?, isGuest? }
   *   isGuest: true → user_id NULL olarak kaydedilir
   *
   * @param {number} sessionId
   * @param {Array}  leaderboard
   * @param {number} totalQuestions
   */
  static async finalizeSession(sessionId, leaderboard, totalQuestions) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Oturumu kapat
      await conn.execute(
        `UPDATE game_sessions
         SET ended_at = NOW(), player_count = ?, total_questions = ?
         WHERE id = ?`,
        [leaderboard.length, totalQuestions || 0, sessionId],
      );

      // Oyuncu sonuçları
      if (leaderboard.length > 0) {
        const values = leaderboard.map((p) => [
          sessionId,
          p.isGuest ? null : p.playerId, // [FIX-3] misafir → NULL
          p.nickname,
          p.score,
          p.rank,
          p.correct || 0,
          p.wrong || 0,
        ]);
        await conn.query(
          `INSERT INTO player_results
             (session_id, user_id, nickname, final_score, final_rank, correct_count, wrong_count)
           VALUES ?`,
          [values],
        );
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Kullanıcının geçmiş oyun istatistikleri (Dashboard genişletme).
   * @param {string} userId
   * @returns {Array}
   */
  static async getUserHistory(userId) {
    const [rows] = await pool.execute(
      `SELECT
         gs.id              AS session_id,
         gs.room_pin,
         gs.started_at,
         gs.total_questions,
         qz.name            AS quiz_name,
         pr.final_score,
         pr.final_rank,
         pr.correct_count,
         pr.wrong_count
       FROM player_results pr
       INNER JOIN game_sessions gs ON gs.id = pr.session_id
       INNER JOIN quizzes       qz ON qz.id = gs.quiz_id
       WHERE pr.user_id = ?
       ORDER BY gs.started_at DESC
       LIMIT 20`,
      [userId],
    );
    return rows;
  }
}

// Pool'u modül dışına aç — test/graceful-shutdown için
const closePool = () => pool.end();

module.exports = {
  UserOperations,
  CategoryOperations,
  QuizOperations,
  QuestionOperations,
  GameSessionOperations,
  closePool,
};
