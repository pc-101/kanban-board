import type { Column, Task } from "./board-store";
import { getSupabase } from "./supabase";

export type BoardSnapshot = {
  boardColor: string;
  columns: Column[];
  tasks: Record<string, Task>;
};

type BoardRow = {
  data: BoardSnapshot;
};

const BOARD_ID = process.env.NEXT_PUBLIC_SUPABASE_BOARD_ID || "default";

export async function loadBoardFromSupabase() {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: null };

  const { data, error } = await supabase
    .from("boards")
    .select("data")
    .eq("id", BOARD_ID)
    .maybeSingle<BoardRow>();

  return { data: data?.data ?? null, error };
}

export async function saveBoardToSupabase(snapshot: BoardSnapshot) {
  const supabase = getSupabase();
  if (!supabase) return { error: null };

  const { error } = await supabase
    .from("boards")
    .upsert({ id: BOARD_ID, data: snapshot, updated_at: new Date().toISOString() });

  return { error };
}
