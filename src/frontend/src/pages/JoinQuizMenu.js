import "./JoinQuizMenu.css";
import React from "react";

// Quize katılma yöntemini seçme sayfası.
// Kullanıcı ya quizler arasından seçim yapar ya da pin ile giriş yapar.
export default function JoinQuizMenu({ setCurrentView, playClick }) {
  return (
    <div className="join-quiz-container">
      {/* Quiz listesinden seçim yapmak için */}
      <button
        className="auth-button neon-box"
        onClick={() => { playClick(); setCurrentView("quizSelect"); }}
      >
        <span className="neon-text">QUİZ SEÇ</span>
      </button>

      {/* Pin kodu girerek quize katılmak için */}
      <button
        className="auth-button neon-box"
        onClick={() => { playClick(); setCurrentView("enterPin"); }}
      >
        <span className="neon-text">PİN İLE GİRİŞ</span>
      </button>
    </div>
  );
}