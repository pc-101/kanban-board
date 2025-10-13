"use client";
import { useBoard } from "@/lib/board-store";

const PALETTE = [
  { name: "Sky", value: "#0ea5e9" },
  { name: "Rose", value: "#fb7185" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Emerald", value: "#34d399" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Slate", value: "#64748b" },
];

export default function BoardColorPicker() {
  const boardColor = useBoard((state) => state.boardColor);
  const setBoardColor = useBoard((state) => state.setBoardColor);

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500 sm:inline">Color</span>
      <div className="flex items-center gap-1">
        {PALETTE.map((swatch) => {
          const isActive = swatch.value.toLowerCase() === boardColor.toLowerCase();
          return (
            <button
              key={swatch.value}
              type="button"
              aria-label={`Set board color to ${swatch.name}`}
              aria-pressed={isActive}
              onClick={() => setBoardColor(swatch.value)}
              className={`h-5 w-5 rounded-full border transition focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 dark:focus:ring-slate-500 ${isActive ? "ring-2 ring-offset-1 ring-slate-400 dark:ring-slate-500" : "border-slate-200 hover:scale-110 dark:border-slate-700"}`}
              style={{ backgroundColor: swatch.value }}
            />
          );
        })}
      </div>
    </div>
  );
}
