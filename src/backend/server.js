const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

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