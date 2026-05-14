/**
 * seed.js — QuizNight test verisi
 * Çalıştır: node src/backend/seed.js
 *
 * Eklenecekler:
 *   - 5 sahte kullanıcı (tümünün şifresi: Test1234!)
 *   - 3 kullanıcının oluşturduğu 5 quiz
 *   - Her quizde 5 soru, her soruda 4 şık (1 doğru)
 *   - 3 geçmiş oyun oturumu + oyuncu sonuçları
 *
 * Idempotent: INSERT IGNORE kullanılır, tekrar çalıştırmak güvenlidir.
 */

"use strict";

require("dotenv").config({ path: __dirname + "/.env" });
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "your_password",
  database: process.env.DB_NAME || "quiznight",
  waitForConnections: true,
  connectionLimit: 5,
  timezone: "Z",
});

// ─── Sabit UUID'ler — idempotency için ───────────────────────────────────────
const USER_IDS = {
  ahmet: "a1b2c3d4-0001-0001-0001-000000000001",
  zeynep: "a1b2c3d4-0002-0002-0002-000000000002",
  mehmet: "a1b2c3d4-0003-0003-0003-000000000003",
  selin: "a1b2c3d4-0004-0004-0004-000000000004",
  berk: "a1b2c3d4-0005-0005-0005-000000000005",
};

// ─── Yardımcı: soru + 4 şık ekler ───────────────────────────────────────────
async function insertQuestion(
  conn,
  quizId,
  orderIndex,
  text,
  answers,
  correctIdx,
) {
  const [qResult] = await conn.execute(
    `INSERT IGNORE INTO questions (quiz_id, question_text, image_url, order_index)
     VALUES (?, ?, NULL, ?)`,
    [quizId, text, orderIndex],
  );

  // IGNORE ile atlandıysa (zaten varsa) bul
  let questionId = qResult.insertId;
  if (!questionId) {
    const [rows] = await conn.execute(
      `SELECT id FROM questions WHERE quiz_id = ? AND order_index = ?`,
      [quizId, orderIndex],
    );
    if (!rows[0]) return;
    questionId = rows[0].id;
  }

  for (let i = 0; i < answers.length; i++) {
    await conn.execute(
      `INSERT IGNORE INTO answer_options
         (question_id, option_text, is_correct, option_order)
       VALUES (?, ?, ?, ?)`,
      [questionId, answers[i], i === correctIdx, i],
    );
  }
}

// ─── Ana seed fonksiyonu ─────────────────────────────────────────────────────
async function seed() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ── 1. Kullanıcılar ───────────────────────────────────────────────────────
    console.log("👤 Kullanıcılar ekleniyor...");
    const passwordHash = await bcrypt.hash("Test1234!", 10);

    const users = [
      {
        id: USER_IDS.ahmet,
        display_name: "Ahmet Yılmaz",
        email: "ahmet@test.com",
      },
      {
        id: USER_IDS.zeynep,
        display_name: "Zeynep Kaya",
        email: "zeynep@test.com",
      },
      {
        id: USER_IDS.mehmet,
        display_name: "Mehmet Demir",
        email: "mehmet@test.com",
      },
      {
        id: USER_IDS.selin,
        display_name: "Selin Aydın",
        email: "selin@test.com",
      },
      { id: USER_IDS.berk, display_name: "Berk Çelik", email: "berk@test.com" },
    ];

    for (const u of users) {
      await conn.execute(
        `INSERT IGNORE INTO users (id, display_name, email, password_hash)
         VALUES (?, ?, ?, ?)`,
        [u.id, u.display_name, u.email, passwordHash],
      );
    }

    // ── 2. Kategori ID'lerini al ──────────────────────────────────────────────
    const [catRows] = await conn.execute(`SELECT id, name FROM categories`);
    const catMap = {};
    for (const r of catRows) catMap[r.name] = r.id;

    // ── 3. Quizler ────────────────────────────────────────────────────────────
    console.log("📋 Quizler ekleniyor...");

    // Her quiz için INSERT yapıp ID'yi alıyoruz.
    // Idempotency: aynı sahip + aynı isim varsa atla.
    async function insertQuiz(ownerId, name, catName, difficulty, timeSec) {
      const [existing] = await conn.execute(
        `SELECT id FROM quizzes WHERE owner_id = ? AND name = ?`,
        [ownerId, name],
      );
      if (existing[0]) return existing[0].id;

      const [res] = await conn.execute(
        `INSERT INTO quizzes (owner_id, category_id, name, difficulty, time_per_q_s, is_public)
         VALUES (?, ?, ?, ?, ?, TRUE)`,
        [ownerId, catMap[catName] || null, name, difficulty, timeSec],
      );
      return res.insertId;
    }

    const q1Id = await insertQuiz(
      USER_IDS.ahmet,
      "Türkiye Coğrafyası",
      "Coğrafya",
      1,
      30,
    );
    const q2Id = await insertQuiz(
      USER_IDS.zeynep,
      "Dünya Tarihi",
      "Tarih",
      2,
      45,
    );
    const q3Id = await insertQuiz(
      USER_IDS.mehmet,
      "Temel Matematik",
      "Matematik",
      1,
      30,
    );
    const q4Id = await insertQuiz(
      USER_IDS.ahmet,
      "İngilizce Kelimeler",
      "İngilizce",
      2,
      40,
    );
    const q5Id = await insertQuiz(
      USER_IDS.zeynep,
      "Türk Müziği",
      "Müzik",
      1,
      30,
    );

    // ── 4. Sorular ve Cevaplar ────────────────────────────────────────────────
    console.log("❓ Sorular ekleniyor...");

    // Quiz 1 — Türkiye Coğrafyası
    await insertQuestion(
      conn,
      q1Id,
      0,
      "Türkiye'nin başkenti hangi şehirdir?",
      ["İstanbul", "Ankara", "İzmir", "Bursa"],
      1,
    );
    await insertQuestion(
      conn,
      q1Id,
      1,
      "Türkiye'nin en yüksek dağı hangisidir?",
      ["Kaçkar Dağı", "Erciyes Dağı", "Uludağ", "Ağrı Dağı"],
      3,
    );
    await insertQuestion(
      conn,
      q1Id,
      2,
      "Türkiye hangi iki kıta arasında yer almaktadır?",
      ["Asya-Afrika", "Avrupa-Asya", "Avrupa-Afrika", "Amerika-Asya"],
      1,
    );
    await insertQuestion(
      conn,
      q1Id,
      3,
      "Türkiye'nin yüzölçümü açısından en büyük gölü hangisidir?",
      ["Tuz Gölü", "Van Gölü", "Burdur Gölü", "Eğirdir Gölü"],
      1,
    );
    await insertQuestion(
      conn,
      q1Id,
      4,
      "Türkiye'nin en uzun nehri hangisidir?",
      ["Fırat Nehri", "Dicle Nehri", "Kızılırmak", "Sakarya Nehri"],
      2,
    );

    // Quiz 2 — Dünya Tarihi
    await insertQuestion(
      conn,
      q2Id,
      0,
      "İkinci Dünya Savaşı kaç yılında sona ermiştir?",
      ["1943", "1944", "1945", "1946"],
      2,
    );
    await insertQuestion(
      conn,
      q2Id,
      1,
      "Fransız Devrimi hangi yılda gerçekleşmiştir?",
      ["1776", "1789", "1799", "1812"],
      1,
    );
    await insertQuestion(
      conn,
      q2Id,
      2,
      "Rönesans hareketi hangi ülkede başlamıştır?",
      ["Fransa", "İngiltere", "İtalya", "Almanya"],
      2,
    );
    await insertQuestion(
      conn,
      q2Id,
      3,
      "Osmanlı İmparatorluğu hangi yılda kurulmuştur?",
      ["1299", "1326", "1453", "1517"],
      0,
    );
    await insertQuestion(
      conn,
      q2Id,
      4,
      "Avrupa'nın Amerika kıtasına yönelik keşif seferlerini başlatan güç hangisidir?",
      ["İngiltere", "Fransa", "İspanya ve Portekiz", "Hollanda"],
      2,
    );

    // Quiz 3 — Temel Matematik
    await insertQuestion(
      conn,
      q3Id,
      0,
      "12 × 12 kaçtır?",
      ["132", "144", "156", "124"],
      1,
    );
    await insertQuestion(
      conn,
      q3Id,
      1,
      "√144 kaçtır?",
      ["11", "12", "13", "14"],
      1,
    );
    await insertQuestion(
      conn,
      q3Id,
      2,
      "Pi sayısının yaklaşık değeri nedir?",
      ["3.41", "3.14", "3.12", "3.16"],
      1,
    );
    await insertQuestion(
      conn,
      q3Id,
      3,
      "2^10 kaçtır?",
      ["512", "2048", "256", "1024"],
      3,
    );
    await insertQuestion(
      conn,
      q3Id,
      4,
      "Bir üçgenin iç açıları toplamı kaç derecedir?",
      ["90", "270", "180", "360"],
      2,
    );

    // Quiz 4 — İngilizce Kelimeler
    await insertQuestion(
      conn,
      q4Id,
      0,
      '"Butterfly" kelimesinin Türkçe karşılığı nedir?',
      ["Arı", "Kelebek", "Sinek", "Böcek"],
      1,
    );
    await insertQuestion(
      conn,
      q4Id,
      1,
      '"Ambitious" kelimesinin anlamı nedir?',
      ["Tembel", "Hırslı", "Sakin", "Mutlu"],
      1,
    );
    await insertQuestion(
      conn,
      q4Id,
      2,
      '"Benevolent" kelimesinin anlamı nedir?',
      ["Zalim", "Cimri", "İyilik sever", "Kızgın"],
      2,
    );
    await insertQuestion(
      conn,
      q4Id,
      3,
      '"Ephemeral" kelimesinin anlamı nedir?',
      ["Kalıcı", "Geçici", "Güçlü", "Zayıf"],
      1,
    );
    await insertQuestion(
      conn,
      q4Id,
      4,
      '"Eloquent" kelimesinin anlamı nedir?',
      ["Suskun", "Kaba", "Güzel konuşan", "Korkak"],
      2,
    );

    // Quiz 5 — Türk Müziği
    await insertQuestion(
      conn,
      q5Id,
      0,
      "Türk halk müziğinde en yaygın kullanılan çalgı hangisidir?",
      ["Keman", "Bağlama", "Piyano", "Davul"],
      1,
    );
    await insertQuestion(
      conn,
      q5Id,
      1,
      "Türk sanat müziğinin önemli isimlerinden biri kimdir?",
      ["Münir Nurettin Selçuk", "Barış Manço", "Cem Karaca", "Tarkan"],
      0,
    );
    await insertQuestion(
      conn,
      q5Id,
      2,
      '"Kâtibim" türküsü hangi türe aittir?',
      ["Klasik Türk Müziği", "Arabesk", "Halk Müziği", "Pop"],
      2,
    );
    await insertQuestion(
      conn,
      q5Id,
      3,
      "Fasıl müziği hangi tür müziğin kapsamına girer?",
      ["Halk Müziği", "Türk Sanat Müziği", "Arabesk", "Pop"],
      1,
    );
    await insertQuestion(
      conn,
      q5Id,
      4,
      '"Sarı Zeybek" türküsünün ait olduğu bölge hangisidir?',
      ["Karadeniz", "Ege", "Trakya", "İç Anadolu"],
      1,
    );

    // ── 5. Geçmiş Oyun Oturumları ─────────────────────────────────────────────
    console.log("🎮 Oyun oturumları ekleniyor...");

    async function insertSession(
      quizId,
      hostId,
      pin,
      totalQ,
      startedAt,
      endedAt,
      players,
    ) {
      const [existing] = await conn.execute(
        `SELECT id FROM game_sessions WHERE room_pin = ?`,
        [pin],
      );
      if (existing[0]) return;

      const [res] = await conn.execute(
        `INSERT INTO game_sessions
           (quiz_id, host_id, room_pin, total_questions, started_at, ended_at, player_count)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [quizId, hostId, pin, totalQ, startedAt, endedAt, players.length],
      );
      const sessionId = res.insertId;

      for (const p of players) {
        const userId = p.isGuest ? null : p.userId;
        await conn.execute(
          `INSERT IGNORE INTO player_results
             (session_id, user_id, nickname, final_score, final_rank, correct_count, wrong_count)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [sessionId, userId, p.nickname, p.score, p.rank, p.correct, p.wrong],
        );
      }
    }

    await insertSession(
      q1Id,
      USER_IDS.ahmet,
      "123456",
      5,
      "2025-05-10 20:00:00",
      "2025-05-10 20:15:00",
      [
        {
          userId: USER_IDS.ahmet,
          nickname: "Ahmet",
          score: 480,
          rank: 1,
          correct: 5,
          wrong: 0,
          isGuest: false,
        },
        {
          userId: USER_IDS.selin,
          nickname: "Selin",
          score: 360,
          rank: 2,
          correct: 4,
          wrong: 1,
          isGuest: false,
        },
        {
          userId: USER_IDS.berk,
          nickname: "Berk",
          score: 240,
          rank: 3,
          correct: 3,
          wrong: 2,
          isGuest: false,
        },
        {
          userId: null,
          nickname: "Misafir1",
          score: 120,
          rank: 4,
          correct: 2,
          wrong: 3,
          isGuest: true,
        },
      ],
    );

    await insertSession(
      q2Id,
      USER_IDS.zeynep,
      "654321",
      5,
      "2025-05-11 19:30:00",
      "2025-05-11 19:50:00",
      [
        {
          userId: USER_IDS.zeynep,
          nickname: "Zeynep",
          score: 420,
          rank: 1,
          correct: 5,
          wrong: 0,
          isGuest: false,
        },
        {
          userId: USER_IDS.mehmet,
          nickname: "Mehmet",
          score: 380,
          rank: 2,
          correct: 4,
          wrong: 1,
          isGuest: false,
        },
        {
          userId: USER_IDS.berk,
          nickname: "Berk",
          score: 300,
          rank: 3,
          correct: 3,
          wrong: 2,
          isGuest: false,
        },
      ],
    );

    await insertSession(
      q3Id,
      USER_IDS.mehmet,
      "789012",
      5,
      "2025-05-12 21:00:00",
      "2025-05-12 21:20:00",
      [
        {
          userId: USER_IDS.mehmet,
          nickname: "Mehmet",
          score: 500,
          rank: 1,
          correct: 5,
          wrong: 0,
          isGuest: false,
        },
        {
          userId: USER_IDS.ahmet,
          nickname: "Ahmet",
          score: 400,
          rank: 2,
          correct: 4,
          wrong: 1,
          isGuest: false,
        },
        {
          userId: null,
          nickname: "Misafir2",
          score: 200,
          rank: 3,
          correct: 2,
          wrong: 3,
          isGuest: true,
        },
        {
          userId: null,
          nickname: "Misafir3",
          score: 100,
          rank: 4,
          correct: 1,
          wrong: 4,
          isGuest: true,
        },
      ],
    );

    await conn.commit();
    console.log("✅ Seed tamamlandı!");
    console.log("\n📌 Test kullanıcıları (tümünün şifresi: Test1234!):");
    console.log("   ahmet@test.com   → Ahmet Yılmaz  (2 quiz sahibi)");
    console.log("   zeynep@test.com  → Zeynep Kaya   (2 quiz sahibi)");
    console.log("   mehmet@test.com  → Mehmet Demir  (1 quiz sahibi)");
    console.log("   selin@test.com   → Selin Aydın");
    console.log("   berk@test.com    → Berk Çelik");
  } catch (err) {
    await conn.rollback();
    console.error("❌ Seed hatası:", err.message);
    throw err;
  } finally {
    conn.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
