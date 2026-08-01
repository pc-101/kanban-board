import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const index = args.indexOf(name);
  return index === -1 ? fallback : args[index + 1] ?? fallback;
};

const envPath = getArg("--env-file", ".env.local");
const mode = getArg("--mode", "single");

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

const sampleBoards = [
  {
    id: "dev-product-launch",
    data: {
      boardTitle: "Product Launch",
      boardColor: "#0ea5e9",
      assignees: ["Pat", "Sam", "Alex"],
      columns: [
        { id: "launch-todo", title: "Todo", taskIds: ["draft-launch-plan", "prepare-demo"] },
        { id: "launch-progress", title: "In Progress", taskIds: ["finalize-pricing"] },
        { id: "launch-done", title: "Done", taskIds: ["create-brief"] },
      ],
      tasks: {
        "draft-launch-plan": {
          id: "draft-launch-plan",
          title: "Draft launch plan",
          assignee: "Pat",
          dueDate: "2026-08-02",
          description: "Outline launch milestones, channels, and owners.",
        },
        "prepare-demo": {
          id: "prepare-demo",
          title: "Prepare demo script",
          assignee: "Sam",
          dueDate: "2026-08-05",
          description: "Create a short walkthrough for the release demo.",
        },
        "finalize-pricing": {
          id: "finalize-pricing",
          title: "Finalize pricing page copy",
          assignee: "Alex",
          description: "Review pricing language with product and marketing.",
        },
        "create-brief": {
          id: "create-brief",
          title: "Create stakeholder brief",
          assignee: "Pat",
          description: "Summarize positioning, risks, and rollout timeline.",
        },
      },
    },
  },
  {
    id: "dev-website-refresh",
    data: {
      boardTitle: "Website Refresh",
      boardColor: "#34d399",
      assignees: ["Mina", "Jordan", "Lee"],
      columns: [
        { id: "web-todo", title: "Todo", taskIds: ["audit-homepage", "collect-testimonials"] },
        { id: "web-progress", title: "In Progress", taskIds: ["build-case-study"] },
        { id: "web-done", title: "Done", taskIds: [] },
      ],
      tasks: {
        "audit-homepage": {
          id: "audit-homepage",
          title: "Audit homepage content",
          assignee: "Mina",
          dueDate: "2026-08-09",
          description: "Flag outdated sections and conversion gaps.",
        },
        "collect-testimonials": {
          id: "collect-testimonials",
          title: "Collect customer testimonials",
          assignee: "Jordan",
          description: "Gather three short quotes for the refreshed landing page.",
        },
        "build-case-study": {
          id: "build-case-study",
          title: "Build featured case study block",
          assignee: "Lee",
          dueDate: "2026-08-12",
          description: "Create the first version of the reusable case study section.",
        },
      },
    },
  },
  {
    id: "dev-ops-backlog",
    data: {
      boardTitle: "Ops Backlog",
      boardColor: "#f59e0b",
      assignees: ["Rae", "Chris"],
      columns: [
        { id: "ops-todo", title: "Todo", taskIds: ["triage-alerts", "document-runbook"] },
        { id: "ops-progress", title: "In Progress", taskIds: [] },
        { id: "ops-done", title: "Done", taskIds: ["rotate-keys"] },
      ],
      tasks: {
        "triage-alerts": {
          id: "triage-alerts",
          title: "Triage stale alerts",
          assignee: "Rae",
          description: "Remove noisy alerts and add owners to the remaining set.",
        },
        "document-runbook": {
          id: "document-runbook",
          title: "Document deploy rollback runbook",
          assignee: "Chris",
          dueDate: "2026-08-16",
          description: "Write the rollback checklist for failed production deploys.",
        },
        "rotate-keys": {
          id: "rotate-keys",
          title: "Rotate staging API keys",
          assignee: "Rae",
          description: "Replace staging credentials and confirm dependent services are healthy.",
        },
      },
    },
  },
];

const singleBoard = {
  id: process.env.NEXT_PUBLIC_SUPABASE_BOARD_ID || "default",
  data: {
    boardTitle: "Kanban Board",
    boardColor: "#0ea5e9",
    assignees: ["Pat", "Sam", "Alex"],
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
  },
};

loadLocalEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  console.error(`Missing Supabase environment values. Check ${envPath}.`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabasePublishableKey);
const boards = mode === "dev-samples" ? sampleBoards : [{ ...singleBoard, id: process.env.NEXT_PUBLIC_SUPABASE_BOARD_ID || singleBoard.id }];
const fallbackColors = ["#3b82f6", "#fb7185", "#8b5cf6", "#34d399", "#f59e0b"];

const patchForSnapshot = (snapshot) => ({
  board: { title: snapshot.boardTitle, color: snapshot.boardColor },
  columns: snapshot.columns.map((column, position) => ({ id: column.id, title: column.title, position })),
  tasks: snapshot.columns.flatMap((column) => column.taskIds.map((taskId, position) => ({
    ...snapshot.tasks[taskId],
    columnId: column.id,
    position,
  }))),
  assignees: snapshot.assignees.map((name, position) => ({
    name,
    color: snapshot.assigneeColors?.[name] ?? fallbackColors[position % fallbackColors.length],
    position,
  })),
  deletedColumnIds: [],
  deletedTaskIds: [],
  deletedAssigneeNames: [],
});

for (const board of boards) {
  const { error } = await supabase.rpc("apply_board_patch", {
    p_board_id: board.id,
    p_snapshot: board.data,
    p_patch: patchForSnapshot(board.data),
  });

  if (error) {
    console.error(`Seed failed for ${board.id}:`, error.message);
    console.error("Code:", error.code ?? "n/a");
    process.exit(1);
  }
}

console.log(`Seeded ${boards.length} board${boards.length === 1 ? "" : "s"} from ${envPath}:`);
for (const board of boards) {
  console.log(`- ${board.id}: ${board.data.boardTitle} (${Object.keys(board.data.tasks).length} tasks)`);
}
