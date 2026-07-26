import dynamic from "next/dynamic";
import BoardTitle from "@/components/board-title";

const Board = dynamic(() => import("@/components/board"), { ssr: false });

export default function Home() {
  return (
    <section className="space-y-6">
      <BoardTitle />
      <Board />
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Drag tasks between columns. Titles and tasks persist in your browser.
      </p>
    </section>
  );
}
