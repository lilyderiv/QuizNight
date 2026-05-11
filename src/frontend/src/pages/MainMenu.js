import "./MainMenu.css";
import React from "react";

export default function MainMenu({ setCurrentView, playClick }) {
  return (
    <>
      {/* Üst başlık kutusu */}
      <div className="title-box neon-box">
        <h1 className="title-text neon-text">HOŞ GELDİN!</h1>
      </div>

      {/* Karakterlerin veya görsellerin yerleşeceği boş alan */}
      <div className="characters-container"></div>

      {/* Alt açıklama yazısı */}
      <div className="subtitle-box neon-box">
        <h2 className="subtitle-text neon-text">
          Ne yapmak istediğine karar ver...
        </h2>
      </div>

      {/* İki ana aksiyon butonu */}
      <div className="button-container">
        {/* Quize katılmak isteyen kullanıcıyı yönlendirir */}
        <button
          className="action-button neon-box"
          onClick={() => { playClick(); setCurrentView("joinQuizMenu"); }}
        >
          <span className="neon-text">QUİZE</span>
          <span className="neon-text">GİR</span>
        </button>

        {/* Quiz oluşturmak isteyen kullanıcıyı yönlendirir */}
        <button
          className="action-button neon-box"
          onClick={() => { playClick(); setCurrentView("authMenu"); }}
        >
          <span className="neon-text">QUİZ</span>
          <span className="neon-text">OLUŞTUR</span>
        </button>
      </div>
    </>
  );
}