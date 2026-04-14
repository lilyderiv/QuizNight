const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Birisi bağlandığında konsola yaz
io.on('connection', (socket) => {
  console.log('kullanıcı bağlandı ID:', socket.id);
});

// Sunucuyu tek bir yerden çalıştır
server.listen(3000, () => {
  console.log('--- sunucu aktif ---');
  console.log('Adres: http://localhost:3000');
});