import "./CreateQuizSettings.css";
import { mockUser } from "../mockData";
import React from "react";

// Quiz oluşturma — Ayarlar adımı.
// Quiz ismi, kategorisi, soru başına süre ve zorluk seviyesi burada belirlenir.
export default function CreateQuizSettings({ quizForm, setQuizForm, setCurrentView, playClick }) {
  return (
    <div className="cq-container">
      {/* Kullanıcı adı göstergesi (mockData'dan gelir) */}
      <div className="cq-username neon-box">
        <span className="neon-text" title={mockUser.fullName}>
          {mockUser.fullName}
        </span>
      </div>

      <div className="cq-form-area">
        {/* Quiz İsmi alanı */}
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

        {/* Kategori alanı */}
        <div className="cq-row">
          <div className="cq-label neon-box">
            <span className="neon-text">Kategori</span>
          </div>
          <input
            type="text"
            className="cq-input neon-text"
            value={quizForm.category}
            onChange={(e) => setQuizForm({ ...quizForm, category: e.target.value })}
          />
        </div>

        {/* Süre seçimi: Dakika ve saniye ayrı ayrı seçilir */}
        <div className="cq-row">
          <div className="cq-label neon-box">
            <span className="neon-text" style={{ whiteSpace: "pre-wrap" }}>
              Soru Başına Geçecek Süre
            </span>
          </div>
          <div className="cq-time-container">
            {/* Dakika seçici (0-5) */}
            <div className="cq-select-box neon-box">
              <select
                className="cq-select neon-text"
                value={quizForm.min}
                onChange={(e) => setQuizForm({ ...quizForm, min: e.target.value })}
              >
                <option value="" disabled hidden></option>
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span className="cq-suffix neon-text">dk</span>
            </div>

            {/* Saniye seçici (1-59) */}
            <div className="cq-select-box neon-box">
              <select
                className="cq-select neon-text"
                value={quizForm.sec}
                onChange={(e) => setQuizForm({ ...quizForm, sec: e.target.value })}
              >
                <option value="" disabled hidden></option>
                {Array.from({ length: 59 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span className="cq-suffix neon-text">sn</span>
            </div>
          </div>
        </div>

        {/* Zorluk seviyesi seçimi */}
        <div className="cq-level-section">
          <div className="cq-level-title-row">
            <div className="cq-level-title neon-box">
              <span className="neon-text">Seviye</span>
            </div>

            {/* İleri ok butonu: soru oluşturma ekranına geçer */}
            <button
              className="cq-next-btn neon-box"
              onClick={() => { playClick(); setCurrentView("createQuizQuestions"); }}
            >
              <svg className="nav-icon-svg" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Kolay / Orta / Zor butonları. Seçilmeyen butonlar soluklaşır (dimmed) */}
          <div className="cq-level-buttons">
            {["Kolay", "Orta", "Zor"].map((lvl) => (
              <button
                key={lvl}
                className={`cq-level-btn neon-box ${quizForm.level && quizForm.level !== lvl ? "dimmed" : ""}`}
                onClick={() => { playClick(); setQuizForm({ ...quizForm, level: lvl }); }}
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