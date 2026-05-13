// =====================================================================
// App.js — Uygulamanın ana dosyası ve merkezi yönetim noktası.
// =====================================================================

import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import "./styles/components.css";
import { io } from "socket.io-client";
import axios from "axios";

// Mock veriler — yalnızca DEV_MODE için
import {
  mockUserQuizzes,
  mockQuizList,
  mockLeaderboardData,
  mockActiveQuizQs,
} from "./mockData";

// Ortak bileşenler — DÜZELTME: alt klasör yok, direkt src/ altında
import BackButton from "./BackButton";
import SettingsButton from "./SettingsButton";

// Ses hook'u — DÜZELTME: alt klasör yok
import useSounds from "./useSounds";

// Sayfa bileşenleri — DÜZELTME: alt klasör yok
import MainMenu from "./MainMenu";
import AuthMenu from "./AuthMenu";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import Dashboard from "./Dashboard";
import JoinQuizMenu from "./JoinQuizMenu";
import QuizSelect from "./QuizSelect";
import EnterPin from "./EnterPin";
import QuizPinDetails from "./QuizPinDetails";
import WaitingRoom from "./WaitingRoom";
import PlayingQuiz from "./PlayingQuiz";
import Leaderboard from "./Leaderboard";
import Settings from "./Settings";
import CreateQuizSettings from "./CreateQuizSettings";
import CreateQuizQuestions from "./CreateQuizQuestions";

const DEV_MODE = true;
const API_URL = "http://localhost:3000";

// Socket bağlantısı — modül düzeyinde bir kez oluşturulur
const socket = io(API_URL, { autoConnect: true });

function App() {
  // --- SAYFA YÖNETİMİ ---
  const [currentView, setCurrentView] = useState("mainMenu");
  const [previousView, setPreviousView] = useState("mainMenu");

  // --- KULLANICI STATE ---
  const [user, setUser] = useState(null); // { id, display_name, email }
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

  // --- VERİ STATE ---
  const [quizzes, setQuizzes] = useState([]);
  const [quizList, setQuizList] = useState(mockQuizList); // DEV_MODE'da mock
  const [leaderboardData, setLeaderboardData] = useState(mockLeaderboardData);
  const [activeQuizQs, setActiveQuizQs] = useState(mockActiveQuizQs);

  // --- OYUN STATE ---
  const [playQIndex, setPlayQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState(null);

  // --- MÜZİK ---
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isMusicMuted) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [isMusicMuted]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = musicVolume / 100;
    }
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
  // =====================================================================

  useEffect(() => {
    // Oyuncu odaya katıldığında
    socket.on("player_joined", ({ nickname, players }) => {
      console.log("Oyuncu katıldı:", nickname, players);
    });

    // Oyun başladığında — backend'den sorular gelir
    socket.on("game_started", ({ questions: serverQs, timeLimitMs }) => {
      const formattedQs = serverQs.map((q) => ({
        id: q.id,
        text: q.text,
        time: timeLimitMs / 1000,
        answers: q.answers.map((a) => a.text), // sadece metinler
        correct: null, // sunucu gizli tutar
      }));
      setActiveQuizQs(formattedQs);
      setPlayQIndex(0);
      setTimeLeft(timeLimitMs / 1000);
      setCurrentView("playingQuiz");
    });

    // Cevap geri bildirimi
    socket.on("answer_feedback", ({ isCorrect, points, alreadyAnswered }) => {
      if (alreadyAnswered) return;
      setFeedbackStatus(isCorrect ? "correct" : "incorrect");
      setTimeout(() => {
        setFeedbackStatus(null);
        handleNextOrEnd();
      }, 500);
    });

    // Liderlik tablosu güncellemesi
    socket.on("leaderboard_update", ({ leaderboard }) => {
      const formatted = leaderboard.map((p) => ({
        id: p.rank,
        name: p.nickname,
        score: p.score,
        total: 10,
      }));
      setLeaderboardData(formatted);
    });

    // Oyun bitti
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

    // Hata mesajı
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
  // YARDIMCI FONKSİYONLAR
  // =====================================================================

  const generateRandomPin = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let newPin = "";
    for (let i = 0; i < 6; i++) {
      newPin += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return newPin;
  };

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

  // --- AUTH FONKSİYONLARI ---

  // Gerçek API çağrısı yapan kayıt fonksiyonu
  const handleRegisterClick = async (displayName, email, password) => {
    if (DEV_MODE) {
      // DEV_MODE: direkt dashboard'a git
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
        setQuizzes([]);
        setCurrentView("dashboard");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Kayıt başarısız.");
    }
  };

  // Gerçek API çağrısı yapan giriş fonksiyonu
  const handleLoginClick = async (email, password) => {
    setLoginError(false);
    if (DEV_MODE) {
      // DEV_MODE: mock veriyle dashboard'a git
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
        // Kullanıcının quizlerini yükle
        const quizRes = await axios.get(`${API_URL}/api/quizzes/my`, {
          headers: { Authorization: `Bearer ${res.data.token}` },
        });
        setQuizzes(quizRes.data.quizzes || []);
        setCurrentView("dashboard");
      }
    } catch (err) {
      setLoginError(true);
    }
  };

  // --- SOCKET FONKSİYONLARI ---

  // Oyuncu pin girerek odaya katılır
  const handleJoinRoom = (pin, nickname) => {
    socket.emit("join_room", {
      pin,
      nickname,
      playerId: user?.id || null,
      isGuest: !user,
    });
  };

  // Host oyunu başlatır
  const handleStartGame = (pin) => {
    socket.emit("start_game", { pin });
  };

  // Cevap gönder (DEV_MODE'da yerel işlenir)
  const handleAnswerClick = (ans) => {
    if (feedbackStatus) return;

    if (DEV_MODE) {
      // DEV_MODE: yerel doğrulama
      const isCorrect = ans === activeQuizQs[playQIndex].correct;
      if (isCorrect) playTrue();
      else playFalse();
      setFeedbackStatus(isCorrect ? "correct" : "incorrect");
      setTimeout(() => {
        setFeedbackStatus(null);
        handleNextOrEnd();
      }, 500);
    } else {
      // Gerçek mod: sunucuya gönder, feedback socket'ten gelir
      const currentQ = activeQuizQs[playQIndex];
      const selectedAnswer = currentQ.answers.find((a) => a === ans);
      socket.emit("submit_answer", {
        pin: enteredPin || currentPin,
        playerId: user?.id || `guest:${socket.id}`,
        selectedAnswerId: selectedAnswer?.id,
        questionId: currentQ.id,
        timeLimitMs: timeLeft * 1000,
      });
      if (ans) playTrue();
      else playFalse(); // optimistik ses
    }
  };

  // --- DİĞER FONKSİYONLAR ---

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

  const finishQuiz = () => {
    setQuizzes([
      ...quizzes,
      { id: Date.now(), name: quizForm.name || "İsimsiz Quiz" },
    ]);
    setCurrentView("dashboard");
  };

  const finishAndGoToLeaderboard = () => {
    const activeName = hostNickname || playerNickname || "Gizli Oyuncu";
    const myResult = {
      id: 999,
      name: activeName,
      score: DEV_MODE ? 11 : 0,
      total: 10,
    };
    const updatedLeaderboard = [
      ...leaderboardData.filter((p) => p.id !== 999),
      myResult,
    ];
    updatedLeaderboard.sort((a, b) => b.score - a.score);
    setLeaderboardData(updatedLeaderboard);
    setCurrentView("leaderboard");
  };

  const handleNextOrEnd = () => {
    if (playQIndex < activeQuizQs.length - 1) {
      setPlayQIndex(playQIndex + 1);
      setTimeLeft(activeQuizQs[playQIndex + 1].time);
    } else {
      finishAndGoToLeaderboard();
    }
  };

  const handleNextPlayQuestion = () => {
    if (feedbackStatus) return;
    handleNextOrEnd();
  };

  const startQuiz = () => {
    setPlayQIndex(0);
    setTimeLeft(activeQuizQs[0]?.time || 30);
    setIsOptionsMenuOpen(false);
    setFeedbackStatus(null);
    if (!DEV_MODE) {
      handleStartGame(currentPin || enteredPin);
    } else {
      setCurrentView("playingQuiz");
    }
  };

  // --- ZAMANLAYICI ---
  useEffect(() => {
    if (currentView === "playingQuiz" && timeLeft > 0 && !feedbackStatus) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else if (
      currentView === "playingQuiz" &&
      timeLeft === 0 &&
      !feedbackStatus
    ) {
      handleAnswerClick("");
    }
  }, [currentView, timeLeft, feedbackStatus]);

  // =====================================================================
  // RENDER
  // =====================================================================
  return (
    <div className="app-container" onClick={handleFirstInteraction}>
      {/* Arka plan müziği — DÜZELTME: playClick geçersiz prop kaldırıldı */}
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

      {/* DÜZELTME: user prop geçildi */}
      {currentView === "dashboard" && (
        <Dashboard
          quizzes={quizzes}
          openCreateQuiz={openCreateQuiz}
          setCurrentView={setCurrentView}
          playClick={playClick}
          user={user}
        />
      )}

      {currentView === "joinQuizMenu" && (
        <JoinQuizMenu setCurrentView={setCurrentView} playClick={playClick} />
      )}

      {/* DÜZELTME: searchTerm, setSearchTerm, sortOption, setSortOption prop olarak geçildi */}
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

      {/* DÜZELTME: onJoinRoom prop eklendi */}
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
        <WaitingRoom startQuiz={startQuiz} playClick={playClick} />
      )}

      {/* DÜZELTME: isOptionsMenuOpen ve setIsOptionsMenuOpen prop olarak geçildi */}
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
        <Leaderboard leaderboardData={leaderboardData} playClick={playClick} />
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

      {/* DÜZELTME: user prop geçildi */}
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
