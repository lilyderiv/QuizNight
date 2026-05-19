import "./LoginForm.css";
import React, { useState } from "react";

// Giriş yapma formu. E-posta ve şifre alanlarından oluşur.
// Hatalı giriş durumunda yanıp sönen hata kutusu gösterilir.
export default function LoginForm({ onLogin, loginError, playClick }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="login-page-container">
      {/* E-posta satırı */}
      <div className="login-form-row">
        <div className="login-label neon-box">
          <span className="neon-text">e-mail</span>
        </div>
        <input
          type="email"
          className="login-input neon-text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="off"
        />
      </div>

      {/* Şifre satırı */}
      <div className="login-form-row">
        <div className="login-label neon-box">
          <span className="neon-text">şifre</span>
        </div>
        <input
          type="password"
          className="login-input neon-text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {/* Giriş yap butonu — email ve password'u App.js'deki onLogin fonksiyonuna iletir */}
      <button
        className="login-submit-button neon-box"
        onClick={() => {
          playClick();
          onLogin(email, password);
        }}
      >
        <span className="neon-text">Giriş Yap</span>
      </button>

      {/* Hata durumunda yanıp sönen uyarı kutusu */}
      {loginError && (
        <div className="login-error-box neon-box">
          <span className="error-text">
            E-posta adresinizi veya şifrenizi yanlış girdiniz. Lütfen tekrar
            deneyin.
          </span>
        </div>
      )}
    </div>
  );
}
