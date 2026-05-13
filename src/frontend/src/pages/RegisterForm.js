import "./RegisterForm.css";
import React, { useState } from "react";

export default function RegisterForm({ onRegister }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="register-page-container">
      <div className="form-row">
        <div className="form-label neon-box"><span className="neon-text">Ad Soyad</span></div>
        <input type="text" className="neon-input neon-text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
      </div>
      <div className="form-row">
        <div className="form-label neon-box"><span className="neon-text">e-mail</span></div>
        <input type="email" className="neon-input neon-text" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
      </div>
      <div className="form-row">
        <div className="form-label neon-box"><span className="neon-text">şifre</span></div>
        <input type="password" className="neon-input neon-text" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button className="auth-button neon-box submit-button" onClick={() => onRegister(name, email, password)}>
        <span className="neon-text">Kaydı onayla</span>
      </button>
    </div>
  );
}