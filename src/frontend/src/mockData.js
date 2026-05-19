// --- KULLANICI BİLGİLERİ ---
export const mockUser = {
  fullName: "Hilal Çakıroğlu",
};

// --- GİRİŞ YAPINCA GELEN QUİZLER (Dashboard Carousel) ---
export const mockUserQuizzes = [
  { id: 1, name: "A2 İngilizce Kelimeler" },
  { id: 2, name: "Genel Kültür 1" },
  { id: 3, name: "Eser-Yazar Eşleşmeleri" },
  { id: 4, name: "Dört İşlem" },
  { id: 5, name: "Organik Kimya" },
  { id: 6, name: "Şarkı sözleri" },
];

// --- QUİZ KÜTÜPHANESI (QuizSelect sayfası) ---
export const mockQuizList = [
  { id: 1, name: "English A2 test", difficulty: 1, date: 8 },
  { id: 2, name: "Ülkeler", difficulty: 2, date: 7 },
  { id: 3, name: "Genel Kültür", difficulty: 2, date: 6 },
  { id: 4, name: "Şairler / Yazarlar", difficulty: 3, date: 5 },
  { id: 5, name: "İlçeler", difficulty: 1, date: 4 },
  { id: 6, name: "Futbolcular", difficulty: 1, date: 3 },
  { id: 7, name: "Pop Şarkılar", difficulty: 1, date: 2 },
  { id: 8, name: "Savaşlar", difficulty: 3, date: 1 },
];

// --- SIRALAMA (Leaderboard) ---
export const mockLeaderboardData = [
  { id: 1, name: "Cookie", score: 10, total: 10 },
  { id: 2, name: "Alice", score: 9, total: 10 },
  { id: 3, name: "Strawberry", score: 9, total: 10 },
  { id: 4, name: "The Champ", score: 7, total: 10 },
  { id: 5, name: "Eugene", score: 2, total: 10 },
  { id: 6, name: "Hilal", score: 1, total: 10 },
];

// --- OYUN SORULARI (PlayingQuiz) ---
export const mockActiveQuizQs = [
  {
    id: 1,
    text: "İstiklal Marşı'mızın şairi kimdir?",
    time: 25,
    answers: [
      "Mehmet Akif Ersoy",
      "Attila İlhan",
      "Sait Faik Abasıyanık",
      "Cahit Zarifoğlu",
    ],
    correct: "Mehmet Akif Ersoy",
  },
  {
    id: 2,
    text: "Türkiye'nin başkenti neresidir?",
    time: 15,
    answers: ["İstanbul", "Ankara", "İzmir", "Bursa"],
    correct: "Ankara",
  },
];