import { getPool } from "../config/database";

const pool = getPool();

// Board types
export interface Board {
  id: number;
  name: string;
  parent_id: number | null;
  created_at: Date;
  updated_at: Date;
  children?: Board[];
}

export interface CreateBoardRequest {
  name: string;
  parent_id?: number;
}

export interface MoveBoardRequest {
  board_id: number;
  new_parent_id: number | null;
}

// Board model functions
export async function createBoard(name: string, parent_id?: number): Promise<Board> {
  const result = await pool.query(
    "INSERT INTO boards (name, parent_id) VALUES ($1, $2) RETURNING *",
    [name, parent_id || null]
  );
  return result.rows[0];
}

export async function deleteBoard(id: number): Promise<void> {
  await pool.query("DELETE FROM boards WHERE id = $1", [id]);
}

export async function moveBoard(id: number, new_parent_id: number | null): Promise<Board> {
  await pool.query(
    "UPDATE boards SET parent_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
    [new_parent_id, id]
  );
  
  const result = await pool.query("SELECT * FROM boards WHERE id = $1", [id]);
  return result.rows[0];
}

export async function getAllBoards(): Promise<Board[]> {
  const result = await pool.query("SELECT * FROM boards ORDER BY created_at");
  return result.rows;
}

export async function getBoardById(id: number): Promise<Board | null> {
  const result = await pool.query("SELECT * FROM boards WHERE id = $1", [id]);
  return result.rows.length > 0 ? result.rows[0] : null;
}