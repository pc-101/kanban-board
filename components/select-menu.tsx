"use client";

import { KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "./ui-icons";

export type SelectMenuOption = {
  value: string;
  label: string;
  color?: string;
};

type SelectMenuProps = {
  value: string;
  options: SelectMenuOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
  onOpenChange?: (open: boolean) => void;
};

export default function SelectMenu({
  value,
  options,
  onChange,
  ariaLabel,
  className = "h-9 w-full",
  onOpenChange,
}: SelectMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  const setOpen = useCallback((open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  }, [onOpenChange]);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen, setOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
    requestAnimationFrame(() => optionRefs.current[selectedIndex]?.focus());
  }, [isOpen, options, value]);

  const moveFocus = (event: KeyboardEvent<HTMLDivElement>, direction: 1 | -1) => {
    event.preventDefault();
    const currentIndex = optionRefs.current.findIndex((option) => option === document.activeElement);
    const nextIndex = (currentIndex + direction + options.length) % options.length;
    optionRefs.current[nextIndex]?.focus();
  };

  return (
    <div
      ref={rootRef}
      className="relative"
      onKeyDown={(event) => {
        if (!isOpen || !options.length) return;
        if (event.key === "ArrowDown") moveFocus(event, 1);
        if (event.key === "ArrowUp") moveFocus(event, -1);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!isOpen)}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`${className} flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 text-left text-sm font-medium text-slate-700 shadow-sm outline-none transition hover:border-sky-200 hover:bg-sky-50 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:focus:ring-sky-950`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selectedOption?.color ? <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: selectedOption.color }} /> : null}
          <span className="truncate">{selectedOption?.label}</span>
        </span>
        <span className={`shrink-0 text-slate-400 transition-transform dark:text-slate-500 ${isOpen ? "rotate-180" : ""}`}>
          <ChevronDownIcon />
        </span>
      </button>

      {isOpen ? (
        <div role="listbox" aria-label={ariaLabel} className="absolute left-0 top-full z-[60] mt-2 w-full min-w-48 rounded-md border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-950">
          {options.map((option, index) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                ref={(node) => { optionRefs.current[index] = node; }}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => { onChange(option.value); setOpen(false); triggerRef.current?.focus(); }}
                className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm outline-none transition ${isSelected ? "bg-sky-50 font-medium text-slate-950 dark:bg-sky-950/50 dark:text-slate-50" : "text-slate-700 hover:bg-slate-100 focus:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900 dark:focus:bg-slate-900"}`}
              >
                {option.color ? <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: option.color }} /> : null}
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {isSelected ? <span className="text-sky-600 dark:text-sky-400" aria-hidden="true">✓</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
