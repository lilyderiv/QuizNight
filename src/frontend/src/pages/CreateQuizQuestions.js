import "./CreateQuizQuestions.css";
import React from "react";

// Quiz oluşturma — Soru editörü adımı.
// Her soru için metin veya resim eklenebilir, 4 şık ve doğru cevap belirlenir.
// Sayfalar arası geçiş ve yeni sayfa ekleme de bu ekranda yapılır.
export default function CreateQuizQuestions({
  questions,       // Tüm soruların listesi
  currentQIndex,   // Şu an düzenlenen sorunun index'i
  setCurrentQIndex,
  updateCurrentQuestion, // Mevcut soruyu güncelleyen fonksiyon (App.js'de tanımlı)
  handleImageUpload,     // Resim yükleme fonksiyonu
  handleAnswerChange,    // Şık metni değiştirme fonksiyonu
  toggleAnswerEdit,      // Şık düzenleme modunu aç/kapat
  removeAnswer,          // Şık silme fonksiyonu
  addNewPage,            // Yeni soru sayfası ekleme fonksiyonu
  finishQuiz,            // Quizi tamamlayıp dashboard'a dönme fonksiyonu
  playClick,
}) {
  // Şu an düzenlenen soruyu kolayca erişmek için değişkene atadık
  const currentQ = questions[currentQIndex];

  // Resim silme: onay aldıktan sonra imagePreview'ı temizler
  const removeImage = () => {
    playClick();
    if (window.confirm("Resmi silmek istediğinize emin misiniz?"))
      updateCurrentQuestion({ imagePreview: null });
  };

  // Soru metnini silme: onay aldıktan sonra text'i temizler
  const removeText = () => {
    playClick();
    if (window.confirm("Soruyu silmek istediğinize emin misiniz?"))
      updateCurrentQuestion({ text: "" });
  };

  // Geçersiz index durumunda hiçbir şey render etme
  if (!currentQ) return null;

  return (
    <div className="qq-container">

      {/* Sağ üst köşedeki "kaçıncı soru / toplam soru" göstergesi */}
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

      {/* === BÜYÜK SORU KUTUSU === */}
      <div className="qq-main-box neon-box">

        {/* Kutu tamamen boşsa: büyük artı butonu göster */}
        {!currentQ.imagePreview && !currentQ.text && !currentQ.isSelectingType && (
          <button
            className="qq-giant-plus"
            onClick={() => { playClick(); updateCurrentQuestion({ isSelectingType: true }); }}
          >
            <svg viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        )}

        {/* İçerik türü seçimi: Resim mi yoksa metin mi? */}
        {currentQ.isSelectingType && !currentQ.imagePreview && !currentQ.text && (
          <div className="qq-selection-options">
            {/* Resim seçeneği: gizli input ile dosya yüklenir */}
            <label className="qq-select-btn neon-box neon-text" onClick={() => playClick()}>
              Resim
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImageUpload}
              />
            </label>
            {/* Yazı seçeneği: metin editörünü açar */}
            <button
              className="qq-select-btn neon-box neon-text"
              onClick={() => {
              playClick();
              updateCurrentQuestion({
                isSelectingType: false,
                text: " ",
                isEditingText: true,
              });
            }}
            >
              Soruyu Yaz
            </button>
          </div>
        )}

        {/* İçerik varsa (resim ve/veya metin) göster */}
        {(currentQ.imagePreview || currentQ.text) && (
          <div className="qq-filled-content">

            {/* Resim varsa sol tarafta göster */}
            {currentQ.imagePreview && (
              <div className="qq-image-wrapper">
                <img src={currentQ.imagePreview} alt="Soru" className="qq-image" />
                {/* Resim silme butonu (sol alt köşe) */}
                <button className="qq-trash-btn" onClick={removeImage} title="Resmi Sil">
                  <svg viewBox="0 0 24 24">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            )}

            {/* Metin varsa sağ tarafta göster */}
            {currentQ.text && (
              <div className="qq-text-wrapper">
                {/* Düzenleme modunda textarea açılır */}
                {currentQ.isEditingText ? (
                  <>
                    <textarea
                      className="qq-textarea neon-text"
                      placeholder="Sorunuzu buraya yazın..."
                      value={currentQ.text.trim() === "" ? "" : currentQ.text}
                      onChange={(e) => updateCurrentQuestion({ text: e.target.value })}
                      autoFocus
                    />
                    {/* OK butonu: düzenleme modunu kapatır */}
                    <button
                      className="qq-ok-btn neon-text"
                      onClick={() => { playClick(); updateCurrentQuestion({ isEditingText: false }); }}
                    >
                      OK
                    </button>
                  </>
                ) : (
                  <>
                    {/* Metne tıklanınca düzenleme modu açılır */}
                    <div
                      style={{
                        width: "100%", height: "100%",
                        display: "flex", alignItems: "center",
                        justifyContent: "center", cursor: "pointer",
                      }}
                      onClick={() => { playClick(); updateCurrentQuestion({ isEditingText: true }); }}
                      title="Yazıyı düzenlemek için tıklayın"
                    >
                      <span className="neon-text qq-ans-text">{currentQ.text}</span>
                    </div>
                    {/* Metin silme butonu */}
                    <button className="qq-trash-btn" onClick={removeText} title="Soruyu Sil">
                      <svg viewBox="0 0 24 24">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Hover'da görünen "eksik içerik ekle" overlay'i */}
            {!(currentQ.imagePreview && currentQ.text) && !currentQ.isEditingText && (
              <div className="qq-add-more-overlay">
                {!currentQ.imagePreview ? (
                  <label className="qq-overlay-btn neon-box neon-text"  onClick={() => playClick()}>
                    + Resim Ekle
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
                  </label>
                ) : (
                  <button
                    className="qq-overlay-btn neon-box neon-text"
                    onClick={() => { playClick(); updateCurrentQuestion({ text: " ", isEditingText: true }); }}
                  >
                    + Yazı Ekle
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* === ORTA BÖLÜM: Sol Ok + Şıklar + Sağ Ok === */}
      <div className="qq-middle-section">

        {/* Sol ok: önceki soruya git (ilk soruda gizlenir) */}
        <button
          className="qq-side-arrow neon-box"
          onClick={() => { playClick(); setCurrentQIndex(currentQIndex - 1); }}
          style={{ visibility: currentQIndex > 0 ? "visible" : "hidden" }}
        >
          <svg className="nav-icon-svg" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* 4 şıklık 2x2 grid */}
        <div className="qq-answers-grid">
          {currentQ.answers.map((ans) => (
            <div key={ans.id} className="qq-answer-box neon-box">

              {/* Şık boşsa: artı butonu ile ekleme başlatılır */}
              {!ans.text && !ans.isEditing && (
                <button
                  className="qq-giant-plus"
                  onClick={() => { playClick(); toggleAnswerEdit(ans.id, true); }}
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              )}

              {/* Şık düzenleme modundaysa textarea göster */}
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
                    onClick={() => { playClick(); toggleAnswerEdit(ans.id, false); }}
                  >
                    OK
                  </button>
                </div>
              )}

              {/* Şıkta metin varsa göster */}
              {ans.text && !ans.isEditing && (
                <div className="qq-answer-filled">
                  <span className="neon-text qq-ans-text">{ans.text}</span>

                  {/* Doğru cevap seçildiyse yeşil rozet göster */}
                  {currentQ.correctAnswerId === ans.id && (
                    <div className="qq-correct-badge">DOĞRU CEVAP</div>
                  )}

                  {/* Şık silme butonu (sol alt köşe) */}
                  <button className="qq-trash-btn" onClick={() => { playClick(); removeAnswer(ans.id); }}>
                    <svg viewBox="0 0 24 24">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>

                  {/* Hover'da çıkan "Doğru Cevap Olarak Ayarla" overlay'i */}
                  <div
                    className="qq-correct-overlay"
                    onClick={() => { playClick(); updateCurrentQuestion({ correctAnswerId: ans.id }); }}
                  >
                    <span className="neon-text" style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                      Doğru Cevap Olarak Ayarla
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Sağ ok: sonraki soruya git (son soruda gizlenir) */}
        <button
          className="qq-side-arrow neon-box"
          onClick={() => { playClick(); setCurrentQIndex(currentQIndex + 1); }}
          style={{ visibility: currentQIndex < questions.length - 1 ? "visible" : "hidden" }}
        >
          <svg className="nav-icon-svg" viewBox="0 0 24 24">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* === ALT BUTONLAR === */}
      <div className="qq-bottom-buttons">
        {/* Quizi tamamla: dashboard'a döner ve quizi listeye ekler */}
        <button className="qq-bottom-btn neon-box" onClick={() => { playClick(); finishQuiz(); }}>
          <span className="neon-text">Quizi Tamamla</span>
        </button>
        {/* Yeni sayfa: listeye yeni boş bir soru ekler */}
        <button className="qq-bottom-btn neon-box" onClick={() => { playClick(); addNewPage(); }}>
          <span className="neon-text" style={{ textDecoration: "underline" }}>
            Yeni Sayfa                         
          </span>
        </button>
      </div>
    </div>
  );
}