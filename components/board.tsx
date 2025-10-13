"use client";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { useEffect, type CSSProperties } from "react";
import { useBoard } from "@/lib/board-store";
import ColumnView from "./column";
import BoardColorPicker from "./board-color-picker";

export default function Board() {
  const columns = useBoard((state) => state.columns);
  const hydrate = useBoard((state) => state.hydrate);
  const boardColor = useBoard((state) => state.boardColor);
  useEffect(() => { hydrate(); }, [hydrate]);
  const softBorderColor = boardColor.startsWith("#") && boardColor.length === 7 ? `${boardColor}33` : boardColor;

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
        <div
          className="overflow-hidden rounded-3xl border bg-white/70 shadow-sm ring-1 ring-inset ring-black/5 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/30 dark:ring-white/10"
          style={{ borderColor: boardColor }}
          >
          <div className="h-1.5 w-full" style={{ backgroundColor: boardColor }} />
          <div className="flex gap-4 overflow-x-auto px-4 pb-4 pt-6">
            {columns.map((col) => (
              <Droppable droppableId={col.id} key={col.id}>
                {(provided, snapshot) => {
                  const style: CSSProperties & { "--tw-ring-color"?: string } = snapshot.isDraggingOver
                  ? { borderColor: boardColor, "--tw-ring-color": boardColor }
                  : { borderColor: softBorderColor };
                  return (
                    <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`w-80 shrink-0 rounded-xl border bg-white/90 p-3 transition-shadow dark:bg-slate-900/80 ${snapshot.isDraggingOver ? "ring-2" : ""}`}
                    style={style}
                    >
                      <ColumnView column={col} />
                      {provided.placeholder}
                    </div>
                  );
                }}
              </Droppable>
            ))}
          </div>
        </div>
      </DragDropContext>
    </>
  );
}
