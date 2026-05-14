# QuizNight
## Çok Oyunculu Real-Time Yarışma Sitesi

QuizNight, gerçek zamanlı çok oyunculu bir web tabanlı quiz platformudur. Kullanıcılar quiz oluşturabilir, 6 haneli PIN kodu ile arkadaşlarını davet edebilir ve anlık sıralama sistemiyle rekabetçi bir quiz deneyimi yaşayabilir. Kullanıcıların fiziksel mekanlardaki "Quiz Night" (Bilgi Yarışması Gecesi) deneyimini dijital ortama taşıyarak, belirli temalar (diziler, filmler, genel kültür vb.) etrafında topluluklar oluşturmasını ve gerçek zamanlı rekabet etmesini sağlamaktır. Proje, sadece bir test çözme platformu değil, aynı zamanda senkronize bir sosyal etkileşim alanı yaratmayı hedefler.

##  Ekran Görüntüleri

> Projenin ekran görüntüleri  
> Ana Menü, Quiz Oynama, Sıralama (Leaderboard)  
> Örnek: `![Ana Menü](./screenshots/main-menu.png)`

---

##  Özellikler

### Kullanıcı Sistemi
- E-posta ve şifre ile kayıt ve giriş
- JWT tabanlı kimlik doğrulama
- Misafir (guest) oyuncu desteği — kayıt olmadan oyuna katılma

### Quiz Oluşturma
- Quiz ismi, kategori, zorluk seviyesi ve soru başına süre ayarı
- Metin veya resim tabanlı sorular (ikisi birlikte de olabilir)
- 4 şıklı çoktan seçmeli format, doğru cevap belirleme

### Oyun Sistemi
- 6 haneli PIN kodu ile oda oluşturma ve katılma
- Socket.io ile gerçek zamanlı çok oyunculu oyun
- Geri sayım sayacı ve süreye göre dinamik puan sistemi (1000 → 10 arası)
- Doğru/yanlış anlık görsel ve sesli geri bildirim
- Anlık sıralama (Leaderboard) güncellemeleri

### Teknik
- Aktif oda verisi Redis'te tutulur (hız için)
- Biten oyunlar MySQL'e kalıcı olarak yazılır
- Arama ve sıralama ile quiz kütüphanesi
- Tam responsive tasarım (masaüstü ve mobil uyumlu)
- Neon temalı özel arayüz, arka plan müziği ve ses efektleri

---

##  Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| **Frontend** | React 18, CSS Modules |
| **Backend** | Node.js, Express.js |
| **Gerçek Zamanlı** | Socket.io |
| **Kalıcı Veritabanı** | MySQL 8 |
| **Önbellek / Aktif Oyun** | Redis (ioredis) |
| **Kimlik Doğrulama** | JWT, bcryptjs |
| **Ses** | HTML5 Audio API |

---

##  Proje Yapısı

```
QuizNight/
├── src/
│   ├── backend/
│   │   ├── mysqlOperations.js       # Kalıcı veri katmanı (Kullanıcı, Quiz, Soru, Oyun Oturumu)
│   │   ├── quiznight_schema.sql     # MySQL veritabanı şeması (v3.0)
│   │   ├── redisClient.js           # Paylaşılan Redis bağlantı instance'ı
│   │   ├── redisOperations.js       # Aktif oda, skor, oturum işlemleri
│   │   ├── roomManager.js           # MySQL ve Redis'i koordine eden üst seviye oyun yöneticisi
│   │   ├── scoringManager.js        # Puan hesaplama yardımcısı
│   │   └── server.js                # Express + Socket.io sunucusu, tüm API rotaları
│   │
│   ├── database/
│   │   ├── mysqlOperations.js       # Kalıcı veri katmanı (Kullanıcı, Quiz, Soru, Oyun Oturumu)
│   │   ├── quiznight_schema.sql     # MySQL veritabanı şeması (v3.0)
│   │   ├── redisClient.js           # Paylaşılan Redis bağlantı instance'ı
│   │   ├── redisOperations.js       # Aktif oda, skor, oturum işlemleri
│   │   ├── roomManager.js           # MySQL ve Redis'i koordine eden üst seviye oyun yöneticisi
│   │   └── scoringManager.js        # Puan hesaplama yardımcısı
│   │
│   └── frontend/
│       ├── public/
│       │   ├── sounds/
│       │   │   ├── click.mp3            # Buton tıklama sesi
│       │   │   ├── true1.mp3            # Doğru cevap sesi
│       │   │   ├── false1.mp3           # Yanlış cevap sesi
│       │   ├── background-music.mp3 # Arka plan müziği
│       │   └── index.html
│       │   
│       └── src/
│           ├── App.js                   # Ana uygulama — tüm state ve yönlendirme
│           ├── App.css                  # Global CSS import dosyası
│           ├── mockData.js              # Geçici test verileri (DB bağlanınca devre dışı)
│           │
│           ├── styles/ components.css       # Geri/Ayarlar buton stilleri
│           │   ├── components.css       # Geri/Ayarlar buton stilleri
│           │   └── global.css           # Tüm uygulamaya ait ortak stiller, neon tema
│           │
│           ├── components/
│           │   ├── BackButton.js        # Evrensel geri dön butonu
│           │   └── SettingsButton.js    # Evrensel ayarlar butonu
│           │
│           ├── hooks/
│           │   └── useSounds.js         # Ses efektleri hook'u (click, doğru, yanlış)
│           │
│           └── pages/
│               ├── AuthMenu.js/css              # Kayıt ol / Giriş yap seçim
│               ├── CreateQuizQuestions.js/css   # Quiz oluşturma — soru editörü
│               ├── CreateQuizSettings.js/css    # Quiz oluşturma — ayarlar adımı
│               ├── Dashboard.js/css             # Kullanıcı paneli, quiz carousel
│               ├── EnterPin.js/css              # PIN girişi (oyuncu)
│               ├── JoinQuizMenu.js/css          # Quize katılma menüsü
│               ├── Leaderboard.js/css           # Sıralama ekranı 
│               ├── LoginForm.js/css             # Giriş formu
│               ├── MainMenu.js/css              # Ana menü
│               ├── PlayingQuiz.js/css           # Quiz oynama ekranı
│               ├── QuizPinDetails.js/css        # PIN ekranı (host)
│               ├── QuizSelect.js/css            # Quiz kütüphanesi (arama + sıralama)
│               ├── RegisterForm.js/css          # Kayıt formu
│               ├── Settings.js/css              # Ses ve müzik ayarları
│               └── WaitingRoom.js/css           # Bekleme odası
```

---

##  Veritabanı Şeması

```
users              → Kullanıcı hesapları (display_name, email, password_hash)
categories         → Quiz kategorileri
quizzes            → Quiz ana kayıtları (zorluk, süre, sahip)
questions          → Sorular (metin ve/veya resim URL)
answer_options     → Cevap şıkları (is_correct ile doğru cevap işaretlenir)
game_sessions      → Tamamlanan oyun oturumları
player_results     → Oyuncu sonuçları (misafirler için user_id NULL)
```
> Şema dosyası: `src/backend/quiznight_schema.sql`
---

##  Kurulum

### Gereksinimler

- Node.js (v18 veya üzeri)
- MySQL 8
- Redis

### 1. Repoyu klonla

```bash
git clone https://github.com/kullanici-adin/QuizNight.git
cd QuizNight
```

### 2. Veritabanını kur

```bash
mysql -u root -p < src/backend/quiznight_schema.sql
```

### 3. Backend bağımlılıklarını yükle

```bash
cd src/backend
npm install
```

### 4. Ortam değişkenlerini ayarla

`src/backend/` klasöründe `.env` dosyası oluşturulur:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sifren
DB_NAME=quiznight

REDIS_HOST=host_id
REDIS_PORT=port_numarasi

JWT_SECRET=güvenli_bir_anahtar
PORT=port_numarasi
```

### 5. Backend'i başlat

```bash
node server.js
```

### 6. Frontend bağımlılıklarını yükle ve başlat

```bash
cd src/frontend
npm install
npm start
```

Tarayıcıda `http://localhost:3000` adresini aç.

---

##  Kullanım Rehberi

### Quiz Oluşturmak

1. Ana menüden **QUİZ OLUŞTUR**'a tıkla
2. Kayıt ol veya giriş yap
3. Dashboard'dan **Yeni Quiz Oluştur**'a tıkla
4. Quiz adı, kategori, soru başına süre ve zorluk seviyesini belirle
5. Soru editöründe sorularını ekle: metin veya resim seç, 4 şıkkı yaz, doğru cevabı işaretle
6. **Quizi Tamamla** ile kaydet

### Quiz Oynamak (Host olarak)

1. Ana menüden **QUİZE GİR → QUİZ SEÇ** yolunu izle
2. İstediğin quizi seç
3. Bir takma ad belirle, oluşturulan PIN'i arkadaşlarınla paylaş
4. Herkes katıldıktan sonra **OYUNU BAŞLAT**'a bas

### Quiz Oynamak (Oyuncu olarak)

1. Ana menüden **QUİZE GİR → PİN İLE GİRİŞ** yolunu izle
2. Bir takma ad belirle ve 6 haneli PIN'i gir
3. Host oyunu başlatana kadar bekleme odasında bekle

---

##  Socket.io Olayları

| Olay | Yön | Açıklama |
|------|-----|----------|
| `join_room` | İstemci → Sunucu | Odaya katılma isteği |
| `player_joined` | Sunucu → İstemci | Yeni oyuncu bilgisi + oyuncu listesi |
| `start_game` | İstemci → Sunucu | Oyunu başlatma (yalnızca host) |
| `game_started` | Sunucu → İstemci | Sorular ve süre bilgisi |
| `submit_answer` | İstemci → Sunucu | Cevap gönderme |
| `answer_feedback` | Sunucu → İstemci | Doğru/yanlış + puan bilgisi |
| `leaderboard_update` | Sunucu → İstemci | Anlık sıralama güncellemesi |
| `finalize_game` | İstemci → Sunucu | Oyunu bitirme isteği |
| `game_finished` | Sunucu → İstemci | Final sıralama sonuçları |

---

##  Geliştirici Notları

### DEV_MODE

`src/frontend/src/pages/WaitingRoom.js` dosyasında:

```js
const DEV_MODE = true; // Projeyi teslim ederken false yap
```

`false` yapıldığında bekleme odasındaki **"TEST: OYUNU BAŞLAT"** butonu otomatik kaybolur.

### Mock Veriler

`src/frontend/src/mockData.js` dosyası geçici test verileri içerir. Backend bağlandıktan sonra bu dosyanın içini yorum satırına alarak (`/* */`) devre dışı bırakılır.

Backend bağlandığında güncellenmeyi gerektiren yerler:
- `handleLoginClick` / `handleRegisterClick`   → Gerçek API istekleri
- `mockUserQuizzes`                            → Kullanıcının gerçek quizleri
- `mockQuizList`                               → Veritabanındaki gerçek quizler
- `mockActiveQuizQs`                           → Seçilen quizin gerçek soruları
- `mockLeaderboardData`                        → Gerçek sıralama verileri
- `finishAndGoToLeaderboard`                   → Gerçek skor hesaplama


### Ses Dosyaları

Ses dosyaları `public/sounds/` klasöründe olmalıdır:

```
public/sounds/click.mp3            → Buton tıklama sesi
public/sounds/true1.mp3            → Doğru cevap sesi
public/sounds/false1.mp3           → Yanlış cevap sesi
public/background-music.mp3        → Arka plan müziği
```

---

##  Geliştirici

**Efe Can Özdemir**
**Kübra Dereli**
**Hilal Çakıroğlu**

---

*Bu proje bir yazılım mühendisliği dersi kapsamında geliştirilmiştir.*
