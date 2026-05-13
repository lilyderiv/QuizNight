import "./PlayingQuiz.css";
import React from "react";

export default function PlayingQuiz({
  activeQuizQs,
  playQIndex,
  timeLeft,
  feedbackStatus,
  handleAnswerClick,
  handleNextPlayQuestion,
  finishAndGoToLeaderboard,
}) {
  const currentQ = activeQuizQs[playQIndex];
  if (!currentQ) return null;

  return (
    <div className="play-quiz-container">
      <div className="play-info-row">
        <div className="play-counter-box neon-box">
          <span className="neon-text">{playQIndex + 1}/{activeQuizQs.length}</span>
        </div>
        <div className="play-timer-box neon-box">
          <span className="neon-text">00.{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
        </div>
      </div>

      <div className="play-question-box neon-box">
        <span className="neon-text">{currentQ.text}</span>
      </div>

      <div className="play-answers-grid">
        {currentQ.answers.map((ans) => (
          <button 
            key={ans.id} 
            className="play-answer-btn neon-box" 
            onClick={() => handleAnswerClick(ans.id)}
          >
            <span className="neon-text">{ans.text}</span>
          </button>
        ))}
      </div>

      <div className="play-nav-row">
        {playQIndex < activeQuizQs.length - 1 ? (
          <button className="play-next-arrow neon-box" onClick={handleNextPlayQuestion}>
            <svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke="white" strokeWidth="2" fill="none"/></svg>
          </button>
        ) : (
          <button className="play-end-quiz-btn neon-box" onClick={finishAndGoToLeaderboard}>
            <span className="neon-text">Quizi Bitir</span>
          </button>
        )}
      </div>

      {feedbackStatus && (
        <div className={`feedback-overlay ${feedbackStatus}`}>
          <div className="feedback-circle neon-box">
            {feedbackStatus === "correct" ? "✔" : "✘"}
          </div>
        </div>
      )}
    </div>
  );
}