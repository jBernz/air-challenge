import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";

export interface NotificationMessage {
  message: string;
}

// Define board event types for better type safety
export enum BoardEventType {
  CREATED = "board:created",
  UPDATED = "board:updated",
  DELETED = "board:deleted",
  MOVED = "board:moved",
  // General update event for any board changes
  ANY_UPDATE = "board:update"
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

// Helper function to emit board events
export function emitBoardEvent(
  io: SocketIOServer, 
  eventType: BoardEventType, 
  payload: any
) {
  // Emit the specific event
  io.emit(eventType, payload);
  
  // Also emit the general update event
  io.emit(BoardEventType.ANY_UPDATE, {
    type: eventType,
    payload,
    timestamp: new Date().toISOString()
  });
}