"use client";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useEffect } from "react";
import { useBoard } from "@/lib/board-store";
import ColumnView from "./column";

export default function Board() {
  const { columns, hydrate } = useBoard();
  useEffect(() => { hydrate(); }, [hydrate]);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    const fromColId = source.droppableId;
    const toColId = destination.droppableId;
    const toIndex = destination.index;
    useBoard.getState().moveTask(draggableId, fromColId, toColId, toIndex);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <Droppable droppableId={col.id} key={col.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`w-80 shrink-0 rounded-xl border bg-white p-3 dark:border-slate-800 dark:bg-slate-900 ${snapshot.isDraggingOver ? "ring-2 ring-sky-400/50" : ""}`}
              >
                <ColumnView column={col} />
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
