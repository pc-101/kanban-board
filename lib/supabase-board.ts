import type { Column, Task } from "./board-store";
import { getSupabase } from "./supabase";

export type BoardSnapshot = {
  boardTitle: string;
  boardColor: string;
  assignees: string[];
  assigneeColors: Record<string, string>;
  columns: Column[];
  tasks: Record<string, Task>;
};

export type BoardMeta = {
  id: string;
  title: string;
  updatedAt: string | null;
};

export type RemoteBoard = {
  id: string;
  snapshot: BoardSnapshot;
  updatedAt: string | null;
};

type BoardRow = {
  id: string;
  data: Partial<BoardSnapshot>;
  updated_at: string | null;
};

export const DEFAULT_BOARD_ID = process.env.NEXT_PUBLIC_SUPABASE_BOARD_ID || "default";

const titleFromRow = (row: BoardRow) => row.data.boardTitle || row.id;

export async function listBoardsFromSupabase() {
  const supabase = getSupabase();
  if (!supabase) return { data: [] as BoardMeta[], error: null };

  const { data, error } = await supabase
    .from("boards")
    .select("id, data, updated_at")
    .order("updated_at", { ascending: false });

  return {
    data: (data ?? []).map((row) => ({
      id: row.id,
      title: titleFromRow(row as BoardRow),
      updatedAt: row.updated_at,
    })),
    error,
  };
}

export async function loadBoardFromSupabase(boardId = DEFAULT_BOARD_ID) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: null };

  const { data, error } = await supabase
    .from("boards")
    .select("id, data, updated_at")
    .eq("id", boardId)
    .maybeSingle<BoardRow>();

  return {
    data: data ? { id: data.id, snapshot: data.data as BoardSnapshot, updatedAt: data.updated_at } satisfies RemoteBoard : null,
    error,
  };
}

export async function saveBoardToSupabase(boardId: string, snapshot: BoardSnapshot) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: null };

  const { data, error } = await supabase
    .from("boards")
    .upsert({ id: boardId, data: snapshot, updated_at: new Date().toISOString() })
    .select("updated_at")
    .single<{ updated_at: string | null }>();

  return { data: data ? { updatedAt: data.updated_at } : null, error };
}

export async function deleteBoardFromSupabase(boardId: string) {
  const supabase = getSupabase();
  if (!supabase) return { error: null };

  const { error } = await supabase
    .from("boards")
    .delete()
    .eq("id", boardId);

  return { error };
}
