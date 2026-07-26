"use client";
import { create } from "zustand";
import { nanoid } from "nanoid";
import { colorForAssignee } from "./assignee-colors";
import {
  DEFAULT_BOARD_ID,
  deleteBoardFromSupabase,
  listBoardsFromSupabase,
  loadBoardFromSupabase,
  saveBoardToSupabase,
  type BoardMeta,
  type BoardSnapshot,
  type RemoteBoard,
} from "./supabase-board";

export type Task = {
  id: string;
  title: string;
  assignee?: string;
  description?: string;
  dueDate?: string;
  completedAt?: string;
};
export type Column = { id: string; title: string; taskIds: string[] };
export type BoardState = {
  activeBoardId: string;
  boardTitle: string;
  boardColor: string;
  assignees: string[];
  assigneeColors: Record<string, string>;
  boards: BoardMeta[];
  columns: Column[];
  tasks: Record<string, Task>;
  isLoading: boolean;
  isSyncing: boolean;
  lastRemoteUpdatedAt?: string;
  syncError?: string;
  addTask: (columnId: string, title: string) => void;
  moveTask: (taskId: string, fromColId: string, toColId: string, toIndex: number) => void;
  renameBoard: (title: string) => void;
  renameColumn: (columnId: string, title: string) => void;
  addColumn: (title: string) => void;
  addAssignee: (name: string, color?: string) => void;
  updateAssigneeColor: (name: string, color: string) => void;
  removeAssignee: (name: string) => void;
  removeTask: (taskId: string, columnId: string) => void;
  clearColumnTasks: (columnId: string) => void;
  updateTask: (taskId: string, updates: Partial<Omit<Task, "id">>) => void;
  createBoard: (title: string) => Promise<void>;
  duplicateBoard: (title: string) => Promise<void>;
  deleteBoard: (boardId: string) => Promise<void>;
  switchBoard: (boardId: string) => Promise<void>;
  hydrate: () => Promise<void>;
  persist: () => Promise<void>;
  syncFromRemote: () => Promise<void>;
  setBoardColor: (color: string) => void;
};

const STORAGE_PREFIX = "kanban-board:v2";
const LEGACY_STORAGE_KEY = "kanban-board:v1";
const ACTIVE_BOARD_KEY = `${STORAGE_PREFIX}:active`;
const DEFAULT_BOARD_COLOR = "#0ea5e9";
const DEFAULT_BOARD_TITLE = "Kanban Board";

const isDoneColumn = (column: Column) => column.title.trim().toLowerCase() === "done";

const createStarterSnapshot = (boardTitle = DEFAULT_BOARD_TITLE): BoardSnapshot => {
  const todoId = nanoid(6);
  const doingId = nanoid(6);
  const doneId = nanoid(6);
  const t1 = nanoid(6), t2 = nanoid(6), t3 = nanoid(6), t4 = nanoid(6);

  return {
    boardTitle,
    boardColor: DEFAULT_BOARD_COLOR,
    assignees: ["Pat", "Sam", "Alex"],
    assigneeColors: {
      Pat: "#3b82f6",
      Sam: "#fb7185",
      Alex: "#8b5cf6",
    },
    columns: [
      { id: todoId, title: "Todo", taskIds: [t1, t2] },
      { id: doingId, title: "In Progress", taskIds: [t3] },
      { id: doneId, title: "Done", taskIds: [t4] },
    ],
    tasks: {
      [t1]: {
        id: t1,
        title: "Design wireframes",
        assignee: "Pat",
        dueDate: "2026-05-22",
        description: "Sketch the first pass of the board layout and task detail flow.",
      },
      [t2]: {
        id: t2,
        title: "Set up CI",
        assignee: "Sam",
        dueDate: "2026-05-24",
        description: "Create a basic build workflow for pull requests and production deploys.",
      },
      [t3]: {
        id: t3,
        title: "Build Drag & Drop",
        assignee: "Alex",
        description: "Wire column reordering with @hello-pangea/dnd and persist changes locally.",
      },
      [t4]: {
        id: t4,
        title: "Brainstorm initial design",
        description: "Capture the first set of layout ideas and user flow notes.",
      },
    },
  };
};

const createEmptyBoardSnapshot = (boardTitle: string): BoardSnapshot => ({
  boardTitle,
  boardColor: DEFAULT_BOARD_COLOR,
  assignees: [],
  assigneeColors: {},
  columns: [
    { id: nanoid(6), title: "Todo", taskIds: [] },
    { id: nanoid(6), title: "In Progress", taskIds: [] },
    { id: nanoid(6), title: "Done", taskIds: [] },
  ],
  tasks: {},
});

const initialSnapshot = createStarterSnapshot();

const uniqueNames = (names: Array<string | undefined>) => {
  const seen = new Set<string>();
  return names.reduce<string[]>((result, name) => {
    const trimmed = name?.trim();
    if (!trimmed) return result;

    const key = trimmed.toLowerCase();
    if (seen.has(key)) return result;

    seen.add(key);
    result.push(trimmed);
    return result;
  }, []);
};

const normalizeSnapshot = (snapshot: Partial<BoardSnapshot>, fallback: BoardState): BoardSnapshot => {
  const tasks = snapshot.tasks ?? fallback.tasks;
  const assignees = snapshot.assignees?.length
    ? uniqueNames(snapshot.assignees)
    : uniqueNames(Object.values(tasks).map((task) => task.assignee));

  const sourceColors = snapshot.assigneeColors ?? fallback.assigneeColors ?? {};
  const assigneeColors = Object.fromEntries(
    assignees.map((assignee) => [assignee, sourceColors[assignee] ?? colorForAssignee(assignee)]),
  );

  return {
    boardTitle: snapshot.boardTitle ?? fallback.boardTitle ?? DEFAULT_BOARD_TITLE,
    columns: snapshot.columns ?? fallback.columns,
    tasks,
    boardColor: snapshot.boardColor ?? fallback.boardColor ?? DEFAULT_BOARD_COLOR,
    assignees,
    assigneeColors,
  };
};

const snapshotFromState = (state: BoardState): BoardSnapshot => ({
  boardTitle: state.boardTitle,
  columns: state.columns,
  tasks: state.tasks,
  boardColor: state.boardColor,
  assignees: state.assignees,
  assigneeColors: state.assigneeColors,
});

const boardStorageKey = (boardId: string) => `${STORAGE_PREFIX}:board:${boardId}`;

const readLocalSnapshot = (boardId: string) => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(boardStorageKey(boardId)) ?? (boardId === DEFAULT_BOARD_ID ? localStorage.getItem(LEGACY_STORAGE_KEY) : null);
    return raw ? JSON.parse(raw) as Partial<BoardSnapshot> : null;
  } catch {
    return null;
  }
};

const writeLocalSnapshot = (boardId: string, snapshot: BoardSnapshot) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(boardStorageKey(boardId), JSON.stringify(snapshot));
  localStorage.setItem(ACTIVE_BOARD_KEY, boardId);
};

const removeLocalSnapshot = (boardId: string) => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(boardStorageKey(boardId));
};

const remoteIsNewer = (remoteUpdatedAt?: string | null, currentUpdatedAt?: string) => {
  if (!remoteUpdatedAt) return true;
  if (!currentUpdatedAt) return true;
  return new Date(remoteUpdatedAt).getTime() > new Date(currentUpdatedAt).getTime();
};

const applyRemoteBoard = (remote: RemoteBoard, fallback: BoardState) => {
  const snapshot = normalizeSnapshot(remote.snapshot, fallback);
  writeLocalSnapshot(remote.id, snapshot);
  return {
    activeBoardId: remote.id,
    ...snapshot,
    lastRemoteUpdatedAt: remote.updatedAt ?? fallback.lastRemoteUpdatedAt,
    syncError: undefined,
  };
};

const mergeBoards = (boards: BoardMeta[], board: BoardMeta) => {
  const withoutBoard = boards.filter((item) => item.id !== board.id);
  return [board, ...withoutBoard];
};

export const useBoard = create<BoardState>((set, get) => ({
  activeBoardId: DEFAULT_BOARD_ID,
  ...initialSnapshot,
  boards: [{ id: DEFAULT_BOARD_ID, title: DEFAULT_BOARD_TITLE, updatedAt: null }],
  isLoading: false,
  isSyncing: false,
  hydrate: async () => {
    if (typeof window === "undefined") return;

    const storedBoardId = localStorage.getItem(ACTIVE_BOARD_KEY) || DEFAULT_BOARD_ID;
    set({ activeBoardId: storedBoardId });

    const local = readLocalSnapshot(storedBoardId);
    if (local) {
      set((state) => ({ ...state, ...normalizeSnapshot(local, state) }));
    }

    set({ isLoading: true, syncError: undefined });

    const boardList = await listBoardsFromSupabase();
    if (boardList.error) {
      set({ isLoading: false, syncError: boardList.error.message });
      return;
    }

    if (boardList.data.length) {
      set({ boards: boardList.data });
    }

    const selectedId = boardList.data.some((board) => board.id === storedBoardId)
      ? storedBoardId
      : boardList.data[0]?.id ?? storedBoardId;

    const { data, error } = await loadBoardFromSupabase(selectedId);

    if (error) {
      set({ isLoading: false, syncError: error.message });
      return;
    }

    if (data) {
      set((state) => ({
        ...state,
        ...applyRemoteBoard(data, state),
        isLoading: false,
      }));
      return;
    }

    set({ activeBoardId: selectedId, isLoading: false });
    void get().persist();
  },
  switchBoard: async (boardId) => {
    if (boardId === get().activeBoardId) return;

    set({ activeBoardId: boardId, isLoading: true, syncError: undefined, lastRemoteUpdatedAt: undefined });

    const local = readLocalSnapshot(boardId);
    if (local) {
      set((state) => ({ ...state, ...normalizeSnapshot(local, state) }));
    }

    const { data, error } = await loadBoardFromSupabase(boardId);

    if (error) {
      set({ isLoading: false, syncError: error.message });
      return;
    }

    if (data) {
      set((state) => ({
        ...state,
        ...applyRemoteBoard(data, state),
        isLoading: false,
      }));
      return;
    }

    set({ isLoading: false });
  },
  createBoard: async (title) => {
    const trimmed = title.trim();
    if (!trimmed) return;

    const boardId = `board-${nanoid(8)}`;
    const snapshot = createEmptyBoardSnapshot(trimmed);
    const boardMeta = { id: boardId, title: trimmed, updatedAt: null };

    set((state) => ({
      ...state,
      activeBoardId: boardId,
      ...snapshot,
      boards: mergeBoards(state.boards, boardMeta),
      lastRemoteUpdatedAt: undefined,
      syncError: undefined,
    }));
    writeLocalSnapshot(boardId, snapshot);
    await get().persist();
  },
  duplicateBoard: async (title) => {
    const current = get();
    const trimmed = title.trim();
    if (!trimmed) return;

    const boardId = `board-${nanoid(8)}`;
    const snapshot = {
      ...snapshotFromState(current),
      boardTitle: trimmed,
      columns: current.columns.map((column) => ({
        ...column,
        taskIds: [...column.taskIds],
      })),
      tasks: Object.fromEntries(
        Object.entries(current.tasks).map(([id, task]) => [id, { ...task }]),
      ),
      assignees: [...current.assignees],
      assigneeColors: { ...current.assigneeColors },
    };
    const boardMeta = { id: boardId, title: trimmed, updatedAt: null };

    set((state) => ({
      ...state,
      activeBoardId: boardId,
      ...snapshot,
      boards: mergeBoards(state.boards, boardMeta),
      lastRemoteUpdatedAt: undefined,
      syncError: undefined,
    }));
    writeLocalSnapshot(boardId, snapshot);
    await get().persist();
  },
  deleteBoard: async (boardId) => {
    const current = get();
    if (current.boards.length <= 1) return;

    const remainingBoards = current.boards.filter((board) => board.id !== boardId);
    const nextBoardId = current.activeBoardId === boardId
      ? remainingBoards[0]?.id
      : current.activeBoardId;

    if (!nextBoardId) return;

    removeLocalSnapshot(boardId);
    const { error } = await deleteBoardFromSupabase(boardId);

    set((state) => ({
      ...state,
      boards: remainingBoards,
      syncError: error?.message,
    }));

    if (current.activeBoardId === boardId) {
      await get().switchBoard(nextBoardId);
      return;
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(ACTIVE_BOARD_KEY, nextBoardId);
    }
  },
  syncFromRemote: async () => {
    const state = get();
    if (state.isLoading || state.isSyncing) return;

    const { data, error } = await loadBoardFromSupabase(state.activeBoardId);

    if (error) {
      set({ syncError: error.message });
      return;
    }

    if (!data || !remoteIsNewer(data.updatedAt, get().lastRemoteUpdatedAt)) return;

    set((current) => ({
      ...current,
      ...applyRemoteBoard(data, current),
    }));
  },
  persist: async () => {
    const state = get();
    const snapshot = snapshotFromState(state);
    writeLocalSnapshot(state.activeBoardId, snapshot);

    set({ isSyncing: true, syncError: undefined });
    const { data, error } = await saveBoardToSupabase(state.activeBoardId, snapshot);
    const updatedAt = data?.updatedAt ?? get().lastRemoteUpdatedAt;
    set((current) => ({
      isSyncing: false,
      lastRemoteUpdatedAt: updatedAt,
      syncError: error?.message,
      boards: mergeBoards(current.boards, { id: current.activeBoardId, title: current.boardTitle, updatedAt: updatedAt ?? null }),
    }));
  },
  addTask: (columnId, title) => {
    const id = nanoid(6);
    set((s) => {
      const col = s.columns.find(c => c.id === columnId)!;
      col.taskIds.unshift(id);
      s.tasks[id] = { id, title };
      return { ...s };
    });
    void get().persist();
  },
  removeTask: (taskId, columnId) => {
    set((s) => {
      const col = s.columns.find(c => c.id === columnId)!;
      col.taskIds = col.taskIds.filter(id => id !== taskId);
      delete s.tasks[taskId];
      return { ...s };
    });
    void get().persist();
  },
  clearColumnTasks: (columnId) => {
    set((s) => {
      const column = s.columns.find((col) => col.id === columnId);
      if (!column || column.taskIds.length === 0) return s;

      const taskIds = new Set(column.taskIds);
      const tasks = Object.fromEntries(
        Object.entries(s.tasks).filter(([id]) => !taskIds.has(id)),
      );

      return {
        ...s,
        columns: s.columns.map((col) => col.id === columnId ? { ...col, taskIds: [] } : col),
        tasks,
      };
    });
    void get().persist();
  },
  updateTask: (taskId, updates) => {
    set((s) => {
      const task = s.tasks[taskId];
      if (!task) return s;
      return {
        ...s,
        tasks: {
          ...s.tasks,
          [taskId]: { ...task, ...updates },
        },
      };
    });
    void get().persist();
  },
  renameBoard: (title) => {
    const trimmed = title.trim();
    if (!trimmed) return;

    set((s) => ({
      ...s,
      boardTitle: trimmed,
      boards: mergeBoards(s.boards, {
        id: s.activeBoardId,
        title: trimmed,
        updatedAt: s.lastRemoteUpdatedAt ?? null,
      }),
    }));
    void get().persist();
  },
  renameColumn: (columnId, title) => {
    set((s) => {
      const col = s.columns.find(c => c.id === columnId);
      if (col) col.title = title;
      return { ...s };
    });
    void get().persist();
  },
  addColumn: (title) => {
    const id = nanoid(6);
    set((s) => ({ ...s, columns: [...s.columns, { id, title, taskIds: [] }] }));
    void get().persist();
  },
  addAssignee: (name, color) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    set((s) => {
      const exists = s.assignees.some((assignee) => assignee.toLowerCase() === trimmed.toLowerCase());
      if (exists) return s;
      return {
        ...s,
        assignees: [...s.assignees, trimmed],
        assigneeColors: {
          ...s.assigneeColors,
          [trimmed]: color ?? colorForAssignee(trimmed, s.assigneeColors),
        },
      };
    });
    void get().persist();
  },
  updateAssigneeColor: (name, color) => {
    set((s) => {
      if (!s.assignees.includes(name)) return s;
      return {
        ...s,
        assigneeColors: {
          ...s.assigneeColors,
          [name]: color,
        },
      };
    });
    void get().persist();
  },
  removeAssignee: (name) => {
    set((s) => {
      const tasks = Object.fromEntries(
        Object.entries(s.tasks).map(([id, task]) => [
          id,
          task.assignee === name ? { ...task, assignee: undefined } : task,
        ]),
      );

      const { [name]: _removed, ...assigneeColors } = s.assigneeColors;

      return {
        ...s,
        assignees: s.assignees.filter((assignee) => assignee !== name),
        assigneeColors,
        tasks,
      };
    });
    void get().persist();
  },
  moveTask: (taskId, fromColId, toColId, toIndex) => {
    set((s) => {
      const from = s.columns.find(c => c.id === fromColId)!;
      const to = s.columns.find(c => c.id === toColId)!;
      const wasDone = isDoneColumn(from);
      const isNowDone = isDoneColumn(to);

      from.taskIds = from.taskIds.filter(id => id !== taskId);
      const next = [...to.taskIds];
      next.splice(toIndex, 0, taskId);
      to.taskIds = next;

      const task = s.tasks[taskId];
      if (task && !wasDone && isNowDone) {
        s.tasks[taskId] = { ...task, completedAt: new Date().toISOString() };
      }
      if (task && wasDone && !isNowDone) {
        s.tasks[taskId] = { ...task, completedAt: undefined };
      }

      return { ...s };
    });
    void get().persist();
  },
  setBoardColor: (color) => {
    set(() => ({ boardColor: color }));
    void get().persist();
  },
}));
