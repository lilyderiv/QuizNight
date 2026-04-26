import React from "react";

export default function MainMenu({ setCurrentView }) {
  return (
    <>
      <div className="title-box neon-box">
        <h1 className="title-text neon-text">HOŞ GELDİN!</h1>
      </div>
      <div className="characters-container"></div>
      <div className="subtitle-box neon-box">
        <h2 className="subtitle-text neon-text">
          Ne yapmak istediğine karar ver...
        </h2>
      </div>
      <div className="button-container">
        <button
          className="action-button neon-box"
          onClick={() => setCurrentView("joinQuizMenu")}
        >
          <span className="neon-text">QUİZE</span>
          <span className="neon-text">GİR</span>
        </button>
        <button
          className="action-button neon-box"
          onClick={() => setCurrentView("authMenu")}
        >
          <span className="neon-text">QUİZ</span>
          <span className="neon-text">OLUŞTUR</span>
        </button>
      </div>
    </>
  );
}