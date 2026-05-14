import "./QuizSelect.css";
import React, { useRef, useEffect, useState } from "react";

// Quiz seçim sayfası.
// onQuizSelect(quizId): App.js'de backend'e POST /api/rooms atar ve oda oluşturur.
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

  let filteredQuizzes = quizList.filter((q) =>
    q.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (sortOption === "İsme Göre Azalan")
    filteredQuizzes.sort((a, b) => b.name.localeCompare(a.name));
  else if (sortOption === "İsme Göre Artan")
    filteredQuizzes.sort((a, b) => a.name.localeCompare(b.name));
  else if (sortOption === "Zordan Kolaya")
    filteredQuizzes.sort((a, b) => b.difficulty - a.difficulty);
  else if (sortOption === "Kolaydan Zora")
    filteredQuizzes.sort((a, b) => a.difficulty - b.difficulty);
  else if (sortOption === "İlk Eklenenler Başta")
    filteredQuizzes.sort((a, b) => new Date(a.date) - new Date(b.date));
  else
    filteredQuizzes.sort((a, b) => new Date(b.date) - new Date(a.date));

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

        {filteredQuizzes.length === 0 ? (
          <div className="neon-box" style={{ padding: "20px", marginTop: "20px" }}>
            <span className="neon-text">Quiz bulunamadı.</span>
          </div>
        ) : (
          <div className="quiz-grid-container">
            {filteredQuizzes.map((quiz) => (
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
