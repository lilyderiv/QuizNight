import React from "react";
import "./WaitingRoom.css";

// DEV_MODE: true iken "TEST: OYUNU BAŞLAT" butonu görünür.
// Projeyi teslim ederken false yap, buton otomatik kaybolur.
const DEV_MODE = true;

// Bekleme odası ekranı.
// Oyuncular quize katılırken host bu ekranda bekler.
// Gerçek uygulamada WebSocket ile oyuncu listesi burada görünecek.
export default function WaitingRoom({ startQuiz, playClick }) {
  return (
    <div className="waiting-room-container">
      {/* Büyük bekleme mesajı kutusu */}
      <div className="waiting-message-box neon-box">
        <span className="neon-text">
          HERKES TOPLANANA
          <br />
          KADAR
          <br />
          BEKLEMEDESİN :)
        </span>
      </div>

      {/* DEV_MODE açıkken görünen test butonu. Database bağlanınca kaldırılacak. */}
      {DEV_MODE && (
        <button
          className="pin-confirm-button neon-box"
          style={{ marginTop: "3dvh", backgroundColor: "rgba(0, 12, 66, 0.8)" }}
          onClick={() => { playClick(); startQuiz(); }}
        >
          <span className="neon-text">TEST: OYUNU BAŞLAT</span>
        </button>
      )}
    </div>
  );
}