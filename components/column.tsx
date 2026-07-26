"use client";
import { Draggable, DraggableProvidedDraggableProps, DraggableStateSnapshot } from "@hello-pangea/dnd";
import { ReactNode, useMemo, useState } from "react";
import { useBoard, Column } from "@/lib/board-store";
import TaskCard from "./task-card";

const alpha = (color: string, opacity: string) => color.startsWith("#") && color.length === 7 ? `${color}${opacity}` : color;

const getDraggableStyle = (
  style: DraggableProvidedDraggableProps["style"],
  snapshot: DraggableStateSnapshot,
) => {
  if (!snapshot.isDropAnimating) return style;

  return {
    ...style,
    transitionDuration: "0.001s",
  };
};

function AddIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function DoneIcon({ color }: { color: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
      <circle cx="10" cy="10" r="6.6" stroke={color} strokeWidth="1.8" />
      <path d="m6.9 10.2 2 2 4.2-4.5" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function TodoIcon({ color }: { color: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 15 15" fill="none" className="h-[13px] w-[13px]">
      <path
        d="M14,7.5c0,3.5899-2.9101,6.5-6.5,6.5S1,11.0899,1,7.5S3.9101,1,7.5,1S14,3.9101,14,7.5z"
        stroke={color}
        strokeWidth="1.45"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function ProgressIcon({ color }: { color: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 15 15" className="h-[13px] w-[13px]">
      <path
        d="M14,7.5c0,3.5899-2.9101,6.5-6.5,6.5S1,11.0899,1,7.5S3.9101,1,7.5,1S14,3.9101,14,7.5z"
        fill={alpha(color, "35")}
        stroke={color}
        strokeWidth="1.45"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export default function ColumnView({
  column,
  isDraggingOver,
  placeholder,
}: {
  column: Column;
  isDraggingOver: boolean;
  placeholder: ReactNode;
}) {
  const { tasks, addTask, renameColumn, clearColumnTasks, boardColor } = useBoard();
  const [value, setValue] = useState("");
  const normalizedTitle = column.title.trim().toLowerCase();
  const isDoneColumn = normalizedTitle === "done";
  const isProgressColumn = normalizedTitle.includes("progress") || normalizedTitle.includes("doing");

  const styles = useMemo(() => ({
    columnBg: `linear-gradient(180deg, ${alpha(boardColor, "12")} 0%, ${alpha(boardColor, "08")} 42%, ${alpha(boardColor, "05")} 100%)`,
    countBg: alpha(boardColor, "18"),
    countText: boardColor,
    inputBorder: alpha(boardColor, "2E"),
    addBg: alpha(boardColor, "0D"),
    previewBg: alpha(boardColor, "0A"),
    previewBorder: alpha(boardColor, "66"),
  }), [boardColor]);

  return (
    <div className="-m-4 min-h-72 rounded-xl p-4" style={{ background: styles.columnBg }}>
      <div className="-mx-4 -mt-4 rounded-t-xl px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0">
              {isDoneColumn ? <DoneIcon color={boardColor} /> : isProgressColumn ? <ProgressIcon color={boardColor} /> : <TodoIcon color={boardColor} />}
            </span>
            <input
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-950 outline-none dark:text-slate-100"
              value={column.title}
              onChange={(e) => renameColumn(column.id, e.target.value)}
              aria-label="Column title"
            />
          </div>
          <span
            className="inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-semibold"
            style={{ backgroundColor: styles.countBg, color: styles.countText }}
          >
            {column.taskIds.length}
          </span>
        </div>
        {isDoneColumn && column.taskIds.length > 0 ? (
          <button
            type="button"
            onClick={() => clearColumnTasks(column.id)}
            className="mt-2 rounded-md border px-2 py-1 text-xs font-medium text-slate-500 hover:bg-white/60 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-white/5"
          >
            Clear all
          </button>
        ) : null}
      </div>

      <div className="relative space-y-2">
        {column.taskIds.map((id, idx) => (
          <Draggable draggableId={id} index={idx} key={id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                style={getDraggableStyle(provided.draggableProps.style, snapshot)}
              >
                <TaskCard task={tasks[id]} columnId={column.id} />
              </div>
            )}
          </Draggable>
        ))}
        {column.taskIds.length === 0 && isDraggingOver ? (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-24 rounded-lg border-2 border-dashed"
            style={{
              backgroundColor: styles.previewBg,
              borderColor: styles.previewBorder,
            }}
            aria-hidden="true"
          />
        ) : null}
        {placeholder}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!value.trim()) return;
          addTask(column.id, value.trim());
          setValue("");
        }}
        className="mt-5 flex overflow-hidden rounded-lg border bg-white/60 dark:bg-slate-950/30"
        style={{ borderColor: styles.inputBorder }}
      >
        <div className="flex flex-1 items-center gap-2 px-3 text-slate-500 dark:text-slate-400">
          <AddIcon />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Add task..."
            className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
        <button
          className="border-l px-4 text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/5"
          style={{ borderColor: styles.inputBorder, color: boardColor, backgroundColor: styles.addBg }}
        >
          Add
        </button>
      </form>
    </div>
  );
}
