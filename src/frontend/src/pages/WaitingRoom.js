import React from "react";

export default function WaitingRoom({ startQuiz }) {
  return (
    <div className="waiting-room-container">
      <div className="waiting-message-box neon-box">
        <span className="neon-text">
          HERKES TOPLANANA
          <br />
          KADAR
          <br />
          BEKLEMEDESİN :)
        </span>
      </div>
      <button
        className="pin-confirm-button neon-box"
        style={{ marginTop: "3dvh", backgroundColor: "rgba(0, 12, 66, 0.8)" }}
        onClick={startQuiz}
      >
        <span className="neon-text">TEST: OYUNU BAŞLAT</span>
      </button>
    </div>
  );
}