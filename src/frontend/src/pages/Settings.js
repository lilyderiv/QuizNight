import "./Settings.css";
import React from "react";

export default function Settings({
  goBack,
  soundVolume,
  setSoundVolume,
  musicVolume,
  setMusicVolume,
  isSoundMuted,
  setIsSoundMuted,
  isMusicMuted,
  setIsMusicMuted,
}) {
  return (
    <div className="settings-page-container">
      <div className="setting-row">
        <button
          className={`icon-btn neon-box ${isSoundMuted ? "muted" : ""}`}
          onClick={() => setIsSoundMuted(!isSoundMuted)}
        >
          <svg
            className="neon-svg icon-content"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
          </svg>
        </button>
        <input
          type="range"
          className="neon-slider"
          min="0"
          max="100"
          value={isSoundMuted ? 0 : soundVolume}
          onChange={(e) => {
            setSoundVolume(e.target.value);
            if (e.target.value > 0) setIsSoundMuted(false);
          }}
        />
      </div>
      <div className="setting-row">
        <button
          className={`icon-btn neon-box ${isMusicMuted ? "muted" : ""}`}
          onClick={() => setIsMusicMuted(!isMusicMuted)}
        >
          <svg
            className="neon-svg icon-content"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
          >
            <path d="M9 18V5l12-2v13"></path>
            <circle cx="6" cy="18" r="3"></circle>
            <circle cx="18" cy="16" r="3"></circle>
          </svg>
        </button>
        <input
          type="range"
          className="neon-slider"
          min="0"
          max="100"
          value={isMusicMuted ? 0 : musicVolume}
          onChange={(e) => {
            setMusicVolume(e.target.value);
            if (e.target.value > 0) setIsMusicMuted(false);
          }}
        />
      </div>
      <button className="auth-button neon-box back-button" onClick={goBack}>
        <span className="neon-text">Geri Dön</span>
      </button>
    </div>
  );
}