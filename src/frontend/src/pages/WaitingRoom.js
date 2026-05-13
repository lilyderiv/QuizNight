import React from "react";
import "./WaitingRoom.css";

const DEV_MODE = true; 

export default function WaitingRoom({ players, startQuiz }) {
  return (
    <div className="waiting-room-container">
      <div className="waiting-message-box neon-box">
        <span className="neon-text">
          OYUNCULAR TOPLANIYOR...
        </span>
      </div>

      {/* Canlı Oyuncu Listesi  */}
      <div className="player-list-container neon-box" style={{ marginTop: "20px", padding: "10px", minWidth: "200px" }}>
        <h3 className="neon-text" style={{ fontSize: "1.2rem", marginBottom: "10px" }}>Katılımcılar ({players?.length || 0})</h3>
        <div className="players-grid" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          {players && players.map((player, index) => (
            <div key={index} className="player-item neon-text" style={{ fontSize: "1rem" }}>
              • {player.nickname} {player.isGuest ? "(Misafir)" : ""}
            </div>
          ))}
        </div>
      </div>

      {DEV_MODE && (
        <button
          className="pin-confirm-button neon-box"
          style={{ marginTop: "3dvh", backgroundColor: "rgba(0, 12, 66, 0.8)" }}
          onClick={startQuiz}
        >
          <span className="neon-text">TEST: OYUNU BAŞLAT</span>
        </button>
      )}
    </div>
  );
}