import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  // --- 1. STATE'LER (HAFIZA) ---
  const [currentView, setCurrentView] = useState('mainMenu');
  const [previousView, setPreviousView] = useState('mainMenu');
  
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [soundVolume, setSoundVolume] = useState(50);
  const [musicVolume, setMusicVolume] = useState(50);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);

  const carouselRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [quizzes, setQuizzes] = useState([]);

  // Yeni Quiz Oluşturma Sayfası State'leri
  const [quizForm, setQuizForm] = useState({
    name: '',
    category: '',
    pin: '',
    min: '',
    sec: '',
    level: '' 
  });


  // --- YENİ: SORU EDİTÖRÜ STATE'LERİ ---
  const [questions, setQuestions] = useState([
    {
      id: 1,
      text: '',
      imagePreview: null,
      isSelectingType: false, 
      answers: [
        { id: 1, text: '', isEditing: false },
        { id: 2, text: '', isEditing: false },
        { id: 3, text: '', isEditing: false },
        { id: 4, text: '', isEditing: false }
      ],
      correctAnswerId: null
    }
  ]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const currentQ = questions[currentQIndex]; // Aktif soruyu tutar


  // --- 2. FONKSİYONLAR ---

  // Bu fonksiyon sayfayı açarken hem eski bilgileri SIFIRLAR hem de otomatik eşsiz PIN üretir
  const openCreateQuiz = () => {
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString(); 
    setQuizForm({
      name: '', category: '', pin: randomPin, min: '0', sec: '30', level: '' 
    });
    // Soru listesini de sıfırdan başlatıyoruz ki eski sorular gelmesin
    setQuestions([{ id: 1, text: '', imagePreview: null, isSelectingType: false, answers: [{id: 1, text: '', isEditing: false}, {id: 2, text: '', isEditing: false}, {id: 3, text: '', isEditing: false}, {id: 4, text: '', isEditing: false}], correctAnswerId: null }]);
    setCurrentQIndex(0);
    setCurrentView('createQuizSettings');
  };

  const handleRegisterClick = () => {
    setQuizzes([]); // Kayıt olan kişi TERTEMİZ boş bir sayfa görür
    setCurrentView('dashboard');
  };

  const handleLoginClick = () => {
    // Giriş yapan kişi eski quizlerini görür
    setQuizzes([
      { id: 1, name: "A2 İngilizce Kelimeler" },
      { id: 2, name: "Genel Kültür 1" },
      { id: 3, name: "Eser-Yazar Eşleşmeleri" },
      { id: 4, name: "Dört İşlem" },
      { id: 5, name: "Organik Kimya" },
      { id: 6, name: "Şarkı sözleri" }
    ]);
    setCurrentView('dashboard');
  };

  const checkArrows = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(Math.ceil(scrollLeft) < scrollWidth - clientWidth - 5); 
    }
  };

  useEffect(() => {
    checkArrows();
    window.addEventListener('resize', checkArrows);
    return () => window.removeEventListener('resize', checkArrows);
  }, [quizzes, currentView]);

  const scrollCarousel = (dir) => {
    if (carouselRef.current) {
      const scrollAmount = 436; 
      carouselRef.current.scrollBy({ left: dir === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  // --- SORU EDİTÖRÜ FONKSİYONLARI ---
  const updateCurrentQuestion = (updates) => {
    const updatedQs = [...questions];
    updatedQs[currentQIndex] = { ...updatedQs[currentQIndex], ...updates };
    setQuestions(updatedQs);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      updateCurrentQuestion({ imagePreview: previewUrl, isSelectingType: false });
    }
  };

  const removeImage = () => {
    if (window.confirm("Resmi silmek istediğinize emin misiniz?")) updateCurrentQuestion({ imagePreview: null });
  };

  const removeText = () => {
    if (window.confirm("Soruyu silmek istediğinize emin misiniz?")) updateCurrentQuestion({ text: '' });
  };

  const handleAnswerChange = (ansId, newText) => {
    const newAnswers = currentQ.answers.map(a => a.id === ansId ? { ...a, text: newText } : a);
    updateCurrentQuestion({ answers: newAnswers });
  };

  const toggleAnswerEdit = (ansId, editingState) => {
    const newAnswers = currentQ.answers.map(a => a.id === ansId ? { ...a, isEditing: editingState } : a);
    updateCurrentQuestion({ answers: newAnswers });
  };

  const removeAnswer = (ansId) => {
    if (window.confirm("Bu seçeneği silmek istediğinize emin misiniz?")) {
      const newAnswers = currentQ.answers.map(a => a.id === ansId ? { ...a, text: '', isEditing: false } : a);
      updateCurrentQuestion({ answers: newAnswers, correctAnswerId: currentQ.correctAnswerId === ansId ? null : currentQ.correctAnswerId });
    }
  };

  const addNewPage = () => {
    setQuestions([...questions, { id: questions.length + 1, text: '', imagePreview: null, isSelectingType: false, answers: [{id: 1, text: '', isEditing: false}, {id: 2, text: '', isEditing: false}, {id: 3, text: '', isEditing: false}, {id: 4, text: '', isEditing: false}], correctAnswerId: null }]);
    setCurrentQIndex(questions.length);
  };

  const finishQuiz = () => {
    setQuizzes([...quizzes, { id: Date.now(), name: quizForm.name || 'İsimsiz Quiz' }]);
    setCurrentView('dashboard');
  };

  const openSettings = () => {
    if (currentView !== 'settings') {
      setPreviousView(currentView);
      setCurrentView('settings');
    }
  };

  const goBack = () => {
    // Soru editöründen çıkarsa da dashboarda dönmeli
    if (currentView === 'createQuizSettings' || currentView === 'createQuizQuestions') {
      setCurrentView('dashboard'); 
    } else {
      setCurrentView(previousView);
    }
  };

  return (
    <div className="app-container">

      {/* --- DASHBOARD: ÜST PANEL (Profil ve İsim) --- */}
      {currentView === 'dashboard' && (
        <>
          <div style={{ position: 'absolute', top: '15px', left: '75px', zIndex: 130 }}>
            <button className="dash-profile-btn" onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
              <svg className="nav-icon-svg" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </button>
            {isProfileMenuOpen && (
              <div className="dash-dropdown neon-box">
                <button className="dash-logout" onClick={() => { setIsProfileMenuOpen(false); setCurrentView('mainMenu'); }}>Çıkış Yap</button>
              </div>
            )}
          </div>
          <div className="dash-username neon-box">
            <span className="neon-text" title="Hilal Çakıroğlu">Hilal Çakıroğlu</span>
          </div>
        </>
      )}

      {/* --- EVRENSEL BUTONLAR (Geri ve Ayarlar) --- */}
      {currentView !== 'mainMenu' && currentView !== 'settings' && currentView !== 'dashboard' && (
        <button className="back-navigation-button" onClick={() => {
          if (currentView === 'loginForm' || currentView === 'registerForm') setCurrentView('authMenu');
          else if (currentView === 'createQuizSettings') setCurrentView('dashboard');
          else setCurrentView('mainMenu');
        }}>
          <svg className="nav-icon-svg" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
      )}

      {currentView !== 'settings' && (
        <button className="settings-button" onClick={openSettings} style={{ left: (currentView === 'mainMenu' || currentView === 'dashboard') ? '15px' : '75px' }}>
          <svg className="nav-icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
        </button>
      )}

      {/* KESİR (Sadece Sorular Ekranında Sağ Üstte Görünür) */}
      {currentView === 'createQuizQuestions' && (
        <div className="qq-fraction neon-box" style={{ position: 'absolute', top: '15px', right: '25px', width: 'clamp(80px, 10vw, 165px)', height: '50px', zIndex: 130 }}>
          <span className="neon-text" style={{ fontSize: '2rem' }}>{currentQIndex + 1}/{questions.length}</span>
        </div>
      )}

      {/* --- ANA MENÜ --- */}
      {currentView === 'mainMenu' && (
        <>
          <div className="title-box neon-box"><h1 className="title-text neon-text">HOŞ GELDİN!</h1></div>
          <div className="characters-container"></div>
          <div className="subtitle-box neon-box"><h2 className="subtitle-text neon-text">Ne yapmak istediğine karar ver...</h2></div>
          <div className="button-container">
            <button className="action-button neon-box"><span className="neon-text">QUİZE</span><span className="neon-text">GİR</span></button>
            <button className="action-button neon-box" onClick={() => setCurrentView('authMenu')}><span className="neon-text">QUİZ</span><span className="neon-text">OLUŞTUR</span></button>
          </div>
        </>
      )}

      {/* --- KAYIT OL / GİRİŞ YAP SEÇİM --- */}
      {currentView === 'authMenu' && (
        <div className="auth-page-container">
          <button className="auth-button neon-box" onClick={() => setCurrentView('registerForm')}><span className="neon-text">Kayıt ol</span></button>
          <button className="auth-button neon-box" onClick={() => setCurrentView('loginForm')}><span className="neon-text">Giriş Yap</span></button>
        </div>
      )}

      {/* --- KAYIT FORMU --- */}
      {currentView === 'registerForm' && (
        <div className="register-page-container">
          <div className="form-row"><div className="form-label neon-box"><span className="neon-text">Ad Soyad</span></div><input type="text" className="neon-input neon-text" autoComplete="off" /></div>
          <div className="form-row"><div className="form-label neon-box"><span className="neon-text">e-mail</span></div><input type="email" className="neon-input neon-text" autoComplete="off" /></div>
          <div className="form-row"><div className="form-label neon-box"><span className="neon-text">şifre</span></div><input type="password" placeholder="**********" className="neon-input neon-text" autoComplete="new-password" /></div>
          <button className="auth-button neon-box submit-button" onClick={handleRegisterClick}><span className="neon-text">Kaydı onayla</span></button>
        </div>
      )}

      {/* --- GİRİŞ FORMU --- */}
      {currentView === 'loginForm' && (
        <div className="login-page-container">
          <div className="login-form-row"><div className="login-label neon-box"><span className="neon-text">e-mail</span></div><input type="email" className="login-input neon-text" autoComplete="off" /></div>
          <div className="login-form-row"><div className="login-label neon-box"><span className="neon-text">şifre</span></div><input type="password" placeholder="**********" className="login-input neon-text" autoComplete="new-password" /></div>
          <button className="login-submit-button neon-box" onClick={handleLoginClick}><span className="neon-text">Giriş Yap</span></button>
        </div>
      )}

      {/* --- DASHBOARD EKRANI --- */}
      {currentView === 'dashboard' && (
        <div className="dash-container">
          <div className="dash-title neon-box"><span className="neon-text">Quizlerin</span></div>
          
          {quizzes.length === 0 ? (
            <div className="dash-empty neon-box"><span className="neon-text">Henüz bir quiz oluşturmadın...</span></div>
          ) : (
            <div className="dash-carousel">
              {showLeftArrow && <button className="dash-arrow neon-box" onClick={() => scrollCarousel('left')}><svg className="nav-icon-svg" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg></button>}
              
              <div className="dash-scroll-area" ref={carouselRef} onScroll={checkArrows}>
                {quizzes.map(q => (
                  <button key={q.id} className="dash-quiz-card neon-box" title={q.name}>
                    <span className="neon-text">{q.name}</span>
                  </button>
                ))}
              </div>

              {showRightArrow && <button className="dash-arrow neon-box" onClick={() => scrollCarousel('right')}><svg className="nav-icon-svg" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg></button>}
            </div>
          )}

          {/* İŞTE BURAYA EKLENDİ: onClick={openCreateQuiz} */}
          <button className="dash-new-btn neon-box" onClick={openCreateQuiz}>
            <span className="neon-text">Yeni Quiz oluştur</span>
          </button>
        </div>
      )}

      {/* --- YENİ QUİZ OLUŞTURMA (AYARLAR) EKRANI --- */}
      {currentView === 'createQuizSettings' && (
        <div className="cq-container">
          
          {/* Kullanıcı Adı */}
          <div className="cq-username neon-box">
            <span className="neon-text" title="Hilal Çakıroğlu">Hilal Çakıroğlu</span>
          </div>

          <div className="cq-form-area">
            {/* 1. Quiz İsmi */}
            <div className="cq-row">
              <div className="cq-label neon-box"><span className="neon-text">Quizin İsmi</span></div>
              <input type="text" className="cq-input neon-text" value={quizForm.name} onChange={e => setQuizForm({...quizForm, name: e.target.value})} />
            </div>

            {/* 2. Kategori */}
            <div className="cq-row">
              <div className="cq-label neon-box"><span className="neon-text">Kategori</span></div>
              <input type="text" className="cq-input neon-text" value={quizForm.category} onChange={e => setQuizForm({...quizForm, category: e.target.value})} />
            </div>

            {/* 3. Quizin Pini */}
            <div className="cq-row">
              <div className="cq-label neon-box"><span className="neon-text">Quizin Pini</span></div>
              <div className="cq-input neon-text cq-pin-display">{quizForm.pin}</div>
            </div>

            {/* 4. Süre */}
            <div className="cq-row">
              <div className="cq-label neon-box"><span className="neon-text" style={{whiteSpace: 'pre-wrap'}}>Soru Başına Geçecek Süre</span></div>
              <div className="cq-time-container">
                <div className="cq-select-box neon-box">
                  <select className="cq-select neon-text" value={quizForm.min} onChange={e => setQuizForm({...quizForm, min: e.target.value})}>
                    <option value="" disabled hidden></option>
                    {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <span className="cq-suffix neon-text">dk</span>
                </div>
                <div className="cq-select-box neon-box">
                  <select className="cq-select neon-text" value={quizForm.sec} onChange={e => setQuizForm({...quizForm, sec: e.target.value})}>
                    <option value="" disabled hidden></option>
                    {Array.from({length: 59}, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <span className="cq-suffix neon-text">sn</span>
                </div>
              </div>
            </div>

            {/* 5. Seviye ve Butonlar */}
            <div className="cq-level-section">
              <div className="cq-level-title-row">
                <div className="cq-level-title neon-box"><span className="neon-text">Seviye</span></div>
                <button className="cq-next-btn neon-box" onClick={() => setCurrentView('createQuizQuestions')}>
                  <svg className="nav-icon-svg" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>
              
              <div className="cq-level-buttons">
                <button className={`cq-level-btn neon-box ${quizForm.level && quizForm.level !== 'Kolay' ? 'dimmed' : ''}`} onClick={() => setQuizForm({...quizForm, level: 'Kolay'})}>
                  <span className="neon-text">Kolay</span>
                </button>
                <button className={`cq-level-btn neon-box ${quizForm.level && quizForm.level !== 'Orta' ? 'dimmed' : ''}`} onClick={() => setQuizForm({...quizForm, level: 'Orta'})}>
                  <span className="neon-text">Orta</span>
                </button>
                <button className={`cq-level-btn neon-box ${quizForm.level && quizForm.level !== 'Zor' ? 'dimmed' : ''}`} onClick={() => setQuizForm({...quizForm, level: 'Zor'})}>
                  <span className="neon-text">Zor</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* --- EFSANE SAYFA: SORU EDİTÖRÜ --- */}
      {currentView === 'createQuizQuestions' && currentQ && (
        <div className="qq-container">
          
          {/* BÜYÜK SORU KUTUSU */}
          <div className="qq-main-box neon-box">
            
            {/* DURUM 1: BOMBOŞ */}
            {!currentQ.imagePreview && !currentQ.text && !currentQ.isSelectingType && (
              <button className="qq-giant-plus" onClick={() => updateCurrentQuestion({ isSelectingType: true })}>
                <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
              </button>
            )}

            {/* DURUM 2: SEÇİM AŞAMASI (Resim veya Yazı) */}
            {currentQ.isSelectingType && !currentQ.imagePreview && !currentQ.text && (
              <div className="qq-selection-options">
                <label className="qq-select-btn neon-box neon-text">
                  Resim
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                </label>
                <button className="qq-select-btn neon-box neon-text" onClick={() => updateCurrentQuestion({ isSelectingType: false, text: ' ' })}>
                  Soruyu Yaz
                </button>
              </div>
            )}

            {/* DURUM 3: İÇİ DOLU (Resim, Yazı veya İkisi) */}
            {(currentQ.imagePreview || currentQ.text) && (
              <div className="qq-filled-content">
                
                {currentQ.imagePreview && (
                  <div className="qq-image-wrapper">
                    <img src={currentQ.imagePreview} alt="Soru" className="qq-image" />
                    <button className="qq-trash-btn" onClick={removeImage} title="Resmi Sil">
                      <svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                )}

                {currentQ.text && (
                  <div className="qq-text-wrapper">
                    <textarea 
                      className="qq-textarea neon-text" 
                      placeholder="Sorunuzu buraya yazın..."
                      value={currentQ.text.trim() === '' ? '' : currentQ.text} 
                      onChange={(e) => updateCurrentQuestion({ text: e.target.value })}
                      autoFocus
                    />
                    <button className="qq-trash-btn" onClick={removeText} title="Soruyu Sil">
                      <svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                )}

                {/* EKSİK OLANI EKLEME OVERLAY'İ */}
                {!(currentQ.imagePreview && currentQ.text) && (
                  <div className="qq-add-more-overlay">
                    {!currentQ.imagePreview ? (
                      <label className="qq-overlay-btn neon-box neon-text">
                        + Resim Ekle
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                      </label>
                    ) : (
                      <button className="qq-overlay-btn neon-box neon-text" onClick={() => updateCurrentQuestion({ text: ' ' })}>
                        + Yazı Ekle
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* OKLAR VE 4 CEVAP KUTUSU ALANI */}
          <div className="qq-middle-section">
            
            {/* Sol Ok */}
            <button className="qq-side-arrow neon-box" onClick={() => setCurrentQIndex(currentQIndex - 1)} style={{ visibility: currentQIndex > 0 ? 'visible' : 'hidden' }}>
              <svg className="nav-icon-svg" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
            </button>

            {/* 4 Seçenek Izgarası */}
            <div className="qq-answers-grid">
              {currentQ.answers.map(ans => (
                <div key={ans.id} className="qq-answer-box neon-box">
                  
                  {/* Henüz Boş */}
                  {!ans.text && !ans.isEditing && (
                    <button className="qq-giant-plus" onClick={() => toggleAnswerEdit(ans.id, true)}>
                      <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                    </button>
                  )}

                  {/* Yazım Modu */}
                  {ans.isEditing && (
                    <div className="qq-answer-edit-mode">
                      <textarea className="qq-answer-input neon-text" value={ans.text} onChange={(e) => handleAnswerChange(ans.id, e.target.value)} autoFocus />
                      <button className="qq-ok-btn neon-text" onClick={() => toggleAnswerEdit(ans.id, false)}>OK</button>
                    </div>
                  )}

                  {/* Dolu Mod */}
                  {ans.text && !ans.isEditing && (
                    <div className="qq-answer-filled">
                      <span className="neon-text qq-ans-text">{ans.text}</span>
                      
                      {currentQ.correctAnswerId === ans.id && (
                        <div className="qq-correct-badge">DOĞRU CEVAP</div>
                      )}

                      <button className="qq-trash-btn" onClick={() => removeAnswer(ans.id)}>
                        <svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>

                      {/* HOVER EFEKTİ */}
                      <div className="qq-correct-overlay" onClick={() => updateCurrentQuestion({ correctAnswerId: ans.id })}>
                        <span className="neon-text" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Doğru Cevap Olarak Ayarla</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Sağ Ok */}
            <button className="qq-side-arrow neon-box" onClick={() => setCurrentQIndex(currentQIndex + 1)} style={{ visibility: currentQIndex < questions.length - 1 ? 'visible' : 'hidden' }}>
              <svg className="nav-icon-svg" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>

          {/* ALT BUTONLAR */}
          <div className="qq-bottom-buttons">
            <button className="qq-bottom-btn neon-box" onClick={finishQuiz}><span className="neon-text">Quizi Tamamla</span></button>
            <button className="qq-bottom-btn neon-box" onClick={addNewPage}>
              <span className="neon-text" style={{textDecoration: 'underline'}}>Yeni Sayfa</span>
            </button>
          </div>

        </div>
      )}

      {/* --- AYARLAR EKRANI --- */}
      {currentView === 'settings' && (
        <div className="settings-page-container">
          <div className="setting-row">
            <button className={`icon-btn neon-box ${isSoundMuted ? 'muted' : ''}`} onClick={() => setIsSoundMuted(!isSoundMuted)}>
              <svg className="neon-svg icon-content" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
            </button>
            <input type="range" className="neon-slider" min="0" max="100" value={isSoundMuted ? 0 : soundVolume} onChange={(e) => { setSoundVolume(e.target.value); if(e.target.value > 0) setIsSoundMuted(false); }} />
          </div>
          <div className="setting-row">
            <button className={`icon-btn neon-box ${isMusicMuted ? 'muted' : ''}`} onClick={() => setIsMusicMuted(!isMusicMuted)}>
              <svg className="neon-svg icon-content" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
            </button>
            <input type="range" className="neon-slider" min="0" max="100" value={isMusicMuted ? 0 : musicVolume} onChange={(e) => { setMusicVolume(e.target.value); if(e.target.value > 0) setIsMusicMuted(false); }} />
          </div>
          <button className="auth-button neon-box back-button" onClick={goBack}><span className="neon-text">Geri Dön</span></button>
        </div>
      )}



    </div>
  );
}

export default App;