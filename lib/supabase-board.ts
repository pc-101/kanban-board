import type { Column, Task } from "./board-store";
import { getSupabase } from "./supabase";

export type BoardSnapshot = {
  boardColor: string;
  assignees: string[];
  columns: Column[];
  tasks: Record<string, Task>;
};

export type RemoteBoard = {
  snapshot: BoardSnapshot;
  updatedAt: string | null;
};

type BoardRow = {
  data: BoardSnapshot;
  updated_at: string | null;
};

const BOARD_ID = process.env.NEXT_PUBLIC_SUPABASE_BOARD_ID || "default";

export async function loadBoardFromSupabase() {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: null };

  const { data, error } = await supabase
    .from("boards")
    .select("data, updated_at")
    .eq("id", BOARD_ID)
    .maybeSingle<BoardRow>();

  return {
    data: data ? { snapshot: data.data, updatedAt: data.updated_at } satisfies RemoteBoard : null,
    error,
  };
}

export async function saveBoardToSupabase(snapshot: BoardSnapshot) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: null };

  const { data, error } = await supabase
    .from("boards")
    .upsert({ id: BOARD_ID, data: snapshot, updated_at: new Date().toISOString() })
    .select("updated_at")
    .single<{ updated_at: string | null }>();

  return { data: data ? { updatedAt: data.updated_at } : null, error };
}
