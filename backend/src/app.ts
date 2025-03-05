import express from "express"
import cors from "cors"
import bodyParser from "body-parser"
import boardRoutes from "./routes/boardRoutes"

// Load environment variables
import dotenv from "dotenv"
dotenv.config()

console.log(process.env.NODE_ENV)

// Initialize Express app
const app = express()

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://frontend:3000"],
    credentials: true,
  })
)
app.use(bodyParser.json())

// Routes
app.get("/api/hello", (_req, res) => {
  res.json({ message: "Hello from Express Backend!" })
})

// Register board routes
app.use("/api/boards", boardRoutes)

export { app }
