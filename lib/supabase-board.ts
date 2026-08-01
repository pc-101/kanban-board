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
  title: string;
  color: string;
  updated_at: string | null;
};

type ColumnRow = {
  id: string;
  title: string;
  position: number;
};

type TaskRow = {
  id: string;
  column_id: string;
  position: number;
  title: string;
  assignee: string | null;
  description: string | null;
  due_date: string | null;
  completed_at: string | null;
};

type AssigneeRow = {
  name: string;
  color: string;
  position: number;
};

type ColumnPatch = {
  id: string;
  title: string;
  position: number;
};

type TaskPatch = Task & {
  columnId: string;
  position: number;
};

type AssigneePatch = {
  name: string;
  color: string;
  position: number;
};

type BoardPatch = {
  board?: { title: string; color: string };
  columns: ColumnPatch[];
  tasks: TaskPatch[];
  assignees: AssigneePatch[];
  deletedColumnIds: string[];
  deletedTaskIds: string[];
  deletedAssigneeNames: string[];
};

export const DEFAULT_BOARD_ID = process.env.NEXT_PUBLIC_SUPABASE_BOARD_ID || "default";

const remoteSnapshots = new Map<string, BoardSnapshot>();
const saveQueues = new Map<string, Promise<unknown>>();

const cloneSnapshot = (snapshot: BoardSnapshot): BoardSnapshot => JSON.parse(JSON.stringify(snapshot)) as BoardSnapshot;

const sameValue = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);

const normalizedColumns = (snapshot: BoardSnapshot): ColumnPatch[] => snapshot.columns.map((column, position) => ({
  id: column.id,
  title: column.title,
  position,
}));

const normalizedTasks = (snapshot: BoardSnapshot): TaskPatch[] => snapshot.columns.flatMap((column) => (
  column.taskIds.flatMap((taskId, position) => {
    const task = snapshot.tasks[taskId];
    return task ? [{ ...task, columnId: column.id, position }] : [];
  })
));

const normalizedAssignees = (snapshot: BoardSnapshot): AssigneePatch[] => snapshot.assignees.map((name, position) => ({
  name,
  color: snapshot.assigneeColors[name],
  position,
}));

const changedRows = <Row extends { id: string }>(next: Row[], previous: Row[]) => {
  const previousById = new Map(previous.map((row) => [row.id, row]));
  return next.filter((row) => !sameValue(row, previousById.get(row.id)));
};

const removedIds = <Row extends { id: string }>(next: Row[], previous: Row[]) => {
  const nextIds = new Set(next.map((row) => row.id));
  return previous.filter((row) => !nextIds.has(row.id)).map((row) => row.id);
};

const buildPatch = (next: BoardSnapshot, previous?: BoardSnapshot): BoardPatch => {
  const nextColumns = normalizedColumns(next);
  const previousColumns = previous ? normalizedColumns(previous) : [];
  const nextTasks = normalizedTasks(next);
  const previousTasks = previous ? normalizedTasks(previous) : [];
  const nextAssignees = normalizedAssignees(next);
  const previousAssignees = previous ? normalizedAssignees(previous) : [];
  const previousAssigneesWithIds = previousAssignees.map((assignee) => ({ ...assignee, id: assignee.name }));
  const nextAssigneesWithIds = nextAssignees.map((assignee) => ({ ...assignee, id: assignee.name }));

  const boardChanged = !previous
    || next.boardTitle !== previous.boardTitle
    || next.boardColor !== previous.boardColor;

  return {
    ...(boardChanged ? { board: { title: next.boardTitle, color: next.boardColor } } : {}),
    columns: changedRows(nextColumns, previousColumns),
    tasks: changedRows(nextTasks, previousTasks),
    assignees: changedRows(nextAssigneesWithIds, previousAssigneesWithIds).map(({ id: _id, ...assignee }) => assignee),
    deletedColumnIds: removedIds(nextColumns, previousColumns),
    deletedTaskIds: removedIds(nextTasks, previousTasks),
    deletedAssigneeNames: removedIds(nextAssigneesWithIds, previousAssigneesWithIds),
  };
};

const loadNormalizedBoard = async (boardId: string) => {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: null };

  const [boardResult, columnsResult, tasksResult, assigneesResult] = await Promise.all([
    supabase.from("boards").select("id, title, color, updated_at").eq("id", boardId).maybeSingle<BoardRow>(),
    supabase.from("board_columns").select("id, title, position").eq("board_id", boardId).order("position"),
    supabase.from("board_tasks").select("id, column_id, position, title, assignee, description, due_date, completed_at").eq("board_id", boardId).order("position"),
    supabase.from("board_assignees").select("name, color, position").eq("board_id", boardId).order("position"),
  ]);

  const error = boardResult.error ?? columnsResult.error ?? tasksResult.error ?? assigneesResult.error;
  if (error || !boardResult.data) return { data: null, error };

  const columnRows = (columnsResult.data ?? []) as ColumnRow[];
  const taskRows = (tasksResult.data ?? []) as TaskRow[];
  const assigneeRows = (assigneesResult.data ?? []) as AssigneeRow[];
  const snapshot: BoardSnapshot = {
    boardTitle: boardResult.data.title,
    boardColor: boardResult.data.color,
    columns: columnRows.map((column) => ({
      id: column.id,
      title: column.title,
      taskIds: taskRows
        .filter((task) => task.column_id === column.id)
        .sort((left, right) => left.position - right.position)
        .map((task) => task.id),
    })),
    tasks: Object.fromEntries(taskRows.map((task) => [task.id, {
      id: task.id,
      title: task.title,
      assignee: task.assignee ?? undefined,
      description: task.description ?? undefined,
      dueDate: task.due_date ?? undefined,
      completedAt: task.completed_at ?? undefined,
    }])),
    assignees: assigneeRows.map((assignee) => assignee.name),
    assigneeColors: Object.fromEntries(assigneeRows.map((assignee) => [assignee.name, assignee.color])),
  };

  remoteSnapshots.set(boardId, cloneSnapshot(snapshot));

  return {
    data: {
      id: boardResult.data.id,
      snapshot,
      updatedAt: boardResult.data.updated_at,
    } satisfies RemoteBoard,
    error: null,
  };
};

export async function listBoardsFromSupabase() {
  const supabase = getSupabase();
  if (!supabase) return { data: [] as BoardMeta[], error: null };

  const { data, error } = await supabase
    .from("boards")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false });

  return {
    data: (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      updatedAt: row.updated_at,
    })),
    error,
  };
}

export async function loadBoardFromSupabase(boardId = DEFAULT_BOARD_ID) {
  return loadNormalizedBoard(boardId);
}

export async function saveBoardToSupabase(boardId: string, snapshot: BoardSnapshot) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: null };

  const snapshotToSave = cloneSnapshot(snapshot);
  const patch = buildPatch(snapshotToSave, remoteSnapshots.get(boardId));
  const previousSave = saveQueues.get(boardId) ?? Promise.resolve();
  const save = previousSave.then(async () => {
    const { error } = await supabase.rpc("apply_board_patch", {
      p_board_id: boardId,
      p_snapshot: snapshotToSave,
      p_patch: patch,
    });

    if (error) return { data: null, error };
    return loadNormalizedBoard(boardId);
  });

  saveQueues.set(boardId, save.then(() => undefined, () => undefined));
  return save;
}

export async function deleteBoardFromSupabase(boardId: string) {
  const supabase = getSupabase();
  if (!supabase) return { error: null };

  const { error } = await supabase
    .from("boards")
    .delete()
    .eq("id", boardId);

  if (!error) {
    remoteSnapshots.delete(boardId);
    saveQueues.delete(boardId);
  }

  return { error };
}

export function subscribeToBoardChanges(boardId: string, onChange: () => void) {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const channel = supabase
    .channel(`board-changes:${boardId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "boards", filter: `id=eq.${boardId}` },
      onChange,
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
