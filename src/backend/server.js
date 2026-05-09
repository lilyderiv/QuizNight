const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
// Gelen verileri okumak için (Middleware)
app.use(express.json());

// Odaları ve oyuncu verilerini tutan obje
const rooms = {};

// Geçici soru havuzu
const mockQuestions = [
    { id: 1, text: "Türkiye'nin başkenti neresidir?", options: ["İstanbul", "Ankara", "İzmir", "Bursa"], answer: "Ankara" },
    { id: 2, text: "Yazılım Mühendisliği hangi fakültededir?", options: ["İİBF", "Edebiyat", "Mühendislik", "Tıp"], answer: "Mühendislik" }
];

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
    
    // Oda verilerini ilklendirir
    rooms[newPin] = { players: {}, currentQuestion: 0 };
    
    console.log(`Yeni oda PIN kodu: ${newPin}`);
    res.json({ success: true, pin: newPin });
});

io.on('connection', (socket) => {
    console.log('Yeni bir kullanıcı bağlandı:', socket.id);

    // Kullanıcı odaya girmek istediğinde çalışır
    socket.on('join_room', (data) => {
        const { pin, nickname } = data; // Gelen PIN ve rumuz bilgisi
        
        if (rooms[pin]) {
            socket.join(pin); // Kullanıcıyı PIN numaralı odaya sokar
            
            // Oyuncuyu oda listesine ekler
            rooms[pin].players[socket.id] = { nickname, score: 0 };
            
            // Odadaki herkese yeni birinin geldiğini haber verir
            io.to(pin).emit('player_joined', { 
                nickname: nickname,
                players: Object.values(rooms[pin].players)
            });
            
            console.log(`${nickname}, ${pin} odasına girdi.`);
        }
    });

    // Oyunu başlatır ve soru döngüsünü yönetir
    socket.on('start_game', (data) => {
        const { pin } = data;
        if (rooms[pin]) {
            sendNextQuestion(pin);
        }
    });

    // Belirli aralıklarla yeni soruyu gönderir
    const sendNextQuestion = (pin) => {
        const room = rooms[pin];
        if (room && room.currentQuestion < mockQuestions.length) {
            const question = mockQuestions[room.currentQuestion];
            
            // Soru bilgilerini odaya iletir
            io.to(pin).emit('next_question', {
                id: question.id,
                text: question.text,
                options: question.options,
                duration: 15
            });

            // 15 saniye sonra bir sonraki soruya geçer
            setTimeout(() => {
                room.currentQuestion++;
                sendNextQuestion(pin);
            }, 15000);
        } else if (room) {
            // Oyun bittiğinde liderlik tablosunu iletir
            const leaderboard = Object.values(room.players).sort((a, b) => b.score - a.score);
            io.to(pin).emit('game_over', { leaderboard });
            delete rooms[pin]; // Belleği temizler
        }
    };

    // Cevap gönderildiğinde puan hesaplar
    socket.on('submit_answer', (data) => {
        const { pin, answer, timeLeft, questionId } = data;
        const room = rooms[pin];
        const question = mockQuestions.find(q => q.id === questionId);
        
        // Yanıt kontrolü ve puan hesaplaması
        if (room && room.players[socket.id] && question) {
            const isCorrect = (answer === question.answer); 
            const points = calculateScore(timeLeft, isCorrect);
            
            // Oyuncunun toplam puanını günceller
            room.players[socket.id].score += points;
            
            // Hesaplanan puanı kullanıcıya iletir
            socket.emit('score_update', { 
                score: room.players[socket.id].score,
                isCorrect: isCorrect 
            });
        }
    });
});

server.listen(3000, () => {
    console.log('Sunucu 3000 portunda çalışıyor.');
});