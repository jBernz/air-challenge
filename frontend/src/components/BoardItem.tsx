"use client"

import { useState } from "react"
import type { Board } from "@/types/board"
import { ChevronDown, ChevronRight, Trash, Move } from "lucide-react"

interface BoardItemProps {
  board: Board
  onDelete: (boardId: string) => void
  onMove: (boardId: string, newParentId: string | null) => void
  allBoards: Board[]
  level?: number
}

export default function BoardItem({ board, onDelete, onMove, allBoards, level = 0 }: BoardItemProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isMoving, setIsMoving] = useState(false)
  const hasChildren = board.children && board.children.length > 0

  const handleToggle = () => {
    setIsExpanded(!isExpanded)
  }

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${board.name}" and all its children?`)) {
      onDelete(board.id)
    }
  }

  const handleMoveClick = () => {
    setIsMoving(!isMoving)
  }

  const handleMove = (newParentId: string | null) => {
    onMove(board.id, newParentId)
    setIsMoving(false)
  }

  // Filter out this board and its descendants to prevent circular references
  const getDescendantIds = (boardId: string): string[] => {
    const board = allBoards.find((b) => b.id === boardId)
    if (!board || !board.children || board.children.length === 0) {
      return [boardId]
    }

    return [boardId, ...board.children.flatMap((child) => getDescendantIds(child.id))]
  }

  const validMoveTargets = allBoards.filter((b) => !getDescendantIds(board.id).includes(b.id) && b.id !== board.id)

  return (
    <div className="board-item">
      <div
        className="flex items-center py-2 px-3 hover:bg-gray-100 rounded-md transition-colors"
        style={{ paddingLeft: `${level * 20 + 12}px` }}
      >
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className="mr-2 text-gray-500 hover:text-gray-700"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : (
          <div className="w-6 mr-2"></div>
        )}

        <div className="flex-grow font-medium">{board.name}</div>

        <div className="flex space-x-2">
          <button
            onClick={handleMoveClick}
            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
            title="Move board"
            aria-label="Move board"
          >
            <Move size={16} />
          </button>

          <button
            onClick={handleDelete}
            className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
            title="Delete board"
            aria-label="Delete board"
          >
            <Trash size={16} />
          </button>
        </div>
      </div>

      {isMoving && (
        <div
          className="ml-8 mt-1 mb-2 p-2 bg-gray-50 rounded-md border border-gray-200"
          style={{ marginLeft: `${level * 20 + 24}px` }}
        >
          <div className="text-sm font-medium mb-2">Move to:</div>
          <div className="space-y-1">
            <div className="px-2 py-1 hover:bg-gray-100 rounded cursor-pointer" onClick={() => handleMove(null)}>
              Root level
            </div>
            {validMoveTargets.map((target) => (
              <div
                key={target.id}
                className="px-2 py-1 hover:bg-gray-100 rounded cursor-pointer"
                onClick={() => handleMove(target.id)}
              >
                {target.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {hasChildren && isExpanded && (
        <div className="board-children">
          {board.children?.map((child) => (
            <BoardItem
              key={child.id}
              board={child}
              onDelete={onDelete}
              onMove={onMove}
              allBoards={allBoards}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
