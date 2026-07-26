"use client";
import { useEffect, useState } from "react";
import { useBoard } from "@/lib/board-store";

function PencilIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
    >
      <path
        d="M13.6 3.6a1.7 1.7 0 0 1 2.4 2.4l-8.7 8.7-3.2.8.8-3.2 8.7-8.7Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

export default function BoardTitle() {
  const boardTitle = useBoard((state) => state.boardTitle);
  const renameBoard = useBoard((state) => state.renameBoard);
  const [draftTitle, setDraftTitle] = useState(boardTitle);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setDraftTitle(boardTitle);
    setIsEditing(false);
  }, [boardTitle]);

  const saveTitle = () => {
    const trimmed = draftTitle.trim();
    if (!trimmed) {
      setDraftTitle(boardTitle);
      setIsEditing(false);
      return;
    }

    if (trimmed !== boardTitle) renameBoard(trimmed);
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setDraftTitle(boardTitle);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex h-10 min-w-0 items-center gap-2 overflow-hidden">
        <input
          value={draftTitle}
          onChange={(event) => setDraftTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") saveTitle();
            if (event.key === "Escape") cancelEdit();
          }}
          autoFocus
          aria-label="Rename board"
          className="h-10 min-w-0 max-w-full rounded-md border bg-transparent px-2 text-2xl font-semibold outline-none focus:border-sky-400 dark:border-slate-700"
        />
        <button
          type="button"
          onClick={saveTitle}
          className="h-8 rounded-md border border-emerald-600 bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-700 dark:border-emerald-500 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
        >
          Save
        </button>
        <button
          type="button"
          onClick={cancelEdit}
          className="h-8 rounded-md border border-rose-300 bg-rose-50 px-3 text-sm font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-10 min-w-0 items-center gap-2">
      <h1 className="truncate text-2xl font-semibold">{boardTitle}</h1>
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        aria-label="Edit board name"
        title="Edit board name"
        className="rounded-md border p-1.5 text-slate-500 hover:bg-black/5 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100"
      >
        <PencilIcon />
      </button>
    </div>
  );
}
