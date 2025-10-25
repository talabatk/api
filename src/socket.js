const { Server } = require("socket.io");
let iot = null;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: [
        "https://talabatk.top",
        "https://www.talabatk.top",
        "http://localhost:5173",
      ],
      credentials: true,
    },
    transports: ["websocket"],
    pingInterval: 25000,
    pingTimeout: 60000,
    allowEIO3: true,
  });

  io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);

    socket.on("join-room", (room) => {
      socket.join(room);
      console.log(`${socket.id} joined room: ${room}`);
    });

    socket.on("disconnect", (reason) => {
      console.warn("❌ Disconnected:", reason);
    });
  });
}

function getIO() {
  if (!io) throw new Error("Socket.io not initialized yet");
  return io;
}

module.exports = { initSocket, getIO };
