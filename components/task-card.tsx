"use client";
import { KeyboardEvent, useState } from "react";
import { useBoard, Task } from "@/lib/board-store";
import TaskDetailModal from "./task-detail-modal";

export default function TaskCard({ task, columnId }: { task: Task; columnId: string }) {
  const removeTask = useBoard((state) => state.removeTask);
  const [isOpen, setIsOpen] = useState(false);

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
              {task.assignee ? <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">{task.assignee}</span> : null}
              {task.dueDate ? <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">Due {task.dueDate}</span> : null}
            </div>
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              removeTask(task.id, columnId);
            }}
            className="rounded-md px-2 py-0.5 text-xs text-slate-500 hover:bg-black/5 dark:text-slate-400 dark:hover:bg-white/5"
            aria-label="Delete task"
          >
            x
          </button>
        </div>
      </div>
      {isOpen ? <TaskDetailModal task={task} onClose={() => setIsOpen(false)} /> : null}
    </>
  );
}
