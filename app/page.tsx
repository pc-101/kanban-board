import dynamic from "next/dynamic";

const Board = dynamic(() => import("@/components/board"), { ssr: false });

export default function Home() {
  return <Board />;
}
