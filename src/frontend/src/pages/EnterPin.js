import "./EnterPin.css";
import React from "react";

// Oyuncu pin giriş ekranı.
// Oyuncu önce kendine bir isim verir, sonra 6 haneli oyun pinini girer.
export default function EnterPin({
  playerNickname,
  setPlayerNickname,
  enteredPin,
  setEnteredPin,
  setCurrentView,
  playClick,
}) {
  return (
    <div className="enter-pin-container">
      {/* İsim belirleme başlığı */}
      <div className="enter-pin-name-label neon-box">
        <span className="neon-text">Kendine Bir isim Ver</span>
      </div>

      {/* İsim yazma alanı (max 15 karakter) */}
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

      {/* Pin girme başlığı */}
      <div className="enter-pin-label neon-box">
        <span className="neon-text">Pini Gir</span>
      </div>

      {/* 6 haneli pin giriş alanı (otomatik büyük harfe çevirir) */}
      <input
        type="text"
        className="enter-pin-input neon-box neon-text"
        value={enteredPin}
        onChange={(e) => setEnteredPin(e.target.value.toUpperCase())}
        maxLength={6}
        autoComplete="off"
        spellCheck="false"
      />

      {/* Onay butonu: isim ve pin doğrulanır, bekleme odasına geçilir */}
      <button
        className="pin-confirm-button neon-box"
        onClick={() => {
          playClick();
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