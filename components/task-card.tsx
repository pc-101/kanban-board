"use client";
import { KeyboardEvent, useMemo, useState } from "react";
import { colorForAssignee } from "@/lib/assignee-colors";
import { useBoard, Task } from "@/lib/board-store";
import TaskDetailModal from "./task-detail-modal";
import { XIcon } from "./ui-icons";

export default function TaskCard({ task, columnId }: { task: Task; columnId: string }) {
  const removeTask = useBoard((state) => state.removeTask);
  const assigneeColors = useBoard((state) => state.assigneeColors);
  const [isOpen, setIsOpen] = useState(false);
  const completedLabel = useMemo(() => {
    if (!task.completedAt) return null;
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(task.completedAt));
  }, [task.completedAt]);

  const openFromKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(true)}
        onKeyDown={openFromKeyboard}
        className="w-full cursor-pointer rounded-lg border bg-white p-3 text-left shadow-sm transition hover:border-sky-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-700"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{task.title}</p>
            <div className="flex flex-wrap gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              {task.assignee ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: colorForAssignee(task.assignee, assigneeColors) }}
                    aria-hidden="true"
                  />
                  {task.assignee}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-400" aria-hidden="true" />
                  Unassigned
                </span>
              )}
              {task.dueDate ? <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">Due {task.dueDate}</span> : null}
              {completedLabel ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">Completed {completedLabel}</span> : null}
            </div>
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              removeTask(task.id, columnId);
            }}
            className="rounded-full p-1 text-slate-400 hover:bg-black/10 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100"
            aria-label="Delete task"
          >
            <XIcon />
          </button>
        </div>
      </div>
      {isOpen ? <TaskDetailModal task={task} onClose={() => setIsOpen(false)} /> : null}
    </>
  );
}
