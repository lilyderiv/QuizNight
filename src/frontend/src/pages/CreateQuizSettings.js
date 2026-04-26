import React from "react";

export default function CreateQuizSettings({
  quizForm,
  setQuizForm,
  setCurrentView,
}) {
  return (
    <div className="cq-container">
      <div className="cq-username neon-box">
        <span className="neon-text" title="Hilal Çakıroğlu">
          Hilal Çakıroğlu
        </span>
      </div>
      <div className="cq-form-area">
        <div className="cq-row">
          <div className="cq-label neon-box">
            <span className="neon-text">Quizin İsmi</span>
          </div>
          <input
            type="text"
            className="cq-input neon-text"
            value={quizForm.name}
            onChange={(e) => setQuizForm({ ...quizForm, name: e.target.value })}
          />
        </div>
        <div className="cq-row">
          <div className="cq-label neon-box">
            <span className="neon-text">Kategori</span>
          </div>
          <input
            type="text"
            className="cq-input neon-text"
            value={quizForm.category}
            onChange={(e) =>
              setQuizForm({ ...quizForm, category: e.target.value })
            }
          />
        </div>
        <div className="cq-row">
          <div className="cq-label neon-box">
            <span className="neon-text" style={{ whiteSpace: "pre-wrap" }}>
              Soru Başına Geçecek Süre
            </span>
          </div>
          <div className="cq-time-container">
            <div className="cq-select-box neon-box">
              <select
                className="cq-select neon-text"
                value={quizForm.min}
                onChange={(e) =>
                  setQuizForm({ ...quizForm, min: e.target.value })
                }
              >
                <option value="" disabled hidden></option>
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="cq-suffix neon-text">dk</span>
            </div>
            <div className="cq-select-box neon-box">
              <select
                className="cq-select neon-text"
                value={quizForm.sec}
                onChange={(e) =>
                  setQuizForm({ ...quizForm, sec: e.target.value })
                }
              >
                <option value="" disabled hidden></option>
                {Array.from({ length: 59 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="cq-suffix neon-text">sn</span>
            </div>
          </div>
        </div>
        <div className="cq-level-section">
          <div className="cq-level-title-row">
            <div className="cq-level-title neon-box">
              <span className="neon-text">Seviye</span>
            </div>
            <button
              className="cq-next-btn neon-box"
              onClick={() => setCurrentView("createQuizQuestions")}
            >
              <svg className="nav-icon-svg" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="cq-level-buttons">
            {["Kolay", "Orta", "Zor"].map((lvl) => (
              <button
                key={lvl}
                className={`cq-level-btn neon-box ${
                  quizForm.level && quizForm.level !== lvl ? "dimmed" : ""
                }`}
                onClick={() => setQuizForm({ ...quizForm, level: lvl })}
              >
                <span className="neon-text">{lvl}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}