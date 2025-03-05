import type { Board, BoardServer, CreateBoardRequest, MoveBoardRequest } from "../types/board"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

const formatData = (board:BoardServer):Board => {
  return {...board, parentId: board.parent_id, children: board.children ? board.children.map(formatData): []}
}

export async function fetchBoards(): Promise<Board[]> {
  const response = await fetch(`${API_URL}/api/boards`)

  if (!response.ok) {
    throw new Error("Failed to fetch boards")
  }

  const res = (await response.json()).map(formatData)

  console.log(res)

  return res;
}

export async function createBoard(data: CreateBoardRequest): Promise<Board> {

  console.log(data)
  const response = await fetch(`${API_URL}/api/boards`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({"name": data.name, "parent_id": data.parentId}),
  })

  if (!response.ok) {
    throw new Error("Failed to create board")
  }

  return response.json()
}

export async function deleteBoard(boardId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/boards/${boardId}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    throw new Error("Failed to delete board")
  }
}

export async function moveBoard(data: MoveBoardRequest): Promise<Board> {
  const response = await fetch(`${API_URL}/api/boards/${data.boardId}/move`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({"new_parent_id": data.newParentId}),
  })

  if (!response.ok) {
    throw new Error("Failed to move board")
  }

  return response.json()
}
