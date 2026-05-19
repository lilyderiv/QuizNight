-- ============================================================
-- QuizNight — MySQL Veritabanı Şeması
-- Versiyon : 3.0
-- Değişiklik: Frontend + mimari contract'ı ile tam uyum
-- ============================================================
--
-- DEĞİŞİKLİK KAYDI (v2 → v3)
-- ─────────────────────────────────────────────────────────────
-- [FIX-1] questions.question_text  NULL yapıldı
--         Sebep: Frontend CreateQuizQuestions.js'de "Sadece Resim"
--         seçeneği mevcuttur; metin boş bırakılabilir.
--
-- [FIX-2] player_results.user_id  NOT NULL → NULL yapıldı
--         Sebep: EnterPin.js misafir oyuncuları destekler.
--         Kayıtlı kullanıcı olmayan oyuncular için NULL bırakılır.
--
-- [FIX-3] player_results UNIQUE(session_id, user_id) kaldırıldı
--         Sebep: user_id NULL olan birden fazla misafir aynı
--         oturumda oynayabilir; NULL değerlerde UNIQUE kısıtı
--         MySQL'de beklendiği gibi çalışmaz.
--         Mantıksal tekil kısıt uygulama katmanında sağlanır.
--
-- [FIX-4] game_sessions.host_id  ON DELETE CASCADE → RESTRICT
--         Sebep: Host kullanıcı silindiğinde geçmiş oyun
--         kayıtlarının da silinmesi veri kaybına yol açar.
--
-- [FIX-5] player_results.user_id ON DELETE CASCADE → SET NULL
--         Sebep: Kullanıcı hesabı silindiğinde oyun istatistikleri
--         korunmalı; sadece user bağlantısı kopmalıdır.
--
-- [ADD-1] questions tablosuna CHECK kısıtı eklendi:
--         question_text IS NOT NULL OR image_url IS NOT NULL
--         (Her soru en az bir içeriğe sahip olmalı)
--
-- [ADD-2] game_sessions.total_questions kolonu eklendi
--         Sebep: Leaderboard payload'ı { score, total } gerektirir;
--         total değeri her seferinde quiz'den JOIN ile çekilmemeli.
-- ============================================================

CREATE DATABASE IF NOT EXISTS quiznight
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE quiznight;

-- ============================================================
-- 1. KULLANICILAR (users)
--    Frontend bağlantısı:
--      RegisterForm → full_name, email, password
--      LoginForm    → email, password          (username DEĞİL)
--      Dashboard    → display_name gösterimi
-- ============================================================
CREATE TABLE users (
  id            VARCHAR(36)   NOT NULL,
  display_name  VARCHAR(50)   NOT NULL,           -- Dashboard / oyun içi görünen ad
  email         VARCHAR(255)  NOT NULL,           -- LoginForm: giriş e-posta ile yapılır
  password_hash VARCHAR(255)  NOT NULL,
  avatar_url    VARCHAR(500)  NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- NOT: Orijinal şemada "username" ve "full_name" ayrıydı.
-- Frontend RegisterForm.js "Ad Soyad" tek alan olarak topluyor,
-- LoginForm.js sadece e-posta + şifre kullanıyor.
-- Bu yüzden username kolonu kaldırıldı; display_name yeterli.


-- ============================================================
-- 2. KATEGORİLER (categories)
--    Frontend bağlantısı:
--      CreateQuizSettings → quizForm.category (text input → category_id)
--      QuizSelect         → filtreleme / sıralama
-- ============================================================
CREATE TABLE categories (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100)  NOT NULL,
  description TEXT          NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed: App.js quizList kategorileri ile eşleşen başlangıç verisi
INSERT INTO categories (name) VALUES
  ('Genel Kültür'),
  ('İngilizce'),
  ('Matematik'),
  ('Coğrafya'),
  ('Tarih'),
  ('Müzik'),
  ('Spor'),
  ('Edebiyat');


-- ============================================================
-- 3. QUİZLER (quizzes)
--    Frontend bağlantısı:
--      CreateQuizSettings → quizForm { name, category, min, sec, level }
--        time_per_q_s = quizForm.min * 60 + quizForm.sec
--        difficulty   = 'Kolay'→1 / 'Orta'→2 / 'Zor'→3
--      QuizSelect     → quizList { id, name, difficulty, date }
--      Dashboard      → quizzes[] carousel
-- ============================================================
CREATE TABLE quizzes (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  owner_id      VARCHAR(36)   NOT NULL,
  category_id   INT UNSIGNED  NULL,
  name          VARCHAR(150)  NOT NULL,
  difficulty    TINYINT       NOT NULL DEFAULT 1
                              CHECK (difficulty BETWEEN 1 AND 3),
  time_per_q_s  SMALLINT      NOT NULL DEFAULT 30
                              CHECK (time_per_q_s > 0),
  is_public     BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  CONSTRAINT fk_quizzes_owner    FOREIGN KEY (owner_id)
    REFERENCES users(id)       ON DELETE CASCADE,
  CONSTRAINT fk_quizzes_category FOREIGN KEY (category_id)
    REFERENCES categories(id)  ON DELETE SET NULL,

  INDEX idx_quizzes_owner      (owner_id),
  INDEX idx_quizzes_category   (category_id),
  INDEX idx_quizzes_difficulty (difficulty),
  INDEX idx_quizzes_created_at (created_at),         -- "Son/İlk eklenenler"
  INDEX idx_quizzes_public     (is_public, created_at) -- QuizSelect ana sorgusu
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 4. SORULAR (questions)
--    Frontend bağlantısı:
--      CreateQuizQuestions → questions[] { text, imagePreview, answers[], correctAnswerId }
--
--    [FIX-1] question_text NULL olabilir (sadece resimli soru)
--    [ADD-1] CHECK: metin VEYA resim zorunlu (ikisi birden NULL olamaz)
-- ============================================================
CREATE TABLE questions (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  quiz_id       INT UNSIGNED  NOT NULL,
  question_text TEXT          NULL,               -- [FIX-1] NULL → sadece resimli soru
  image_url     VARCHAR(500)  NULL,               -- imagePreview base64 → S3/CDN URL
  order_index   SMALLINT      NOT NULL DEFAULT 0,

  PRIMARY KEY (id),
  CONSTRAINT fk_questions_quiz FOREIGN KEY (quiz_id)
    REFERENCES quizzes(id) ON DELETE CASCADE,
  CONSTRAINT chk_question_content                 -- [ADD-1] en az bir içerik zorunlu
    CHECK (question_text IS NOT NULL OR image_url IS NOT NULL),

  INDEX idx_questions_quiz_order (quiz_id, order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 5. CEVAP SEÇENEKLERİ (answer_options)
--    Frontend bağlantısı:
--      answers[]     { id, text, isEditing }
--      correctAnswerId → is_correct = TRUE olan kayıt
--
--    Kısıt notları (uygulama katmanında):
--      • Her soruda en az 2, en fazla 4 seçenek
--      • Her soruda tam olarak 1 doğru cevap
-- ============================================================
CREATE TABLE answer_options (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  question_id  INT UNSIGNED  NOT NULL,
  option_text  VARCHAR(500)  NOT NULL,
  is_correct   BOOLEAN       NOT NULL DEFAULT FALSE,
  option_order TINYINT       NOT NULL DEFAULT 0,  -- 0=A, 1=B, 2=C, 3=D

  PRIMARY KEY (id),
  CONSTRAINT fk_answers_question FOREIGN KEY (question_id)
    REFERENCES questions(id) ON DELETE CASCADE,

  INDEX idx_answers_question (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 6. OYUN OTURUMLARI (game_sessions)
--    MySQL'e YALNIZCA biten oyunlar yazılır.
--    Aktif oda verisi Redis'te tutulur.
--
--    [FIX-4] host_id ON DELETE CASCADE → RESTRICT
--            Host silindiğinde geçmiş kayıtlar korunur.
--    [ADD-2] total_questions: Leaderboard { score, total } için
-- ============================================================
CREATE TABLE game_sessions (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  quiz_id          INT UNSIGNED  NOT NULL,
  host_id          VARCHAR(36)   NOT NULL,
  room_pin         CHAR(6)       NOT NULL,
  total_questions  SMALLINT      NOT NULL DEFAULT 0,  -- [ADD-2]
  started_at       DATETIME      NOT NULL,
  ended_at         DATETIME      NULL,
  player_count     SMALLINT      NOT NULL DEFAULT 0,

  PRIMARY KEY (id),
  CONSTRAINT fk_sessions_quiz FOREIGN KEY (quiz_id)
    REFERENCES quizzes(id)  ON DELETE CASCADE,
  CONSTRAINT fk_sessions_host FOREIGN KEY (host_id)
    REFERENCES users(id)    ON DELETE RESTRICT,     -- [FIX-4]

  INDEX idx_sessions_host    (host_id),
  INDEX idx_sessions_quiz    (quiz_id),
  INDEX idx_sessions_pin     (room_pin),
  INDEX idx_sessions_started (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 7. OYUNCU SONUÇLARI (player_results)
--    Redis leaderboard → MySQL flush (oyun bitişinde)
--    Frontend bağlantısı:
--      Leaderboard.js → leaderboardData[] { id, name, score, total }
--        id    → player_results.id
--        name  → player_results.nickname
--        score → player_results.correct_count   (doğru sayısı)
--        total → game_sessions.total_questions
--
--    [FIX-2] user_id NULL olabilir (misafir oyuncular)
--    [FIX-3] UNIQUE(session_id, user_id) kaldırıldı (NULL sorunu)
--    [FIX-5] user_id ON DELETE CASCADE → SET NULL
-- ============================================================
CREATE TABLE player_results (
  id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  session_id     INT UNSIGNED  NOT NULL,
  user_id        VARCHAR(36)   NULL,               -- [FIX-2] misafir için NULL
  nickname       VARCHAR(50)   NOT NULL,
  final_score    INT           NOT NULL DEFAULT 0, -- Zaman bonuslı toplam puan
  final_rank     SMALLINT      NOT NULL DEFAULT 0,
  correct_count  SMALLINT      NOT NULL DEFAULT 0, -- Leaderboard score alanı
  wrong_count    SMALLINT      NOT NULL DEFAULT 0,

  PRIMARY KEY (id),
  CONSTRAINT fk_results_session FOREIGN KEY (session_id)
    REFERENCES game_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_results_user FOREIGN KEY (user_id)
    REFERENCES users(id)         ON DELETE SET NULL, -- [FIX-5]

  -- [FIX-3] UNIQUE(session_id, user_id) kaldırıldı
  INDEX idx_results_user    (user_id),
  INDEX idx_results_session (session_id),
  INDEX idx_results_rank    (session_id, final_rank) -- Leaderboard sıralaması
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
