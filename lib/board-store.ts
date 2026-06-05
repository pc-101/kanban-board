"use client";
import { create } from "zustand";
import { nanoid } from "nanoid";
import { loadBoardFromSupabase, saveBoardToSupabase, type BoardSnapshot } from "./supabase-board";

export type Task = {
  id: string;
  title: string;
  assignee?: string;
  description?: string;
  dueDate?: string;
};
export type Column = { id: string; title: string; taskIds: string[] };
export type BoardState = {
  boardColor: string;
  columns: Column[];
  tasks: Record<string, Task>;
  isLoading: boolean;
  isSyncing: boolean;
  syncError?: string;
  addTask: (columnId: string, title: string) => void;
  moveTask: (taskId: string, fromColId: string, toColId: string, toIndex: number) => void;
  renameColumn: (columnId: string, title: string) => void;
  addColumn: (title: string) => void;
  removeTask: (taskId: string, columnId: string) => void;
  updateTask: (taskId: string, updates: Partial<Omit<Task, "id">>) => void;
  hydrate: () => Promise<void>;
  persist: () => Promise<void>;
  setBoardColor: (color: string) => void;
};

const STORAGE_KEY = "kanban-board:v1";
const DEFAULT_BOARD_COLOR = "#0ea5e9";

const initial = () => {
  const todoId = nanoid(6);
  const doingId = nanoid(6);
  const doneId = nanoid(6);
  const t1 = nanoid(6), t2 = nanoid(6), t3 = nanoid(6), t4 = nanoid(6);
  return {
    boardColor: DEFAULT_BOARD_COLOR,
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

const snapshotFromState = (state: BoardState): BoardSnapshot => ({
  columns: state.columns,
  tasks: state.tasks,
  boardColor: state.boardColor,
});

const readLocalSnapshot = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as Partial<BoardSnapshot> : null;
  } catch {
    return null;
  }
};

const writeLocalSnapshot = (snapshot: BoardSnapshot) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
};

export const useBoard = create<BoardState>((set, get) => ({
  ...initial(),
  isLoading: false,
  isSyncing: false,
  hydrate: async () => {
    if (typeof window === "undefined") return;

    const local = readLocalSnapshot();
    if (local) {
      set((state) => ({
        ...state,
        columns: local.columns ?? state.columns,
        tasks: local.tasks ?? state.tasks,
        boardColor: local.boardColor ?? state.boardColor ?? DEFAULT_BOARD_COLOR,
      }));
    }

    set({ isLoading: true, syncError: undefined });
    const { data, error } = await loadBoardFromSupabase();

    if (error) {
      set({ isLoading: false, syncError: error.message });
      return;
    }

    if (data) {
      set((state) => ({
        ...state,
        ...data,
        isLoading: false,
        syncError: undefined,
      }));
      writeLocalSnapshot(data);
      return;
    }

    set({ isLoading: false });
    void get().persist();
  },
  persist: async () => {
    const snapshot = snapshotFromState(get());
    writeLocalSnapshot(snapshot);

    set({ isSyncing: true, syncError: undefined });
    const { error } = await saveBoardToSupabase(snapshot);
    set({ isSyncing: false, syncError: error?.message });
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
  moveTask: (taskId, fromColId, toColId, toIndex) => {
    set((s) => {
      const from = s.columns.find(c => c.id === fromColId)!;
      const to = s.columns.find(c => c.id === toColId)!;
      from.taskIds = from.taskIds.filter(id => id !== taskId);
      const next = [...to.taskIds];
      next.splice(toIndex, 0, taskId);
      to.taskIds = next;
      return { ...s };
    });
    void get().persist();
  },
  setBoardColor: (color) => {
    set(() => ({ boardColor: color }));
    void get().persist();
  },
}));
