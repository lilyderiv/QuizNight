import React, { useRef, useEffect, useState } from "react";

export default function Dashboard({ quizzes, openCreateQuiz, setCurrentView }) {
  const carouselRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const checkArrows = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(Math.ceil(scrollLeft) < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    checkArrows();
    window.addEventListener("resize", checkArrows);
    return () => window.removeEventListener("resize", checkArrows);
  }, [quizzes]);

  const scrollCarousel = (dir) => {
    if (carouselRef.current) {
      const scrollAmount = 436;
      carouselRef.current.scrollBy({
        left: dir === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      <div style={{ position: "absolute", top: "15px", left: "75px", zIndex: 130 }}>
        <button
          className="dash-profile-btn"
          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
        >
          <svg className="nav-icon-svg" viewBox="0 0 24 24">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
        {isProfileMenuOpen && (
          <div className="dash-dropdown neon-box">
            <button
              className="dash-logout"
              onClick={() => {
                setIsProfileMenuOpen(false);
                setCurrentView("mainMenu");
              }}
            >
              Çıkış Yap
            </button>
          </div>
        )}
      </div>

      <div className="dash-username neon-box">
        <span className="neon-text" title="Hilal Çakıroğlu">
          Hilal Çakıroğlu
        </span>
      </div>

      <div className="dash-container">
        <div className="dash-title neon-box">
          <span className="neon-text">Quizlerin</span>
        </div>

        {quizzes.length === 0 ? (
          <div className="dash-empty neon-box">
            <span className="neon-text">
              Henüz bir quiz oluşturmadın...
            </span>
          </div>
        ) : (
          <div className="dash-carousel">
            {showLeftArrow && (
              <button
                className="dash-arrow neon-box"
                onClick={() => scrollCarousel("left")}
              >
                <svg className="nav-icon-svg" viewBox="0 0 24 24">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            )}
            <div
              className="dash-scroll-area"
              ref={carouselRef}
              onScroll={checkArrows}
            >
              {quizzes.map((q) => (
                <button
                  key={q.id}
                  className="dash-quiz-card neon-box"
                  title={q.name}
                >
                  <span className="neon-text">{q.name}</span>
                </button>
              ))}
            </div>
            {showRightArrow && (
              <button
                className="dash-arrow neon-box"
                onClick={() => scrollCarousel("right")}
              >
                <svg className="nav-icon-svg" viewBox="0 0 24 24">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            )}
          </div>
        )}

        <button className="dash-new-btn neon-box" onClick={openCreateQuiz}>
          <span className="neon-text">Yeni Quiz oluştur</span>
        </button>
      </div>
    </>
  );
}