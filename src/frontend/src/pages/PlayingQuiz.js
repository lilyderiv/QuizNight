import "./PlayingQuiz.css";
import React from "react";

export default function PlayingQuiz({
  activeQuizQs,
  playQIndex,
  timeLeft,
  feedbackStatus,
  isOptionsMenuOpen,
  setIsOptionsMenuOpen,
  handleAnswerClick,
  handleNextPlayQuestion,
  finishAndGoToLeaderboard,
  setCurrentView,
}) {
  if (!activeQuizQs[playQIndex]) return null;

  return (
    <div
      className="play-quiz-container"
      onClick={() => {
        if (isOptionsMenuOpen) setIsOptionsMenuOpen(false);
      }}
    >
      {/* Üst Bar */}
      <div className="play-top-fixed-bar">
        <div style={{ position: "relative" }}>
          <button
            className="back-navigation-button"
            style={{ position: "relative", top: 0, left: 0 }}
            onClick={(e) => {
              e.stopPropagation();
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
              <button onClick={() => setCurrentView("mainMenu")}>
                <span className="neon-text">Quizden Çık</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sayaç ve Süre */}
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

      {/* Soru */}
      <div className="play-question-box neon-box">
        <span className="neon-text">{activeQuizQs[playQIndex].text}</span>
      </div>

      {/* Cevaplar */}
      <div className="play-answers-wrapper">
        <div className="play-answers-grid">
          {activeQuizQs[playQIndex].answers.map((ans, i) => (
            <button
              key={i}
              className="play-answer-btn neon-box"
              onClick={() => handleAnswerClick(ans)}
            >
              <span className="neon-text">{ans}</span>
            </button>
          ))}
        </div>

        {playQIndex < activeQuizQs.length - 1 && (
          <button className="play-next-arrow neon-box" onClick={handleNextPlayQuestion}>
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

      {/* Quizi Bitir */}
      <button
        className="play-end-quiz-btn neon-box"
        onClick={finishAndGoToLeaderboard}
      >
        <span className="neon-text">Quizi Bitir</span>
      </button>

      {/* Doğru/Yanlış Bildirimi */}
      {feedbackStatus && (
        <div className="feedback-overlay">
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