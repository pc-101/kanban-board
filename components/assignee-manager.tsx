"use client";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ASSIGNEE_COLOR_OPTIONS, colorForAssignee, initialsForAssignee } from "@/lib/assignee-colors";
import { useBoard } from "@/lib/board-store";
import { ChevronDownIcon, XIcon } from "./ui-icons";

function UsersIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M7.5 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 17a4.5 4.5 0 0 1 9 0" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
      <path d="M13 9.5a2.5 2.5 0 1 0 0-5M13.5 12.5A4 4 0 0 1 17 16.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 15 15" fill="none" className="h-4 w-4">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.07095 0.650238C6.67391 0.650238 6.32977 0.925096 6.24198 1.31231L6.0039 2.36247C5.6249 2.47269 5.26335 2.62363 4.92436 2.81013L4.01335 2.23585C3.67748 2.02413 3.23978 2.07312 2.95903 2.35386L2.35294 2.95996C2.0722 3.2407 2.0232 3.6784 2.23493 4.01427L2.80942 4.92561C2.62307 5.2645 2.47227 5.62594 2.36216 6.00481L1.31209 6.24287C0.924883 6.33065 0.650024 6.6748 0.650024 7.07183V7.92897C0.650024 8.32601 0.924883 8.67015 1.31209 8.75794L2.36228 8.99603C2.47246 9.375 2.62335 9.73652 2.80979 10.0755L2.2354 10.9867C2.02367 11.3225 2.07267 11.7602 2.35341 12.041L2.95951 12.6471C3.24025 12.9278 3.67795 12.9768 4.01382 12.7651L4.92506 12.1907C5.26384 12.377 5.62516 12.5278 6.0039 12.6379L6.24198 13.6881C6.32977 14.0753 6.67391 14.3502 7.07095 14.3502H7.92809C8.32512 14.3502 8.66927 14.0753 8.75705 13.6881L8.99505 12.6383C9.37411 12.5282 9.73573 12.3773 10.0748 12.1909L10.986 12.7653C11.3218 12.977 11.7595 12.928 12.0403 12.6473L12.6464 12.0412C12.9271 11.7604 12.9761 11.3227 12.7644 10.9869L12.1902 10.076C12.3768 9.73688 12.5278 9.37515 12.638 8.99596L13.6879 8.75794C14.0751 8.67015 14.35 8.32601 14.35 7.92897V7.07183C14.35 6.6748 14.0751 6.33065 13.6879 6.24287L12.6381 6.00488C12.528 5.62578 12.3771 5.26414 12.1906 4.92507L12.7648 4.01407C12.9766 3.6782 12.9276 3.2405 12.6468 2.95975L12.0407 2.35366C11.76 2.07292 11.3223 2.02392 10.9864 2.23565L10.0755 2.80989C9.73622 2.62328 9.37437 2.47229 8.99505 2.36209L8.75705 1.31231C8.66927 0.925096 8.32512 0.650238 7.92809 0.650238H7.07095ZM4.92053 3.81251C5.44724 3.44339 6.05665 3.18424 6.71543 3.06839L7.07095 1.50024H7.92809L8.28355 3.06816C8.94267 3.18387 9.5524 3.44302 10.0794 3.81224L11.4397 2.9547L12.0458 3.56079L11.1882 4.92117C11.5573 5.44798 11.8164 6.0575 11.9321 6.71638L13.5 7.07183V7.92897L11.932 8.28444C11.8162 8.94342 11.557 9.55301 11.1878 10.0798L12.0453 11.4402L11.4392 12.0462L10.0787 11.1886C9.55192 11.5576 8.94241 11.8166 8.28355 11.9323L7.92809 13.5002H7.07095L6.71543 11.932C6.0569 11.8162 5.44772 11.5572 4.92116 11.1883L3.56055 12.046L2.95445 11.4399L3.81213 10.0794C3.4431 9.55266 3.18403 8.94326 3.06825 8.2845L1.50002 7.92897V7.07183L3.06818 6.71632C3.18388 6.05765 3.44283 5.44833 3.81171 4.92165L2.95398 3.561L3.56008 2.95491L4.92053 3.81251ZM9.02496 7.50008C9.02496 8.34226 8.34223 9.02499 7.50005 9.02499C6.65786 9.02499 5.97513 8.34226 5.97513 7.50008C5.97513 6.65789 6.65786 5.97516 7.50005 5.97516C8.34223 5.97516 9.02496 6.65789 9.02496 7.50008ZM9.92496 7.50008C9.92496 8.83932 8.83929 9.92499 7.50005 9.92499C6.1608 9.92499 5.07513 8.83932 5.07513 7.50008C5.07513 6.16084 6.1608 5.07516 7.50005 5.07516C8.83929 5.07516 9.92496 6.16084 9.92496 7.50008Z"
        fill="currentColor"
      />
    </svg>
  );
}

function AssigneeAvatar({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white shadow-sm"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      {initialsForAssignee(name)}
    </span>
  );
}

function AssigneePill({ name, color, onRemove }: { name: string; color: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
      {name}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full p-0.5 text-slate-400 hover:bg-black/10 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-100"
          aria-label={`Remove ${name}`}
        >
          <XIcon />
        </button>
      ) : null}
    </span>
  );
}

function EmptyAssignees({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="px-4 py-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border text-slate-400 dark:border-slate-700">
        <UsersIcon />
      </div>
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">No assignees yet</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Add people so you can start sharing tasks.</p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-4 rounded-md border border-sky-600 bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700 dark:border-sky-500 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
      >
        Add new assignee
      </button>
    </div>
  );
}

export default function AssigneeManager() {
  const assignees = useBoard((state) => state.assignees);
  const assigneeColors = useBoard((state) => state.assigneeColors);
  const addAssignee = useBoard((state) => state.addAssignee);
  const updateAssigneeColor = useBoard((state) => state.updateAssigneeColor);
  const removeAssignee = useBoard((state) => state.removeAssignee);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(ASSIGNEE_COLOR_OPTIONS[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const filteredAssignees = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return assignees;
    return assignees.filter((assignee) => assignee.toLowerCase().includes(query));
  }, [assignees, search]);

  const closeAssigneeUi = () => {
    setIsAddOpen(false);
    setIsManageOpen(false);
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAssigneeUi();
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, []);

  const openAddModal = () => {
    setName("");
    setSelectedColor(ASSIGNEE_COLOR_OPTIONS[assignees.length % ASSIGNEE_COLOR_OPTIONS.length]);
    setIsDropdownOpen(false);
    setIsAddOpen(true);
  };

  const openManageModal = () => {
    setIsDropdownOpen(false);
    setIsManageOpen(true);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    addAssignee(name, selectedColor);
    setName("");
    setIsAddOpen(false);
  };

  const addModal = isAddOpen ? createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-assignee-title"
      onMouseDown={() => setIsAddOpen(false)}
    >
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-xl border bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape") closeAssigneeUi();
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="add-assignee-title" className="text-lg font-semibold text-slate-950 dark:text-slate-50">Add new assignee</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Just a name and color.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddOpen(false)}
            className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Close add assignee"
          >
            x
          </button>
        </div>

        <label className="mt-5 block space-y-1.5">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Taylor"
            autoFocus
            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:border-sky-400 dark:border-slate-700"
          />
        </label>

        <div className="mt-4">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Color</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ASSIGNEE_COLOR_OPTIONS.map((color) => (
              <button
                type="button"
                key={color}
                onClick={() => setSelectedColor(color)}
                className="h-8 w-8 rounded-full border-2 transition"
                style={{
                  backgroundColor: color,
                  borderColor: selectedColor === color ? "#0f172a" : "transparent",
                }}
                aria-label={`Choose ${color}`}
              />
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setIsAddOpen(false)}
            className="rounded-md border px-4 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="rounded-md border border-sky-600 bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-sky-500 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
          >
            Add assignee
          </button>
        </div>
      </form>
    </div>,
    document.body,
  ) : null;

  const manageModal = isManageOpen ? createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="manage-assignees-title"
      onMouseDown={() => setIsManageOpen(false)}
    >
      <div
        className="w-full max-w-sm rounded-xl border bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="manage-assignees-title" className="text-lg font-semibold text-slate-950 dark:text-slate-50">Assignees</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">People you work with on this board.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsManageOpen(false)}
            className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Close assignees"
          >
            x
          </button>
        </div>

        <div className="mt-4 divide-y dark:divide-slate-800">
          {assignees.length ? assignees.map((assignee) => (
            <div key={assignee} className="space-y-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <AssigneeAvatar name={assignee} color={colorForAssignee(assignee, assigneeColors)} />
                  <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{assignee}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeAssignee(assignee)}
                  className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                  aria-label={`Remove ${assignee}`}
                >
                  Remove
                </button>
              </div>
              <div className="flex flex-wrap gap-2 pl-9">
                {ASSIGNEE_COLOR_OPTIONS.map((color) => {
                  const isSelected = colorForAssignee(assignee, assigneeColors).toLowerCase() === color.toLowerCase();
                  return (
                    <button
                      type="button"
                      key={color}
                      onClick={() => updateAssigneeColor(assignee, color)}
                      className="h-5 w-5 rounded-full border-2 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 dark:focus:ring-slate-500"
                      style={{
                        backgroundColor: color,
                        borderColor: isSelected ? "#0f172a" : "transparent",
                      }}
                      aria-label={`Set ${assignee} color to ${color}`}
                      aria-pressed={isSelected}
                    />
                  );
                })}
              </div>
            </div>
          )) : (
            <EmptyAssignees onAdd={() => { setIsManageOpen(false); openAddModal(); }} />
          )}
        </div>

        <button
          type="button"
          onClick={() => { setIsManageOpen(false); openAddModal(); }}
          className="mt-4 w-full rounded-md border border-sky-600 bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700 dark:border-sky-500 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
        >
          + Add new assignee
        </button>
      </div>
    </div>,
    document.body,
  ) : null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen((open) => !open)}
          aria-label="Open assignees"
          aria-haspopup="menu"
          aria-expanded={isDropdownOpen}
          className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600 shadow-sm hover:border-sky-200 hover:bg-sky-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
        >
          <UsersIcon />
          Assignees
          <span className={`text-slate-400 transition-transform dark:text-slate-500 ${isDropdownOpen ? "rotate-180" : ""}`}>
            <ChevronDownIcon />
          </span>
        </button>

        {isDropdownOpen ? (
          <div className="absolute right-0 top-10 z-30 w-72 rounded-md border bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-950">
            {assignees.length ? (
              <>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search assignees..."
                  className="mb-2 w-full border-b border-slate-200 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-sky-400 dark:border-slate-800 dark:placeholder:text-slate-500"
                />
                <div className="max-h-56 overflow-y-auto py-1">
                  {filteredAssignees.length ? filteredAssignees.map((assignee) => (
                    <div key={assignee} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 dark:text-slate-200">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colorForAssignee(assignee, assigneeColors) }} aria-hidden="true" />
                      {assignee}
                    </div>
                  )) : (
                    <p className="px-3 py-4 text-sm text-slate-500 dark:text-slate-400">No matching assignees.</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={openManageModal}
                  className="mt-1 flex w-full items-center gap-3 border-t border-slate-200 px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  <span className="flex h-3 w-3 shrink-0 items-center justify-center text-slate-500 dark:text-slate-400">
                    <GearIcon />
                  </span>
                  Manage assignees
                </button>
              </>
            ) : (
              <EmptyAssignees onAdd={openAddModal} />
            )}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={openAddModal}
        className="h-8 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm hover:border-sky-200 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-900"
      >
        Quick Add
      </button>

      <div className="hidden flex-wrap gap-1.5 md:flex">
        {assignees.slice(0, 3).map((assignee) => (
          <AssigneePill
            key={assignee}
            name={assignee}
            color={colorForAssignee(assignee, assigneeColors)}
            onRemove={() => removeAssignee(assignee)}
          />
        ))}
        {assignees.length > 3 ? (
          <span className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            +{assignees.length - 3}
          </span>
        ) : null}
      </div>

      {addModal}
      {manageModal}
    </div>
  );
}
