import Link from "next/link";
import ThemeToggle from "./theme-toggle";
export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="container-hero flex h-14 items-center justify-between gap-3">
        <Link href="/" className="font-semibold tracking-tight">🗂️ Kanban</Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
