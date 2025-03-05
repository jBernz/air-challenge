import express from "express";
import { Server as SocketIOServer } from "socket.io";
import boardRoutes from "./boardRoutes";

export default function routes(io: SocketIOServer) {
  const router = express.Router();
  
  // Hello route
  router.get("/hello", (_req, res) => {
    res.json({ message: "Hello from Express Backend!" });
  });

  // Register board routes with io instance
  router.use("/boards", boardRoutes(io));
  
  return router;
}