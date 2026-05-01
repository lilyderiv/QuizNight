import "./LoginForm.css";
import React from "react";

export default function LoginForm({ onLogin, loginError }) {
  return (
    <div className="login-page-container">
      <div className="login-form-row">
        <div className="login-label neon-box">
          <span className="neon-text">e-mail</span>
        </div>
        <input
          type="email"
          className="login-input neon-text"
          autoComplete="off"
        />
      </div>
      <div className="login-form-row">
        <div className="login-label neon-box">
          <span className="neon-text">şifre</span>
        </div>
        <input
          type="password"
          placeholder="**********"
          className="login-input neon-text"
          autoComplete="new-password"
        />
      </div>
      <button className="login-submit-button neon-box" onClick={onLogin}>
        <span className="neon-text">Giriş Yap</span>
      </button>

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