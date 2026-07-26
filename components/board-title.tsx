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
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <input
          value={draftTitle}
          onChange={(event) => setDraftTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") saveTitle();
            if (event.key === "Escape") cancelEdit();
          }}
          autoFocus
          aria-label="Rename board"
          className="min-w-0 max-w-full rounded-md border bg-transparent px-2 py-1 text-2xl font-semibold outline-none focus:border-sky-400 dark:border-slate-700"
        />
        <button
          type="button"
          onClick={saveTitle}
          className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:border-slate-700 dark:hover:bg-white/5"
        >
          Save
        </button>
        <button
          type="button"
          onClick={cancelEdit}
          className="rounded-md border px-3 py-1.5 text-sm text-slate-600 hover:bg-black/5 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-white/5"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
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
