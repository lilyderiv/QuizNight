import "./Dashboard.css";
import { mockUser } from "../mockData";
import React, { useRef, useEffect, useState } from "react";

// Dashboard sayfası. Kullanıcının oluşturduğu quizleri ve profil menüsünü gösterir.
export default function Dashboard({ quizzes, openCreateQuiz, setCurrentView, playClick }) {
  // Carousel (yatay kaydırma) için DOM referansı
  const carouselRef = useRef(null);

  // Sol ve sağ ok butonlarının görünürlüğünü kontrol eden state'ler
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Profil açılır menüsünün açık/kapalı durumu
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Carousel'in scroll pozisyonuna göre ok butonlarını göster/gizle
  const checkArrows = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(Math.ceil(scrollLeft) < scrollWidth - clientWidth - 5);
    }
  };

  // Sayfa ilk açıldığında ve quiz listesi değiştiğinde ok durumunu kontrol et
  useEffect(() => {
    checkArrows();
    window.addEventListener("resize", checkArrows);
    return () => window.removeEventListener("resize", checkArrows);
  }, [quizzes]);

  // Carousel'i sola veya sağa kaydıran fonksiyon
  const scrollCarousel = (dir) => {
    if (carouselRef.current) {
      const scrollAmount = 436; // Bir kart genişliği kadar kaydır
      carouselRef.current.scrollBy({
        left: dir === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      {/* Profil butonu ve açılır menüsü (sol üst köşe) */}
      <div style={{ position: "absolute", top: "15px", left: "75px", zIndex: 130 }}>
        <button
          className="dash-profile-btn"
          onClick={() => { playClick(); setIsProfileMenuOpen(!isProfileMenuOpen); }}
        >
          {/* Profil ikonu (kişi silüeti) */}
          <svg className="nav-icon-svg" viewBox="0 0 24 24">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>

        {/* Profil menüsü açıkken gösterilen dropdown */}
        {isProfileMenuOpen && (
          <div className="dash-dropdown neon-box">
            <button
              className="dash-logout"
              onClick={() => {
                playClick();
                setIsProfileMenuOpen(false);
                setCurrentView("mainMenu"); // Ana menüye dön (çıkış yap)
              }}
            >
              Çıkış Yap
            </button>
          </div>
        )}
      </div>

      {/* Kullanıcı adı göstergesi (mockData'dan gelir, database bağlanınca değişecek) */}
      <div className="dash-username neon-box">
        <span className="neon-text" title={mockUser.fullName}>
          {mockUser.fullName}
        </span>
      </div>

      <div className="dash-container">
        {/* "Quizlerin" başlık kutusu */}
        <div className="dash-title neon-box">
          <span className="neon-text">Quizlerin</span>
        </div>

        {/* Quiz yoksa boş durum mesajı göster, varsa carousel göster */}
        {quizzes.length === 0 ? (
          <div className="dash-empty neon-box">
            <span className="neon-text">Henüz bir quiz oluşturmadın...</span>
          </div>
        ) : (
          <div className="dash-carousel">
            {/* Sol ok: sadece başta değilsek görünür */}
            {showLeftArrow && (
              <button className="dash-arrow neon-box" onClick={() => { playClick(); scrollCarousel("left"); }}>
                <svg className="nav-icon-svg" viewBox="0 0 24 24">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            )}

            {/* Yatay kaydırılabilir quiz kartları alanı */}
            <div className="dash-scroll-area" ref={carouselRef} onScroll={checkArrows}>
              {quizzes.map((q) => (
                <button key={q.id} className="dash-quiz-card neon-box" title={q.name}>
                  <span className="neon-text">{q.name}</span>
                </button>
              ))}
            </div>

            {/* Sağ ok: sonda değilsek görünür */}
            {showRightArrow && (
              <button className="dash-arrow neon-box" onClick={() => { playClick(); scrollCarousel("right"); }}>
                <svg className="nav-icon-svg" viewBox="0 0 24 24">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Yeni quiz oluşturma butonu */}
        <button className="dash-new-btn neon-box" onClick={() => { playClick(); openCreateQuiz(); }}>
          <span className="neon-text">Yeni Quiz oluştur</span>
        </button>
      </div>
    </>
  );
}