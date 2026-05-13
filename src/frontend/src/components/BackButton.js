import React from "react";

// BackButton Bileşeni: Uygulama içindeki görünümler (view) arasında geriye doğru gezinmeyi sağlar.
// currentView: Kullanıcının şu anda bulunduğu aktif ekranın adını tutar.
// setCurrentView: Ekranı değiştirmek (state'i güncellemek) için kullanılan fonksiyondur.
export default function BackButton({ currentView, setCurrentView }) {
  
  // 1. KONTROL: Geri butonunun gizleneceği ekranlar.
  // Kullanıcı zaten ana sayfalardan birindeyse (Ana Menü, Ayarlar, Dashboard veya Oyun İçi), 
  // geriye gidecek bir yer olmadığı için buton render edilmez (null döner).
  if (
    currentView === "mainMenu" ||
    currentView === "settings" ||
    currentView === "dashboard" ||
    currentView === "playingQuiz"
  ) {
    return null;
  }

  // 2. YÖNLENDİRME MANTIĞI: Butona tıklandığında çalışacak fonksiyon.
  // Kullanıcının bulunduğu mevcut ekrana göre, onu bir önceki mantıksal ekrana yönlendirir.
  const handleBack = () => {
    if (currentView === "loginForm" || currentView === "registerForm") {
      // Giriş yap veya Kayıt ol ekranından -> Yetkilendirme (Auth) menüsüne dön.
      setCurrentView("authMenu");
      
    } else if (
      currentView === "createQuizSettings" ||
      currentView === "createQuizQuestions"
    ) {
      // Quiz oluşturma adımlarından (ayarlar veya sorular) -> Dashboard'a dön.
      setCurrentView("dashboard");
      
    } else if (currentView === "joinQuizMenu") {
      // Quiz'e katılma menüsünden -> Ana menüye dön.
      setCurrentView("mainMenu");
      
    } else if (currentView === "quizSelect") {
      // Listedeki quizleri seçme ekranından -> Katılma menüsüne dön.
      setCurrentView("joinQuizMenu");
      
    } else if (currentView === "quizPinDetails") {
      // Bir quizin PIN kodunu görme/paylaşma ekranından -> Quiz seçim ekranına dön.
      setCurrentView("quizSelect");
      
    } else if (currentView === "enterPin") {
      // Oyuncunun PIN girdiği ekrandan -> Katılma menüsüne dön.
      setCurrentView("joinQuizMenu");
      
    } else if (currentView === "waitingRoom") {
      // Bekleme odasından çıkmak istenirse -> Doğrudan ana menüye dön.
      setCurrentView("mainMenu");
      
    } else {
      // Olası bir hata durumunda veya tanımlanmamış bir ekranda kalındıysa,
      // güvenlik ve kolaylık için varsayılan olarak ana menüye (mainMenu) gönder.
      setCurrentView("mainMenu");
    }
  };

  // 3. EKRANA ÇİZİM (RENDER):
  // Yukarıdaki gizleme şartlarına takılmayan ekranlar için ekrana bir buton çizilir.
  return (
    <button className="back-navigation-button" onClick={handleBack}>
      {/* Sol tarafı işaret eden geri ok ikonu (SVG formatında) */}
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