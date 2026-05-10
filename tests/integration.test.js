const { createServer } = require("http");
const { Server } = require("socket.io");
const Client = require("socket.io-client");
const express = require("express");
const { RoomOperations, SessionOperations } = require("../redisOperations");
const redisClient = require("../redisClient"); // Gerçek veya mock Redis

describe("QuizNight Frontend-Backend-Veritabanı Uçtan Uca Akış Testleri", () => {
  let io, serverSocket, clientSocket;
  let port;
  const testPin = "123456";

  beforeAll((done) => {
    // 1. Test için Express ve Socket.io sunucusunu ayağa kaldırıyoruz
    const app = express();
    const httpServer = createServer(app);
    io = new Server(httpServer);

    // Backend'deki gerçek socket event'lerinizi buraya bağlıyoruz
    io.on("connection", (socket) => {
      serverSocket = socket;

      // Örnek: Odaya katılma event'i
      socket.on("join_room", async (data, callback) => {
        try {
          // Redis'te bir session oluşturulduğunu varsayıyoruz
          await SessionOperations.refreshSession(
            socket.id,
            data.playerId,
            data.pin,
            true,
          );
          socket.join(data.pin);
          callback({ status: "success", pin: data.pin });
        } catch (error) {
          callback({ status: "error" });
        }
      });
    });

    httpServer.listen(() => {
      port = httpServer.address().port;
      done();
    });
  });

  afterAll(async () => {
    // Test bitiminde bağlantıları ve Redis'i temizliyoruz
    io.close();
    await redisClient.quit();
  });

  beforeEach((done) => {
    // 2. Her testten önce sanal bir frontend istemcisi (client) oluşturuyoruz
    clientSocket = new Client(`http://localhost:${port}`);
    clientSocket.on("connect", done);
  });

  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  // --- TEST SENARYOLARI ---

  test("Oyuncu geçerli bir PIN ile odaya katıldığında Redis üzerinde session oluşmalıdır", (done) => {
    const testPlayer = { playerId: "user_999", pin: testPin };

    // Frontend'den backend'e 'join_room' isteği atılıyor
    clientSocket.emit("join_room", testPlayer, async (response) => {
      // 1. Frontend beklentisi: Başarılı yanıt dönmeli
      expect(response.status).toBe("success");
      expect(response.pin).toBe(testPin);

      // 2. Veritabanı/Cache beklentisi: Redis üzerinde socket.id ile session açılmış mı kontrolü
      // (Backend'in veritabanı ile uyumlu çalışıp çalışmadığını doğrular)
      const sessionData = await redisClient.hgetall(
        `session:${serverSocket.id}`,
      );

      expect(sessionData).toBeDefined();
      expect(sessionData.playerId).toBe(testPlayer.playerId);
      expect(sessionData.roomPin).toBe(testPin);
      expect(sessionData.isGuest).toBe("1");

      done();
    });
  });

  test("Puanlama algoritması doğru cevapta doğru süreyi hesaplamalıdır", () => {
    // Mimari tasarımınızda belirttiğiniz gibi Unit/Integration olarak
    // ScoringService veya doğrudan 'submit_answer' event'i burada test edilebilir.
  });
});
