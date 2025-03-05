"use client"

import type React from "react"

import { useState } from "react"
import type { Board } from "@/types/board"
import { Plus } from "lucide-react"

interface CreateBoardFormProps {
  onCreateBoard: (name: string, parentId: string | null) => void
  boards: Board[]
  isCreating: boolean
}

export default function CreateBoardForm({ onCreateBoard, boards, isCreating }: CreateBoardFormProps) {
  const [name, setName] = useState("")
  const [parentId, setParentId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onCreateBoard(name.trim(), parentId)
      setName("")
      setIsFormOpen(false)
    }
  }

  const toggleForm = () => {
    setIsFormOpen(!isFormOpen)
  }

  return (
    <div className="mb-6">
      {!isFormOpen ? (
        <button
          onClick={toggleForm}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span>Create New Board</span>
        </button>
      ) : (
        <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
          <h3 className="text-lg font-medium mb-3">Create New Board</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="boardName" className="block text-sm font-medium text-gray-700 mb-1">
                Board Name
              </label>
              <input
                id="boardName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter board name"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="parentBoard" className="block text-sm font-medium text-gray-700 mb-1">
                Parent Board (optional)
              </label>
              <select
                id="parentBoard"
                value={parentId || ""}
                onChange={(e) => setParentId(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Root Level (No Parent)</option>
                {boards.map((board) => (
                  <option key={board.id} value={board.id}>
                    {board.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isCreating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              >
                {isCreating ? "Creating..." : "Create Board"}
              </button>
              <button
                type="button"
                onClick={toggleForm}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

