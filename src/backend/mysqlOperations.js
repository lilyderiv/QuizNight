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
  timezone: "Z",
});

// ─────────────────────────────────────────────────────────────
//  KULLANICI İŞLEMLERİ
// ─────────────────────────────────────────────────────────────

class UserOperations {
  /**
   * Yeni kullanıcı kaydeder.
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
   * E-posta ile kullanıcı getirir.
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
   * JWT doğrulaması sonrası kullanıcı profili.
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
  static async getAllCategories() {
    const [rows] = await pool.execute(
      `SELECT id, name FROM categories ORDER BY name ASC`,
    );
    return rows;
  }

  /**
   * Kategori adından ID bulur.
   * Kategori yoksa atomik INSERT IGNORE + SELECT ile oluşturur.
   * Bu yaklaşım race condition'a karşı güvenlidir:
   * eşzamanlı iki istek aynı kategoriyi INSERT etmeye çalışsa bile
   * IGNORE ile hata almaz ve SELECT doğru ID'yi döndürür.
   */
  static async getOrCreateByName(name) {
    const trimmed = name.trim();

    // Atomik: INSERT IGNORE (var olan satırda hata vermez)
    await pool.execute(`INSERT IGNORE INTO categories (name) VALUES (?)`, [
      trimmed,
    ]);

    // Her koşulda kesin SELECT
    const [rows] = await pool.execute(
      `SELECT id FROM categories WHERE name = ?`,
      [trimmed],
    );
    return rows[0].id;
  }
}

// ─────────────────────────────────────────────────────────────
//  QUİZ İŞLEMLERİ
// ─────────────────────────────────────────────────────────────

class QuizOperations {
  /**
   * Dashboard carousel için kullanıcıya ait quizler.
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
   * sortBy whitelist: SQL injection önlemi.
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
   * Tek quiz detayı — owner_id dahil (yetki kontrolü için).
   */
  static async getQuizById(quizId) {
    const [rows] = await pool.execute(
      `SELECT
         q.id,
         q.owner_id,
         q.name,
         q.difficulty,
         q.time_per_q_s,
         c.name AS category,
         u.display_name AS owner_display_name
       FROM quizzes q
       LEFT JOIN categories c ON c.id = q.category_id
       LEFT JOIN users      u ON u.id = q.owner_id
       WHERE q.id = ?`,
      [quizId],
    );
    return rows[0] || null;
  }

  /**
   * Yeni quiz ve soruları transaction içinde kaydeder.
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

    const categoryId = categoryName
      ? await CategoryOperations.getOrCreateByName(categoryName)
      : null;

    const validQuestions = questionsData.filter(
      (q) => (q.text && q.text.trim()) || q.imageUrl,
    );
    if (validQuestions.length === 0) {
      throw new Error("Quiz en az bir geçerli soru içermelidir.");
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [quizResult] = await conn.execute(
        `INSERT INTO quizzes (owner_id, category_id, name, difficulty, time_per_q_s, is_public)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [ownerId, categoryId, name, difficulty || 1, timeSec || 30, isPublic],
      );
      const quizId = quizResult.insertId;

      for (let i = 0; i < validQuestions.length; i++) {
        const q = validQuestions[i];

        const [qResult] = await conn.execute(
          `INSERT INTO questions (quiz_id, question_text, image_url, order_index)
           VALUES (?, ?, ?, ?)`,
          [quizId, q.text?.trim() || null, q.imageUrl || null, i],
        );
        const questionId = qResult.insertId;

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
   * is_correct sunucu için çekiliyor; roomManager sanitize ederek istemciye gönderir.
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

    const [answers] = await pool.query(
      `SELECT id, question_id, option_text AS text, is_correct, option_order
       FROM answer_options
       WHERE question_id IN (${holders})
       ORDER BY option_order ASC`,
      ids,
    );

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
   * Cevap doğrulama — cache yoksa fallback olarak kullanılır.
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
   * correct_count ve wrong_count artık Redis'ten geliyor (her zaman dolu).
   */
  static async finalizeSession(sessionId, leaderboard, totalQuestions) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.execute(
        `UPDATE game_sessions
         SET ended_at = NOW(), player_count = ?, total_questions = ?
         WHERE id = ?`,
        [leaderboard.length, totalQuestions || 0, sessionId],
      );

      if (leaderboard.length > 0) {
        const values = leaderboard.map((p) => [
          sessionId,
          p.isGuest ? null : p.playerId,
          p.nickname,
          p.score,
          p.rank,
          p.correct || 0, // Redis'ten gelen doğru sayısı
          p.wrong || 0, // Redis'ten gelen yanlış sayısı
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
   * Kullanıcının geçmiş oyun istatistikleri.
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

const closePool = () => pool.end();

module.exports = {
  UserOperations,
  CategoryOperations,
  QuizOperations,
  QuestionOperations,
  GameSessionOperations,
  closePool,
};
const RoomOperations = require("./roomManager");
const ScoringOperations = require("./scoringManager");
const SessionOperations = require("./sessionManager");
const CleanupOperations = require("./cleanupManager");
const questionCache = require("./questionCache");
