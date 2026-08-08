import { execFileSync } from "node:child_process";

const environment = process.env.VERCEL_TARGET_ENV || process.env.VERCEL_ENV;

if (!environment) {
  console.error(
    "Missing VERCEL_TARGET_ENV or VERCEL_ENV; refusing to select a Vercel build command.",
  );
  process.exit(1);
}

const script = environment === "production" ? "build:production" : "build";

console.log(`Running pnpm ${script} for Vercel environment: ${environment}`);

try {
  execFileSync(
    process.platform === "win32" ? "pnpm.cmd" : "pnpm",
    ["run", script],
    { stdio: "inherit" },
  );
} catch (error) {
  process.exit(typeof error?.status === "number" ? error.status : 1);
}
