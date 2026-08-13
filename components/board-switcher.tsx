"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useBoard } from "@/lib/board-store";
import SelectMenu from "./select-menu";

type BoardAction = "create" | "duplicate" | "delete";

function DotsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <circle cx="4" cy="10" r="1.5" />
      <circle cx="10" cy="10" r="1.5" />
      <circle cx="16" cy="10" r="1.5" />
    </svg>
  );
}

export default function BoardSwitcher() {
  const activeBoardId = useBoard((state) => state.activeBoardId);
  const boardTitle = useBoard((state) => state.boardTitle);
  const boards = useBoard((state) => state.boards);
  const createBoard = useBoard((state) => state.createBoard);
  const duplicateBoard = useBoard((state) => state.duplicateBoard);
  const deleteBoard = useBoard((state) => state.deleteBoard);
  const switchBoard = useBoard((state) => state.switchBoard);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<BoardAction | null>(null);
  const [title, setTitle] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setActiveAction(null);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const openAction = (action: BoardAction) => {
    setActiveAction(action);
    setTitle(action === "duplicate" ? `${boardTitle} Copy` : "");
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setActiveAction(null);
    setTitle("");
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeAction) return;

    if (activeAction === "delete") {
      await deleteBoard(activeBoardId);
      closeMenu();
      return;
    }

    if (!title.trim()) return;
    if (activeAction === "create") await createBoard(title);
    if (activeAction === "duplicate") await duplicateBoard(title);
    closeMenu();
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Board</span>
        <SelectMenu
          value={activeBoardId}
          options={boards.map((board) => ({ value: board.id, label: board.title }))}
          onChange={(boardId) => void switchBoard(boardId)}
          ariaLabel="Select board"
          className="h-8 min-w-44 max-w-64"
        />
      </div>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label="Board actions"
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          className="rounded-md border p-2 text-slate-500 hover:bg-black/5 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100"
        >
          <DotsIcon />
        </button>

        {isMenuOpen ? (
          <div className="absolute left-0 top-10 z-30 w-72 rounded-md border bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-950">
            {!activeAction ? (
              <div className="grid gap-1">
                <button
                  type="button"
                  onClick={() => openAction("create")}
                  className="rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-900"
                >
                  New board
                </button>
                <button
                  type="button"
                  onClick={() => openAction("duplicate")}
                  className="rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-900"
                >
                  Duplicate current board
                </button>
                <button
                  type="button"
                  onClick={() => openAction("delete")}
                  disabled={boards.length <= 1}
                  className="rounded-md px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-300 dark:hover:bg-rose-950/40"
                >
                  Delete current board
                </button>
              </div>
            ) : activeAction === "delete" ? (
              <form onSubmit={onSubmit} className="space-y-5 p-3">
                <div className="space-y-2">
                  <p className="text-base font-semibold text-slate-900 dark:text-slate-100">Delete this board?</p>
                  <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                    This removes {boardTitle} from the app and database.
                  </p>
                </div>
                <div className="flex justify-end gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveAction(null)}
                    className="rounded-md border px-4 py-2 text-sm text-slate-600 hover:bg-black/5 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md border border-rose-600 bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 dark:border-rose-500 dark:bg-rose-500 dark:text-slate-950 dark:hover:bg-rose-400"
                  >
                    Delete
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={onSubmit} className="space-y-2">
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  {activeAction === "create" ? "New board name" : "Duplicate as"}
                </label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") closeMenu();
                  }}
                  autoFocus
                  aria-label={activeAction === "create" ? "New board name" : "Duplicate board name"}
                  className="w-full rounded-md border bg-transparent px-2 py-1.5 text-sm outline-none focus:border-sky-400 dark:border-slate-700"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveAction(null)}
                    className="rounded-md border px-3 py-1.5 text-sm text-slate-600 hover:bg-black/5 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-white/5"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="rounded-md border border-sky-600 bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700 dark:border-sky-500 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
                  >
                    {activeAction === "create" ? "Create" : "Duplicate"}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
