"use client";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { useEffect, useMemo } from "react";
import { useBoard } from "@/lib/board-store";
import ColumnView from "./column";
import BoardColorPicker from "./board-color-picker";

export default function Board() {
  const columns = useBoard((state) => state.columns);
  const hydrate = useBoard((state) => state.hydrate);
  const boardColor = useBoard((state) => state.boardColor);
  useEffect(() => {
    hydrate();
  }, [hydrate]);

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
      <BoardColorPicker />
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
