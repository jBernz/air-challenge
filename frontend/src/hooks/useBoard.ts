import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchBoards, createBoard, deleteBoard, moveBoard } from "../services/api"
import type { CreateBoardRequest, MoveBoardRequest } from "../types/board"

export function useBoards() {
  const queryClient = useQueryClient()

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
  }
}

