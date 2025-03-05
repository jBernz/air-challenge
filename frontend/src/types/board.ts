export interface Board {
  id: string
  name: string
  parentId: string | null
  children?: Board[]
}

export interface CreateBoardRequest {
  name: string
  parentId: string | null
}

export interface MoveBoardRequest {
  boardId: string
  newParentId: string | null
}

export interface BoardServer {
  id: string
  name: string
  parent_id: string | null
  children?: BoardServer[]
}


