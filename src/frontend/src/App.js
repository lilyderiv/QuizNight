import React, { useState, useEffect } from "react";
import "./App.css";

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

function App() {
  const [currentView, setCurrentView] = useState("mainMenu");
  const [previousView, setPreviousView] = useState("mainMenu");

  const [soundVolume, setSoundVolume] = useState(50);
  const [musicVolume, setMusicVolume] = useState(50);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);

  const [quizzes, setQuizzes] = useState([]);
  const [loginError, setLoginError] = useState(false);
  const [enteredPin, setEnteredPin] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("Son eklenenler");
  const [currentPin, setCurrentPin] = useState("");
  const [hostNickname, setHostNickname] = useState("");
  const [playerNickname, setPlayerNickname] = useState("");

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

  const [quizList] = useState([
    { id: 1, name: "English A2 test", difficulty: 1, date: 8 },
    { id: 2, name: "Ülkeler", difficulty: 2, date: 7 },
    { id: 3, name: "Genel Kültür", difficulty: 2, date: 6 },
    { id: 4, name: "Şairler / Yazarlar", difficulty: 3, date: 5 },
    { id: 5, name: "İlçeler", difficulty: 1, date: 4 },
    { id: 6, name: "Futbolcular", difficulty: 1, date: 3 },
    { id: 7, name: "Pop Şarkılar", difficulty: 1, date: 2 },
    { id: 8, name: "Savaşlar", difficulty: 3, date: 1 },
  ]);

  const [leaderboardData, setLeaderboardData] = useState([
    { id: 1, name: "Cookie", score: 10, total: 10 },
    { id: 2, name: "Alice", score: 9, total: 10 },
    { id: 3, name: "Strawberry", score: 9, total: 10 },
    { id: 4, name: "The Champ", score: 7, total: 10 },
    { id: 5, name: "Eugene", score: 2, total: 10 },
    { id: 6, name: "Hilal", score: 1, total: 10 },
  ]);

  const [playQIndex, setPlayQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState(null);

  const [activeQuizQs] = useState([
    {
      id: 1,
      text: "İstiklal Marşı'mızın şairi kimdir?",
      time: 25,
      answers: ["Mehmet Akif Ersoy", "Attila İlhan", "Sait Faik Abasıyanık", "Cahit Zarifoğlu"],
      correct: "Mehmet Akif Ersoy",
    },
    {
      id: 2,
      text: "Türkiye'nin başkenti neresidir?",
      time: 15,
      answers: ["İstanbul", "Ankara", "İzmir", "Bursa"],
      correct: "Ankara",
    },
  ]);

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

  const handleRegisterClick = () => {
    setQuizzes([]);
    setCurrentView("dashboard");
  };

  const handleLoginClick = () => {
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

  const updateCurrentQuestion = (updates) => {
    const updatedQs = [...questions];
    updatedQs[currentQIndex] = { ...updatedQs[currentQIndex], ...updates };
    setQuestions(updatedQs);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      updateCurrentQuestion({ imagePreview: previewUrl, isSelectingType: false });
    }
  };

  const handleAnswerChange = (ansId, newText) => {
    const newAnswers = questions[currentQIndex].answers.map((a) =>
      a.id === ansId ? { ...a, text: newText } : a
    );
    updateCurrentQuestion({ answers: newAnswers });
  };

  const toggleAnswerEdit = (ansId, editingState) => {
    const newAnswers = questions[currentQIndex].answers.map((a) =>
      a.id === ansId ? { ...a, isEditing: editingState } : a
    );
    updateCurrentQuestion({ answers: newAnswers });
  };

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
    const myResult = { id: 999, name: activeName, score: 11, total: 10 };
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

  const handleAnswerClick = (ans) => {
    if (feedbackStatus) return;
    const isCorrect = ans === activeQuizQs[playQIndex].correct;
    setFeedbackStatus(isCorrect ? "correct" : "incorrect");
    setTimeout(() => {
      setFeedbackStatus(null);
      handleNextOrEnd();
    }, 500);
  };

  const handleNextPlayQuestion = () => {
    if (feedbackStatus) return;
    handleNextOrEnd();
  };

  const startQuiz = () => {
    setPlayQIndex(0);
    setTimeLeft(activeQuizQs[0].time);
    setIsOptionsMenuOpen(false);
    setFeedbackStatus(null);
    setCurrentView("playingQuiz");
  };

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

  return (
    <div className="app-container">
      <BackButton
        currentView={currentView}
        setCurrentView={setCurrentView}
      />
      <SettingsButton
        currentView={currentView}
        openSettings={openSettings}
      />

      {currentView === "mainMenu" && (
        <MainMenu setCurrentView={setCurrentView} />
      )}
      {currentView === "authMenu" && (
        <AuthMenu setCurrentView={setCurrentView} />
      )}
      {currentView === "registerForm" && (
        <RegisterForm onRegister={handleRegisterClick} />
      )}
      {currentView === "loginForm" && (
        <LoginForm onLogin={handleLoginClick} loginError={loginError} />
      )}
      {currentView === "dashboard" && (
        <Dashboard
          quizzes={quizzes}
          openCreateQuiz={openCreateQuiz}
          setCurrentView={setCurrentView}
        />
      )}
      {currentView === "joinQuizMenu" && (
        <JoinQuizMenu setCurrentView={setCurrentView} />
      )}
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
        />
      )}
      {currentView === "enterPin" && (
        <EnterPin
          playerNickname={playerNickname}
          setPlayerNickname={setPlayerNickname}
          enteredPin={enteredPin}
          setEnteredPin={setEnteredPin}
          setCurrentView={setCurrentView}
        />
      )}
      {currentView === "quizPinDetails" && (
        <QuizPinDetails
          hostNickname={hostNickname}
          setHostNickname={setHostNickname}
          currentPin={currentPin}
          startQuiz={startQuiz}
        />
      )}
      {currentView === "waitingRoom" && (
        <WaitingRoom startQuiz={startQuiz} />
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
        />
      )}
      {currentView === "leaderboard" && (
        <Leaderboard leaderboardData={leaderboardData} />
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
        />
      )}
      {currentView === "createQuizSettings" && (
        <CreateQuizSettings
          quizForm={quizForm}
          setQuizForm={setQuizForm}
          setCurrentView={setCurrentView}
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
        />
      )}
    </div>
  );
}

export default App;