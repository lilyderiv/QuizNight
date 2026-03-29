###Her üye kendi uzmanlık alanındaki görevlerden sorumludur:###
Kübra DERELİ (Proje Yöneticisi): Proje sınırlarının belirlenmesi, CI/CD süreçleri, GitHub Workflow yönetimi ve güvenlik/lint kontrolleri.
Hilal ÇAKIROĞLU (Front-end): Minimalist UI/UX tasarımı, responsive geliştirme ve kullanıcı testleri.
Efe Can ÖZDEMİR (Back-end): Veri tabanı mimarisi, Socket.io ile real-time iletişim altyapısı ve API dökümantasyonu.

###Branch (Dal) Stratejisi###
Repo üzerinde doğrudan Prod veya Dev dallarına işlem yapmak yerine şu hiyerarşiyi izleyeceğiz:

Prod: Sadece en kararlı, bitmiş sürüm.
Dev: Ana geliştirme dalı.
feat/ veya fix/: Herkesin kendi özelliği için açacağı kısa ömürlü dallar.

###Yeni Bir Özellik Eklerken İzlenecek Adımlar:###
Not: Projede herhangi bir ekleme veya çıkartma yapmadan önce kendi localinize mutlaka en güncel sürümü çekmeyi unutmayın!

Dalınızı oluşturun: git checkout Dev -> git pull -> git checkout -b feat/gorev-adi
Kodunuzu yazın: Sadece kendi alanınızda (Backend/Frontend) değişiklik yapın.
Gönderin: git push origin feat/gorev-adi
Pull Request (PR) Açın: GitHub üzerinden kodunuzu Dev dalına çekmek için PR oluşturun.
