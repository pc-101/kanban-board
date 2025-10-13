"use client";
import { useBoard, Task } from "@/lib/board-store";

export default function TaskCard({ task, columnId }: { task: Task; columnId: string }) {
  const { removeTask } = useBoard();
  return (
    <div className="rounded-lg border bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-slate-900 dark:text-slate-100">{task.title}</p>
        <button
          onClick={() => removeTask(task.id, columnId)}
          className="rounded-md px-2 py-0.5 text-xs text-slate-500 hover:bg-black/5 dark:text-slate-400 dark:hover:bg-white/5"
          aria-label="Delete task"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
