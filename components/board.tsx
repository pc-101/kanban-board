"use client";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { useEffect, useMemo } from "react";
import { useBoard } from "@/lib/board-store";
import { subscribeToBoardChanges } from "@/lib/supabase-board";
import AssigneeManager from "./assignee-manager";
import BoardColorPicker from "./board-color-picker";
import BoardSwitcher from "./board-switcher";
import BoardTitle from "./board-title";
import ColumnView from "./column";

const alpha = (color: string, opacity: string) => color.startsWith("#") && color.length === 7 ? `${color}${opacity}` : color;

function DragHintIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M10 3v14M3 10h14M6.5 6.5 3 10l3.5 3.5M13.5 6.5 17 10l-3.5 3.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

function SyncStatus() {
  const isLoading = useBoard((state) => state.isLoading);
  const isSyncing = useBoard((state) => state.isSyncing);
  const syncError = useBoard((state) => state.syncError);

  return (
    <div className="min-h-5 text-xs text-slate-500 dark:text-slate-400">
      {syncError ? <span className="text-rose-500">Sync error: {syncError}</span> : null}
      {!syncError && isLoading ? <span>Loading board...</span> : null}
      {!syncError && !isLoading && isSyncing ? <span>Saving...</span> : null}
    </div>
  );
}

export default function Board() {
  const columns = useBoard((state) => state.columns);
  const hydrate = useBoard((state) => state.hydrate);
  const syncFromRemote = useBoard((state) => state.syncFromRemote);
  const boardColor = useBoard((state) => state.boardColor);
  const activeBoardId = useBoard((state) => state.activeBoardId);

  useEffect(() => {
    void hydrate();

    const poll = () => {
      if (document.visibilityState === "visible") {
        void useBoard.getState().syncFromRemote();
      }
    };

    const interval = window.setInterval(poll, 10000);
    return () => window.clearInterval(interval);
  }, [hydrate, syncFromRemote]);

  useEffect(() => subscribeToBoardChanges(activeBoardId, () => {
    void useBoard.getState().syncFromRemote();
  }), [activeBoardId]);

  const { accent, subtleAccent, washAccent } = useMemo(() => ({
    accent: boardColor,
    subtleAccent: alpha(boardColor, "33"),
    washAccent: alpha(boardColor, "10"),
  }), [boardColor]);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    const fromColId = source.droppableId;
    const toColId = destination.droppableId;
    const toIndex = destination.index;
    useBoard.getState().moveTask(draggableId, fromColId, toColId, toIndex);
  };

  return (
    <section
      className="rounded-xl border bg-white/95 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/95"
      style={{
        backgroundImage: `radial-gradient(circle at 50% 0%, ${washAccent}, transparent 42%)`,
      }}
    >
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <BoardTitle />
          <SyncStatus />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <BoardSwitcher />
          <AssigneeManager />
        </div>

        <BoardColorPicker />
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-5 overflow-x-auto pb-4">
          {columns.map((col) => (
            <Droppable droppableId={col.id} key={col.id}>
              {(provided, snapshot) => {
                const isActive = snapshot.isDraggingOver;
                return (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="w-80 shrink-0 rounded-xl border bg-white/80 p-4 shadow-sm transition-shadow dark:bg-slate-900/70"
                    style={{
                      borderColor: isActive ? accent : subtleAccent,
                      boxShadow: isActive ? `0 16px 40px ${alpha(boardColor, "22")}` : undefined,
                    }}
                  >
                    <ColumnView column={col} isDraggingOver={isActive} placeholder={provided.placeholder} />
                  </div>
                );
              }}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      <p className="mt-1 inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <DragHintIcon />
        Drag tasks between columns. Changes save locally and sync through Supabase.
      </p>
    </section>
  );
}
