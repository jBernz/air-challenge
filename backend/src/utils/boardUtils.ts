import { getPool } from "../config/database";
import { Board } from "../models/board";

const pool = getPool();

// Helper function to check board depth
export async function getBoardDepth(boardId: number | null): Promise<number> {
  if (!boardId) return 0;

  const result = await pool.query("SELECT parent_id FROM boards WHERE id = $1", [boardId]);

  if (result.rows.length === 0) return 0;

  const parentId = result.rows[0].parent_id;
  if (parentId === null) return 1;

  return 1 + (await getBoardDepth(parentId));
}

// Build hierarchical structure
export function buildHierarchy(boards: Board[], parentId: number | null = null): Board[] {
  return boards
    .filter((board) => board.parent_id === parentId)
    .map((board) => ({
      ...board,
      children: buildHierarchy(boards, board.id),
    }));
}

// Check if a board is a descendant of another board
export async function isDescendant(parentId: number, targetId: number): Promise<boolean> {
  if (parentId === targetId) return true;

  const children = await pool.query("SELECT id FROM boards WHERE parent_id = $1", [parentId]);

  for (const child of children.rows) {
    if (await isDescendant(child.id, targetId)) {
      return true;
    }
  }

  return false;
}

// Get the maximum depth of a board's subtree
export async function getMaxSubtreeDepth(rootId: number): Promise<number> {
  const children = await pool.query("SELECT id FROM boards WHERE parent_id = $1", [rootId]);

  if (children.rows.length === 0) return 0;

  let maxChildDepth = 0;
  for (const child of children.rows) {
    const childDepth = await getMaxSubtreeDepth(child.id);
    maxChildDepth = Math.max(maxChildDepth, childDepth);
  }

  return 1 + maxChildDepth;
}