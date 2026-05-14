import "./PlayingQuiz.css";
import React from "react";

// Quiz oynama ekranı.
export default function PlayingQuiz({
  activeQuizQs,
  playQIndex,
  timeLeft,
  feedbackStatus,
  isOptionsMenuOpen, // App.js'den prop olarak alınıyor
  setIsOptionsMenuOpen, // App.js'den prop olarak alınıyor
  handleAnswerClick,
  handleNextPlayQuestion,
  finishAndGoToLeaderboard,
  setCurrentView,
  playClick,
}) {
  const currentQ = activeQuizQs[playQIndex]; // Şu anki soru prop'lardan türetiliyor

  if (!currentQ) return null;

  return (
    <div
      className="play-quiz-container"
      onClick={() => {
        if (isOptionsMenuOpen) setIsOptionsMenuOpen(false);
      }}
    >
      {/* Üst sabit bar: hamburger menü */}
      <div className="play-top-fixed-bar">
        <div style={{ position: "relative" }}>
          <button
            className="back-navigation-button"
            style={{ position: "relative", top: 0, left: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              playClick();
              setIsOptionsMenuOpen(!isOptionsMenuOpen);
            }}
          >
            <svg className="nav-icon-svg" viewBox="0 0 24 24">
              <path
                d="M3 12h18M3 6h18M3 18h18"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {isOptionsMenuOpen && (
            <div
              className="play-options-dropdown neon-box"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  playClick();
                  setCurrentView("mainMenu");
                }}
              >
                <span className="neon-text">Quizden Çık</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Soru sayacı ve kalan süre */}
      <div className="play-info-row">
        <div className="play-counter-box neon-box">
          <span className="neon-text">
            {playQIndex + 1}/{activeQuizQs.length}
          </span>
        </div>
        <div className="play-timer-box neon-box">
          <span className="neon-text">
            00.{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
          </span>
        </div>
      </div>

      {/* Soru metni */}
      <div className="play-question-box neon-box">
        <span className="neon-text">{currentQ.text}</span>
      </div>

      {/* Cevap şıkları ve ileri ok */}
      <div className="play-answers-wrapper">
        <div className="play-answers-grid">
          {currentQ.answers.map((ans, i) => (
            <button
              key={ans?.id ?? i}
              className="play-answer-btn neon-box"
              onClick={() => handleAnswerClick(ans)}
            >
              {/* Gerçek modda ans = {id, text}, DEV modda ans = string */}
              <span className="neon-text">
                {typeof ans === "object" && ans !== null ? ans.text : ans}
              </span>
            </button>
          ))}
        </div>

        {playQIndex < activeQuizQs.length - 1 && (
          <button
            className="play-next-arrow neon-box"
            onClick={() => {
              playClick();
              handleNextPlayQuestion();
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}
      </div>

      {/* Quizi erken bitirme */}
      <button
        className="play-end-quiz-btn neon-box"
        onClick={() => {
          playClick();
          finishAndGoToLeaderboard();
        }}
      >
        <span className="neon-text">Quizi Bitir</span>
      </button>

      {/* Doğru/Yanlış geri bildirim overlay'i */}
      {feedbackStatus && (
        <div className={`feedback-overlay ${feedbackStatus}`}>
          <div className="feedback-circle neon-box">
            {feedbackStatus === "correct" ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
