import "./LoginForm.css";
import React, { useState } from "react";

// Giriş yapma formu. E-posta ve şifre alanlarından oluşur.
// Hatalı giriş durumunda yanıp sönen hata kutusu gösterilir.
export default function LoginForm({ onLogin, loginError, playClick }) {
  return (
    <div className="login-page-container">
      {/* E-posta satırı: sol etiket + sağ input */}
      <div className="login-form-row">
        <div className="login-label neon-box"><span className="neon-text">e-mail</span></div>
        <input type="email" className="login-input neon-text" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
      </div>

      {/* Şifre satırı: sol etiket + sağ input */}
      <div className="login-form-row">
        <div className="login-label neon-box"><span className="neon-text">şifre</span></div>
        <input type="password" className="login-input neon-text" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>

      {/* Giriş yap butonu. App.js'deki handleLoginClick fonksiyonunu tetikler */}
      <button
        className="login-submit-button neon-box"
        onClick={() => { playClick(); onLogin(); }}
      >
        <span className="neon-text">Giriş Yap</span>
      </button>

      {/* Hata durumunda görünen yanıp sönen uyarı kutusu */}
      {loginError && (
        <div className="login-error-box neon-box">
          <span className="error-text">
            E-posta adresinizi veya şifrenizi yanlış girdiniz. Böyle bir
            kullanıcı bulunmamaktadır. Lütfen tekrar deneyin.
          </span>
        </div>
      )}
    </div>
  );
}