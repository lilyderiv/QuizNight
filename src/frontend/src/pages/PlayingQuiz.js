import "./PlayingQuiz.css";
import React from "react";

// Quiz oynama ekranı.
// Soru, cevaplar, süre sayacı ve doğru/yanlış bildirimi bu ekranda gösterilir.
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
  // Geçerli soru yoksa hiçbir şey render etme
  if (!activeQuizQs[playQIndex]) return null;

  return (
    <div
      className="play-quiz-container"
      onClick={() => {
        // Ekranın herhangi bir yerine tıklanınca seçenekler menüsünü kapat
        if (isOptionsMenuOpen) setIsOptionsMenuOpen(false);
      }}
    >
      {/* Üst sabit bar: hamburger menü butonu */}
      <div className="play-top-fixed-bar">
        <div style={{ position: "relative" }}>
          {/* Hamburger buton: seçenekler menüsünü açar/kapatır */}
          <button
            className="back-navigation-button"
            style={{ position: "relative", top: 0, left: 0 }}
            onClick={(e) => {
              e.stopPropagation(); // Üst div'in onClick'ini tetiklemesin
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

          {/* Seçenekler açılır menüsü: "Quizden Çık" butonu */}
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

      {/* Soru sayacı ve kalan süre */}
      <div className="play-info-row">
        {/* Kaçıncı soruda olduğumuzu gösterir (örn: 1/2) */}
        <div className="play-counter-box neon-box">
          <span className="neon-text">
            {playQIndex + 1}/{activeQuizQs.length}
          </span>
        </div>

        {/* Geri sayım sayacı. Süre bitince otomatik yanlış sayılır */}
        <div className="play-timer-box neon-box">
          <span className="neon-text">
            00.{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
          </span>
        </div>
      </div>

      {/* Soru metni kutusu */}
      <div className="play-question-box neon-box">
        <span className="neon-text">{activeQuizQs[playQIndex].text}</span>
      </div>

      {/* Cevap şıkları ve ileri ok */}
      <div className="play-answers-wrapper">
        {/* 2x2 grid şeklinde 4 cevap şıkkı */}
        <div className="play-answers-grid">
          {activeQuizQs[playQIndex].answers.map((ans, i) => (
            <button
              key={i}
              className="play-answer-btn neon-box"
              onClick={() => handleAnswerClick(ans)}
              // handleAnswerClick: doğruysa yeşil tik, yanlışsa kırmızı çarpı gösterir
              // Ses de bu fonksiyon içinde çalınır (App.js'de tanımlı)
            >
              <span className="neon-text">{ans}</span>
            </button>
          ))}
        </div>

        {/* Son soruda değilsek ileri ok görünür, tıklanınca soruyu atlar */}
        {playQIndex < activeQuizQs.length - 1 && (
          <button
            className="play-next-arrow neon-box"
            onClick={handleNextPlayQuestion}
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

      {/* Quizi erken bitirme butonu: direkt sıralama ekranına gider */}
      <button
        className="play-end-quiz-btn neon-box"
        onClick={finishAndGoToLeaderboard}
      >
        <span className="neon-text">Quizi Bitir</span>
      </button>

      {/* Doğru/Yanlış geri bildirim overlay'i.
          Cevap seçilince 0.5 saniye ekranı kaplar, sonra kaybolur. */}
      {feedbackStatus && (
        <div className="feedback-overlay">
          <div className="feedback-circle neon-box">
            {/* Doğruysa tik ikonu, yanlışsa çarpı ikonu */}
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