import "./LoginForm.css";
import React, { useState } from "react";

export default function LoginForm({ onLogin, loginError }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    // Sayfanın yenilenmesini engellemek için isteğe bağlı eklenebilir
    onLogin(email, password);
  };

  return (
    <div className="login-page-container">
      <div className="login-form-row">
        <div className="login-label neon-box"><span className="neon-text">e-mail</span></div>
        <input type="email" className="login-input neon-text" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
      </div>
      <div className="login-form-row">
        <div className="login-label neon-box"><span className="neon-text">şifre</span></div>
        <input type="password" className="login-input neon-text" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button className="login-submit-button neon-box" onClick={handleSubmit}>
        <span className="neon-text">Giriş Yap</span>
      </button>
      {loginError && <div className="login-error-box neon-box"><span className="error-text">Hatalı giriş!</span></div>}
    </div>
  );
}