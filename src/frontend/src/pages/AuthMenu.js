import "./AuthMenu.css";
import React from "react";

// Kullanıcıya "Kayıt Ol" veya "Giriş Yap" seçeneği sunar.
export default function AuthMenu({ setCurrentView, playClick }) {
  return (
    <div className="auth-page-container">
      {/* Kayıt ol butonuna basılınca kayıt formuna gider */}
      <button
        className="auth-button neon-box"
        onClick={() => { playClick(); setCurrentView("registerForm"); }}
      >
        <span className="neon-text">Kayıt ol</span>
      </button>

      {/* Giriş yap butonuna basılınca login formuna gider */}
      <button
        className="auth-button neon-box"
        onClick={() => { playClick(); setCurrentView("loginForm"); }}
      >
        <span className="neon-text">Giriş Yap</span>
      </button>
    </div>
  );
}