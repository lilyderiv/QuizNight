import "./QuizSelect.css";
import React, { useRef, useEffect, useState } from "react";

// Quiz seçim sayfası.
// Sistemdeki tüm quizler grid şeklinde listelenir.
// Arama ve sıralama özellikleri de bu sayfada bulunur.
export default function QuizSelect({
  quizList,
  searchTerm,
  setSearchTerm,
  sortOption,
  setSortOption,
  setCurrentView,
  setCurrentPin,
  generateRandomPin,
}) {
  // Sıralama dropdown'ının açık/kapalı durumu
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Dropdown dışına tıklanınca kapanması için ref
  const sortMenuRef = useRef(null);

  // Dropdown dışına tıklanınca kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Arama terimine göre quizleri filtrele
  let filteredQuizzes = quizList.filter((q) =>
    q.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Seçilen sıralama seçeneğine göre sırala
  if (sortOption === "İsme Göre Azalan")
    filteredQuizzes.sort((a, b) => b.name.localeCompare(a.name));
  else if (sortOption === "İsme Göre Artan")
    filteredQuizzes.sort((a, b) => a.name.localeCompare(b.name));
  else if (sortOption === "Zordan Kolaya")
    filteredQuizzes.sort((a, b) => b.difficulty - a.difficulty);
  else if (sortOption === "Kolaydan Zora")
    filteredQuizzes.sort((a, b) => a.difficulty - b.difficulty);
  else if (sortOption === "İlk Eklenenler Başta")
    filteredQuizzes.sort((a, b) => a.date - b.date);
  else
    filteredQuizzes.sort((a, b) => b.date - a.date); // Varsayılan: son eklenenler

  return (
    <>
      {/* Sıralama butonu ve dropdown menüsü (sol üst köşe) */}
      <div
        ref={sortMenuRef}
        style={{ position: "absolute", top: "15px", left: "135px", zIndex: 50 }}
      >
        {/* Huni (filtre) ikonu butonu */}
        <button
          className="settings-button"
          style={{ position: "relative", top: "0", left: "0", margin: "0" }}
          onClick={() => setIsSortOpen(!isSortOpen)}
        >
          <svg className="nav-icon-svg" viewBox="0 0 24 24">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
        </button>

        {/* Sıralama seçenekleri dropdown'ı */}
        {isSortOpen && (
          <div className="sort-dropdown-menu neon-box" style={{ top: "110%", left: "0" }}>
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

      {/* Arama kutusu (sağ üst köşe) */}
      <div className="search-box-container neon-box">
        <svg className="search-icon-svg" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          className="search-input neon-text"
          placeholder="Ara"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Ana sayfa içeriği */}
      <div className="quiz-select-page">
        {/* Aktif sıralama seçeneğini gösteren etiket */}
        <div className="current-sort-label neon-box">
          <span className="neon-text">{sortOption}</span>
        </div>

        {/* Quiz kartları grid'i */}
        <div className="quiz-grid-container">
          {filteredQuizzes.map((quiz) => (
            <button
              key={quiz.id}
              className="quiz-item-button neon-box"
              onClick={() => {
                // Quize tıklanınca rastgele pin üretilir ve pin detay sayfasına gidilir
                setCurrentPin(generateRandomPin());
                setCurrentView("quizPinDetails");
              }}
            >
              <span className="neon-text">{quiz.name}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}