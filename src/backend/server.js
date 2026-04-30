const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
// Gelen verileri okumak için (Middleware)
app.use(express.json());

// Puan hesaplama işlemi
const calculateScore = (timeLeft, isCorrect) => {
    if (!isCorrect) return 0;
    const baseScore = 100;
    const speedBonus = timeLeft * 10;
    return baseScore + speedBonus;
};

// Oda Kurma API'si (Phase 1)
app.post('/api/rooms/create', (req, res) => {
    // 6 haneli rastgele PIN üretimi
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`Yeni oda PIN kodu: ${newPin}`);
    res.json({ success: true, pin: newPin });
});

io.on('connection', (socket) => {
    console.log('Yeni bir kullanıcı bağlandı:', socket.id);

    // Kullanıcı odaya girmek istediğinde çalışır
    socket.on('join_room', (data) => {
        const { pin, nickname } = data; // Gelen PIN ve rumuz bilgisi
        
        socket.join(pin); // Kullanıcıyı PIN numaralı odaya sokar
        
        // Odadaki herkese yeni birinin geldiğini haber verir
        io.to(pin).emit('player_joined', { 
            nickname: nickname 
        });
        
        console.log(`${nickname}, ${pin} odasına girdi.`);
    });

    // Cevap gönderildiğinde puan hesaplar
    socket.on('submit_answer', (data) => {
        const { pin, answer, timeLeft } = data;
        
        // Yanıt kontrolü ve puan hesaplaması
        const isCorrect = (answer === "doğru_cevap"); 
        const score = calculateScore(timeLeft, isCorrect);
        
        // Hesaplanan puanı kullanıcıya iletir
        socket.emit('score_update', { score: score });
    });
});

server.listen(3000, () => {
    console.log('Sunucu 3000 portunda çalışıyor.');
});