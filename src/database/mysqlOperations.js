const mysql = require("mysql2/promise");

// MySQL Bağlantı Havuzu (Performans için tekli bağlantı yerine pool kullanılır)
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "your_password",
  database: "quiznight",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

class MySQLOperations {
  // 1. Yeni Kullanıcı Kaydı (Auth)
  static async createUser(id, username, email, passwordHash) {
    const query = `INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)`;
    const [result] = await pool.execute(query, [
      id,
      username,
      email,
      passwordHash,
    ]);
    return result;
  }

  // 2. Kullanıcı Girişi İçin Bilgi Getirme
  static async getUserByUsername(username) {
    const query = `SELECT * FROM users WHERE username = ?`;
    const [rows] = await pool.execute(query, [username]);
    return rows[0];
  }

  // 3. Oyun Başlarken Kategoriye Göre Soru Çekme
  static async getQuestionsByCategory(categoryId, limit = 10) {
    const query = `SELECT * FROM questions WHERE category_id = ? ORDER BY RAND() LIMIT ?`;
    // limit parametresi int olmalı, pool.execute stringe çevirmemesi için formatlanır
    const [rows] = await pool.query(query, [categoryId, limit]);
    return rows;
  }
}

module.exports = MySQLOperations;
