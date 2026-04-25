import React, { useState, useRef, useEffect } from "react";
import "./App.css";

function App() {
  // --- 1. STATE'LER (HAFIZA) ---
  const [currentView, setCurrentView] = useState("mainMenu");
  const [previousView, setPreviousView] = useState("mainMenu");

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [soundVolume, setSoundVolume] = useState(50);
  const [musicVolume, setMusicVolume] = useState(50);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);

  const carouselRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [loginError, setLoginError] = useState(false);
  const [enteredPin, setEnteredPin] = useState("");

  const [quizForm, setQuizForm] = useState({
    name: "",
    category: "",
    pin: "",
    min: "",
    sec: "",
    level: "",
  });

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

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const currentQ = questions[currentQIndex];

  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("Son eklenenler");
  const [isSortOpen, setIsSortOpen] = useState(false);

  const [currentPin, setCurrentPin] = useState("");

  const generateRandomPin = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let newPin = '';
    for (let i = 0; i < 6; i++) {
      newPin += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return newPin;
  };

  const [quizList, setQuizList] = useState([
    { id: 1, name: "English A2 test", difficulty: 1, date: 8 },
    { id: 2, name: "Ülkeler", difficulty: 2, date: 7 },
    { id: 3, name: "Genel Kültür", difficulty: 2, date: 6 },
    { id: 4, name: "Şairler / Yazarlar", difficulty: 3, date: 5 },
    { id: 5, name: "İlçeler", difficulty: 1, date: 4 },
    { id: 6, name: "Futbolcular", difficulty: 1, date: 3 },
    { id: 7, name: "Pop Şarkılar", difficulty: 1, date: 2 },
    { id: 8, name: "Savaşlar", difficulty: 3, date: 1 }
  ]);

  let filteredQuizzes = quizList.filter(q => 
    q.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (sortOption === "İsme Göre Azalan") filteredQuizzes.sort((a,b) => b.name.localeCompare(a.name));
  else if (sortOption === "İsme Göre Artan") filteredQuizzes.sort((a,b) => a.name.localeCompare(b.name));
  else if (sortOption === "Zordan Kolaya") filteredQuizzes.sort((a,b) => b.difficulty - a.difficulty);
  else if (sortOption === "Kolaydan Zora") filteredQuizzes.sort((a,b) => a.difficulty - b.difficulty);
  else if (sortOption === "İlk Eklenenler Başta") filteredQuizzes.sort((a,b) => a.date - b.date);
  else filteredQuizzes.sort((a,b) => b.date - a.date);

  // --- 2. FONKSİYONLAR ---

  const openCreateQuiz = () => {
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    setQuizForm({
    name: "",
    category: "",
    min: "0",
    sec: "30",
    level: "",
  });
    setQuestions([
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
    setCurrentQIndex(0);
    setCurrentView("createQuizSettings");
  };

  const handleRegisterClick = () => {
    setQuizzes([]);
    setCurrentView("dashboard");
  };

  const handleLoginClick = () => {
    const errorCondition = false; 
    if (errorCondition) {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 15000);
    } else {
      setLoginError(false);
      setQuizzes([
        { id: 1, name: "A2 İngilizce Kelimeler" },
        { id: 2, name: "Genel Kültür 1" },
        { id: 3, name: "Eser-Yazar Eşleşmeleri" },
        { id: 4, name: "Dört İşlem" },
        { id: 5, name: "Organik Kimya" },
        { id: 6, name: "Şarkı sözleri" },
      ]);
      setCurrentView("dashboard");
    }
  };

  const checkArrows = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(
        Math.ceil(scrollLeft) < scrollWidth - clientWidth - 5
      );
    }
  };

  useEffect(() => {
    checkArrows();
    window.addEventListener("resize", checkArrows);
    return () => window.removeEventListener("resize", checkArrows);
  }, [quizzes, currentView]);

  const scrollCarousel = (dir) => {
    if (carouselRef.current) {
      const scrollAmount = 436;
      carouselRef.current.scrollBy({
        left: dir === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const sortMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const updateCurrentQuestion = (updates) => {
    const updatedQs = [...questions];
    updatedQs[currentQIndex] = { ...updatedQs[currentQIndex], ...updates };
    setQuestions(updatedQs);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      updateCurrentQuestion({
        imagePreview: previewUrl,
        isSelectingType: false,
      });
    }
  };

  // --- OYUN OYNAMA (PLAY) STATE'LERİ VE YENİ EKLENENLER ---
  const [playQIndex, setPlayQIndex] = useState(0); 
  const [timeLeft, setTimeLeft] = useState(30); 
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false); 
  
  // YENİ: Ekranda tik/çarpı çıkmasını kontrol eden hafıza
  const [feedbackStatus, setFeedbackStatus] = useState(null); // null, 'correct' veya 'incorrect'

  // YENİ: Sorulara "correct" (doğru cevap) eklendi
  const [activeQuizQs, setActiveQuizQs] = useState([
    { id: 1, text: "İstiklal Marşı'mızın şairi kimdir?", time: 25, answers: ["Mehmet Akif Ersoy", "Attila İlhan", "Sait Faik Abasıyanık", "Cahit Zarifoğlu"], correct: "Mehmet Akif Ersoy" },
    { id: 2, text: "Türkiye'nin başkenti neresidir?", time: 15, answers: ["İstanbul", "Ankara", "İzmir", "Bursa"], correct: "Ankara" }
  ]);

  // --- ZAMANLAYICI VE GERİ BİLDİRİM MANTIĞI ---
  useEffect(() => {
    // Eğer ekranda geri bildirim (tik/çarpı) YOKSA süre akar, VARSA süre donar!
    if (currentView === "playingQuiz" && timeLeft > 0 && !feedbackStatus) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else if (currentView === "playingQuiz" && timeLeft === 0 && !feedbackStatus) {
      // Süre biterse otomatik yanlış kabul et ve atla
      handleAnswerClick(""); 
    }
  }, [currentView, timeLeft, feedbackStatus]);

  const handleNextOrEnd = () => {
    if (playQIndex < activeQuizQs.length - 1) {
      setPlayQIndex(playQIndex + 1);
      setTimeLeft(activeQuizQs[playQIndex + 1].time);
    } else {
      setCurrentView("mainMenu"); // Şimdilik sıralama olmadığı için ana menüye döner
    }
  };

  // ŞIKLARA TIKLANDIĞINDA ÇALIŞACAK FONKSİYON
  const handleAnswerClick = (ans) => {
    if (feedbackStatus) return; // Zaten ekranda tik varken art arda tıklanmasını engeller

    const isCorrect = ans === activeQuizQs[playQIndex].correct;
    setFeedbackStatus(isCorrect ? "correct" : "incorrect");

    // Tam 0.5 saniye bekle ve sonraki soruya uç!
    setTimeout(() => {
      setFeedbackStatus(null); 
      handleNextOrEnd(); 
    }, 500);
  };

  const handleNextPlayQuestion = () => {
    if (feedbackStatus) return;
    handleNextOrEnd(); // İleri okuna basılırsa direkt atlar
  };

  const startQuiz = () => {
    setPlayQIndex(0);
    setTimeLeft(activeQuizQs[0].time);
    setIsOptionsMenuOpen(false); 
    setFeedbackStatus(null); // Başlarken ekranı temizle
    setCurrentView("playingQuiz");
  };

  const removeImage = () => {
    if (window.confirm("Resmi silmek istediğinize emin misiniz?"))
      updateCurrentQuestion({ imagePreview: null });
  };

  const removeText = () => {
    if (window.confirm("Soruyu silmek istediğinize emin misiniz?"))
      updateCurrentQuestion({ text: "" });
  };

  const handleAnswerChange = (ansId, newText) => {
    const newAnswers = currentQ.answers.map((a) =>
      a.id === ansId ? { ...a, text: newText } : a
    );
    updateCurrentQuestion({ answers: newAnswers });
  };

  const toggleAnswerEdit = (ansId, editingState) => {
    const newAnswers = currentQ.answers.map((a) =>
      a.id === ansId ? { ...a, isEditing: editingState } : a
    );
    updateCurrentQuestion({ answers: newAnswers });
  };

  const removeAnswer = (ansId) => {
    if (window.confirm("Bu seçeneği silmek istediğinize emin misiniz?")) {
      const newAnswers = currentQ.answers.map((a) =>
        a.id === ansId ? { ...a, text: "", isEditing: false } : a
      );
      updateCurrentQuestion({
        answers: newAnswers,
        correctAnswerId:
          currentQ.correctAnswerId === ansId
            ? null
            : currentQ.correctAnswerId,
      });
    }
  };

  const addNewPage = () => {
    setQuestions([
      ...questions,
      {
        id: questions.length + 1,
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
    setCurrentQIndex(questions.length);
  };

  const finishQuiz = () => {
    setQuizzes([
      ...quizzes,
      { id: Date.now(), name: quizForm.name || "İsimsiz Quiz" },
    ]);
    setCurrentView("dashboard");
  };

  const openSettings = () => {
    if (currentView !== "settings") {
      setPreviousView(currentView);
      setCurrentView("settings");
    }
  };

  const goBack = () => {
    if (
      currentView === "createQuizSettings" ||
      currentView === "createQuizQuestions"
    ) {
      setCurrentView("dashboard");
    } else if (currentView === "enterPin") {
      setCurrentView("joinQuizMenu");
    } else {
      setCurrentView(previousView);
    }
  };

  // =====================================================================
  // --- EKRAN ÇİZİMİ (JSX) ---
  // =====================================================================
  return (
    <div className="app-container">
      
      {/* --- EVRENSEL BUTONLAR (Geri ve Ayarlar) --- */}
      {currentView !== "mainMenu" &&
        currentView !== "settings" &&
        currentView !== "dashboard" &&
        currentView !== "playingQuiz" && ( /* 1. DEĞİŞİKLİK: Oyun ekranında "Geri Oku" gizleniyor! */
          <button
            className="back-navigation-button"
            onClick={() => {
              if (currentView === "loginForm" || currentView === "registerForm") {
                setCurrentView("authMenu");
              } else if (currentView === "createQuizSettings" || currentView === "createQuizQuestions") {
                setCurrentView("dashboard");
              } else if (currentView === "joinQuizMenu") {
                setCurrentView("mainMenu");
              } else if (currentView === "quizSelect") {
                setCurrentView("joinQuizMenu");
              } else if (currentView === "quizPinDetails") {
                setCurrentView("quizSelect");
              } else if (currentView === "enterPin") {
                setCurrentView("joinQuizMenu");
              } else if (currentView === "waitingRoom") {
                setCurrentView("mainMenu");
              } else {
                setCurrentView("mainMenu");
              }
            }}
          >
            <svg className="nav-icon-svg" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

      {/* --- EVRENSEL AYARLAR BUTONU --- */}
      {currentView !== "settings" && ( /* 2. KURAL: Ayarlar çarkı oyun ekranında GÖRÜNMEYE DEVAM EDECEK! */
        <button
          className="settings-button"
          onClick={openSettings}
          style={{
            /* Oyun ekranındayken Geri/Hamburger butonu 15px'te olduğu için Ayarlar 75px'e kayacak (tam istediğimiz gibi) */
            left: currentView === "mainMenu" || currentView === "dashboard" ? "15px" : "75px",
          }}
        >
          {/* AYARLAR ÇARK İKONU */}
          <svg className="nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      )}

      {currentView !== "settings" && (
        <button
          className="settings-button"
          onClick={openSettings}
          style={{
            left:
              currentView === "mainMenu" || currentView === "dashboard"
                ? "15px"
                : "75px",
          }}
        >
          <svg className="nav-icon-svg" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      )}

      {/* --- QUİZ SEÇ SAYFASI ÖZEL ÜST BUTONLAR --- */}
      {currentView === "quizSelect" && (
        <>
          {/* Sıralama Butonu (Ayarların hemen sağında - KESİN ÇÖZÜM) */}
          <div ref={sortMenuRef} style={{ position: "absolute", top: "15px", left: "135px", zIndex: 50 }}>
            <button 
              className="settings-button" 
              style={{ position: "relative", top: "0", left: "0", margin: "0" }}
              onClick={() => setIsSortOpen(!isSortOpen)}
            >
              {/* Huni (Filtre) İkonu */}
              <svg className="nav-icon-svg" viewBox="0 0 24 24">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
            </button>

            {/* Açılır Menü (Dropdown) */}
            {isSortOpen && (
              <div className="sort-dropdown-menu neon-box" style={{ top: "110%", left: "0" }}>
                {["İsme Göre Azalan", "İsme Göre Artan", "Zordan Kolaya", "Kolaydan Zora", "Son eklenenler", "İlk Eklenenler Başta"].map(option => (
                  <button 
                    key={option} 
                    className="sort-option-btn neon-text"
                    onClick={() => {
                      setSortOption(option);
                      setIsSortOpen(false);
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Arama Kutusu (Sağ Üst Köşe) - Burası Aynı Kalıyor */}
          <div className="search-box-container neon-box">
            <svg className="search-icon-svg" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              className="search-input neon-text" 
              placeholder="Ara"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </>
      )}

      {/* KESİR (Sadece Sorular Ekranında) */}
      {currentView === "createQuizQuestions" && (
        <div
          className="qq-fraction neon-box"
          style={{
            position: "absolute",
            top: "15px",
            right: "25px",
            width: "clamp(80px, 10vw, 165px)",
            height: "50px",
            zIndex: 130,
          }}
        >
          <span className="neon-text" style={{ fontSize: "2rem" }}>
            {currentQIndex + 1}/{questions.length}
          </span>
        </div>
      )}

      {/* --- ANA MENÜ --- */}
      {currentView === "mainMenu" && (
        <>
          <div className="title-box neon-box">
            <h1 className="title-text neon-text">HOŞ GELDİN!</h1>
          </div>
          <div className="characters-container"></div>
          <div className="subtitle-box neon-box">
            <h2 className="subtitle-text neon-text">
              Ne yapmak istediğine karar ver...
            </h2>
          </div>
          <div className="button-container">
            {/* BURAYI GÜNCELLEDİK: onClick eklendi */}
            <button 
              className="action-button neon-box"
              onClick={() => setCurrentView("joinQuizMenu")}
            >
              <span className="neon-text">QUİZE</span>
              <span className="neon-text">GİR</span>
            </button>

            <button
              className="action-button neon-box"
              onClick={() => setCurrentView("authMenu")}
            >
              <span className="neon-text">QUİZ</span>
              <span className="neon-text">OLUŞTUR</span>
            </button>
          </div>
        </>
      )}

      {/* --- KAYIT OL / GİRİŞ YAP SEÇİM --- */}
      {currentView === "authMenu" && (
        <div className="auth-page-container">
          <button
            className="auth-button neon-box"
            onClick={() => setCurrentView("registerForm")}
          >
            <span className="neon-text">Kayıt ol</span>
          </button>
          <button
            className="auth-button neon-box"
            onClick={() => setCurrentView("loginForm")}
          >
            <span className="neon-text">Giriş Yap</span>
          </button>
        </div>
      )}

      {/* --- KAYIT FORMU --- */}
      {currentView === "registerForm" && (
        <div className="register-page-container">
          <div className="form-row">
            <div className="form-label neon-box">
              <span className="neon-text">Ad Soyad</span>
            </div>
            <input type="text" className="neon-input neon-text" autoComplete="off" />
          </div>
          <div className="form-row">
            <div className="form-label neon-box">
              <span className="neon-text">e-mail</span>
            </div>
            <input type="email" className="neon-input neon-text" autoComplete="off" />
          </div>
          <div className="form-row">
            <div className="form-label neon-box">
              <span className="neon-text">şifre</span>
            </div>
            <input type="password" placeholder="**********" className="neon-input neon-text" autoComplete="new-password" />
          </div>
          <button
            className="auth-button neon-box submit-button"
            onClick={handleRegisterClick}
          >
            <span className="neon-text">Kaydı onayla</span>
          </button>
        </div>
      )}

      {/* --- GİRİŞ FORMU --- */}
{currentView === "loginForm" && (
  <div className="login-page-container">
    <div className="login-form-row">
      <div className="login-label neon-box">
        <span className="neon-text">e-mail</span>
      </div>
      <input type="email" className="login-input neon-text" autoComplete="off" />
    </div>
    <div className="login-form-row">
      <div className="login-label neon-box">
        <span className="neon-text">şifre</span>
      </div>
      <input type="password" placeholder="**********" className="login-input neon-text" autoComplete="new-password" />
    </div>
    <button
      className="login-submit-button neon-box"
      onClick={handleLoginClick}
    >
      <span className="neon-text">Giriş Yap</span>
    </button>

    {/* İŞTE BURAYA EKLEDİK: Eğer hata varsa bu kutu görünecek */}
    {loginError && (
      <div className="login-error-box neon-box">
        <span className="error-text">
          E-posta adresinizi veya şifrenizi yanlış girdiniz. 
          Böyle bir kullanıcı bulunmamaktadır. Lütfen tekrar deneyin.
        </span>
      </div>
    )}
  </div>
)}

      {/* --- DASHBOARD EKRANI --- */}
      {currentView === "dashboard" && (
        <>
          {/* Üst Panel (Profil ve İsim) */}
          <div style={{ position: "absolute", top: "15px", left: "75px", zIndex: 130 }}>
            <button
              className="dash-profile-btn"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            >
              <svg className="nav-icon-svg" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>
            {isProfileMenuOpen && (
              <div className="dash-dropdown neon-box">
                <button
                  className="dash-logout"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setCurrentView("mainMenu");
                  }}
                >
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>
          <div className="dash-username neon-box">
            <span className="neon-text" title="Hilal Çakıroğlu">
              Hilal Çakıroğlu
            </span>
          </div>

          {/* İçerik */}
          <div className="dash-container">
            <div className="dash-title neon-box">
              <span className="neon-text">Quizlerin</span>
            </div>
            {quizzes.length === 0 ? (
              <div className="dash-empty neon-box">
                <span className="neon-text">
                  Henüz bir quiz oluşturmadın...
                </span>
              </div>
            ) : (
              <div className="dash-carousel">
                {showLeftArrow && (
                  <button className="dash-arrow neon-box" onClick={() => scrollCarousel("left")}>
                    <svg className="nav-icon-svg" viewBox="0 0 24 24">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                )}
                <div className="dash-scroll-area" ref={carouselRef} onScroll={checkArrows}>
                  {quizzes.map((q) => (
                    <button key={q.id} className="dash-quiz-card neon-box" title={q.name}>
                      <span className="neon-text">{q.name}</span>
                    </button>
                  ))}
                </div>
                {showRightArrow && (
                  <button className="dash-arrow neon-box" onClick={() => scrollCarousel("right")}>
                    <svg className="nav-icon-svg" viewBox="0 0 24 24">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                )}
              </div>
            )}
            <button className="dash-new-btn neon-box" onClick={openCreateQuiz}>
              <span className="neon-text">Yeni Quiz oluştur</span>
            </button>
          </div>
        </>
      )}

      {/* --- YENİ QUİZ OLUŞTURMA (AYARLAR) EKRANI --- */}
      {currentView === "createQuizSettings" && (
        <div className="cq-container">
          <div className="cq-username neon-box">
            <span className="neon-text" title="Hilal Çakıroğlu">
              Hilal Çakıroğlu
            </span>
          </div>
          <div className="cq-form-area">
            <div className="cq-row">
              <div className="cq-label neon-box">
                <span className="neon-text">Quizin İsmi</span>
              </div>
              <input
                type="text"
                className="cq-input neon-text"
                value={quizForm.name}
                onChange={(e) => setQuizForm({ ...quizForm, name: e.target.value })}
              />
            </div>
            <div className="cq-row">
              <div className="cq-label neon-box">
                <span className="neon-text">Kategori</span>
              </div>
              <input
                type="text"
                className="cq-input neon-text"
                value={quizForm.category}
                onChange={(e) => setQuizForm({ ...quizForm, category: e.target.value })}
              />
            </div>
            <div className="cq-row">
              <div className="cq-label neon-box">
                <span className="neon-text" style={{ whiteSpace: "pre-wrap" }}>
                  Soru Başına Geçecek Süre
                </span>
              </div>
              <div className="cq-time-container">
                <div className="cq-select-box neon-box">
                  <select
                    className="cq-select neon-text"
                    value={quizForm.min}
                    onChange={(e) => setQuizForm({ ...quizForm, min: e.target.value })}
                  >
                    <option value="" disabled hidden></option>
                    {[0, 1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <span className="cq-suffix neon-text">dk</span>
                </div>
                <div className="cq-select-box neon-box">
                  <select
                    className="cq-select neon-text"
                    value={quizForm.sec}
                    onChange={(e) => setQuizForm({ ...quizForm, sec: e.target.value })}
                  >
                    <option value="" disabled hidden></option>
                    {Array.from({ length: 59 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <span className="cq-suffix neon-text">sn</span>
                </div>
              </div>
            </div>
            <div className="cq-level-section">
              <div className="cq-level-title-row">
                <div className="cq-level-title neon-box">
                  <span className="neon-text">Seviye</span>
                </div>
                <button
                  className="cq-next-btn neon-box"
                  onClick={() => setCurrentView("createQuizQuestions")}
                >
                  <svg className="nav-icon-svg" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="cq-level-buttons">
                <button
                  className={`cq-level-btn neon-box ${quizForm.level && quizForm.level !== "Kolay" ? "dimmed" : ""}`}
                  onClick={() => setQuizForm({ ...quizForm, level: "Kolay" })}
                >
                  <span className="neon-text">Kolay</span>
                </button>
                <button
                  className={`cq-level-btn neon-box ${quizForm.level && quizForm.level !== "Orta" ? "dimmed" : ""}`}
                  onClick={() => setQuizForm({ ...quizForm, level: "Orta" })}
                >
                  <span className="neon-text">Orta</span>
                </button>
                <button
                  className={`cq-level-btn neon-box ${quizForm.level && quizForm.level !== "Zor" ? "dimmed" : ""}`}
                  onClick={() => setQuizForm({ ...quizForm, level: "Zor" })}
                >
                  <span className="neon-text">Zor</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- EFSANE SAYFA: SORU EDİTÖRÜ --- */}
      {currentView === "createQuizQuestions" && currentQ && (
        <div className="qq-container">
          {/* BÜYÜK SORU KUTUSU */}
          <div className="qq-main-box neon-box">
            {!currentQ.imagePreview && !currentQ.text && !currentQ.isSelectingType && (
              <button
                className="qq-giant-plus"
                onClick={() => updateCurrentQuestion({ isSelectingType: true })}
              >
                <svg viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            )}

            {currentQ.isSelectingType && !currentQ.imagePreview && !currentQ.text && (
              <div className="qq-selection-options">
                <label className="qq-select-btn neon-box neon-text">
                  Resim
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
                </label>
                <button
                  className="qq-select-btn neon-box neon-text"
                  onClick={() => updateCurrentQuestion({ isSelectingType: false, text: " ", isEditingText: true })}
                >
                  Soruyu Yaz
                </button>
              </div>
            )}

            {(currentQ.imagePreview || currentQ.text) && (
              <div className="qq-filled-content">
                {currentQ.imagePreview && (
                  <div className="qq-image-wrapper">
                    <img src={currentQ.imagePreview} alt="Soru" className="qq-image" />
                    <button className="qq-trash-btn" onClick={removeImage} title="Resmi Sil">
                      <svg viewBox="0 0 24 24">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                )}
                {currentQ.text && (
                  <div className="qq-text-wrapper">
                    {currentQ.isEditingText ? (
                      <>
                        <textarea
                          className="qq-textarea neon-text"
                          placeholder="Sorunuzu buraya yazın..."
                          value={currentQ.text.trim() === "" ? "" : currentQ.text}
                          onChange={(e) => updateCurrentQuestion({ text: e.target.value })}
                          autoFocus
                        />
                        <button
                          className="qq-ok-btn neon-text"
                          onClick={() => updateCurrentQuestion({ isEditingText: false })}
                        >
                          OK
                        </button>
                      </>
                    ) : (
                      <>
                        <div
                          style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                          onClick={() => updateCurrentQuestion({ isEditingText: true })}
                          title="Yazıyı düzenlemek için tıklayın"
                        >
                          <span className="neon-text qq-ans-text">{currentQ.text}</span>
                        </div>
                        <button className="qq-trash-btn" onClick={removeText} title="Soruyu Sil">
                          <svg viewBox="0 0 24 24">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* EKSİK OLANI EKLEME OVERLAY'İ */}
                {!(currentQ.imagePreview && currentQ.text) && !currentQ.isEditingText && (
                  <div className="qq-add-more-overlay">
                    {!currentQ.imagePreview ? (
                      <label className="qq-overlay-btn neon-box neon-text">
                        + Resim Ekle
                        <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
                      </label>
                    ) : (
                      <button className="qq-overlay-btn neon-box neon-text" onClick={() => updateCurrentQuestion({ text: " ", isEditingText: true })}>
                        + Yazı Ekle
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="qq-middle-section">
            <button
              className="qq-side-arrow neon-box"
              onClick={() => setCurrentQIndex(currentQIndex - 1)}
              style={{ visibility: currentQIndex > 0 ? "visible" : "hidden" }}
            >
              <svg className="nav-icon-svg" viewBox="0 0 24 24">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <div className="qq-answers-grid">
              {currentQ.answers.map((ans) => (
                <div key={ans.id} className="qq-answer-box neon-box">
                  {!ans.text && !ans.isEditing && (
                    <button className="qq-giant-plus" onClick={() => toggleAnswerEdit(ans.id, true)}>
                      <svg viewBox="0 0 24 24">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </button>
                  )}

                  {ans.isEditing && (
                    <div className="qq-answer-edit-mode">
                      <textarea
                        className="qq-answer-input neon-text"
                        value={ans.text}
                        onChange={(e) => handleAnswerChange(ans.id, e.target.value)}
                        autoFocus
                      />
                      <button className="qq-ok-btn neon-text" onClick={() => toggleAnswerEdit(ans.id, false)}>
                        OK
                      </button>
                    </div>
                  )}

                  {ans.text && !ans.isEditing && (
                    <div className="qq-answer-filled">
                      <span className="neon-text qq-ans-text">{ans.text}</span>
                      {currentQ.correctAnswerId === ans.id && (
                        <div className="qq-correct-badge">DOĞRU CEVAP</div>
                      )}
                      <button className="qq-trash-btn" onClick={() => removeAnswer(ans.id)}>
                        <svg viewBox="0 0 24 24">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                      <div className="qq-correct-overlay" onClick={() => updateCurrentQuestion({ correctAnswerId: ans.id })}>
                        <span className="neon-text" style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                          Doğru Cevap Olarak Ayarla
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              className="qq-side-arrow neon-box"
              onClick={() => setCurrentQIndex(currentQIndex + 1)}
              style={{ visibility: currentQIndex < questions.length - 1 ? "visible" : "hidden" }}
            >
              <svg className="nav-icon-svg" viewBox="0 0 24 24">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          <div className="qq-bottom-buttons">
            <button className="qq-bottom-btn neon-box" onClick={finishQuiz}>
              <span className="neon-text">Quizi Tamamla</span>
            </button>
            <button className="qq-bottom-btn neon-box" onClick={addNewPage}>
              <span className="neon-text" style={{ textDecoration: "underline" }}>Yeni Sayfa</span>
            </button>
          </div>
        </div>
      )}

      {/* --- QUİZE GİRİŞ SEÇENEKLERİ SAYFASI --- */}
      {currentView === "joinQuizMenu" && (
        <div className="join-quiz-container">
          
          {/* Her iki butonu da 'auth-button' sınıfına çektik ki tasarım kardeş olsun */}
          <button 
            className="auth-button neon-box"
            onClick={() => setCurrentView("quizSelect")} 
          >
            <span className="neon-text">QUİZ SEÇ</span>
          </button>

          <button 
            className="auth-button neon-box" 
            onClick={() => setCurrentView("enterPin")}
          >
            <span className="neon-text">PİN İLE GİRİŞ</span>
          </button>

        </div>
      )}

      {/* --- QUİZ SEÇİM SAYFASI (GRID) --- */}
      {currentView === "quizSelect" && (
        <div className="quiz-select-page">
          
          {/* O Seçili Sıralama Adını Gösteren Şeffaf Kutu */}
          <div className="current-sort-label neon-box">
            <span className="neon-text">{sortOption}</span>
          </div>

          {/* 4'lü Aşağı Kayan Quiz Grid Sistemi */}
          <div className="quiz-grid-container">
            {filteredQuizzes.map((quiz) => (
              <button 
                key={quiz.id} 
                className="quiz-item-button neon-box"
                onClick={() => {
                  setCurrentPin(generateRandomPin()); // Tıklanınca yeni 6 haneli pin üretir
                  setCurrentView("quizPinDetails");   // Ve pin sayfasına geçer
                }}
              >
                <span className="neon-text">{quiz.name}</span>
              </button>
            ))}
          </div>

        </div>
      )}


      {/* --- PİN GİRİŞ EKRANI (OYUNCULAR İÇİN) --- */}
      {currentView === "enterPin" && (
        <div className="enter-pin-container">
          {/* Üstteki Transparan Başlık Kutusu */}
          <div className="enter-pin-label neon-box">
            <span className="neon-text">Pini Gir</span>
          </div>

          {/* Alttaki Tıklanabilir Lacivert Girdi (Input) Kutusu */}
          <input
            type="text"
            className="enter-pin-input neon-box neon-text"
            value={enteredPin}
            onChange={(e) => setEnteredPin(e.target.value.toUpperCase())}
            maxLength={6}
            autoFocus
            autoComplete="off"
            spellCheck="false"
          />

          {/* YENİ: Pini Onayla Butonu */}
          {/* Pini Onayla Butonunun onClick kısmını güncelle */}
          <button 
            className="pin-confirm-button neon-box"
            onClick={() => {
              if(enteredPin.length === 6) {
                setCurrentView("waitingRoom"); // Bekleme odasına uçuyoruz!
              } else {
                alert("Lütfen 6 haneli pini girin.");
              }
            }}
          >
            <span className="neon-text">Pini Onayla</span>
          </button>
        </div>
      )}



      {/* --- QUİZ PİN DETAY SAYFASI --- */}
      {currentView === "quizPinDetails" && (
        <div className="pin-screen-container">
          
          {/* Oyun Pini (Üstteki dar, transparan kutu) */}
          <div className="pin-label-box neon-box">
            <span className="neon-text">OYUN PİNİ</span>
          </div>

          {/* Ana Pin Kodu (İçi lacivert dolu kutu) */}
          <div className="pin-code-box neon-box">
            <span className="neon-text">{currentPin}</span>
          </div>

          {/* Bilgi Yazısı (Transparan alt kutu) */}
          <div className="pin-info-box neon-box">
            <span className="neon-text">Arkadaşlarını bu pine çağır!</span>
          </div>

          {/* Oyunu Başlat Butonu */}
          <button className="pin-start-button neon-box">
            <span className="neon-text">OYUNU BAŞLAT</span>
          </button>
          
        </div>
      )}


      {/* --- BEKLEME ODASI EKRANI --- */}
      {currentView === "waitingRoom" && (
        <div className="waiting-room-container">
          <div className="waiting-message-box neon-box">
            <span className="neon-text">
              HERKES TOPLANANA<br />
              KADAR<br />
              BEKLEMEDESİN :)
            </span>
          </div>
          {/* SADECE TASARIMI TEST ETMEK İÇİN GEÇİCİ BUTON */}
          <button 
            className="pin-confirm-button neon-box" 
            style={{ marginTop: "3dvh", backgroundColor: "rgba(0, 12, 66, 0.8)" }}
            onClick={startQuiz} // Bu fonksiyon seni doğrudan o şahane oyun ekranına uçuracak!
          >
            <span className="neon-text">TEST: OYUNU BAŞLAT</span>
          </button>

        </div>
      )}


      {/* --- QUİZ OYNAMA EKRANI (PLAYING QUIZ) --- */}
      {currentView === "playingQuiz" && activeQuizQs[playQIndex] && (
        <div 
          className="play-quiz-container" 
          onClick={() => { if(isOptionsMenuOpen) setIsOptionsMenuOpen(false); }} // Ekrana tıklandığında menüyü kapatır
        >
          {/* ÜST BAR: SADECE Hamburger Menü (Sabit Konum) */}
          <div className="play-top-fixed-bar">
            <div style={{ position: "relative" }}>
              <button 
                className="back-navigation-button" 
                style={{ position: "relative", top: 0, left: 0 }}
                onClick={(e) => { e.stopPropagation(); setIsOptionsMenuOpen(!isOptionsMenuOpen); }}
              >
                <svg className="nav-icon-svg" viewBox="0 0 24 24">
                  <path d="M3 12h18M3 6h18M3 18h18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              
              {isOptionsMenuOpen && (
                <div className="play-options-dropdown neon-box" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setCurrentView("mainMenu")}>
                    <span className="neon-text">Quizden Çık</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* SAYAÇ VE SÜRE */}
          <div className="play-info-row">
            <div className="play-counter-box neon-box">
              <span className="neon-text">{playQIndex + 1}/{activeQuizQs.length}</span>
            </div>
            <div className="play-timer-box neon-box">
              <span className="neon-text">00.{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
            </div>
          </div>

          {/* SORU METNİ */}
          <div className="play-question-box neon-box">
            <span className="neon-text">{activeQuizQs[playQIndex].text}</span>
          </div>

          {/* CEVAPLAR VE İLERİ OKU */}
          <div className="play-answers-wrapper">
            <div className="play-answers-grid">
              {activeQuizQs[playQIndex].answers.map((ans, i) => (
                <button key={i} className="play-answer-btn neon-box" onClick={() => handleAnswerClick(ans)}>
                  <span className="neon-text">{ans}</span>
                </button>
              ))}
            </div>

            {/* Son soruda değilsek Ok tuşu çıksın */}
            {playQIndex < activeQuizQs.length - 1 && (
              <button className="play-next-arrow neon-box" onClick={handleNextPlayQuestion}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            )}
          </div>

          {/* QUİZİ BİTİR BUTONU */}
          <button className="play-end-quiz-btn neon-box" onClick={() => setCurrentView("mainMenu")}>
            <span className="neon-text">Quizi Bitir</span>
          </button>

          {/* --- YENİ: DEV TİK VEYA ÇARPI EKRANI (0.5 SANİYE GÖRÜNÜR) --- */}
          {feedbackStatus && (
            <div className="feedback-overlay">
              <div className="feedback-circle neon-box">
                {feedbackStatus === "correct" ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                )}
              </div>
            </div>
          )}

        </div>
      )}



      {/* --- AYARLAR EKRANI --- */}
      {currentView === "settings" && (
        <div className="settings-page-container">
          <div className="setting-row">
            <button
              className={`icon-btn neon-box ${isSoundMuted ? "muted" : ""}`}
              onClick={() => setIsSoundMuted(!isSoundMuted)}
            >
              <svg className="neon-svg icon-content" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
              </svg>
            </button>
            <input
              type="range"
              className="neon-slider"
              min="0"
              max="100"
              value={isSoundMuted ? 0 : soundVolume}
              onChange={(e) => {
                setSoundVolume(e.target.value);
                if (e.target.value > 0) setIsSoundMuted(false);
              }}
            />
          </div>
          <div className="setting-row">
            <button
              className={`icon-btn neon-box ${isMusicMuted ? "muted" : ""}`}
              onClick={() => setIsMusicMuted(!isMusicMuted)}
            >
              <svg className="neon-svg icon-content" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M9 18V5l12-2v13"></path>
                <circle cx="6" cy="18" r="3"></circle>
                <circle cx="18" cy="16" r="3"></circle>
              </svg>
            </button>
            <input
              type="range"
              className="neon-slider"
              min="0"
              max="100"
              value={isMusicMuted ? 0 : musicVolume}
              onChange={(e) => {
                setMusicVolume(e.target.value);
                if (e.target.value > 0) setIsMusicMuted(false);
              }}
            />
          </div>
          <button className="auth-button neon-box back-button" onClick={goBack}>
            <span className="neon-text">Geri Dön</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default App;