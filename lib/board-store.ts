"use client";
import { create } from "zustand";
import { nanoid } from "nanoid";

export type Task = { id: string; title: string; description?: string };
export type Column = { id: string; title: string; taskIds: string[] };
export type BoardState = {
  columns: Column[];
  tasks: Record<string, Task>;
  addTask: (columnId: string, title: string) => void;
  moveTask: (taskId: string, fromColId: string, toColId: string, toIndex: number) => void;
  renameColumn: (columnId: string, title: string) => void;
  addColumn: (title: string) => void;
  removeTask: (taskId: string, columnId: string) => void;
  hydrate: () => void;
  persist: () => void;
};

const STORAGE_KEY = "kanban-board:v1";

const initial = () => {
  const todoId = nanoid(6);
  const doingId = nanoid(6);
  const doneId = nanoid(6);
  const t1 = nanoid(6), t2 = nanoid(6), t3 = nanoid(6);
  return {
    columns: [
      { id: todoId, title: "Todo", taskIds: [t1, t2] },
      { id: doingId, title: "In Progress", taskIds: [t3] },
      { id: doneId, title: "Done", taskIds: [] },
    ],
    tasks: {
      [t1]: { id: t1, title: "Design wireframes" },
      [t2]: { id: t2, title: "Set up CI" },
      [t3]: { id: t3, title: "Build Drag & Drop" },
    },
  };
};

export const useBoard = create<BoardState>((set, get) => ({
  ...initial(),
  hydrate: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) set(JSON.parse(raw));
    } catch {}
  },
  persist: () => {
    if (typeof window === "undefined") return;
    const { columns, tasks } = get();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ columns, tasks }));
  },
  addTask: (columnId, title) => {
    const id = nanoid(6);
    set((s) => {
      const col = s.columns.find(c => c.id === columnId)!;
      col.taskIds.unshift(id);
      s.tasks[id] = { id, title };
      return { ...s };
    });
    get().persist();
  },
  removeTask: (taskId, columnId) => {
    set((s) => {
      const col = s.columns.find(c => c.id === columnId)!;
      col.taskIds = col.taskIds.filter(id => id !== taskId);
      delete s.tasks[taskId];
      return { ...s };
    });
    get().persist();
  },
  renameColumn: (columnId, title) => {
    set((s) => {
      const col = s.columns.find(c => c.id === columnId);
      if (col) col.title = title;
      return { ...s };
    });
    get().persist();
  },
  addColumn: (title) => {
    const id = nanoid(6);
    set((s) => ({ ...s, columns: [...s.columns, { id, title, taskIds: [] }] }));
    get().persist();
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
    get().persist();
  },
}));
