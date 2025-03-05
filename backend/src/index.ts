import express, { type Request, type Response } from "express"
import http from "http"
import { Server as SocketIOServer } from "socket.io"
import cors from "cors"
import { Pool } from "pg"
import bodyParser from "body-parser"

require('dotenv').config()

console.log(process.env.NODE_ENV)

// Initialize Express app
const app = express()
const server = http.createServer(app)
const io = new SocketIOServer(server, {
  cors: {
    origin: ["http://localhost:3000", "http://frontend:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
})

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://frontend:3000"],
    credentials: true,
  }),
)
app.use(bodyParser.json())

// PostgreSQL connection
const dbUrl = process.env.NODE_ENV === 'test' ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL
console.log(dbUrl)
const pool = new Pool({
  connectionString: dbUrl,
})

// Initialize database
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS boards (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        parent_id INTEGER REFERENCES boards(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
    console.log("Database initialized successfully")
  } catch (error) {
    console.error("Error initializing database:", error)
  }
}

initializeDatabase()

// Existing routes
interface HelloResponse {
  message: string
}

app.get("/api/hello", (_req: Request, res: Response<HelloResponse>) => {
  res.json({ message: "Hello from Express Backend!" })
})

// Board types
interface Board {
  id: number
  name: string
  parent_id: number | null
  created_at: Date
  updated_at: Date
  children?: Board[]
}

interface CreateBoardRequest {
  name: string
  parent_id?: number
}

interface MoveBoardRequest {
  board_id: number
  new_parent_id: number | null
}

// Helper function to check board depth
async function getBoardDepth(boardId: number | null): Promise<number> {
  if (!boardId) return 0

  const result = await pool.query("SELECT parent_id FROM boards WHERE id = $1", [boardId])

  if (result.rows.length === 0) return 0

  const parentId = result.rows[0].parent_id
  if (parentId === null) return 1

  return 1 + (await getBoardDepth(parentId))
}

// Board Routes

// Create a board
app.post("/api/boards", async (req: Request<{}, {}, CreateBoardRequest>, res: Response) => {
  try {
    const { name, parent_id } = req.body

    if (!name) {
      return res.status(400).json({ error: "Board name is required" })
    }

    // Check if parent board exists if parent_id is provided
    if (parent_id) {
      const parentResult = await pool.query("SELECT id FROM boards WHERE id = $1", [parent_id])

      if (parentResult.rows.length === 0) {
        return res.status(404).json({ error: "Parent board not found" })
      }

      // Check depth constraint
      const depth = await getBoardDepth(parent_id)
      if (depth >= 10) {
        return res.status(400).json({ error: "Maximum board depth (10) exceeded" })
      }
    }

    const result = await pool.query("INSERT INTO boards (name, parent_id) VALUES ($1, $2) RETURNING *", [
      name,
      parent_id || null,
    ])

    // Notify clients about the new board
    io.emit("board:created", result.rows[0])

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error("Error creating board:", error)
    res.status(500).json({ error: "Failed to create board" })
  }
})

// Delete a board
app.delete("/api/boards/:id", async (req: Request, res: Response) => {
  try {
    const boardId = Number.parseInt(req.params.id)

    // Check if board exists
    const boardResult = await pool.query("SELECT id FROM boards WHERE id = $1", [boardId])

    if (boardResult.rows.length === 0) {
      return res.status(404).json({ error: "Board not found" })
    }

    // PostgreSQL will handle cascading deletes due to ON DELETE CASCADE
    await pool.query("DELETE FROM boards WHERE id = $1", [boardId])

    // Notify clients about the deleted board
    io.emit("board:deleted", { id: boardId })

    res.status(200).json({ message: "Board deleted successfully" })
  } catch (error) {
    console.error("Error deleting board:", error)
    res.status(500).json({ error: "Failed to delete board" })
  }
})

// Move a board
app.put("/api/boards/:id/move", async (req: Request<{ id: string }, {}, MoveBoardRequest>, res: Response) => {
  try {
    const boardId = Number.parseInt(req.params.id)
    const { new_parent_id } = req.body

    // Check if board exists
    const boardResult = await pool.query("SELECT id, parent_id FROM boards WHERE id = $1", [boardId])

    if (boardResult.rows.length === 0) {
      return res.status(404).json({ error: "Board not found" })
    }

    // Check if new parent exists if new_parent_id is provided
    if (new_parent_id !== null) {
      const parentResult = await pool.query("SELECT id FROM boards WHERE id = $1", [new_parent_id])

      if (parentResult.rows.length === 0) {
        return res.status(404).json({ error: "New parent board not found" })
      }

      // Prevent circular references
      if (new_parent_id === boardId) {
        return res.status(400).json({ error: "Board cannot be its own parent" })
      }

      // Check if new parent is a descendant of the board
      const checkDescendant = async (parentId: number, targetId: number): Promise<boolean> => {
        if (parentId === targetId) return true

        const children = await pool.query("SELECT id FROM boards WHERE parent_id = $1", [parentId])

        for (const child of children.rows) {
          if (await checkDescendant(child.id, targetId)) {
            return true
          }
        }

        return false
      }

      if (await checkDescendant(boardId, new_parent_id)) {
        return res.status(400).json({ error: "Cannot move a board to its descendant" })
      }

      // Check depth constraint
      const depth = await getBoardDepth(new_parent_id)

      // Get the maximum depth of the board's subtree
      const getMaxSubtreeDepth = async (rootId: number): Promise<number> => {
        const children = await pool.query("SELECT id FROM boards WHERE parent_id = $1", [rootId])

        if (children.rows.length === 0) return 0

        let maxChildDepth = 0
        for (const child of children.rows) {
          const childDepth = await getMaxSubtreeDepth(child.id)
          maxChildDepth = Math.max(maxChildDepth, childDepth)
        }

        return 1 + maxChildDepth
      }

      const subtreeDepth = await getMaxSubtreeDepth(boardId)

      if (depth + subtreeDepth >= 10) {
        return res.status(400).json({ error: "Moving this board would exceed maximum depth (10)" })
      }
    }

    // Update the board's parent
    await pool.query("UPDATE boards SET parent_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [
      new_parent_id,
      boardId,
    ])

    // Get the updated board
    const updatedBoard = await pool.query("SELECT * FROM boards WHERE id = $1", [boardId])

    // Notify clients about the moved board
    io.emit("board:moved", updatedBoard.rows[0])

    res.status(200).json(updatedBoard.rows[0])
  } catch (error) {
    console.error("Error moving board:", error)
    res.status(500).json({ error: "Failed to move board" })
  }
})

// List boards in hierarchical structure
app.get("/api/boards", async (_req: Request, res: Response) => {
  try {
    // Get all boards
    const result = await pool.query("SELECT * FROM boards ORDER BY created_at")

    // Build hierarchical structure
    const buildHierarchy = (boards: Board[], parentId: number | null = null): Board[] => {
      return boards
        .filter((board) => board.parent_id === parentId)
        .map((board) => ({
          ...board,
          children: buildHierarchy(boards, board.id),
        }))
    }

    const hierarchy = buildHierarchy(result.rows)

    res.status(200).json(hierarchy)
  } catch (error) {
    console.error("Error retrieving boards:", error)
    res.status(500).json({ error: "Failed to retrieve boards" })
  }
})

// Get a specific board with its children
app.get("/api/boards/:id", async (req: Request, res: Response) => {
  try {
    const boardId = Number.parseInt(req.params.id)

    // Get the board
    const boardResult = await pool.query("SELECT * FROM boards WHERE id = $1", [boardId])

    if (boardResult.rows.length === 0) {
      return res.status(404).json({ error: "Board not found" })
    }

    // Get all boards to build hierarchy
    const allBoardsResult = await pool.query("SELECT * FROM boards")

    // Build hierarchical structure
    const buildHierarchy = (boards: Board[], parentId: number): Board[] => {
      return boards
        .filter((board) => board.parent_id === parentId)
        .map((board) => ({
          ...board,
          children: buildHierarchy(boards, board.id),
        }))
    }

    const board = boardResult.rows[0]
    board.children = buildHierarchy(allBoardsResult.rows, boardId)

    res.status(200).json(board)
  } catch (error) {
    console.error("Error retrieving board:", error)
    res.status(500).json({ error: "Failed to retrieve board" })
  }
})

// Socket.io event handlers
interface NotificationMessage {
  message: string
}

io.on("connection", (socket) => {
  console.log("Client connected")

  socket.on("disconnect", () => {
    console.log("Client disconnected")
  })
})

// Broadcast notification every second
setInterval(() => {
  const notification: NotificationMessage = {
    message: "Server notification: " + new Date().toLocaleString(),
  }
  io.emit("notification", notification)
}, 1000)

// Start server
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

// Export for testing
module.exports = app;