import dynamic from "next/dynamic";
const Board = dynamic(() => import("@/components/board"), { ssr: false });

export default function Home() {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Your Board</h1>
      <Board />
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Drag tasks between columns. Titles and tasks persist in your browser.
      </p>
    </section>
  );
}
