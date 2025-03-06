import express, { Request, Response } from "express";
import { Server as SocketIOServer } from "socket.io";
import { 
  Board, 
  CreateBoardRequest, 
  MoveBoardRequest,
  createBoard, 
  deleteBoard, 
  moveBoard, 
  getAllBoards, 
  getBoardById 
} from "../models/board";
import { 
  getBoardDepth, 
  buildHierarchy, 
  isDescendant, 
  getMaxSubtreeDepth 
} from "../utils/boardUtils";
import { BoardEventType, emitBoardEvent } from "../socket";

export default function boardRoutes(io: SocketIOServer) {
  const router = express.Router();

  // Create a board
  router.post("/", async (req: Request<{}, {}, CreateBoardRequest>, res: Response) => {
    try {
      const { name, parent_id } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Board name is required" });
      }

      // Check if parent board exists if parent_id is provided
      if (parent_id) {
        const parentBoard = await getBoardById(parent_id);

        if (!parentBoard) {
          return res.status(404).json({ error: "Parent board not found" });
        }

        // Check depth constraint
        const depth = await getBoardDepth(parent_id);
        if (depth >= 10) {
          return res.status(400).json({ error: "Maximum board depth (10) exceeded" });
        }
      }

      const board = await createBoard(name, parent_id);

      // Notify clients about the new board
      emitBoardEvent(io, BoardEventType.CREATED, board);

      res.status(201).json(board);
    } catch (error) {
      console.error("Error creating board:", error);
      res.status(500).json({ error: "Failed to create board" });
    }
  });

  // Delete a board
  router.delete("/:id", async (req: Request, res: Response) => {
    try {
      const boardId = Number.parseInt(req.params.id);

      // Check if board exists
      const board = await getBoardById(boardId);

      if (!board) {
        return res.status(404).json({ error: "Board not found" });
      }

      // PostgreSQL will handle cascading deletes due to ON DELETE CASCADE
      await deleteBoard(boardId);

      // Notify clients about the deleted board
      emitBoardEvent(io, BoardEventType.DELETED, { id: boardId });

      res.status(200).json({ message: "Board deleted successfully" });
    } catch (error) {
      console.error("Error deleting board:", error);
      res.status(500).json({ error: "Failed to delete board" });
    }
  });

  // Move a board
  router.put("/:id/move", async (req: Request<{ id: string }, {}, MoveBoardRequest>, res: Response) => {
    try {
      const boardId = Number.parseInt(req.params.id);
      const { new_parent_id } = req.body;

      // Check if board exists
      const board = await getBoardById(boardId);

      if (!board) {
        return res.status(404).json({ error: "Board not found" });
      }

      // Check if new parent exists if new_parent_id is provided
      if (new_parent_id !== null) {
        const parentBoard = await getBoardById(new_parent_id);

        if (!parentBoard) {
          return res.status(404).json({ error: "New parent board not found" });
        }

        // Prevent circular references
        if (new_parent_id === boardId) {
          return res.status(400).json({ error: "Board cannot be its own parent" });
        }

        // Check if new parent is a descendant of the board
        if (await isDescendant(boardId, new_parent_id)) {
          return res.status(400).json({ error: "Cannot move a board to its descendant" });
        }

        // Check depth constraint
        const depth = await getBoardDepth(new_parent_id);
        const subtreeDepth = await getMaxSubtreeDepth(boardId);

        if (depth + subtreeDepth >= 10) {
          return res.status(400).json({ error: "Moving this board would exceed maximum depth (10)" });
        }
      }

      // Update the board's parent
      const updatedBoard = await moveBoard(boardId, new_parent_id);

      // Notify clients about the moved board
      emitBoardEvent(io, BoardEventType.MOVED, updatedBoard);

      res.status(200).json(updatedBoard);
    } catch (error) {
      console.error("Error moving board:", error);
      res.status(500).json({ error: "Failed to move board" });
    }
  });

  // List boards in hierarchical structure
  router.get("/", async (_req: Request, res: Response) => {
    try {
      // Get all boards
      const boards = await getAllBoards();

      // Build hierarchical structure
      const hierarchy = buildHierarchy(boards);

      res.status(200).json(hierarchy);
    } catch (error) {
      console.error("Error retrieving boards:", error);
      res.status(500).json({ error: "Failed to retrieve boards" });
    }
  });

  // Get a specific board with its children
  router.get("/:id", async (req: Request, res: Response) => {
    try {
      const boardId = Number.parseInt(req.params.id);

      // Get the board
      const board = await getBoardById(boardId);

      if (!board) {
        return res.status(404).json({ error: "Board not found" });
      }

      // Get all boards to build hierarchy
      const allBoards = await getAllBoards();

      // Build hierarchical structure for this board's children
      const children = buildHierarchy(allBoards, boardId);
      
      // Attach children to board
      const boardWithChildren: Board = {
        ...board,
        children
      };

      res.status(200).json(boardWithChildren);
    } catch (error) {
      console.error("Error retrieving board:", error);
      res.status(500).json({ error: "Failed to retrieve board" });
    }
  });

  return router;
}