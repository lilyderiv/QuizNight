import React from "react";

// SettingsButton Bileşeni: Uygulamanın köşesinde duran ve tıklandığında ayarları açan butondur.
// currentView: Kullanıcının o an bulunduğu aktif ekranı belirtir.
// openSettings: Butona tıklandığında ayarlar menüsünü açacak olan fonksiyondur.
export default function SettingsButton({ currentView, openSettings }) {
  
  // 1. GİZLEME KONTROLÜ
  // Eğer kullanıcı zaten "settings" (Ayarlar) ekranındaysa, bu butonu ekranda göstermeye gerek yoktur.
  if (currentView === "settings") return null;

  // 2. DİNAMİK KONUMLANDIRMA (Yerleşim Ayarı)
  // Ekranın durumuna göre butonun sol taraftan (left) ne kadar boşluk bırakacağını belirliyoruz.
  // - Eğer "mainMenu" (Ana Menü) veya "dashboard" ekranındaysak, yan tarafta "Geri" butonu olmadığı için 
  //   bu butonu köşeye daha yakın (15px) yerleştiriyoruz.
  // - Diğer ekranlarda muhtemelen bir "Geri" butonu (BackButton) olacağı için, butonların üst üste binmemesi 
  //   adına ayarlar butonunu biraz daha sağa (75px) kaydırıyoruz.
  const leftPos =
    currentView === "mainMenu" || currentView === "dashboard"
      ? "15px"
      : "75px";

  // 3. EKRANA ÇİZİM (RENDER)
  // Hesaplanan konuma ve tıklanma özelliğine sahip Ayarlar butonunu oluşturuyoruz.
  return (
    <button
      className="settings-button"
      onClick={openSettings}
      style={{ left: leftPos }}
    >
      {/* Çark/Dişli ikonu (Ayarları temsil eden SVG çizimi) */}
      <svg
        className="nav-icon-svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    </button>
  );
}