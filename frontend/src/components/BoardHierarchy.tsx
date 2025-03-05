"use client"

import { useEffect } from "react"
import { useBoards } from "@/hooks/useBoard"
import { useSocket } from "@/hooks/useSocket"
import BoardItem from "./BoardItem"
import CreateBoardForm from "./CreateBoardForm"
import type { Board } from "@/types/board"

export default function BoardHierarchy() {
  const { boards, isLoading, isError, createBoard, deleteBoard, moveBoard, isCreating } = useBoards()

  const socket = useSocket()

  useEffect(() => {
    if (!socket) return

    const handleBoardUpdate = () => {
      console.log("Board hierarchy updated via WebSocket")
      // React Query will handle the refetch
    }

    socket.on("board:update", handleBoardUpdate)

    return () => {
      socket.off("board:update", handleBoardUpdate)
    }
  }, [socket])

  const handleCreateBoard = (name: string, parentId: string | null) => {
    createBoard({ name, parentId })
  }

  const handleDeleteBoard = (boardId: string) => {
    deleteBoard(boardId)
  }

  const handleMoveBoard = (boardId: string, newParentId: string | null) => {
    moveBoard({ boardId, newParentId })
  }

  // Get all boards in a flat array (including nested children)
  const getFlatBoards = (boards: Board[]): Board[] => {
    return boards.reduce((acc: Board[], board) => {
      acc.push(board)
      if (board.children && board.children.length > 0) {
        acc.push(...getFlatBoards(board.children))
      }
      return acc
    }, [])
  }

  const flatBoards = getFlatBoards(boards)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (isError) {
    return <div className="p-4 bg-red-50 text-red-700 rounded-md">Error loading boards. Please try again later.</div>
  }

  return (
    <div className="board-hierarchy">
      <CreateBoardForm onCreateBoard={handleCreateBoard} boards={flatBoards} isCreating={isCreating} />

      <div className="bg-white rounded-md shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Board Hierarchy</h2>
        </div>

        <div className="p-2">
          {boards.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No boards found. Create your first board to get started.
            </div>
          ) : (
            boards.map((board) => (
              <BoardItem
                key={board.id}
                board={board}
                onDelete={handleDeleteBoard}
                onMove={handleMoveBoard}
                allBoards={flatBoards}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
