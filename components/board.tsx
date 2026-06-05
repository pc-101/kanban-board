"use client";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { useEffect, useMemo } from "react";
import { useBoard } from "@/lib/board-store";
import AssigneeManager from "./assignee-manager";
import BoardColorPicker from "./board-color-picker";
import ColumnView from "./column";

export default function Board() {
  const columns = useBoard((state) => state.columns);
  const hydrate = useBoard((state) => state.hydrate);
  const syncFromRemote = useBoard((state) => state.syncFromRemote);
  const boardColor = useBoard((state) => state.boardColor);
  const isLoading = useBoard((state) => state.isLoading);
  const isSyncing = useBoard((state) => state.isSyncing);
  const syncError = useBoard((state) => state.syncError);

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

  const { accent, subtleAccent } = useMemo(() => {
    if (boardColor.startsWith("#") && boardColor.length === 7) {
      return {
        accent: boardColor,
        subtleAccent: `${boardColor}33`,
      };
    }
    return { accent: boardColor, subtleAccent: boardColor };
  }, [boardColor]);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    const fromColId = source.droppableId;
    const toColId = destination.droppableId;
    const toIndex = destination.index;
    useBoard.getState().moveTask(draggableId, fromColId, toColId, toIndex);
  };

  return (
    <>
      <div className="mb-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <BoardColorPicker />
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {syncError ? <span className="text-rose-500">Sync error: {syncError}</span> : null}
            {!syncError && isLoading ? <span>Loading board...</span> : null}
            {!syncError && !isLoading && isSyncing ? <span>Saving...</span> : null}
          </div>
        </div>
        <AssigneeManager />
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => (
            <Droppable droppableId={col.id} key={col.id}>
              {(provided, snapshot) => {
                const isActive = snapshot.isDraggingOver;
                return (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="w-80 shrink-0 rounded-xl border-2 bg-white p-3 transition-shadow dark:border-slate-800 dark:bg-slate-900"
                    style={{
                      borderColor: isActive ? accent : subtleAccent,
                    }}
                  >
                    <ColumnView column={col} />
                    {provided.placeholder}
                  </div>
                );
              }}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </>
  );
}
