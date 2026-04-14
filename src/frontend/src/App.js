import React from 'react';
import './App.css';

function App() {
  return (
    <div className="app-container">
      {/* Ayarlar Butonu */}
      <button className="settings-button">⚙️</button>

      {/* 1. Kutu: HOŞ GELDİNN! */}
      <div className="title-box neon-box">
        <h1 className="title-text neon-text">HOŞ GELDİN!</h1>
      </div>

      {/* Çöp Adamlar Alanı (Görünmez/Boşluk) */}
      <div className="characters-container">
        {/* Buraya ileride figürlerini ekleyebilirsin */}
      </div>

      {/* 2. Kutu: Alt Başlık */}
      <div className="subtitle-box neon-box">
        <h2 className="subtitle-text neon-text">Ne yapmak istediğine karar ver...</h2>
      </div>

      {/* Butonlar Konteyneri */}
      <div className="button-container">
        <button className="action-button neon-box">
          <span className="neon-text">QUİZE</span>
          <span className="neon-text">GİR</span>
        </button>

        <button className="action-button neon-box">
          <span className="neon-text">QUİZ</span>
          <span className="neon-text">OLUŞTUR</span>
        </button>
      </div>
    </div>
  );
}

export default App;