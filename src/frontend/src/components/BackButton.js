import React from "react";

// BackButton Bileşeni: Geri navigasyonu sağlar.
// goBack: App.js'de tanımlı, quiz taslağı ve waitingRoom temizliği dahil tüm mantığı içerir.
export default function BackButton({ currentView, goBack }) {
  // Geri butonunun gizleneceği ekranlar
  if (
    currentView === "mainMenu" ||
    currentView === "settings" ||
    currentView === "dashboard" ||
    currentView === "playingQuiz"
  ) {
    return null;
  }

  return (
    <button className="back-navigation-button" onClick={goBack}>
      <svg className="nav-icon-svg" viewBox="0 0 24 24">
        <path
          d="M15 18l-6-6 6-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
