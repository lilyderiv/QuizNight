import "./CreateQuizQuestions.css";
import React from "react";

export default function CreateQuizQuestions({
  questions,
  currentQIndex,
  setCurrentQIndex,
  updateCurrentQuestion,
  handleImageUpload,
  handleAnswerChange,
  toggleAnswerEdit,
  removeAnswer,
  addNewPage,
  finishQuiz,
}) {
  const currentQ = questions[currentQIndex];

  const removeImage = () => {
    if (window.confirm("Resmi silmek istediğinize emin misiniz?"))
      updateCurrentQuestion({ imagePreview: null });
  };

  const removeText = () => {
    if (window.confirm("Soruyu silmek istediğinize emin misiniz?"))
      updateCurrentQuestion({ text: "" });
  };

  if (!currentQ) return null;

  return (
    <div className="qq-container">
      {/* Kesir */}
      <div
        className="qq-fraction neon-box"
        style={{
          position: "absolute",
          top: "15px",
          right: "25px",
          width: "clamp(80px, 10vw, 165px)",
          height: "50px",
          zIndex: 130,
        }}
      >
        <span className="neon-text" style={{ fontSize: "2rem" }}>
          {currentQIndex + 1}/{questions.length}
        </span>
      </div>

      {/* Büyük Soru Kutusu */}
      <div className="qq-main-box neon-box">
        {!currentQ.imagePreview && !currentQ.text && !currentQ.isSelectingType && (
          <button
            className="qq-giant-plus"
            onClick={() => updateCurrentQuestion({ isSelectingType: true })}
          >
            <svg viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        )}

        {currentQ.isSelectingType && !currentQ.imagePreview && !currentQ.text && (
          <div className="qq-selection-options">
            <label className="qq-select-btn neon-box neon-text">
              Resim
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImageUpload}
              />
            </label>
            <button
              className="qq-select-btn neon-box neon-text"
              onClick={() =>
                updateCurrentQuestion({
                  isSelectingType: false,
                  text: " ",
                  isEditingText: true,
                })
              }
            >
              Soruyu Yaz
            </button>
          </div>
        )}

        {(currentQ.imagePreview || currentQ.text) && (
          <div className="qq-filled-content">
            {currentQ.imagePreview && (
              <div className="qq-image-wrapper">
                <img
                  src={currentQ.imagePreview}
                  alt="Soru"
                  className="qq-image"
                />
                <button
                  className="qq-trash-btn"
                  onClick={removeImage}
                  title="Resmi Sil"
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            )}
            {currentQ.text && (
              <div className="qq-text-wrapper">
                {currentQ.isEditingText ? (
                  <>
                    <textarea
                      className="qq-textarea neon-text"
                      placeholder="Sorunuzu buraya yazın..."
                      value={
                        currentQ.text.trim() === "" ? "" : currentQ.text
                      }
                      onChange={(e) =>
                        updateCurrentQuestion({ text: e.target.value })
                      }
                      autoFocus
                    />
                    <button
                      className="qq-ok-btn neon-text"
                      onClick={() =>
                        updateCurrentQuestion({ isEditingText: false })
                      }
                    >
                      OK
                    </button>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        updateCurrentQuestion({ isEditingText: true })
                      }
                      title="Yazıyı düzenlemek için tıklayın"
                    >
                      <span className="neon-text qq-ans-text">
                        {currentQ.text}
                      </span>
                    </div>
                    <button
                      className="qq-trash-btn"
                      onClick={removeText}
                      title="Soruyu Sil"
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            )}
            {!(currentQ.imagePreview && currentQ.text) &&
              !currentQ.isEditingText && (
                <div className="qq-add-more-overlay">
                  {!currentQ.imagePreview ? (
                    <label className="qq-overlay-btn neon-box neon-text">
                      + Resim Ekle
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleImageUpload}
                      />
                    </label>
                  ) : (
                    <button
                      className="qq-overlay-btn neon-box neon-text"
                      onClick={() =>
                        updateCurrentQuestion({ text: " ", isEditingText: true })
                      }
                    >
                      + Yazı Ekle
                    </button>
                  )}
                </div>
              )}
          </div>
        )}
      </div>

      {/* Orta Bölüm */}
      <div className="qq-middle-section">
        <button
          className="qq-side-arrow neon-box"
          onClick={() => setCurrentQIndex(currentQIndex - 1)}
          style={{ visibility: currentQIndex > 0 ? "visible" : "hidden" }}
        >
          <svg className="nav-icon-svg" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="qq-answers-grid">
          {currentQ.answers.map((ans) => (
            <div key={ans.id} className="qq-answer-box neon-box">
              {!ans.text && !ans.isEditing && (
                <button
                  className="qq-giant-plus"
                  onClick={() => toggleAnswerEdit(ans.id, true)}
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              )}
              {ans.isEditing && (
                <div className="qq-answer-edit-mode">
                  <textarea
                    className="qq-answer-input neon-text"
                    value={ans.text}
                    onChange={(e) => handleAnswerChange(ans.id, e.target.value)}
                    autoFocus
                  />
                  <button
                    className="qq-ok-btn neon-text"
                    onClick={() => toggleAnswerEdit(ans.id, false)}
                  >
                    OK
                  </button>
                </div>
              )}
              {ans.text && !ans.isEditing && (
                <div className="qq-answer-filled">
                  <span className="neon-text qq-ans-text">{ans.text}</span>
                  {currentQ.correctAnswerId === ans.id && (
                    <div className="qq-correct-badge">DOĞRU CEVAP</div>
                  )}
                  <button
                    className="qq-trash-btn"
                    onClick={() => removeAnswer(ans.id)}
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                  <div
                    className="qq-correct-overlay"
                    onClick={() =>
                      updateCurrentQuestion({ correctAnswerId: ans.id })
                    }
                  >
                    <span
                      className="neon-text"
                      style={{ fontSize: "1.5rem", fontWeight: "bold" }}
                    >
                      Doğru Cevap Olarak Ayarla
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          className="qq-side-arrow neon-box"
          onClick={() => setCurrentQIndex(currentQIndex + 1)}
          style={{
            visibility:
              currentQIndex < questions.length - 1 ? "visible" : "hidden",
          }}
        >
          <svg className="nav-icon-svg" viewBox="0 0 24 24">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Alt Butonlar */}
      <div className="qq-bottom-buttons">
        <button className="qq-bottom-btn neon-box" onClick={finishQuiz}>
          <span className="neon-text">Quizi Tamamla</span>
        </button>
        <button className="qq-bottom-btn neon-box" onClick={addNewPage}>
          <span className="neon-text" style={{ textDecoration: "underline" }}>
            Yeni Sayfa
          </span>
        </button>
      </div>
    </div>
  );
}