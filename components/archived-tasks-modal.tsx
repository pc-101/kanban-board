"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Task, useBoard } from "@/lib/board-store";
import { ArchiveIcon, XIcon } from "./ui-icons";

const RESTORE_COOLDOWN_MS = 300;

const formatTimestamp = (value?: string) => {
  if (!value) return null;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export default function ArchivedTasksModal({ tasks, onClose }: { tasks: Task[]; onClose: () => void }) {
  const restoreTask = useBoard((state) => state.restoreTask);
  const [isRestoreCoolingDown, setIsRestoreCoolingDown] = useState(false);
  const [restoredTaskTitle, setRestoredTaskTitle] = useState("");
  const restoreCooldown = useRef<ReturnType<typeof setTimeout>>();
  const sortedTasks = [...tasks].sort((left, right) => (
    new Date(right.archivedAt ?? 0).getTime() - new Date(left.archivedAt ?? 0).getTime()
  ));

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  useEffect(() => () => {
    if (restoreCooldown.current) clearTimeout(restoreCooldown.current);
  }, []);

  const handleRestore = (task: Task) => {
    if (isRestoreCoolingDown) return;

    setIsRestoreCoolingDown(true);
    setRestoredTaskTitle(task.title);
    restoreTask(task.id);

    if (tasks.length === 1) {
      onClose();
      return;
    }

    restoreCooldown.current = setTimeout(() => {
      setIsRestoreCoolingDown(false);
    }, RESTORE_COOLDOWN_MS);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 px-4 pb-6 pt-[clamp(1rem,8vh,5rem)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="archived-tasks-title"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-950 dark:text-slate-50">
              <ArchiveIcon />
              <h2 id="archived-tasks-title" className="text-lg font-semibold">Archived tasks</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Completed tasks are archived automatically after 14 days.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Close archived tasks"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 max-h-96 space-y-2 overflow-y-auto [scrollbar-gutter:stable]">
          {sortedTasks.map((task) => (
            <div key={task.id} className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{task.title}</p>
                <div className="mt-1 space-x-2 text-xs text-slate-500 dark:text-slate-400">
                  {task.completedAt ? <span>Completed {formatTimestamp(task.completedAt)}</span> : null}
                  <span>Archived {formatTimestamp(task.archivedAt)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRestore(task)}
                disabled={isRestoreCoolingDown}
                className="mt-0.5 shrink-0 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-sky-300 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-sky-700 dark:hover:bg-slate-900"
              >
                Restore
              </button>
            </div>
          ))}
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          {restoredTaskTitle ? `${restoredTaskTitle} restored.` : ""}
        </p>
      </div>
    </div>,
    document.body,
  );
}
