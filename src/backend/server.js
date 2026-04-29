const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
// Gelen verileri okumak için (Middleware)
app.use(express.json());

// Oda Kurma API'si (Phase 1)
app.post('/api/rooms/create', (req, res) => {
    // 6 haneli rastgele PIN üretimi [cite: 156]
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`Yeni oda PIN kodu: ${newPin}`);
    res.json({ success: true, pin: newPin });
});

io.on('connection', (socket) => {
    console.log('Yeni bir kullanıcı bağlandı:', socket.id);

    // Kullanıcı odaya girmek istediğinde çalışır
    socket.on('join_room', (data) => {
        const { pin, nickname } = data; // Gelen PIN ve rumuz bilgisi [cite: 302]
        
        socket.join(pin); // Kullanıcıyı PIN numaralı odaya sokar [cite: 282]
        
        // Odadaki herkese yeni birinin geldiğini haber verir [cite: 81, 283]
        io.to(pin).emit('player_joined', { 
            nickname: nickname 
        });
        
        console.log(`${nickname}, ${pin} odasına girdi.`);
    });
});

server.listen(3000, () => {
    console.log('Sunucu 3000 portunda çalışıyor.');
});