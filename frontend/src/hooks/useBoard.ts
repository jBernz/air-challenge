import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchBoards, createBoard, deleteBoard, moveBoard } from "../services/api"
import type { BoardServer, CreateBoardRequest, MoveBoardRequest } from "../types/board"
import { useEffect } from "react"
import { useSocket } from "./useSocket"

export function useBoards() {
  const socket = useSocket()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!socket) return

    // Handle any board update event
    const handleBoardUpdate = (data: { type: string; payload: BoardServer|BoardServer[] }) => {
      console.log(`Board update received via WebSocket: ${data.type}`, data.payload)
      
      // Invalidate the boards query to refresh data
      queryClient.invalidateQueries({ queryKey: ["boards"] })
      
      // TODO update the cache directly for more efficient updates
      // depending on the update type
    }

    // Listen for the general board:update event
    socket.on("board:update", handleBoardUpdate)

    return () => {
      // Clean up listeners when component unmounts
      socket.off("board:update", handleBoardUpdate)
    }
  }, [socket, queryClient])

  const boardsQuery = useQuery({
    queryKey: ["boards"],
    queryFn: fetchBoards,
  })

  const createBoardMutation = useMutation({
    mutationFn: (data: CreateBoardRequest) => createBoard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] })
    },
  })

  const deleteBoardMutation = useMutation({
    mutationFn: (boardId: string) => deleteBoard(boardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] })
    },
  })

  const moveBoardMutation = useMutation({
    mutationFn: (data: MoveBoardRequest) => moveBoard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] })
    },
  })

  return {
    boards: boardsQuery.data || [],
    isLoading: boardsQuery.isLoading,
    isError: boardsQuery.isError,
    error: boardsQuery.error,
    createBoard: createBoardMutation.mutate,
    deleteBoard: deleteBoardMutation.mutate,
    moveBoard: moveBoardMutation.mutate,
    isCreating: createBoardMutation.isPending,
    isDeleting: deleteBoardMutation.isPending,
    isMoving: moveBoardMutation.isPending,
    refetch: boardsQuery.refetch,
  }
}
