import "./QuizPinDetails.css";
import React from "react";

// Quiz kurucu (host) ekranı.
// Host ismini belirler, oluşturulan pin kodunu görür ve oyunu başlatır.
export default function QuizPinDetails({
  hostNickname,
  setHostNickname,
  currentPin,
  startQuiz,
  playClick,
}) {
  return (
    <div className="pin-screen-container">
      {/* İsim belirleme başlığı */}
      <div className="pin-host-label neon-box">
        <span className="neon-text">Kendine Bir İsim Ver</span>
      </div>

      {/* Host isim giriş alanı (max 15 karakter) */}
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

      {/* "Oyun Pini" başlık kutusu */}
      <div className="pin-label-box neon-box">
        <span className="neon-text">OYUN PİNİ</span>
      </div>

      {/* Rastgele üretilen 6 haneli pin kodu (generateRandomPin ile oluşturulur) */}
      <div className="pin-code-box neon-box">
        <span className="neon-text">{currentPin}</span>
      </div>

      {/* Bilgi mesajı */}
      <div className="pin-info-box neon-box">
        <span className="neon-text">Arkadaşlarını bu pine çağır!</span>
      </div>

      {/* Oyunu başlat butonu: isim boşsa uyarı verir, doluysa quizi başlatır */}
      <button
        className="pin-start-button neon-box"
        onClick={() => {
          playClick();
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