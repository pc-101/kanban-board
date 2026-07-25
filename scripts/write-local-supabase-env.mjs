import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const output = execFileSync(
  "pnpm",
  [
    "exec",
    "supabase",
    "status",
    "-o",
    "env",
    "--override-name",
    "api.url=NEXT_PUBLIC_SUPABASE_URL",
    "--override-name",
    "auth.anon_key=NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ],
  { encoding: "utf8" },
);

const lines = output
  .split(/\r?\n/)
  .filter((line) => line.startsWith("NEXT_PUBLIC_SUPABASE_URL=") || line.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY="));

if (lines.length < 2) {
  console.error("Could not find local Supabase URL/key. Is `pnpm supabase:start` running?");
  process.exit(1);
}

lines.push("NEXT_PUBLIC_SUPABASE_BOARD_ID=dev-product-launch");
writeFileSync(".env.development.local", `${lines.join("\n")}\n`);
console.log("Wrote .env.development.local for local Supabase.");
