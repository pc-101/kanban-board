import Image from "next/image";
import Link from "next/link";
import kanbanLogo from "@/assets/favicon.svg";
import BoardColorPicker from "./board-color-picker";
import ThemeToggle from "./theme-toggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="container-hero flex h-14 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <Image
            src={kanbanLogo}
            alt=""
            width={24}
            height={24}
            aria-hidden="true"
          />
          <span>Kanban</span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
