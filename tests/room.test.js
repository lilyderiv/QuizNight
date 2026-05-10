const { createServer } = require("http");
const { Server } = require("socket.io");
const Client = require("socket.io-client");
const { RoomOperations } = require("../redisOperations");
const redisClient = require("../redisClient");

describe("Oda Yönetimi E2E Testleri", () => {
  let io, serverSocket, clientSocket, port;

  beforeAll((done) => {
    const httpServer = createServer();
    io = new Server(httpServer);
    io.on("connection", (socket) => {
      // roomManager.js'deki ilgili fonksiyonların mock bağlantısı
      socket.on("create_room", async (data, callback) => {
        await RoomOperations.createRoom(
          data.pin,
          data.hostId,
          data.quizId,
          data.sessionId,
          data.totalQuestions,
        );
        callback({ status: "success" });
      });
    });
    httpServer.listen(() => {
      port = httpServer.address().port;
      done();
    });
  });

  afterAll(async () => {
    io.close();
    await redisClient.quit();
  });

  beforeEach((done) => {
    clientSocket = new Client(`http://localhost:${port}`);
    clientSocket.on("connect", done);
  });

  afterEach(() => {
    clientSocket.disconnect();
  });

  test("Host yeni bir oda oluşturduğunda Redis'e doğru veriler yazılmalıdır", (done) => {
    const testData = {
      pin: "123456",
      hostId: "host_1",
      quizId: 1,
      sessionId: 10,
      totalQuestions: 5,
    };

    clientSocket.emit("create_room", testData, async (response) => {
      expect(response.status).toBe("success");
      const roomData = await redisClient.hgetall(`room:${testData.pin}`);
      expect(roomData.status).toBe("waiting");
      expect(roomData.hostId).toBe(testData.hostId);
      done();
    });
  });
});
