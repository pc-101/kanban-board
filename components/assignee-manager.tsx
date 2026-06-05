"use client";
import { FormEvent, useState } from "react";
import { useBoard } from "@/lib/board-store";

export default function AssigneeManager() {
  const assignees = useBoard((state) => state.assignees);
  const addAssignee = useBoard((state) => state.addAssignee);
  const removeAssignee = useBoard((state) => state.removeAssignee);
  const [name, setName] = useState("");

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    addAssignee(name);
    setName("");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="New assignee"
          className="w-36 rounded-md border bg-transparent px-2 py-1 text-sm outline-none focus:border-sky-400 dark:border-slate-700"
        />
        <button
          type="submit"
          className="rounded-md border px-3 py-1 text-sm hover:bg-black/5 dark:border-slate-700 dark:hover:bg-white/5"
        >
          Add
        </button>
      </form>

      <div className="flex flex-wrap gap-1.5">
        {assignees.map((assignee) => (
          <span
            key={assignee}
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {assignee}
            <button
              type="button"
              onClick={() => removeAssignee(assignee)}
              className="rounded-full px-1 text-slate-400 hover:bg-black/10 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-100"
              aria-label={`Remove ${assignee}`}
            >
              x
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
