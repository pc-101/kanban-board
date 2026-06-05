import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const envPath = ".env.local";

function loadLocalEnv() {
  const raw = readFileSync(envPath, "utf8");

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const index = trimmed.indexOf("=");
    if (index === -1) continue;

    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

const snapshot = {
  boardColor: "#0ea5e9",
  columns: [
    { id: "todo", title: "Todo", taskIds: ["design-wireframes", "setup-ci"] },
    { id: "in-progress", title: "In Progress", taskIds: ["build-dnd"] },
    { id: "done", title: "Done", taskIds: ["brainstorm-design"] },
  ],
  tasks: {
    "design-wireframes": {
      id: "design-wireframes",
      title: "Design wireframes",
      assignee: "Pat",
      dueDate: "2026-05-22",
      description: "Sketch the first pass of the board layout and task detail flow.",
    },
    "setup-ci": {
      id: "setup-ci",
      title: "Set up CI",
      assignee: "Sam",
      dueDate: "2026-05-24",
      description: "Create a basic build workflow for pull requests and production deploys.",
    },
    "build-dnd": {
      id: "build-dnd",
      title: "Build Drag & Drop",
      assignee: "Alex",
      description: "Wire column reordering with @hello-pangea/dnd and persist changes remotely.",
    },
    "brainstorm-design": {
      id: "brainstorm-design",
      title: "Brainstorm initial design",
      description: "Capture the first set of layout ideas and user flow notes.",
    },
  },
};

loadLocalEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const boardId = process.env.NEXT_PUBLIC_SUPABASE_BOARD_ID || "default";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(`Missing Supabase environment values. Copy .env.local.example to ${envPath} and fill it in.`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const { data, error } = await supabase
  .from("boards")
  .upsert({ id: boardId, data: snapshot, updated_at: new Date().toISOString() })
  .select("id, updated_at")
  .single();

if (error) {
  console.error("Seed failed:", error.message);
  console.error("Code:", error.code ?? "n/a");
  process.exit(1);
}

console.log("Seeded board row:", data.id);
console.log("Updated at:", data.updated_at);
console.log("Columns:", snapshot.columns.length);
console.log("Tasks:", Object.keys(snapshot.tasks).length);
