import "./EnterPin.css";
import React from "react";

// Oyuncu pin giriş ekranı.
export default function EnterPin({
  playerNickname,
  setPlayerNickname,
  enteredPin,
  setEnteredPin,
  setCurrentView,
  onJoinRoom, // App.js'den socket join fonksiyonu prop olarak alınıyor
  playClick,
}) {
  return (
    <div className="enter-pin-container">
      <div className="enter-pin-name-label neon-box">
        <span className="neon-text">Kendine Bir isim Ver</span>
      </div>

      <input
        type="text"
        className="enter-pin-name-input neon-box neon-text"
        value={playerNickname}
        onChange={(e) => setPlayerNickname(e.target.value)}
        maxLength={15}
        autoFocus
        autoComplete="off"
        spellCheck="false"
      />

      <div className="enter-pin-label neon-box">
        <span className="neon-text">Pini Gir</span>
      </div>

      <input
        type="text"
        className="enter-pin-input neon-box neon-text"
        value={enteredPin}
        onChange={(e) => setEnteredPin(e.target.value.toUpperCase())}
        maxLength={6}
        autoComplete="off"
        spellCheck="false"
      />

      <button
        className="pin-confirm-button neon-box"
        onClick={() => {
          playClick();
          if (playerNickname.trim() === "") {
            alert("Lütfen oyuna girmeden önce bir isim belirle!");
          } else if (enteredPin.length !== 6) {
            alert("Pin 6 haneli olmalıdır!");
          } else {
            // Backend'e join_room socket event'i gönder (App.js üzerinden)
            if (onJoinRoom) {
              onJoinRoom(enteredPin, playerNickname);
            }
            setCurrentView("waitingRoom");
          }
        }}
      >
        ONAYLA
      </button>
    </div>
  );
}
