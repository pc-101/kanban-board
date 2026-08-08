import { execFileSync } from "node:child_process";

if (process.env.CONTEXT && process.env.CONTEXT !== "production") {
  console.error(`Refusing to migrate the production database in Netlify context: ${process.env.CONTEXT}`);
  process.exit(1);
}

const vercelEnvironment = process.env.VERCEL_TARGET_ENV || process.env.VERCEL_ENV;

if ((process.env.VERCEL === "1" || vercelEnvironment) && vercelEnvironment !== "production") {
  console.error(
    `Refusing to migrate the production database in Vercel environment: ${vercelEnvironment || "unknown"}`,
  );
  process.exit(1);
}

const requiredVariables = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_BOARD_ID",
  "SUPABASE_DB_URL",
];

const missingVariables = requiredVariables.filter((name) => !process.env[name]?.trim());

if (missingVariables.length) {
  console.error(`Missing production environment variable(s): ${missingVariables.join(", ")}`);
  process.exit(1);
}

const databaseUrl = process.env.SUPABASE_DB_URL.trim();

let protocol;
try {
  protocol = new URL(databaseUrl).protocol;
} catch {
  console.error("SUPABASE_DB_URL must be a valid, percent-encoded Postgres connection string.");
  process.exit(1);
}

if (protocol !== "postgres:" && protocol !== "postgresql:") {
  console.error(
    `SUPABASE_DB_URL must use the postgres:// or postgresql:// protocol; the build environment supplied ${protocol}.`,
  );
  process.exit(1);
}

console.log("Applying pending Supabase migrations to production...");

execFileSync(
  process.platform === "win32" ? "pnpm.cmd" : "pnpm",
  ["exec", "supabase", "db", "push", "--yes", "--db-url", databaseUrl],
  { stdio: "inherit" },
);

console.log("Production database schema is up to date.");
