"use client";
import { Draggable } from "@hello-pangea/dnd";
import { useState } from "react";
import { useBoard, Column } from "@/lib/board-store";
import TaskCard from "./task-card";

export default function ColumnView({ column }: { column: Column }) {
  const { tasks, addTask, renameColumn } = useBoard();
  const [value, setValue] = useState("");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <input
          className="w-48 rounded-md border bg-transparent px-2 py-1 text-sm outline-none dark:border-slate-700"
          value={column.title}
          onChange={(e) => renameColumn(column.id, e.target.value)}
        />
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">{column.taskIds.length}</span>
      </div>

      <div className="space-y-2">
        {column.taskIds.map((id, idx) => (
          <Draggable draggableId={id} index={idx} key={id}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                <TaskCard task={tasks[id]} columnId={column.id} />
              </div>
            )}
          </Draggable>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!value.trim()) return;
          addTask(column.id, value.trim());
          setValue("");
        }}
        className="flex gap-2"
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Add task…"
          className="flex-1 rounded-md border bg-transparent px-2 py-1 text-sm outline-none dark:border-slate-700"
        />
        <button className="rounded-md border px-3 py-1 text-sm hover:bg-black/5 dark:border-slate-700 dark:hover:bg-white/5">
          Add
        </button>
      </form>
    </div>
  );
}
