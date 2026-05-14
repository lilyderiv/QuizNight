// =====================================================================
// App.js — Uygulamanın ana dosyası ve merkezi yönetim noktası.
// =====================================================================

import React, { useState, useRef, useEffect, useCallback } from "react";
import "./App.css";
import "./styles/components.css";
import { io } from "socket.io-client";
import axios from "axios";

import {
  mockUserQuizzes,
  mockQuizList,
  mockLeaderboardData,
  mockActiveQuizQs,
} from "./mockData";

import BackButton from "./components/BackButton";
import SettingsButton from "./components/SettingsButton";
import useSounds from "./hooks/useSounds";

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

// DEV_MODE = false → gerçek backend bağlantısı aktif
// DEV_MODE = true  → mock verilerle bağımsız test
const DEV_MODE = false;
const API_URL = "http://localhost:3000";

// Socket bağlantısı — modül düzeyinde bir kez oluşturulur
const socket = io(API_URL, { autoConnect: true });

function App() {
  // --- SAYFA YÖNETİMİ ---
  const [currentView, setCurrentView] = useState("mainMenu");
  const [previousView, setPreviousView] = useState("mainMenu");

  // --- KULLANICI STATE ---
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // --- AYARLAR STATE ---
  const [soundVolume, setSoundVolume] = useState(50);
  const [musicVolume, setMusicVolume] = useState(50);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);

  // --- GİRİŞ STATE ---
  const [loginError, setLoginError] = useState(false);
  const [enteredPin, setEnteredPin] = useState("");
  const [hostNickname, setHostNickname] = useState("");
  const [playerNickname, setPlayerNickname] = useState("");

  // --- QUİZ ARAMA VE SIRALAMA ---
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("Son eklenenler");
  const [currentPin, setCurrentPin] = useState("");

  // --- QUİZ OLUŞTURMA ---
  const [quizForm, setQuizForm] = useState({
    name: "",
    category: "",
    min: "0",
    sec: "30",
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

  // --- VERİ STATE ---
  const [quizzes, setQuizzes] = useState([]);
  const [quizList, setQuizList] = useState(DEV_MODE ? mockQuizList : []);
  const [leaderboardData, setLeaderboardData] = useState(
    DEV_MODE ? mockLeaderboardData : [],
  );
  const [activeQuizQs, setActiveQuizQs] = useState(
    DEV_MODE ? mockActiveQuizQs : [],
  );
  const [players, setPlayers] = useState([]); // Odadaki oyuncular listesi

  // --- OYUN STATE ---
  const [playQIndex, setPlayQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState(null);
  const [isHost, setIsHost] = useState(false); // Bu client host mu?

  // --- MÜZİK ---
  const audioRef = useRef(null);

  // --- SOCKET HANDLER REF'LERİ (stale closure'dan korumak için) ---
  // Socket event handler'ları useEffect ile bir kez kurulur;
  // state'e doğrudan erişemezler — ref'ler her render'da güncellenir.
  const playQIndexRef = useRef(0);
  const activeQuizQsRef = useRef([]);
  const currentPinRef = useRef("");
  const enteredPinRef = useRef("");
  const isHostRef = useRef(false);
  const timeLimitMsRef = useRef(30000);
  const questionStartTimeRef = useRef(null);

  // Ref'leri state ile senkronize tut
  useEffect(() => {
    playQIndexRef.current = playQIndex;
  }, [playQIndex]);
  useEffect(() => {
    activeQuizQsRef.current = activeQuizQs;
  }, [activeQuizQs]);
  useEffect(() => {
    currentPinRef.current = currentPin;
  }, [currentPin]);
  useEffect(() => {
    enteredPinRef.current = enteredPin;
  }, [enteredPin]);
  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  // =====================================================================
  // UYGULAMA BAŞLANGIÇ — localStorage'dan oturum yükle
  // =====================================================================
  useEffect(() => {
    if (DEV_MODE) return;
    const savedToken = localStorage.getItem("quiznight_token");
    const savedUser = localStorage.getItem("quiznight_user");
    if (!savedToken || !savedUser) return;

    try {
      const parsedUser = JSON.parse(savedUser);
      setToken(savedToken);
      setUser(parsedUser);
      // Kullanıcının quizlerini yükle
      axios
        .get(`${API_URL}/api/quizzes/my`, {
          headers: { Authorization: `Bearer ${savedToken}` },
        })
        .then((res) => setQuizzes(res.data.quizzes || []))
        .catch(() => {
          // Token geçersiz — oturumu temizle
          localStorage.removeItem("quiznight_token");
          localStorage.removeItem("quiznight_user");
          setToken(null);
          setUser(null);
        });
    } catch {
      localStorage.removeItem("quiznight_token");
      localStorage.removeItem("quiznight_user");
    }
  }, []);

  // QuizSelect ekranına girilince gerçek listeyi çek
  useEffect(() => {
    if (DEV_MODE || currentView !== "quizSelect") return;
    axios
      .get(`${API_URL}/api/quizzes`)
      .then((res) => setQuizList(res.data.quizzes || []))
      .catch(() => {});
  }, [currentView]);

  // --- MÜZİK ---
  useEffect(() => {
    if (audioRef.current) {
      if (isMusicMuted) audioRef.current.pause();
      else audioRef.current.play().catch(() => {});
    }
  }, [isMusicMuted]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = musicVolume / 100;
  }, [musicVolume]);

  const handleFirstInteraction = () => {
    if (audioRef.current && audioRef.current.paused && !isMusicMuted) {
      audioRef.current.play().catch(() => {});
    }
  };

  // --- SES ---
  const { playClick, playTrue, playFalse } = useSounds(
    soundVolume,
    isSoundMuted,
  );

  // =====================================================================
  // SOCKET.IO EVENT DİNLEYİCİLERİ
  // Ref'ler kullanılır — stale closure sorunu olmaz.
  // =====================================================================
  useEffect(() => {
    // Oyuncu odaya katıldığında listeyi güncelle
    socket.on("player_joined", ({ players: serverPlayers }) => {
      setPlayers(serverPlayers || []);
    });

    // Oyun başladığında — sunucudan sorular gelir
    socket.on("game_started", ({ questions: serverQs, timeLimitMs }) => {
      const formattedQs = serverQs.map((q) => ({
        id: q.id,
        text: q.text,
        imageUrl: q.imageUrl || null,
        time: timeLimitMs / 1000,
        // Cevapları {id, text} olarak koru — id sunucuya gönderilir
        answers: q.answers,
        correct: null,
      }));

      timeLimitMsRef.current = timeLimitMs;
      questionStartTimeRef.current = Date.now();

      setActiveQuizQs(formattedQs);
      setPlayQIndex(0);
      setTimeLeft(timeLimitMs / 1000);
      setCurrentView("playingQuiz");
    });

    // Cevap geri bildirimi — sunucu sonucu bildiriyor
    socket.on("answer_feedback", ({ isCorrect, points, alreadyAnswered }) => {
      if (alreadyAnswered) return;

      if (isCorrect) playTrue();
      else playFalse();

      setFeedbackStatus(isCorrect ? "correct" : "incorrect");

      setTimeout(() => {
        setFeedbackStatus(null);

        // Ref'lerle güncel state'e eriş
        const idx = playQIndexRef.current;
        const qs = activeQuizQsRef.current;
        const pin = currentPinRef.current || enteredPinRef.current;

        if (idx < qs.length - 1) {
          const nextIdx = idx + 1;
          setPlayQIndex(nextIdx);
          setTimeLeft(qs[nextIdx].time);
          questionStartTimeRef.current = Date.now();

          // Sunucuya soru geçişini bildir (zamanlayıcı sıfırlama için)
          if (!DEV_MODE) {
            socket.emit("advance_question", {
              pin,
              questionId: qs[nextIdx].id,
              questionIdx: nextIdx,
            });
          }
        } else {
          // Son soru bitti — oyunu sonlandır
          if (!DEV_MODE) {
            socket.emit("finalize_game", { pin });
            // game_finished event'i gelince leaderboard'a yönlendirilir
          } else {
            setCurrentView("leaderboard");
          }
        }
      }, 500);
    });

    // Liderlik tablosu güncellemesi (cevap sonrası tüm odaya)
    socket.on("leaderboard_update", ({ leaderboard }) => {
      const formatted = leaderboard.map((p) => ({
        id: p.rank,
        name: p.nickname,
        score: p.score,
        total: timeLimitMsRef.current ? activeQuizQsRef.current.length : 10,
      }));
      setLeaderboardData(formatted);
    });

    // Oyun bitti — sunucu nihai sıralamayı gönderdi
    socket.on("game_finished", ({ leaderboard }) => {
      const formatted = leaderboard.map((p) => ({
        id: p.rank,
        name: p.name,
        score: p.score,
        total: p.total,
      }));
      setLeaderboardData(formatted);
      setCurrentView("leaderboard");
    });

    // Sunucu hata mesajı
    socket.on("error_msg", ({ message }) => {
      alert(message);
    });

    return () => {
      socket.off("player_joined");
      socket.off("game_started");
      socket.off("answer_feedback");
      socket.off("leaderboard_update");
      socket.off("game_finished");
      socket.off("error_msg");
    };
  }, []);

  // =====================================================================
  // AUTH FONKSİYONLARI
  // =====================================================================

  const handleRegisterClick = async (displayName, email, password) => {
    if (DEV_MODE) {
      setUser({ display_name: displayName, email });
      setQuizzes([]);
      setCurrentView("dashboard");
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/api/auth/register`, {
        name: displayName,
        email,
        password,
      });
      if (res.data.success) {
        setUser(res.data.user);
        setToken(res.data.token);
        localStorage.setItem("quiznight_token", res.data.token);
        localStorage.setItem("quiznight_user", JSON.stringify(res.data.user));
        setQuizzes([]);
        setCurrentView("dashboard");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Kayıt başarısız.");
    }
  };

  const handleLoginClick = async (email, password) => {
    setLoginError(false);
    if (DEV_MODE) {
      setUser({ display_name: "Demo Kullanıcı", email });
      setQuizzes(mockUserQuizzes);
      setCurrentView("dashboard");
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });
      if (res.data.success) {
        setUser(res.data.user);
        setToken(res.data.token);
        localStorage.setItem("quiznight_token", res.data.token);
        localStorage.setItem("quiznight_user", JSON.stringify(res.data.user));
        const quizRes = await axios.get(`${API_URL}/api/quizzes/my`, {
          headers: { Authorization: `Bearer ${res.data.token}` },
        });
        setQuizzes(quizRes.data.quizzes || []);
        setCurrentView("dashboard");
      }
    } catch {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setQuizzes([]);
    setPlayers([]);
    setIsHost(false);
    localStorage.removeItem("quiznight_token");
    localStorage.removeItem("quiznight_user");
    setCurrentView("mainMenu");
  };

  // =====================================================================
  // ODA / SOCKET FONKSİYONLARI
  // =====================================================================

  // Oyuncu pin girerek odaya katılır
  const handleJoinRoom = (pin, nickname) => {
    socket.emit("join_room", {
      pin,
      nickname,
      playerId: user?.id || null,
      isGuest: !user,
    });
  };

  // Public quizlerden seçim: backend'de oda oluşturur
  const handleQuizSelect = async (quizId) => {
    if (DEV_MODE) {
      setCurrentPin(generateRandomPin());
      setCurrentView("quizPinDetails");
      return;
    }
    if (!token) {
      alert("Oda oluşturmak için giriş yapmalısınız.");
      setCurrentView("authMenu");
      return;
    }
    try {
      const res = await axios.post(
        `${API_URL}/api/rooms`,
        { quizId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.data.success) {
        setCurrentPin(res.data.pin);
        setIsHost(true);
        setCurrentView("quizPinDetails");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Oda oluşturulamadı.");
    }
  };

  // Host oyunu başlatır
  const startQuiz = () => {
    setIsOptionsMenuOpen(false);
    setFeedbackStatus(null);

    if (!DEV_MODE) {
      const pin = currentPin || enteredPin;
      // start_game: sunucu host'u odaya ekler ve oyunu başlatır
      socket.emit("start_game", { pin, nickname: hostNickname });
      // Ekran değişimi game_started event'iyle gerçekleşir
    } else {
      setPlayQIndex(0);
      setTimeLeft(activeQuizQs[0]?.time || 30);
      questionStartTimeRef.current = Date.now();
      setCurrentView("playingQuiz");
    }
  };

  // Cevap gönder
  const handleAnswerClick = (ans) => {
    if (feedbackStatus) return;

    if (DEV_MODE) {
      const isCorrect = ans === activeQuizQs[playQIndex].correct;
      if (isCorrect) playTrue();
      else playFalse();
      setFeedbackStatus(isCorrect ? "correct" : "incorrect");
      setTimeout(() => {
        setFeedbackStatus(null);
        handleNextOrEnd();
      }, 500);
    } else {
      const currentQ = activeQuizQs[playQIndex];
      const timeElapsedMs = questionStartTimeRef.current
        ? Date.now() - questionStartTimeRef.current
        : timeLimitMsRef.current;

      socket.emit("submit_answer", {
        pin: currentPin || enteredPin,
        playerId: user?.id || `guest:${socket.id}`,
        selectedAnswerId: ans?.id ?? null, // null = süre doldu
        questionId: currentQ.id,
        timeLimitMs: timeLimitMsRef.current,
        timeElapsedMs,
      });

      // Optimistik ses — gerçek sonuç answer_feedback'te
      if (ans) playTrue();
      else playFalse();
    }
  };

  // =====================================================================
  // QUİZ OLUŞTURMA
  // =====================================================================

  const openCreateQuiz = () => {
    setQuizForm({ name: "", category: "", min: "0", sec: "30", level: "" });
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

  // Quiz tamamlandığında backend'e kaydeder ve oda oluşturur
  const finishQuiz = async () => {
    if (DEV_MODE) {
      setQuizzes([
        ...quizzes,
        { id: Date.now(), name: quizForm.name || "İsimsiz Quiz" },
      ]);
      setCurrentView("dashboard");
      return;
    }

    if (!quizForm.name.trim()) {
      alert("Quizin bir ismi olmalıdır!");
      return;
    }
    const validQs = questions.filter(
      (q) => (q.text && q.text.trim()) || q.imagePreview,
    );
    if (validQs.length === 0) {
      alert("En az bir geçerli soru eklemelisiniz!");
      return;
    }
    const hasAllCorrect = validQs.every((q) => q.correctAnswerId !== null);
    if (!hasAllCorrect) {
      alert("Her sorunun bir doğru cevabı olmalıdır!");
      return;
    }

    try {
      const difficultyMap = { Kolay: 1, Orta: 2, Zor: 3 };
      const timeSec =
        parseInt(quizForm.min || 0) * 60 + parseInt(quizForm.sec || 30);

      const quizData = {
        name: quizForm.name.trim(),
        categoryName: quizForm.category || "Genel Kültür",
        difficulty: difficultyMap[quizForm.level] || 1,
        timeSec,
        isPublic: true,
      };

      const questionsData = validQs.map((q) => ({
        text: q.text?.trim() || null,
        imageUrl: null, // resim yükleme ileriki sürümde
        answers: q.answers,
        correctAnswerId: q.correctAnswerId,
      }));

      // 1. Quizi kaydet
      const quizRes = await axios.post(
        `${API_URL}/api/quizzes`,
        { quizData, questionsData },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!quizRes.data.success) throw new Error("Quiz kaydedilemedi.");
      const quizId = quizRes.data.quizId;

      // 2. Oda oluştur
      const roomRes = await axios.post(
        `${API_URL}/api/rooms`,
        { quizId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!roomRes.data.success) throw new Error("Oda oluşturulamadı.");

      setCurrentPin(roomRes.data.pin);
      setIsHost(true);

      // Dashboard quiz listesini güncelle
      const myRes = await axios.get(`${API_URL}/api/quizzes/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuizzes(myRes.data.quizzes || []);

      setCurrentView("quizPinDetails");
    } catch (err) {
      alert(
        err.response?.data?.message ||
          err.message ||
          "Quiz oluşturulurken hata oluştu.",
      );
    }
  };

  // =====================================================================
  // YARDIMCI FONKSİYONLAR
  // =====================================================================

  const generateRandomPin = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let pin = "";
    for (let i = 0; i < 6; i++)
      pin += chars.charAt(Math.floor(Math.random() * chars.length));
    return pin;
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

  // DEV_MODE için yerel soru geçişi (gerçek modda socket üzerinden)
  const handleNextOrEnd = () => {
    if (playQIndex < activeQuizQs.length - 1) {
      const nextIdx = playQIndex + 1;
      setPlayQIndex(nextIdx);
      setTimeLeft(activeQuizQs[nextIdx].time);
      questionStartTimeRef.current = Date.now();
    } else {
      setCurrentView("leaderboard");
    }
  };

  const handleNextPlayQuestion = () => {
    if (feedbackStatus) return;
    handleNextOrEnd();
  };

  const finishAndGoToLeaderboard = () => {
    setCurrentView("leaderboard");
  };

  // --- SORU EDİTÖRÜ YARDIMCILARI ---

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

  const handleAnswerChange = (ansId, newText) => {
    const newAnswers = questions[currentQIndex].answers.map((a) =>
      a.id === ansId ? { ...a, text: newText } : a,
    );
    updateCurrentQuestion({ answers: newAnswers });
  };

  const toggleAnswerEdit = (ansId, editingState) => {
    const newAnswers = questions[currentQIndex].answers.map((a) =>
      a.id === ansId ? { ...a, isEditing: editingState } : a,
    );
    updateCurrentQuestion({ answers: newAnswers });
  };

  const removeAnswer = (ansId) => {
    if (window.confirm("Bu seçeneği silmek istediğinize emin misiniz?")) {
      const newAnswers = questions[currentQIndex].answers.map((a) =>
        a.id === ansId ? { ...a, text: "", isEditing: false } : a,
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

  // --- ZAMANLAYICI ---
  useEffect(() => {
    if (currentView === "playingQuiz" && timeLeft > 0 && !feedbackStatus) {
      const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearTimeout(id);
    }
    if (currentView === "playingQuiz" && timeLeft === 0 && !feedbackStatus) {
      handleAnswerClick(null); // Süre doldu → cevapsız gönder
    }
  }, [currentView, timeLeft, feedbackStatus]);

  // =====================================================================
  // RENDER
  // =====================================================================
  return (
    <div className="app-container" onClick={handleFirstInteraction}>
      <audio ref={audioRef} src="/background-music.mp3" autoPlay loop />

      <BackButton currentView={currentView} setCurrentView={setCurrentView} />
      <SettingsButton currentView={currentView} openSettings={openSettings} />

      {currentView === "mainMenu" && (
        <MainMenu setCurrentView={setCurrentView} playClick={playClick} />
      )}

      {currentView === "authMenu" && (
        <AuthMenu setCurrentView={setCurrentView} playClick={playClick} />
      )}

      {currentView === "registerForm" && (
        <RegisterForm onRegister={handleRegisterClick} playClick={playClick} />
      )}

      {currentView === "loginForm" && (
        <LoginForm
          onLogin={handleLoginClick}
          loginError={loginError}
          playClick={playClick}
        />
      )}

      {currentView === "dashboard" && (
        <Dashboard
          quizzes={quizzes}
          openCreateQuiz={openCreateQuiz}
          onQuizSelect={handleQuizSelect}
          setCurrentView={setCurrentView}
          playClick={playClick}
          user={user}
          handleLogout={handleLogout}
        />
      )}

      {currentView === "joinQuizMenu" && (
        <JoinQuizMenu setCurrentView={setCurrentView} playClick={playClick} />
      )}

      {currentView === "quizSelect" && (
        <QuizSelect
          quizList={quizList}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortOption={sortOption}
          setSortOption={setSortOption}
          onQuizSelect={handleQuizSelect}
          playClick={playClick}
        />
      )}

      {currentView === "enterPin" && (
        <EnterPin
          playerNickname={playerNickname}
          setPlayerNickname={setPlayerNickname}
          enteredPin={enteredPin}
          setEnteredPin={setEnteredPin}
          setCurrentView={setCurrentView}
          onJoinRoom={handleJoinRoom}
          playClick={playClick}
        />
      )}

      {currentView === "quizPinDetails" && (
        <QuizPinDetails
          hostNickname={hostNickname}
          setHostNickname={setHostNickname}
          currentPin={currentPin}
          startQuiz={startQuiz}
          playClick={playClick}
        />
      )}

      {currentView === "waitingRoom" && (
        <WaitingRoom players={players} playClick={playClick} />
      )}

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

      {currentView === "leaderboard" && (
        <Leaderboard
          leaderboardData={leaderboardData}
          setCurrentView={setCurrentView}
          playClick={playClick}
        />
      )}

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

      {currentView === "createQuizSettings" && (
        <CreateQuizSettings
          quizForm={quizForm}
          setQuizForm={setQuizForm}
          setCurrentView={setCurrentView}
          playClick={playClick}
          user={user}
        />
      )}

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
