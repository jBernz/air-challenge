import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";

export interface NotificationMessage {
  message: string;
}

export default function setupSocketService(server: HttpServer): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: ["http://localhost:3000", "http://frontend:3000"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Socket.io event handlers
  io.on("connection", (socket) => {
    console.log("Client connected");

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });

  // Broadcast notification every second
  setInterval(() => {
    const notification: NotificationMessage = {
      message: "Server notification: " + new Date().toLocaleString(),
    };
    io.emit("notification", notification);
  }, 1000);

  return io;
}