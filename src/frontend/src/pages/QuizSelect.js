import "./QuizSelect.css";
import React, { useRef, useEffect, useState } from "react";

// Quiz seçim sayfası.
// [DÜZELTME] Sıralama ve arama artık backend'de yapılıyor.
// sortOption ve searchTerm değiştiğinde App.js API'ye yeni istek atar.
// Bu bileşen yalnızca gelen listeyi render eder — yerel sort yok.
export default function QuizSelect({
  quizList,
  searchTerm,
  setSearchTerm,
  sortOption,
  setSortOption,
  onQuizSelect,
  playClick,
}) {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Sıralama butonu */}
      <div
        ref={sortMenuRef}
        style={{ position: "absolute", top: "15px", left: "135px", zIndex: 50 }}
      >
        <button
          className="settings-button"
          style={{ position: "relative", top: "0", left: "0", margin: "0" }}
          onClick={() => {
            playClick();
            setIsSortOpen(!isSortOpen);
          }}
        >
          <svg className="nav-icon-svg" viewBox="0 0 24 24">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
        </button>

        {isSortOpen && (
          <div
            className="sort-dropdown-menu neon-box"
            style={{ top: "110%", left: "0" }}
          >
            {[
              "İsme Göre Azalan",
              "İsme Göre Artan",
              "Zordan Kolaya",
              "Kolaydan Zora",
              "Son eklenenler",
              "İlk Eklenenler Başta",
            ].map((option) => (
              <button
                key={option}
                className="sort-option-btn neon-text"
                onClick={() => {
                  playClick();
                  setSortOption(option);
                  setIsSortOpen(false);
                }}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Arama kutusu */}
      <div className="search-box-container neon-box">
        <svg className="search-icon-svg" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className="search-input neon-text"
          placeholder="Ara"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="quiz-select-page">
        <div className="current-sort-label neon-box">
          <span className="neon-text">{sortOption}</span>
        </div>

        {quizList.length === 0 ? (
          <div
            className="neon-box"
            style={{ padding: "20px", marginTop: "20px" }}
          >
            <span className="neon-text">Quiz bulunamadı.</span>
          </div>
        ) : (
          <div className="quiz-grid-container">
            {quizList.map((quiz) => (
              <button
                key={quiz.id}
                className="quiz-item-button neon-box"
                onClick={() => {
                  playClick();
                  onQuizSelect(quiz.id);
                }}
              >
                <span className="neon-text">{quiz.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
