import React from 'react';
import './App.css'; 

function App() {
  return (
    <div className="app-container">
      
      {/* Ayarlar Butonu */}
      <button className="settings-button">⚙️</button>

      {/* 1. Kutu: Hoş Geldin */}
      <div className="title-box neon-box">
        <h1 className="title-text neon-text">HOŞ GELDİNN!</h1>
      </div>

      {/* Çöp Adam Figürleri İçin Boş Alan (Çizgi tamamen kaldırıldı) */}
      <div className="characters-container">
        {/* Çöp adam resimleri hazır olduğunda buraya ekleyeceğiz */}
      </div>

      {/* 2. Kutu: Alt Başlık (Artık kendi çerçevesi var) */}
      <div className="subtitle-box neon-box">
        <h2 className="subtitle-text neon-text">Ne yapmak istediğine karar ver</h2>
      </div>

      {/* Ana Butonlar */}
      <div className="button-container">
        
        {/* Quize Gir Butonu */}
        <button className="action-button neon-box neon-text">
          <span>Quize</span>
          <span>Gir</span>
        </button>
        
        {/* Quiz Oluştur Butonu */}
        <button className="action-button neon-box neon-text">
          <span>Quiz</span>
          <span>oluştur</span>
        </button>

      </div>

    </div>
  );
}

export default App;