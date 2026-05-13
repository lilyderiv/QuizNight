import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import "./styles/components.css";
import { io } from "socket.io-client";
import axios from "axios";

// Mock Veriler (Yedek olarak)
import { mockUserQuizzes, mockLeaderboardData } from "./mockData";

// Bileşenler ve Sayfalar
import BackButton from "./components/BackButton";
import SettingsButton from "./components/SettingsButton";
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

const socket = io("http://localhost:3000");

const INITIAL_QUESTION = {
  id: Date.now(),
  text: "",
  imagePreview: null,
  isSelectingType: false,
  isEditingText: false,
  correctAnswerId: null,
  answers: [
    { id: 1, text: "", isEditing: false },
    { id: 2, text: "", isEditing: false },
    { id: 3, text: "", isEditing: false },
    { id: 4, text: "", isEditing: false },
  ],
};

function App() {
  // Görünüm ve Kullanıcı State'leri
  const [currentView, setCurrentView] = useState("mainMenu");
  const [previousView, setPreviousView] = useState("mainMenu");
  const [user, setUser] = useState(null);
  const [loginError, setLoginError] = useState(false);
  
  // Quiz Listesi ve Oyuncular
  const [quizList, setQuizList] = useState([]);
  const [players, setPlayers] = useState([]); 
  const [playerNickname, setPlayerNickname] = useState("");
  const [enteredPin, setEnteredPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [hostNickname, setHostNickname] = useState("");

  // Yarışma State'leri
  const [activeQuizQs, setActiveQuizQs] = useState([]);
  const [playQIndex, setPlayQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [feedbackStatus, setFeedbackStatus] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const timerRef = useRef(null);

  // Quiz Oluşturma State'leri
  const [quizForm, setQuizForm] = useState({ name: "", category: "", min: 0, sec: 30, level: "Orta" });
  const [createQuestions, setCreateQuestions] = useState([INITIAL_QUESTION]);
  const [currentCreateQIndex, setCurrentCreateQIndex] = useState(0);

  useEffect(() => {
    // Gerçek Quizleri Çek
    const fetchQuizzes = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/quizzes");
        if (res.data.success) setQuizList(res.data.quizzes);
      } catch (e) { console.error("Quizler çekilemedi."); }
    };
    fetchQuizzes();

    // Socket Dinleyicileri
    socket.on("connect", () => console.log("✅ Sunucuya bağlanıldı:", socket.id));
    
    socket.on("player_joined", (data) => {
      setPlayers(data.players);
      setCurrentView("waitingRoom");
    });

    socket.on("game_started", (data) => {
      setActiveQuizQs(data.questions);
      setTimeLeft(data.timeLimitMs / 1000);
      setCurrentView("playingQuiz");
      startTimer(data.timeLimitMs / 1000);
    });

    socket.on("answer_feedback", (data) => {
      setFeedbackStatus(data.isCorrect ? "correct" : "incorrect");
      setTimeout(() => setFeedbackStatus(null), 1500);
    });

    socket.on("leaderboard_update", (data) => setLeaderboardData(data.leaderboard));

    socket.on("game_finished", (data) => {
      setLeaderboardData(data.leaderboard);
      setCurrentView("leaderboard");
      clearInterval(timerRef.current);
    });

    socket.on("error_msg", (data) => alert("Hata: " + data.message));
    
    return () => socket.off();
  }, []);

  // --- Yardımcı Fonksiyonlar ---
  const startTimer = (initialTime) => {
    clearInterval(timerRef.current);
    setTimeLeft(initialTime);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const goBack = () => setCurrentView(previousView);
  const openSettings = () => { setPreviousView(currentView); setCurrentView("settings"); };

  // --- Auth Handler'ları ---
  const handleLogin = async (email, password) => {
    try {
      const res = await axios.post("http://localhost:3000/api/auth/login", { email, password });
      if (res.data.success) { 
        setUser(res.data.user); 
        setLoginError(false); 
        setCurrentView("dashboard"); 
      }
    } catch (e) { setLoginError(true); }
  };

  const handleRegister = async (name, email, password) => {
    try {
      const res = await axios.post("http://localhost:3000/api/auth/register", { name, email, password });
      if (res.data.success) { setCurrentView("loginForm"); }
    } catch (e) { alert("Kayıt hatası!"); }
  };

  // --- Oda ve Yarışma Handler'ları ---
  const handleCreateRoom = async (quizId) => {
    try {
      const res = await axios.post("http://localhost:3000/api/rooms", {
        hostId: user?.id || "admin",
        quizId: quizId
      });
      if (res.data.success) {
        setCurrentPin(res.data.pin);
        setCurrentView("quizPinDetails");
      }
    } catch (e) { alert("Oda oluşturulamadı."); }
  };

  const handleAnswerClick = (answerId) => {
    socket.emit("submit_answer", {
      pin: enteredPin || currentPin,
      playerId: user?.id || socket.id,
      selectedAnswerId: answerId,
      questionId: activeQuizQs[playQIndex].id,
      timeLimitMs: 30000
    });
  };

  const handleNextPlayQuestion = () => {
    if (playQIndex < activeQuizQs.length - 1) {
      setPlayQIndex(prev => prev + 1);
      setFeedbackStatus(null);
      startTimer(30);
    }
  };

  // --- Quiz Oluşturma Handler'ları ---
  const updateCurrentQuestion = (fields) => {
    const updated = [...createQuestions];
    updated[currentCreateQIndex] = { ...updated[currentCreateQIndex], ...fields };
    setCreateQuestions(updated);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => updateCurrentQuestion({ imagePreview: reader.result, isSelectingType: false });
      reader.readAsDataURL(file);
    }
  };

  const handleAnswerChange = (ansId, text) => {
    const updatedQs = [...createQuestions];
    const q = updatedQs[currentCreateQIndex];
    q.answers = q.answers.map(a => a.id === ansId ? { ...a, text } : a);
    setCreateQuestions(updatedQs);
  };

  const toggleAnswerEdit = (ansId, isEditing) => {
    const updatedQs = [...createQuestions];
    const q = updatedQs[currentCreateQIndex];
    q.answers = q.answers.map(a => a.id === ansId ? { ...a, isEditing } : a);
    setCreateQuestions(updatedQs);
  };

  const handleFinishQuiz = async () => {
    try {
      const quizData = {
        ownerId: user.id,
        name: quizForm.name,
        categoryName: quizForm.category,
        difficulty: quizForm.level === "Kolay" ? 1 : quizForm.level === "Zor" ? 3 : 2,
        timeSec: (quizForm.min * 60) + quizForm.sec
      };
      const questionsData = createQuestions.map(q => ({
        text: q.text,
        imageUrl: q.imagePreview,
        answers: q.answers.map(a => ({ id: a.id, text: a.text })),
        correctAnswerId: q.correctAnswerId
      }));
      const res = await axios.post("http://localhost:3000/api/quizzes", { quizData, questionsData });
      if (res.data.success) { setCurrentView("dashboard"); }
    } catch (e) { alert("Kayıt yapılamadı."); }
  };

  return (
    <div className="app-container">
      <SettingsButton currentView={currentView} openSettings={openSettings} />
      <BackButton currentView={currentView} setCurrentView={setCurrentView} />

      {currentView === "mainMenu" && <MainMenu setCurrentView={setCurrentView} />}
      {currentView === "authMenu" && <AuthMenu setCurrentView={setCurrentView} />}
      {currentView === "loginForm" && <LoginForm onLogin={handleLogin} loginError={loginError} />}
      {currentView === "registerForm" && <RegisterForm onRegister={handleRegister} />}
      
      {currentView === "dashboard" && (
        <Dashboard 
          user={user} 
          quizzes={mockUserQuizzes} 
          setCurrentView={setCurrentView} 
          openCreateQuiz={() => setCurrentView("createQuizSettings")}
        />
      )}

      {currentView === "joinQuizMenu" && <JoinQuizMenu setCurrentView={setCurrentView} />}
      
      {currentView === "quizSelect" && (
        <QuizSelect 
          quizList={quizList} 
          setCurrentView={setCurrentView} 
          onCreateRoom={handleCreateRoom} 
          searchTerm={""} setSearchTerm={() => {}} sortOption={"Son eklenenler"} setSortOption={() => {}} // Basitlik için
        />
      )}
      
      {currentView === "enterPin" && (
        <EnterPin 
          playerNickname={playerNickname} setPlayerNickname={setPlayerNickname}
          enteredPin={enteredPin} setEnteredPin={setEnteredPin}
          setCurrentView={(v) => { 
            if(v === "waitingRoom") socket.emit("join_room", { pin: enteredPin, nickname: playerNickname, isGuest: true });
            setCurrentView(v); 
          }}
        />
      )}

      {currentView === "quizPinDetails" && (
        <QuizPinDetails 
          hostNickname={hostNickname} setHostNickname={setHostNickname} 
          currentPin={currentPin} 
          startQuiz={() => {
            socket.emit("join_room", { pin: currentPin, nickname: hostNickname, isGuest: false, playerId: user?.id });
            socket.emit("start_game", { pin: currentPin });
          }} 
        />
      )}

      {currentView === "waitingRoom" && (
        <WaitingRoom 
          players={players} 
          startQuiz={() => socket.emit("start_game", { pin: enteredPin || currentPin })} 
        />
      )}

      {currentView === "playingQuiz" && (
        <PlayingQuiz 
          activeQuizQs={activeQuizQs} playQIndex={playQIndex} timeLeft={timeLeft} feedbackStatus={feedbackStatus}
          handleAnswerClick={handleAnswerClick} handleNextPlayQuestion={handleNextPlayQuestion}
          finishAndGoToLeaderboard={() => socket.emit("finalize_game", { pin: enteredPin || currentPin })}
        />
      )}

      {currentView === "leaderboard" && <Leaderboard leaderboardData={leaderboardData} />}
      {currentView === "settings" && <Settings goBack={goBack} />}
      
      {currentView === "createQuizSettings" && (
        <CreateQuizSettings 
          user={user} quizForm={quizForm} setQuizForm={setQuizForm} setCurrentView={setCurrentView} 
        />
      )}

      {currentView === "createQuizQuestions" && (
        <CreateQuizQuestions 
          questions={createQuestions} currentQIndex={currentCreateQIndex} setCurrentQIndex={setCurrentCreateQIndex}
          updateCurrentQuestion={updateCurrentQuestion} handleImageUpload={handleImageUpload}
          handleAnswerChange={handleAnswerChange} toggleAnswerEdit={toggleAnswerEdit}
          removeAnswer={(id) => handleAnswerChange(id, "")}
          addNewPage={() => setCreateQuestions([...createQuestions, { ...INITIAL_QUESTION, id: Date.now() }])}
          finishQuiz={handleFinishQuiz}
        />
      )}
    </div>
  );
}

export default App;