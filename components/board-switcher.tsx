"use client";
import { FormEvent, useEffect, useState } from "react";
import { useBoard } from "@/lib/board-store";

export default function BoardSwitcher() {
  const activeBoardId = useBoard((state) => state.activeBoardId);
  const boardTitle = useBoard((state) => state.boardTitle);
  const boards = useBoard((state) => state.boards);
  const createBoard = useBoard((state) => state.createBoard);
  const switchBoard = useBoard((state) => state.switchBoard);
  const renameBoard = useBoard((state) => state.renameBoard);
  const [title, setTitle] = useState("");
  const [boardName, setBoardName] = useState(boardTitle);

  useEffect(() => {
    setBoardName(boardTitle);
  }, [boardTitle]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;
    void createBoard(title);
    setTitle("");
  };

  const saveBoardName = () => {
    const trimmed = boardName.trim();
    if (!trimmed) {
      setBoardName(boardTitle);
      return;
    }
    if (trimmed !== boardTitle) renameBoard(trimmed);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Board</span>
        <select
          value={activeBoardId}
          onChange={(event) => void switchBoard(event.target.value)}
          className="min-w-44 rounded-md border bg-white px-3 py-1.5 text-sm outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-950"
          aria-label="Select board"
        >
          {boards.map((board) => (
            <option value={board.id} key={board.id}>{board.title}</option>
          ))}
        </select>
      </div>

      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="New project board"
          className="w-44 rounded-md border bg-transparent px-2 py-1.5 text-sm outline-none focus:border-sky-400 dark:border-slate-700"
        />
        <button
          type="submit"
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-black/5 dark:border-slate-700 dark:hover:bg-white/5"
        >
          Create
        </button>
      </form>

      <label className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Name</span>
        <input
          value={boardName}
          onChange={(event) => setBoardName(event.target.value)}
          onBlur={saveBoardName}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
            if (event.key === "Escape") {
              setBoardName(boardTitle);
              event.currentTarget.blur();
            }
          }}
          aria-label="Rename board"
          className="w-48 rounded-md border bg-transparent px-2 py-1.5 text-sm font-medium outline-none focus:border-sky-400 dark:border-slate-700"
        />
      </label>
    </div>
  );
}
