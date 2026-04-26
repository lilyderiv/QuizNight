import React from "react";

export default function EnterPin({
  playerNickname,
  setPlayerNickname,
  enteredPin,
  setEnteredPin,
  setCurrentView,
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
          if (playerNickname.trim() === "") {
            alert("Lütfen oyuna girmeden önce bir isim belirle!");
          } else if (enteredPin.length !== 6) {
            alert("Lütfen 6 haneli oyun pinini eksiksiz gir.");
          } else {
            setCurrentView("waitingRoom");
          }
        }}
      >
        <span className="neon-text">Pini onayla</span>
      </button>
    </div>
  );
}