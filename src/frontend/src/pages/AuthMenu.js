import React from "react";

export default function AuthMenu({ setCurrentView }) {
  return (
    <div className="auth-page-container">
      <button
        className="auth-button neon-box"
        onClick={() => setCurrentView("registerForm")}
      >
        <span className="neon-text">Kayıt ol</span>
      </button>
      <button
        className="auth-button neon-box"
        onClick={() => setCurrentView("loginForm")}
      >
        <span className="neon-text">Giriş Yap</span>
      </button>
    </div>
  );
}