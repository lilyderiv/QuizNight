// =====================================================================
// App.js — Uygulamanın ana dosyası ve merkezi yönetim noktası.
// Tüm state'ler, fonksiyonlar ve sayfa yönlendirmesi buradan yönetilir.
// =====================================================================

import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import "./styles/components.css";
import { io } from "socket.io-client";
import axios from "axios";

// Sahte (mock) veriler — database bağlanınca bu import kaldırılacak
import {
  mockUser,
  mockUserQuizzes,
  mockQuizList,
  mockLeaderboardData,
  mockActiveQuizQs,
} from "./mockData";

// Ortak bileşenler
import BackButton from "./components/BackButton";
import SettingsButton from "./components/SettingsButton";

// Ses hook'u
import useSounds from "./hooks/useSounds";

// Sayfa bileşenleri
import MainMenu from "./pages/MainMenu";
import AuthMenu from "./pages/AuthMenu";
import LoginForm from "./pages/LoginForm";
import RegisterForm from "./pages/RegisterForm";
import Dashboard from "./pages/Dashboard";
import JoinQuizMenu from "./pages/JoinQuizMenu";
import QuizSelect from "./pages/QuizSelect";
import EnterPin from "./pages/EnterPin";
import QuizPinDetails from "./pages/QuizPinDetails";
import WaitingRoom from "./pages/WaitingRoom";
import PlayingQuiz from "./pages/PlayingQuiz";
import Leaderboard from "./pages/Leaderboard";
import Settings from "./pages/Settings";
import CreateQuizSettings from "./pages/CreateQuizSettings";
import CreateQuizQuestions from "./pages/CreateQuizQuestions";

// DEV_MODE: true iken test özellikleri aktif.
// Projeyi teslim ederken false yap.
const DEV_MODE = true;

function App() {
  // --- SAYFA YÖNETİMİ ---
  // Hangi sayfanın gösterileceğini kontrol eder
  const [currentView, setCurrentView] = useState("mainMenu");
  // Ayarlar sayfasından geri dönmek için önceki sayfayı saklar
  const [previousView, setPreviousView] = useState("mainMenu");

  // --- AYARLAR STATE'LERİ ---
  const [soundVolume, setSoundVolume] = useState(50);   // Ses efekti seviyesi (0-100)
  const [musicVolume, setMusicVolume] = useState(50);   // Müzik seviyesi (0-100)
  const [isSoundMuted, setIsSoundMuted] = useState(false); // Ses efekti susturuldu mu?
  const [isMusicMuted, setIsMusicMuted] = useState(false); // Müzik susturuldu mu?

  // --- KULLANICI VE GİRİŞ STATE'LERİ ---
  const [quizzes, setQuizzes] = useState([]);          // Kullanıcının kendi quizleri
  const [loginError, setLoginError] = useState(false); // Giriş hatası var mı?
  const [enteredPin, setEnteredPin] = useState("");    // Oyuncu tarafından girilen pin
  const [hostNickname, setHostNickname] = useState(""); // Quiz kurucu (host) takma adı
  const [playerNickname, setPlayerNickname] = useState(""); // Oyuncu takma adı

  // --- QUİZ ARAMA VE SIRALAMA STATE'LERİ ---
  const [searchTerm, setSearchTerm] = useState("");              // Arama kutusu metni
  const [sortOption, setSortOption] = useState("Son eklenenler"); // Seçili sıralama
  const [currentPin, setCurrentPin] = useState("");              // Üretilen oyun pini

  // --- QUİZ OLUŞTURMA STATE'LERİ ---
  // Quiz ayarları formu (isim, kategori, süre, seviye)
  const [quizForm, setQuizForm] = useState({
    name: "", category: "", pin: "", min: "", sec: "", level: "",
  });

  // Soruların listesi (her soru: metin, resim, şıklar, doğru cevap)
  const [questions, setQuestions] = useState([
    {
      id: 1,
      text: "",
      imagePreview: null,
      isSelectingType: false,
      answers: [
        { id: 1, text: "", isEditing: false },
        { id: 2, text: "", isEditing: false },
        { id: 3, text: "", isEditing: false },
        { id: 4, text: "", isEditing: false },
      ],
      correctAnswerId: null,
    },
  ]);

  // Şu an düzenlenen sorunun index'i
  const [currentQIndex, setCurrentQIndex] = useState(0);

  // --- MOCK VERİLER (database bağlanınca kaldırılacak) ---
  const [quizList] = useState(mockQuizList);                         // Quiz kütüphanesi
  const [leaderboardData, setLeaderboardData] = useState(mockLeaderboardData); // Sıralama
  const [activeQuizQs] = useState(mockActiveQuizQs);                // Aktif quiz soruları

  // --- OYUN STATE'LERİ ---
  const [playQIndex, setPlayQIndex] = useState(0);         // Şu an oynanan sorunun index'i
  const [timeLeft, setTimeLeft] = useState(30);            // Kalan süre (saniye)
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false); // Hamburger menü
  const [feedbackStatus, setFeedbackStatus] = useState(null); // 'correct', 'incorrect' veya null

  // --- MÜZİK MOTORU ---
  // Arka plan müziği için ses nesnesi referansı
  const audioRef = useRef(null);

  // Müzik susturulduğunda veya açıldığında otomatik durdur/başlat
  useEffect(() => {
    if (audioRef.current) {
      if (isMusicMuted) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((e) => console.log("Otomatik oynatma bekliyor..."));
      }
    }
  }, [isMusicMuted]);

  // Müzik ses seviyesi değiştiğinde uygula (0-100 → 0.0-1.0)
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = musicVolume / 100;
    }
  }, [musicVolume]);

  // Tarayıcı güvenlik politikası: ilk kullanıcı etkileşiminde müziği başlat
  const handleFirstInteraction = () => {
    if (audioRef.current && audioRef.current.paused && !isMusicMuted) {
      audioRef.current.play().catch((e) => console.log("Müzik başlatılamadı", e));
    }
  };

  // --- SES EFEKTLERİ ---
  // useSounds hook'u: click, doğru ve yanlış seslerini yönetir
  const { playClick, playTrue, playFalse } = useSounds(soundVolume, isSoundMuted);

  // --- YARDIMCI FONKSİYONLAR ---

  // 6 haneli rastgele pin üretir (harf + rakam karışımı)
  const generateRandomPin = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let newPin = "";
    for (let i = 0; i < 6; i++) {
      newPin += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return newPin;
  };

  // Yeni quiz oluşturma ekranını açar ve formu sıfırlar
  const openCreateQuiz = () => {
    setQuizForm({ name: "", category: "", min: "0", sec: "30", level: "" });
    setQuestions([
      {
        id: 1, text: "", imagePreview: null, isSelectingType: false,
        answers: [
          { id: 1, text: "", isEditing: false },
          { id: 2, text: "", isEditing: false },
          { id: 3, text: "", isEditing: false },
          { id: 4, text: "", isEditing: false },
        ],
        correctAnswerId: null,
      },
    ]);
    setCurrentQIndex(0);
    setCurrentView("createQuizSettings");
  };

  // Kayıt ol butonuna basılınca: boş quiz listesiyle dashboard'a git
  const handleRegisterClick = () => {
    setQuizzes([]);
    setCurrentView("dashboard");
  };

  // Giriş yap butonuna basılınca: mock quizleri yükle ve dashboard'a git
  // Database bağlanınca bu fonksiyon API çağrısına dönüşecek
  const handleLoginClick = () => {
    setLoginError(false);
    setQuizzes(mockUserQuizzes);
    setCurrentView("dashboard");
  };

  // Ayarlar sayfasını açar, önceki sayfayı saklar (geri dönmek için)
  const openSettings = () => {
    if (currentView !== "settings") {
      setPreviousView(currentView);
      setCurrentView("settings");
    }
  };

  // Ayarlar sayfasından geri dön
  const goBack = () => {
    if (currentView === "createQuizSettings" || currentView === "createQuizQuestions") {
      setCurrentView("dashboard");
    } else if (currentView === "enterPin") {
      setCurrentView("joinQuizMenu");
    } else {
      setCurrentView(previousView);
    }
  };

  // Şu an düzenlenen soruyu kısmi olarak günceller
  const updateCurrentQuestion = (updates) => {
    const updatedQs = [...questions];
    updatedQs[currentQIndex] = { ...updatedQs[currentQIndex], ...updates };
    setQuestions(updatedQs);
  };

  // Soru için resim yüklenir ve önizleme URL'si oluşturulur
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      updateCurrentQuestion({ imagePreview: previewUrl, isSelectingType: false });
    }
  };

  // Belirtilen şıkın metnini günceller
  const handleAnswerChange = (ansId, newText) => {
    const newAnswers = questions[currentQIndex].answers.map((a) =>
      a.id === ansId ? { ...a, text: newText } : a
    );
    updateCurrentQuestion({ answers: newAnswers });
  };

  // Şık düzenleme modunu aç veya kapat
  const toggleAnswerEdit = (ansId, editingState) => {
    const newAnswers = questions[currentQIndex].answers.map((a) =>
      a.id === ansId ? { ...a, isEditing: editingState } : a
    );
    updateCurrentQuestion({ answers: newAnswers });
  };

  // Belirtilen şıkkı sil (onay alır, doğru cevapsa onu da temizler)
  const removeAnswer = (ansId) => {
    if (window.confirm("Bu seçeneği silmek istediğinize emin misiniz?")) {
      const newAnswers = questions[currentQIndex].answers.map((a) =>
        a.id === ansId ? { ...a, text: "", isEditing: false } : a
      );
      updateCurrentQuestion({
        answers: newAnswers,
        correctAnswerId:
          questions[currentQIndex].correctAnswerId === ansId
            ? null
            : questions[currentQIndex].correctAnswerId,
      });
    }
  };

  // Listeye yeni boş bir soru sayfası ekler ve ona geçer
  const addNewPage = () => {
    setQuestions([
      ...questions,
      {
        id: questions.length + 1, text: "", imagePreview: null, isSelectingType: false,
        answers: [
          { id: 1, text: "", isEditing: false },
          { id: 2, text: "", isEditing: false },
          { id: 3, text: "", isEditing: false },
          { id: 4, text: "", isEditing: false },
        ],
        correctAnswerId: null,
      },
    ]);
    setCurrentQIndex(questions.length);
  };

  // Quizi tamamla: quizler listesine ekle ve dashboard'a dön
  const finishQuiz = () => {
    setQuizzes([...quizzes, { id: Date.now(), name: quizForm.name || "İsimsiz Quiz" }]);
    setCurrentView("dashboard");
  };

  // Quiz bitince sıralama ekranına geç.
  // DEV_MODE'da sabit 11 puan verir (Cookie'yi geçmek için).
  // Database bağlanınca bu fonksiyon gerçek skorla çalışacak.
  const finishAndGoToLeaderboard = () => {
    const activeName = hostNickname || playerNickname || "Gizli Oyuncu";
    const myResult = {
      id: 999,
      name: activeName,
      score: DEV_MODE ? 11 : 0, // DEV_MODE kapatılınca 0 olur (gerçek skor gelecek)
      total: 10,
    };
    const updatedLeaderboard = [...leaderboardData.filter((p) => p.id !== 999), myResult];
    updatedLeaderboard.sort((a, b) => b.score - a.score);
    setLeaderboardData(updatedLeaderboard);
    setCurrentView("leaderboard");
  };

  // Sonraki soruya geç veya quiz bittiyse sıralama ekranına git
  const handleNextOrEnd = () => {
    if (playQIndex < activeQuizQs.length - 1) {
      setPlayQIndex(playQIndex + 1);
      setTimeLeft(activeQuizQs[playQIndex + 1].time);
    } else {
      finishAndGoToLeaderboard();
    }
  };

  // Cevap şıkkına tıklanınca:
  // 1. Doğru/yanlış ses çalar
  // 2. Geri bildirim overlay'i gösterilir
  // 3. 0.5 saniye sonra sonraki soruya geçilir
  const handleAnswerClick = (ans) => {
    if (feedbackStatus) return; // Zaten geri bildirim gösteriliyorsa tıklamayı engelle
    const isCorrect = ans === activeQuizQs[playQIndex].correct;
    if (isCorrect) {
      playTrue();  // Doğru cevap sesi
    } else {
      playFalse(); // Yanlış cevap sesi
    }
    setFeedbackStatus(isCorrect ? "correct" : "incorrect");
    setTimeout(() => {
      setFeedbackStatus(null);
      handleNextOrEnd();
    }, 500);
  };

  // İleri ok butonuna basılınca soruyu atla
  const handleNextPlayQuestion = () => {
    if (feedbackStatus) return;
    handleNextOrEnd();
  };

  // Oyunu başlat: state'leri sıfırla ve oyun ekranına geç
  const startQuiz = () => {
    setPlayQIndex(0);
    setTimeLeft(activeQuizQs[0].time);
    setIsOptionsMenuOpen(false);
    setFeedbackStatus(null);
    setCurrentView("playingQuiz");
  };

  // --- ZAMANLAYICI ---
  // Oyun ekranındayken her saniye timeLeft'i 1 azaltır.
  // Süre bitince boş cevapla handleAnswerClick tetiklenir (yanlış sayılır).
  // feedbackStatus varken (tik/çarpı gösterilirken) sayaç durur.
  useEffect(() => {
    if (currentView === "playingQuiz" && timeLeft > 0 && !feedbackStatus) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else if (currentView === "playingQuiz" && timeLeft === 0 && !feedbackStatus) {
      handleAnswerClick(""); // Boş cevap = yanlış
    }
  }, [currentView, timeLeft, feedbackStatus]);

  // =====================================================================
  // RENDER — Aktif sayfayı göster
  // currentView state'i hangi değerdeyse o sayfa bileşeni render edilir.
  // =====================================================================
  return (
    // İlk etkileşimde müziği başlatmak için tüm uygulamaya onClick eklendi
    <div className="app-container" onClick={handleFirstInteraction}>

      {/* Arka plan müziği oynatıcısı (görünmez, otomatik döngüde çalar) */}
      <audio ref={audioRef} src="/background-music.mp3" autoPlay loop 
      playClick={playClick} />

      {/* Her sayfada ortak: Geri butonu (oyun ekranı ve ana menüde gizlenir) */}
      <BackButton currentView={currentView} setCurrentView={setCurrentView} />

      {/* Her sayfada ortak: Ayarlar çark butonu */}
      <SettingsButton currentView={currentView} openSettings={openSettings} />

      {/* Ana Menü */}
      {currentView === "mainMenu" && (
        <MainMenu setCurrentView={setCurrentView} playClick={playClick} />
      )}

      {/* Kayıt Ol / Giriş Yap Seçim Ekranı */}
      {currentView === "authMenu" && (
        <AuthMenu setCurrentView={setCurrentView} playClick={playClick} />
      )}

      {/* Kayıt Ol Formu */}
      {currentView === "registerForm" && (
        <RegisterForm onRegister={handleRegisterClick} playClick={playClick} />
      )}

      {/* Giriş Yap Formu */}
      {currentView === "loginForm" && (
        <LoginForm onLogin={handleLoginClick} loginError={loginError} playClick={playClick} />
      )}

      {/* Dashboard: Kullanıcının quizleri */}
      {currentView === "dashboard" && (
        <Dashboard
          quizzes={quizzes}
          openCreateQuiz={openCreateQuiz}
          setCurrentView={setCurrentView}
          playClick={playClick}
        />
      )}

      {/* Quize Giriş Menüsü: Quiz Seç veya Pin ile Giriş */}
      {currentView === "joinQuizMenu" && (
        <JoinQuizMenu setCurrentView={setCurrentView} playClick={playClick} />
      )}

      {/* Quiz Kütüphanesi: Arama ve sıralama ile quiz seçimi */}
      {currentView === "quizSelect" && (
        <QuizSelect
          quizList={quizList}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortOption={sortOption}
          setSortOption={setSortOption}
          setCurrentView={setCurrentView}
          setCurrentPin={setCurrentPin}
          generateRandomPin={generateRandomPin}
          playClick={playClick}
        />
      )}

      {/* Pin Giriş Ekranı: Oyuncu isim ve pin girer */}
      {currentView === "enterPin" && (
        <EnterPin
          playerNickname={playerNickname}
          setPlayerNickname={setPlayerNickname}
          enteredPin={enteredPin}
          setEnteredPin={setEnteredPin}
          setCurrentView={setCurrentView}
          playClick={playClick}
        />
      )}

      {/* Pin Detay Ekranı: Host isim girer, pin görür, oyunu başlatır */}
      {currentView === "quizPinDetails" && (
        <QuizPinDetails
          hostNickname={hostNickname}
          setHostNickname={setHostNickname}
          currentPin={currentPin}
          startQuiz={startQuiz}
          playClick={playClick}
        />
      )}

      {/* Bekleme Odası: Oyuncular toplanırken host bekler */}
      {currentView === "waitingRoom" && (
        <WaitingRoom startQuiz={startQuiz} playClick={playClick} />
      )}

      {/* Quiz Oynama Ekranı: Sorular, cevaplar, sayaç */}
      {currentView === "playingQuiz" && (
        <PlayingQuiz
          activeQuizQs={activeQuizQs}
          playQIndex={playQIndex}
          timeLeft={timeLeft}
          feedbackStatus={feedbackStatus}
          isOptionsMenuOpen={isOptionsMenuOpen}
          setIsOptionsMenuOpen={setIsOptionsMenuOpen}
          handleAnswerClick={handleAnswerClick}
          handleNextPlayQuestion={handleNextPlayQuestion}
          finishAndGoToLeaderboard={finishAndGoToLeaderboard}
          setCurrentView={setCurrentView}
          playClick={playClick}
        />
      )}

      {/* Sıralama Ekranı: Quiz sonuçları */}
      {currentView === "leaderboard" && (
        <Leaderboard leaderboardData={leaderboardData} playClick={playClick} />
      )}

      {/* Ayarlar Ekranı: Ses ve müzik kontrolleri */}
      {currentView === "settings" && (
        <Settings
          goBack={goBack}
          soundVolume={soundVolume}
          setSoundVolume={setSoundVolume}
          musicVolume={musicVolume}
          setMusicVolume={setMusicVolume}
          isSoundMuted={isSoundMuted}
          setIsSoundMuted={setIsSoundMuted}
          isMusicMuted={isMusicMuted}
          setIsMusicMuted={setIsMusicMuted}
          playClick={playClick}
        />
      )}

      {/* Quiz Oluşturma — Ayarlar Adımı */}
      {currentView === "createQuizSettings" && (
        <CreateQuizSettings
          quizForm={quizForm}
          setQuizForm={setQuizForm}
          setCurrentView={setCurrentView}
          playClick={playClick}
        />
      )}

      {/* Quiz Oluşturma — Soru Editörü Adımı */}
      {currentView === "createQuizQuestions" && (
        <CreateQuizQuestions
          questions={questions}
          currentQIndex={currentQIndex}
          setCurrentQIndex={setCurrentQIndex}
          updateCurrentQuestion={updateCurrentQuestion}
          handleImageUpload={handleImageUpload}
          handleAnswerChange={handleAnswerChange}
          toggleAnswerEdit={toggleAnswerEdit}
          removeAnswer={removeAnswer}
          addNewPage={addNewPage}
          finishQuiz={finishQuiz}
          playClick={playClick}
        />
      )}
    </div>
  );
}

export default App;