import "./JoinQuizMenu.css";
import React from "react";

export default function JoinQuizMenu({ setCurrentView }) {
  return (
    <div className="join-quiz-container">
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
  );
}