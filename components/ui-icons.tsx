export function ChevronDownIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className={className}>
      <path d="m6 8 4 4 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

export function XIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
    </svg>
  );
}

export function ArchiveIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M4 7.5h12v8.25a1.25 1.25 0 0 1-1.25 1.25h-9.5A1.25 1.25 0 0 1 4 15.75V7.5Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 4.75A1.25 1.25 0 0 1 4.25 3.5h11.5A1.25 1.25 0 0 1 17 4.75V7.5H3V4.75ZM8 11h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}
