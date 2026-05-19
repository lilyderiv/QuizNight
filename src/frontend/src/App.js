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
  const [players, setPlayers] = useState([]);

  // --- OYUN STATE ---
  const [playQIndex, setPlayQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState(null);
  const [isHost, setIsHost] = useState(false);

  // --- MÜZİK ---
  const audioRef = useRef(null);

  // ─────────────────────────────────────────────────────────────
  // [DÜZELTME] Socket useRef ile yönetilir — modül seviyesinde değil.
  // Bu sayede hot reload'da bağlantı sızıntısı olmaz.
  // ─────────────────────────────────────────────────────────────
  const socketRef = useRef(null);

  // ─────────────────────────────────────────────────────────────
  // [DÜZELTME] assignedPlayerId: backend'in atadığı gerçek oyuncu ID'si.
  // Misafir için backend UUID üretir; bunu saklayıp submit_answer'da kullanırız.
  // ─────────────────────────────────────────────────────────────
  const [myPlayerId, setMyPlayerId] = useState(null);

  // --- SOCKET HANDLER REF'LERİ (stale closure'dan korumak için) ---
  const playQIndexRef = useRef(0);
  const activeQuizQsRef = useRef([]);
  const currentPinRef = useRef("");
  const enteredPinRef = useRef("");
  const isHostRef = useRef(false);
  const timeLimitMsRef = useRef(30000);
  const questionStartTimeRef = useRef(null);
  const feedbackStatusRef = useRef(null);

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
  useEffect(() => {
    feedbackStatusRef.current = feedbackStatus;
  }, [feedbackStatus]);

  // ─────────────────────────────────────────────────────────────
  // SOCKET BAĞLANTISI — bir kez oluşturulur, unmount'ta temizlenir
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (DEV_MODE) return;

    socketRef.current = io(API_URL, { autoConnect: true });
    const socket = socketRef.current;

    // Odaya katılım başarılı — backend'den playerId alınır
    socket.on(
      "join_success",
      ({ assignedPlayerId, players: serverPlayers }) => {
        setMyPlayerId(assignedPlayerId);
        setPlayers(serverPlayers || []);
      },
    );

    // Oyuncu listesi güncellendi (yeni katılım veya ayrılma)
    socket.on("player_joined", ({ players: serverPlayers }) => {
      setPlayers(serverPlayers || []);
    });

    // Oyun başladı — sunucudan sorular geldi
    socket.on("game_started", ({ questions: serverQs, timeLimitMs }) => {
      const formattedQs = serverQs.map((q) => ({
        id: q.id,
        text: q.text,
        imageUrl: q.imageUrl || null,
        time: timeLimitMs / 1000,
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

    // [DÜZELTME] Soru değişimi — host "next_question" emit eder,
    // sunucu tüm odaya "question_changed" yayar.
    // TÜM oyuncular aynı anda senkronize ilerler (FR-2).
    socket.on("question_changed", ({ questionIdx, serverTime }) => {
      const qs = activeQuizQsRef.current;
      if (questionIdx >= 0 && questionIdx < qs.length) {
        questionStartTimeRef.current = serverTime || Date.now();
        setPlayQIndex(questionIdx);
        setTimeLeft(qs[questionIdx].time);
        setFeedbackStatus(null);
      }
    });

    // Cevap geri bildirimi
    socket.on("answer_feedback", ({ isCorrect, points, alreadyAnswered }) => {
      if (alreadyAnswered) return;

      if (isCorrect) playTrue();
      else playFalse();

      setFeedbackStatus(isCorrect ? "correct" : "incorrect");
    });

    // Liderlik tablosu güncellemesi
    socket.on("leaderboard_update", ({ leaderboard }) => {
      const qs = activeQuizQsRef.current;
      const formatted = leaderboard.map((p) => ({
        id: p.rank,
        name: p.nickname,
        score: p.score,
        correct: p.correct,
        total: qs.length,
      }));
      setLeaderboardData(formatted);
    });

    // Oyun bitti
    socket.on("game_finished", ({ leaderboard }) => {
      const formatted = leaderboard.map((p) => ({
        id: p.rank || p.id,
        name: p.name || p.nickname,
        score: p.score,
        correct: p.correct,
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
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────────────────────
  // UYGULAMA BAŞLANGICI — localStorage'dan oturum yükle
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (DEV_MODE) return;
    const savedToken = localStorage.getItem("quiznight_token");
    const savedUser = localStorage.getItem("quiznight_user");
    if (!savedToken || !savedUser) return;

    try {
      const parsedUser = JSON.parse(savedUser);
      setToken(savedToken);
      setUser(parsedUser);
      axios
        .get(`${API_URL}/api/quizzes/my`, {
          headers: { Authorization: `Bearer ${savedToken}` },
        })
        .then((res) => setQuizzes(res.data.quizzes || []))
        .catch(() => {
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

  // QuizSelect ekranına girilince listeyi çek
  useEffect(() => {
    if (DEV_MODE || currentView !== "quizSelect") return;
    fetchQuizList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView]);

  const fetchQuizList = useCallback(async (opts = {}) => {
    const { search = "", sortBy = "newest" } = opts;
    try {
      const res = await axios.get(`${API_URL}/api/quizzes`, {
        params: { search, sortBy },
      });
      setQuizList(res.data.quizzes || []);
    } catch {}
  }, []);

  // Sıralama veya arama değişince API'ye tekrar istek at
  useEffect(() => {
    if (DEV_MODE || currentView !== "quizSelect") return;
    const SORT_MAP = {
      "Son eklenenler": "newest",
      "İlk Eklenenler Başta": "oldest",
      "İsme Göre Artan": "name_asc",
      "İsme Göre Azalan": "name_desc",
      "Kolaydan Zora": "easy_first",
      "Zordan Kolaya": "hard_first",
    };
    fetchQuizList({
      search: searchTerm,
      sortBy: SORT_MAP[sortOption] || "newest",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortOption, searchTerm, currentView]);

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

  // ─────────────────────────────────────────────────────────────
  // AUTH FONKSİYONLARI
  // ─────────────────────────────────────────────────────────────

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
    setMyPlayerId(null);
    localStorage.removeItem("quiznight_token");
    localStorage.removeItem("quiznight_user");
    setCurrentView("mainMenu");
  };

  // ─────────────────────────────────────────────────────────────
  // ODA / SOCKET FONKSİYONLARI
  // ─────────────────────────────────────────────────────────────

  const handleJoinRoom = (pin, nickname) => {
    if (!socketRef.current) return;
    // playerId null → backend UUID atar → join_success'te myPlayerId set edilir
    socketRef.current.emit("join_room", {
      pin,
      nickname,
      playerId: user?.id || null,
      isGuest: !user,
    });
  };

  const handleLeaveRoom = (pin) => {
    if (!socketRef.current || !pin) return;
    const pid = myPlayerId || user?.id;
    if (!pid) return;
    socketRef.current.emit("leave_room", { pin, playerId: pid });
    setMyPlayerId(null);
  };

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

  const startQuiz = () => {
    setIsOptionsMenuOpen(false);
    setFeedbackStatus(null);

    if (!DEV_MODE && socketRef.current) {
      const pin = currentPin || enteredPin;
      socketRef.current.emit("start_game", { pin, nickname: hostNickname });
    } else {
      setPlayQIndex(0);
      setTimeLeft(activeQuizQs[0]?.time || 30);
      questionStartTimeRef.current = Date.now();
      setCurrentView("playingQuiz");
    }
  };

  // ─────────────────────────────────────────────────────────────
  // CEVAP GÖNDER
  // ─────────────────────────────────────────────────────────────

  // useCallback ile sarmalanmış — useEffect bağımlılığında güvenle kullanılabilir
  const handleAnswerClick = useCallback(
    (ans) => {
      if (feedbackStatusRef.current) return;

      if (DEV_MODE) {
        const currentQ = activeQuizQsRef.current[playQIndexRef.current];
        const isCorrect = ans === currentQ?.correct;
        if (isCorrect) playTrue();
        else playFalse();
        setFeedbackStatus(isCorrect ? "correct" : "incorrect");
        setTimeout(() => {
          setFeedbackStatus(null);
          handleNextOrEndDev();
        }, 500);
        return;
      }

      if (!socketRef.current) return;

      const currentQ = activeQuizQsRef.current[playQIndexRef.current];
      if (!currentQ) return;

      const timeElapsedMs = questionStartTimeRef.current
        ? Date.now() - questionStartTimeRef.current
        : timeLimitMsRef.current;

      // [DÜZELTME] myPlayerId kullanılıyor — backend'in atadığı gerçek ID
      const pid = myPlayerId || user?.id || null;

      socketRef.current.emit("submit_answer", {
        pin: currentPinRef.current || enteredPinRef.current,
        playerId: pid,
        selectedAnswerId: ans?.id ?? null,
        questionId: currentQ.id,
        timeLimitMs: timeLimitMsRef.current,
        timeElapsedMs,
      });

      if (ans) playTrue();
      else playFalse();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [myPlayerId, user],
  );

  // Host sonraki soruya geçer → sunucu tüm odaya yayar (senkronize)
  const handleNextQuestion = useCallback(() => {
    if (!socketRef.current) return;
    const qs = activeQuizQsRef.current;
    const idx = playQIndexRef.current;

    if (idx < qs.length - 1) {
      const nextIdx = idx + 1;
      socketRef.current.emit("next_question", {
        pin: currentPinRef.current || enteredPinRef.current,
        questionId: qs[nextIdx].id,
        questionIdx: nextIdx,
      });
    } else {
      // Son soru — oyunu bitir
      socketRef.current.emit("finalize_game", {
        pin: currentPinRef.current || enteredPinRef.current,
      });
    }
  }, []);

  // ─────────────────────────────────────────────────────────────
  // [DÜZELTME] Zamanlayıcı useEffect — handleAnswerClick useCallback'te,
  // bağımlılık dizisine doğru eklendi; stale closure riski yok.
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (currentView !== "playingQuiz") return;
    if (feedbackStatus !== null) return;
    if (timeLeft <= 0) {
      handleAnswerClick(null); // Süre doldu → cevapsız
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [currentView, timeLeft, feedbackStatus, handleAnswerClick]);

  // ─────────────────────────────────────────────────────────────
  // QUİZ OLUŞTURMA
  // ─────────────────────────────────────────────────────────────

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
        imageUrl: null,
        answers: q.answers,
        correctAnswerId: q.correctAnswerId,
      }));

      const quizRes = await axios.post(
        `${API_URL}/api/quizzes`,
        { quizData, questionsData },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!quizRes.data.success) throw new Error("Quiz kaydedilemedi.");
      const quizId = quizRes.data.quizId;

      const roomRes = await axios.post(
        `${API_URL}/api/rooms`,
        { quizId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!roomRes.data.success) throw new Error("Oda oluşturulamadı.");

      setCurrentPin(roomRes.data.pin);
      setIsHost(true);

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

  // ─────────────────────────────────────────────────────────────
  // YARDIMCI FONKSİYONLAR
  // ─────────────────────────────────────────────────────────────

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

  // [DÜZELTME] Quiz taslağı varken geri tuşunda confirm dialog
  const goBack = () => {
    if (
      currentView === "createQuizSettings" ||
      currentView === "createQuizQuestions"
    ) {
      const hasDraft = questions.some(
        (q) => (q.text && q.text.trim()) || q.imagePreview,
      );
      if (hasDraft) {
        if (!window.confirm("Quiz taslağınız kaybolacak. Emin misiniz?"))
          return;
      }
      setCurrentView("dashboard");
    } else if (currentView === "enterPin") {
      setCurrentView("joinQuizMenu");
    } else if (currentView === "waitingRoom") {
      // Bekleme odasından çıkarken socket'i temizle
      const pin = enteredPin || currentPin;
      handleLeaveRoom(pin);
      setCurrentView("mainMenu");
    } else {
      setCurrentView(previousView);
    }
  };

  // DEV_MODE için yerel soru geçişi
  const handleNextOrEndDev = () => {
    const idx = playQIndexRef.current;
    const qs = activeQuizQsRef.current;
    if (idx < qs.length - 1) {
      const nextIdx = idx + 1;
      setPlayQIndex(nextIdx);
      setTimeLeft(qs[nextIdx].time);
      questionStartTimeRef.current = Date.now();
    } else {
      setCurrentView("leaderboard");
    }
  };

  const handleNextPlayQuestion = () => {
    if (feedbackStatus) return;
    if (DEV_MODE) {
      handleNextOrEndDev();
    } else {
      // Sadece host "next_question" emit eder
      if (isHostRef.current) {
        handleNextQuestion();
      }
      // Oyuncular "question_changed" event'ini bekler (sunucu yayar)
    }
  };

  const finishAndGoToLeaderboard = () => {
    if (!DEV_MODE && socketRef.current) {
      socketRef.current.emit("finalize_game", {
        pin: currentPin || enteredPin,
      });
    } else {
      setCurrentView("leaderboard");
    }
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

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="app-container" onClick={handleFirstInteraction}>
      <audio ref={audioRef} src="/background-music.mp3" autoPlay loop />

      <BackButton currentView={currentView} goBack={goBack} />
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
          isHost={isHost}
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
