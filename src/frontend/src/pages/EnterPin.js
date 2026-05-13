import "./EnterPin.css";
import React from "react";

export default function EnterPin({
  playerNickname,
  setPlayerNickname,
  enteredPin,
  setEnteredPin,
  setCurrentView,
  onJoinServer, // App.js'ten gelen yeni telsiz bağlantımız
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
            alert("Pin 6 haneli olmalıdır!");
          } else {
            // 1. Backend'e "Ben geldim" mesajı gönderiyoruz
            onJoinServer(enteredPin, playerNickname);
            
            // 2. Ekranı "Bekleme Odası"na çeviriyoruz
            // (Backend'den 'player_joined' mesajı gelince de otomatik değişecek ama 
            // kullanıcı tepkiyi anında görsün diye buraya da koyduk)
            setCurrentView("waitingRoom");
          }
        }}
      >
        ONAYLA
      </button>
    </div>
  );
}