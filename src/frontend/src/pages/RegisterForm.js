import "./RegisterForm.css";
import React, { useState } from "react";

// Kayıt olma formu. Ad Soyad, e-posta ve şifre alanlarından oluşur.
export default function RegisterForm({ onRegister, playClick }) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="register-page-container">
      {/* Ad Soyad alanı */}
      <div className="form-row">
        <div className="form-label neon-box">
          <span className="neon-text">Ad Soyad</span>
        </div>
        <input
          type="text"
          className="neon-input neon-text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          autoComplete="off"
        />
      </div>

      {/* E-posta alanı */}
      <div className="form-row">
        <div className="form-label neon-box">
          <span className="neon-text">e-mail</span>
        </div>
        <input
          type="email"
          className="neon-input neon-text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="off"
        />
      </div>

      {/* Şifre alanı */}
      <div className="form-row">
        <div className="form-label neon-box">
          <span className="neon-text">şifre</span>
        </div>
        <input
          type="password"
          className="neon-input neon-text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {/* Kaydı onaylama butonu — tüm alanları App.js'deki onRegister'a iletir */}
      <button
        className="auth-button neon-box submit-button"
        onClick={() => {
          playClick();
          onRegister(displayName, email, password);
        }}
      >
        <span className="neon-text">Kaydı onayla</span>
      </button>
    </div>
  );
}
