import "./PlayingQuiz.css";
import React from "react";

// Quiz oynama ekranı.
// isHost: sadece host "İleri" okuna basabilir (senkronize soru geçişi için).
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
  playClick,
  isHost,
}) {
  const currentQ = activeQuizQs[playQIndex];

  if (!currentQ) return null;

  // [DÜZELTME] Zamanlayıcı formatı: mm:ss
  // 30s → "00:30", 90s → "01:30", 300s → "05:00"
  const mins = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, "0");
  const secs = (timeLeft % 60).toString().padStart(2, "0");
  const timerDisplay = `${mins}:${secs}`;

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
          <span className="neon-text">{timerDisplay}</span>
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
              disabled={!!feedbackStatus}
            >
              <span className="neon-text">
                {typeof ans === "object" && ans !== null ? ans.text : ans}
              </span>
            </button>
          ))}
        </div>

        {/* [DÜZELTME] Sadece host "İleri" okuna basabilir.
            Bu buton soru geçişini tetikler; sunucu tüm odaya yayar.
            Oyuncular "question_changed" event'ini bekler. */}
        {isHost && playQIndex < activeQuizQs.length - 1 && (
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
