import "./QuizPinDetails.css";
import React from "react";

export default function QuizPinDetails({
  hostNickname,
  setHostNickname,
  currentPin,
  startQuiz,
}) {
  return (
    <div className="pin-screen-container">
      <div className="pin-host-label neon-box">
        <span className="neon-text">Kendine Bir İsim Ver</span>
      </div>

      <input
        type="text"
        className="pin-host-input neon-box neon-text"
        value={hostNickname}
        onChange={(e) => setHostNickname(e.target.value)}
        maxLength={15}
        autoFocus
        autoComplete="off"
        spellCheck="false"
      />

      <div className="pin-label-box neon-box">
        <span className="neon-text">OYUN PİNİ</span>
      </div>

      <div className="pin-code-box neon-box">
        <span className="neon-text">{currentPin}</span>
      </div>

      <div className="pin-info-box neon-box">
        <span className="neon-text">Arkadaşlarını bu pine çağır!</span>
      </div>

      <button
        className="pin-start-button neon-box"
        onClick={() => {
          if (hostNickname.trim() === "") {
            alert("Lütfen oyuna başlamadan önce bir isim girin!");
          } else {
            startQuiz();
          }
        }}
      >
        <span className="neon-text">OYUNU BAŞLAT</span>
      </button>
    </div>
  );
}