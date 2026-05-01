import "./RegisterForm.css";
import React from "react";

export default function RegisterForm({ onRegister }) {
  return (
    <div className="register-page-container">
      <div className="form-row">
        <div className="form-label neon-box">
          <span className="neon-text">Ad Soyad</span>
        </div>
        <input
          type="text"
          className="neon-input neon-text"
          autoComplete="off"
        />
      </div>
      <div className="form-row">
        <div className="form-label neon-box">
          <span className="neon-text">e-mail</span>
        </div>
        <input
          type="email"
          className="neon-input neon-text"
          autoComplete="off"
        />
      </div>
      <div className="form-row">
        <div className="form-label neon-box">
          <span className="neon-text">şifre</span>
        </div>
        <input
          type="password"
          placeholder="**********"
          className="neon-input neon-text"
          autoComplete="new-password"
        />
      </div>
      <button
        className="auth-button neon-box submit-button"
        onClick={onRegister}
      >
        <span className="neon-text">Kaydı onayla</span>
      </button>
    </div>
  );
}