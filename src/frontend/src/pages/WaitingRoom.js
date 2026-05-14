import React from "react";
import "./WaitingRoom.css";

// Bekleme odası — oyuncular host oyunu başlatana kadar burada bekler.
// players: App.js'den player_joined socket event'iyle güncellenen dizi.
export default function WaitingRoom({ players = [], playClick }) {
  return (
    <div className="waiting-room-container">
      <div className="waiting-message-box neon-box">
        <span className="neon-text">OYUNCULAR TOPLANIYOR...</span>
      </div>

      {players.length > 0 && (
        <div className="waiting-players-list neon-box">
          {players.map((p, i) => (
            <div key={p.playerId || i} className="waiting-player-row neon-text">
              {p.nickname}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
