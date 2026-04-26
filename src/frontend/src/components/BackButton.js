import React from "react";

export default function BackButton({ currentView, setCurrentView }) {
  if (
    currentView === "mainMenu" ||
    currentView === "settings" ||
    currentView === "dashboard" ||
    currentView === "playingQuiz"
  ) {
    return null;
  }

  const handleBack = () => {
    if (currentView === "loginForm" || currentView === "registerForm") {
      setCurrentView("authMenu");
    } else if (
      currentView === "createQuizSettings" ||
      currentView === "createQuizQuestions"
    ) {
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
  };

  return (
    <button className="back-navigation-button" onClick={handleBack}>
      <svg className="nav-icon-svg" viewBox="0 0 24 24">
        <path
          d="M15 18l-6-6 6-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}