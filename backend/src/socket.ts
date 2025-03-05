import { Server as HttpServer } from "http"
import { Server as SocketIOServer } from "socket.io"

export function initSocketIO(server: HttpServer) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: ["http://localhost:3000", "http://frontend:3000"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  })

  // Socket.io event handlers
  io.on("connection", (socket) => {
    console.log("Client connected")

    socket.on("disconnect", () => {
      console.log("Client disconnected")
    })
  })

  return io
}

// Export singleton instance for use in other files
export let io: SocketIOServer
export function getIO() {
  return io
}

export function setIO(socketIO: SocketIOServer) {
  io = socketIO
}
