"use client";

import { CalendarDate, getLocalTimeZone, parseDate, today } from "@internationalized/date";
import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  DateInput,
  DatePicker,
  DateSegment,
  Group,
  Heading,
  Label,
  Popover,
} from "react-aria-components";

function CalendarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <rect x="3" y="4.5" width="14" height="12.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 3v3M13.5 3v3M3 8h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      <path d="M6.5 11h1M9.5 11h1M12.5 11h1M6.5 14h1M9.5 14h1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path
        d={direction === "left" ? "m12 5-5 5 5 5" : "m8 5 5 5-5 5"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function parseStoredDate(value: string): CalendarDate | null {
  if (!value) return null;
  try {
    return parseDate(value);
  } catch {
    return null;
  }
}

export default function ThemedDatePicker({
  value,
  onChange,
  onOpenChange,
}: {
  value: string;
  onChange: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
}) {
  const selectedDate = parseStoredDate(value);
  const chooseDate = (date: CalendarDate | null) => {
    onChange(date?.toString() ?? "");
  };

  return (
    <DatePicker
      value={selectedDate}
      onChange={(date) => chooseDate(date ? new CalendarDate(date.year, date.month, date.day) : null)}
      onOpenChange={onOpenChange}
      className="space-y-1.5"
    >
      <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">Due date</Label>
      <Group className="flex h-10 items-center overflow-hidden rounded-md border border-slate-200 bg-slate-50 text-sm text-slate-700 shadow-sm transition focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus-within:ring-sky-950">
        <DateInput className="flex min-w-0 flex-1 items-center px-3">
          {(segment) => (
            <DateSegment
              segment={segment}
              className={({ isFocused, isPlaceholder }) =>
                `rounded px-0.5 tabular-nums outline-none ${isFocused ? "bg-sky-100 text-sky-950 dark:bg-sky-900 dark:text-sky-50" : ""} ${isPlaceholder ? "text-slate-400 dark:text-slate-500" : ""}`
              }
            />
          )}
        </DateInput>
        <Button
          className="flex h-full w-10 shrink-0 items-center justify-center border-l border-slate-200 text-slate-500 outline-none transition hover:bg-sky-50 hover:text-sky-700 focus-visible:bg-sky-50 focus-visible:text-sky-700 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-sky-300 dark:focus-visible:bg-slate-800 dark:focus-visible:text-sky-300"
          aria-label="Open calendar"
        >
          <CalendarIcon />
        </Button>
      </Group>

      <Popover
        placement="bottom end"
        offset={8}
        className="z-[70] w-[19rem] rounded-xl border border-slate-200 bg-white p-3 text-slate-700 shadow-2xl outline-none entering:animate-in entering:fade-in entering:zoom-in-95 exiting:animate-out exiting:fade-out exiting:zoom-out-95 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
      >
        <Calendar className="w-full">
          <header className="mb-2 flex items-center justify-between gap-2">
            <Button
              slot="previous"
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 outline-none transition hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-sky-400 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              aria-label="Previous month"
            >
              <ChevronIcon direction="left" />
            </Button>
            <Heading className="text-sm font-semibold text-slate-900 dark:text-slate-100" />
            <Button
              slot="next"
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 outline-none transition hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-sky-400 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              aria-label="Next month"
            >
              <ChevronIcon direction="right" />
            </Button>
          </header>

          <CalendarGrid weekdayStyle="short" className="w-full border-separate border-spacing-1">
            <CalendarGridHeader>
              {(day) => (
                <CalendarHeaderCell className="pb-1 text-center text-xs font-medium text-slate-400 dark:text-slate-500">
                  {day}
                </CalendarHeaderCell>
              )}
            </CalendarGridHeader>
            <CalendarGridBody>
              {(date) => (
                <CalendarCell
                  date={date}
                  className={({ isDisabled, isFocusVisible, isOutsideMonth, isSelected, isToday }) =>
                    `relative h-9 w-9 cursor-default rounded-md text-center text-sm leading-9 outline-none ${isOutsideMonth ? "text-slate-300 dark:text-slate-700" : "text-slate-700 hover:bg-sky-50 dark:text-slate-200 dark:hover:bg-slate-800"} ${isToday && !isSelected ? "font-semibold text-sky-700 ring-1 ring-inset ring-sky-300 dark:text-sky-300 dark:ring-sky-700" : ""} ${isSelected ? "bg-gradient-to-br from-sky-500 to-violet-600 font-semibold text-white shadow-sm hover:from-sky-600 hover:to-violet-700 dark:text-white" : ""} ${isFocusVisible ? "ring-2 ring-sky-400 ring-offset-1 ring-offset-white dark:ring-offset-slate-950" : ""} ${isDisabled ? "pointer-events-none opacity-40" : ""}`
                  }
                />
              )}
            </CalendarGridBody>
          </CalendarGrid>

          <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-800">
            <button
              type="button"
              onClick={() => chooseDate(null)}
              className="rounded-md px-2.5 py-1.5 text-sm font-medium text-slate-500 outline-none transition hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-sky-400 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => chooseDate(today(getLocalTimeZone()))}
              className="rounded-md px-2.5 py-1.5 text-sm font-semibold text-sky-600 outline-none transition hover:bg-sky-50 hover:text-sky-700 focus-visible:ring-2 focus-visible:ring-sky-400 dark:text-sky-400 dark:hover:bg-sky-950/50 dark:hover:text-sky-300"
            >
              Today
            </button>
          </div>
        </Calendar>
      </Popover>
    </DatePicker>
  );
}
