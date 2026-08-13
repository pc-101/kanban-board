"use client";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { colorForAssignee, UNASSIGNED_COLOR } from "@/lib/assignee-colors";
import { Task, useBoard } from "@/lib/board-store";
import SelectMenu from "./select-menu";

type TaskForm = {
  title: string;
  assignee: string;
  dueDate: string;
  description: string;
};

export default function TaskDetailModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const assignees = useBoard((state) => state.assignees);
  const assigneeColors = useBoard((state) => state.assigneeColors);
  const updateTask = useBoard((state) => state.updateTask);
  const [mounted, setMounted] = useState(false);
  const [isAssigneeMenuOpen, setIsAssigneeMenuOpen] = useState(false);
  const [form, setForm] = useState<TaskForm>({
    title: task.title,
    assignee: task.assignee ?? "",
    dueDate: task.dueDate ?? "",
    description: task.description ?? "",
  });

  const assigneeOptions = task.assignee && !assignees.includes(task.assignee)
    ? [...assignees, task.assignee]
    : assignees;
  const assigneeMenuOptions = [
    { value: "", label: "Unassigned", color: UNASSIGNED_COLOR },
    ...assigneeOptions.map((assignee) => ({
      value: assignee,
      label: assignee,
      color: colorForAssignee(assignee, assigneeColors),
    })),
  ];
  const completedLabel = useMemo(() => {
    if (!task.completedAt) return null;
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(task.completedAt));
  }, [task.completedAt]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isAssigneeMenuOpen) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isAssigneeMenuOpen, onClose]);

  const saveTask = () => {
    if (!form.title.trim()) return;
    updateTask(task.id, {
      title: form.title.trim(),
      assignee: form.assignee || undefined,
      dueDate: form.dueDate || undefined,
      description: form.description.trim() || undefined,
    });
    onClose();
  };

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-detail-title"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl border bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Task details</p>
            <h2 id="task-detail-title" className="mt-1 text-xl font-semibold text-slate-950 dark:text-slate-50">
              {task.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Close task details"
          >
            x
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Title</span>
            <input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:border-sky-400 dark:border-slate-700"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Assignee</span>
              <SelectMenu
                value={form.assignee}
                options={assigneeMenuOptions}
                onChange={(assignee) => setForm((current) => ({ ...current, assignee }))}
                onOpenChange={setIsAssigneeMenuOpen}
                ariaLabel="Select assignee"
                className="h-10 w-full"
              />
            </div>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Due date</span>
              <input
                type="date"
                value={form.dueDate}
                onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:border-sky-400 dark:border-slate-700"
              />
            </label>
          </div>

          {completedLabel ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
              Completed on {completedLabel}
            </div>
          ) : null}

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Description</span>
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Add context, acceptance notes, or blockers."
              rows={6}
              className="w-full resize-none rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:border-sky-400 dark:border-slate-700"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border px-4 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={saveTask}
            disabled={!form.title.trim()}
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modal, document.body);
}
