import React, { useState } from 'react';
import './App.css';

function App() {
  // Hangi sayfada olduğumuzu ve bir önceki sayfayı tutan durumlar
  const [currentView, setCurrentView] = useState('mainMenu');
  const [previousView, setPreviousView] = useState('mainMenu');

  // Ses ve Müzik seviyeleri (0 ile 100 arası)
  const [soundVolume, setSoundVolume] = useState(50);
  const [musicVolume, setMusicVolume] = useState(50);

  // Susturulma (Mute) durumları
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);

  // Ayarları açarken geldiğimiz sayfayı kaydederiz
  const openSettings = () => {
    if (currentView !== 'settings') {
      setPreviousView(currentView);
      setCurrentView('settings');
    }
  };

  // Geri Dön butonuna basınca geldiğimiz sayfaya döneriz
  const goBack = () => {
    setCurrentView(previousView);
  };

  return (
    <div className="app-container">
      {/* Ayarlar Butonu (Eğer ayarlar sayfasındaysak gizleyebiliriz veya tıklanmasını engelleyebiliriz, şimdilik sabit) */}
      {currentView !== 'settings' && (
        <button className="settings-button" onClick={openSettings}>⚙️</button>
      )}

      {/* --- ANA MENÜ --- */}
      {currentView === 'mainMenu' && (
        <>
          <div className="title-box neon-box">
            <h1 className="title-text neon-text">HOŞ GELDİN!</h1>
          </div>
          <div className="characters-container"></div>
          <div className="subtitle-box neon-box">
            <h2 className="subtitle-text neon-text">Ne yapmak istediğine karar ver...</h2>
          </div>
          <div className="button-container">
            <button className="action-button neon-box">
              <span className="neon-text">QUİZE</span><span className="neon-text">GİR</span>
            </button>
            <button className="action-button neon-box" onClick={() => setCurrentView('authMenu')}>
              <span className="neon-text">QUİZ</span><span className="neon-text">OLUŞTUR</span>
            </button>
          </div>
        </>
      )}

      {/* --- KAYIT OL / GİRİŞ YAP EKRANI --- */}
      {currentView === 'authMenu' && (
        <div className="auth-page-container">
          {/* Tıklandığında registerForm sayfasına yönlendirir */}
          <button className="auth-button neon-box" onClick={() => setCurrentView('registerForm')}>
            <span className="neon-text">Kayıt ol</span>
          </button>
          <button className="auth-button neon-box">
            <span className="neon-text">Giriş Yap</span>
          </button>
        </div>
      )}

      {/* --- YENİ EKLENEN: KAYIT FORMU EKRANI --- */}
      {currentView === 'registerForm' && (
        <div className="register-page-container">
          
          {/* 1. SATIR: Ad Soyad */}
          <div className="form-row">
            <div className="form-label neon-box">
              <span className="neon-text">Ad Soyad</span>
            </div>
            <input type="text" className="neon-input neon-text" autoComplete="off" />
          </div>

          {/* 2. SATIR: e-mail */}
          <div className="form-row">
            <div className="form-label neon-box">
              <span className="neon-text">e-mail</span>
            </div>
            {/* Tarayıcının e-posta simgesi eklemesini engelliyoruz */}
            <input type="email" className="neon-input neon-text" autoComplete="off" />
          </div>

          {/* 3. SATIR: şifre */}
          <div className="form-row">
            <div className="form-label neon-box">
              <span className="neon-text">şifre</span>
            </div>
            {/* new-password diyerek Chrome'un eski şifreleri getirip kutuyu bozmasını önlüyoruz */}
            <input type="password" placeholder="**********" className="neon-input neon-text" autoComplete="new-password" />
          </div>

          {/* KAYDI ONAYLA BUTONU */}
          <button className="auth-button neon-box submit-button">
            <span className="neon-text">Kaydı onayla</span>
          </button>
          

        </div>
      )}

      {/* --- AYARLAR EKRANI --- */}
      {currentView === 'settings' && (
        <div className="settings-page-container">
          
          {/* SES SATIRI */}
          <div className="setting-row">
            <button 
              className={`icon-btn neon-box ${isSoundMuted ? 'muted' : ''}`}
              onClick={() => setIsSoundMuted(!isSoundMuted)}
            >
              {/* Yeni Neon Ses İkonu */}
              <svg className="neon-svg icon-content" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
              </svg>

              {/* Yeni Beyaz Neon Çarpı İkonu */}
              {isSoundMuted && (
                <svg className="mute-x neon-svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              )}
            </button>

            <input 
              type="range" className="neon-slider" min="0" max="100" 
              value={isSoundMuted ? 0 : soundVolume} 
              onChange={(e) => {
                setSoundVolume(e.target.value);
                if(e.target.value > 0) setIsSoundMuted(false); 
              }}
            />
          </div>

          {/* MÜZİK SATIRI */}
          <div className="setting-row">
            <button 
              className={`icon-btn neon-box ${isMusicMuted ? 'muted' : ''}`}
              onClick={() => setIsMusicMuted(!isMusicMuted)}
            >
              {/* Yeni Neon Müzik İkonu */}
              <svg className="neon-svg icon-content" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13"></path>
                <circle cx="6" cy="18" r="3"></circle>
                <circle cx="18" cy="16" r="3"></circle>
              </svg>

              {/* Yeni Beyaz Neon Çarpı İkonu */}
              {isMusicMuted && (
                <svg className="mute-x neon-svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              )}
            </button>

            <input 
              type="range" className="neon-slider" min="0" max="100" 
              value={isMusicMuted ? 0 : musicVolume} 
              onChange={(e) => {
                setMusicVolume(e.target.value);
                if(e.target.value > 0) setIsMusicMuted(false);
              }}
            />
          </div>

          {/* GERİ DÖN BUTONU */}
          <button className="auth-button neon-box back-button" onClick={goBack}>
            <span className="neon-text">Geri Dön</span>
          </button>

        </div>
      )}

    </div>
  );
}

export default App;