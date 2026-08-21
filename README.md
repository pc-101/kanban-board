# Kanban Board

A Next.js 14 Kanban board for organizing project work across multiple boards. It includes drag-and-drop tasks, editable task details, assignees, board colors, simple Supabase sync, local Docker-backed Supabase development, and Vercel, Netlify, or GitHub Pages deployment support.

## Features

- Create, duplicate, delete, and switch between multiple project boards.
- Drag tasks across columns with `@hello-pangea/dnd`.
- Add, delete, and reorder tasks.
- Rename boards when a project needs to be repurposed.
- Click tasks to edit title, assignee, description, and due date.
- Create and customize color-coded shared assignees from a compact toolbar dropdown and assign them to tasks.
- Show unassigned tasks explicitly with a reserved neutral color.
- Mark tasks with a completed timestamp when moved into Done.
- Archive individual or all Done tasks, browse archived work, and restore tasks without deleting their history.
- Automatically archive tasks 14 days after completion through an hourly Supabase Cron job.
- Keep permanent task deletion as an explicit, single-task action.
- Customize board accent colors.
- Sync normalized board, column, task, and assignee records to Supabase, with `localStorage` as fallback/cache.
- Merge concurrent edits to different board entities and reflect them through Supabase Realtime, with a 10-second polling fallback.
- Toggle light/dark mode with `next-themes`.
- Export statically for Vercel, Netlify, or GitHub Pages.

## Tech Stack

- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS
- Zustand
- Supabase
- Supabase Cron (`pg_cron`)
- @hello-pangea/dnd
- Vercel, Netlify, and GitHub Pages

## Prerequisites

- Node.js 22
- `nvm` on macOS or WSL
- Corepack for the project-pinned pnpm version
- Docker Desktop for local Supabase development
- A hosted Supabase project for production deployment

## Project Toolchain

The repository pins Node 22 through `.nvmrc` and pnpm 9.15.9 through the `packageManager` field in `package.json`. The strict engine configuration stops immediately when the wrong Node or pnpm version is active instead of allowing a mismatched install.

Complete this once on each development machine:

```bash
nvm install
npm install --global corepack@latest
corepack enable pnpm
pnpm install --frozen-lockfile
```

Whenever you return after using another Node version, run one command from this repository:

```bash
nvm use
```

Corepack then selects pnpm 9.15.9 automatically when `pnpm` is invoked. If Node 22 is not installed on a new machine yet, use `nvm install` instead; it reads `.nvmrc`, installs the requested version, and switches to it.

For a completely automatic switch, use [nvm's shell integration recipe](https://github.com/nvm-sh/nvm#deeper-shell-integration) to run `nvm use` when entering a directory containing `.nvmrc`. That hook belongs in `~/.zshrc` on macOS or `~/.bashrc`/`~/.zshrc` in WSL rather than in this repository.

## Quick Start

Install dependencies:

```bash
pnpm install
```

Start the full local environment:

```bash
pnpm dev:local
```

Open the app:

```text
http://localhost:3000
```

Open local Supabase Studio:

```text
http://127.0.0.1:54323
```

## Common Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the Next.js dev server only. |
| `pnpm dev:local` | Start local Supabase, generate local env, and run Next dev. |
| `pnpm dev:local:reset` | Start local Supabase, reset local DB from migrations/seeds, generate local env, and run Next dev. |
| `pnpm build` | Build the static production app. |
| `pnpm build:production` | Apply pending hosted Supabase migrations, then build the app. |
| `pnpm build:vercel` | Select the migration-safe build from Vercel's environment. |
| `pnpm start` | Serve the exported `out/` directory after a build. |
| `pnpm lint` | Run ESLint. |
| `pnpm test:e2e:dev` | Reset local Supabase and run the two-browser collaboration tests. |
| `pnpm supabase:start` | Start local Supabase Docker containers. |
| `pnpm supabase:stop` | Stop local Supabase Docker containers. |
| `pnpm supabase:reset` | Rebuild local DB from migrations and `seed.sql`. |
| `pnpm supabase:status` | Print local Supabase URLs and keys. |
| `pnpm supabase:env` | Write `.env.development.local` from local Supabase status. |
| `pnpm supabase:dump:seed` | Save current local public data into `supabase/seed.sql`. |
| `pnpm db:seed` | Seed one configured hosted Supabase board row from env values. |
| `pnpm db:push:production` | Apply pending migrations using `SUPABASE_DB_URL`. |

## Local Vs Production

Local development uses Docker-backed Supabase:

```text
Next dev server -> local Supabase Docker -> local seeded data
```

Production uses the statically exported app and your hosted Supabase project:

```text
Vercel, Netlify, or GitHub Pages -> hosted Supabase project -> production data
```

## Collaboration E2E Test

With Docker running and the project toolchain active, install Playwright's Chromium browser once on each machine:

```bash
pnpm exec playwright install chromium
```

Then run the complete local collaboration test with one command:

```bash
pnpm test:e2e:dev
```

The command rebuilds the local database from migrations and seed data, starts the Next.js development server, and opens two isolated browser contexts. It verifies that different-task edits merge, Realtime updates reach the other browser without a reload, and same-task edits retain the documented last-write-wins behavior.

This test intentionally resets local Supabase data. Port 3000 must be available before it starts. The local Supabase containers remain running afterward for continued development; stop them with `pnpm supabase:stop` when needed.

## Documentation

- [Project Guide](docs/project-guide.md) - architecture, state management, Supabase setup, migrations, seeds, sync behavior, and deployment notes.

## Project Structure

```text
app/                    Next.js app router files
components/             Board UI and interaction components
lib/                    Zustand store and Supabase helpers
scripts/                Supabase seeding/env helper scripts
supabase/               Local Supabase config, migrations, and seed data
docs/                   Deeper project and setup documentation
.github/workflows/      GitHub Pages deployment workflow
```

## Fresh Vercel Production Deployment

1. Create a hosted Supabase project. You do not need to create tables manually.
2. Copy the project URL, publishable key, and Session pooler database connection string from Supabase. Replace the database password placeholder and percent-encode special characters in the password.
3. In **Vercel → Project Settings → Environment Variables**, add these Production-only values:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SUPABASE_BOARD_ID
SUPABASE_DB_URL
```

Set `NEXT_PUBLIC_SUPABASE_BOARD_ID` to an initial ID such as `default`. Mark only `SUPABASE_DB_URL` as sensitive; the three `NEXT_PUBLIC_*` values are intentionally embedded in the browser bundle. Ensure all four values belong to the same Supabase project.

Enable Vercel's **Automatically expose System Environment Variables** setting, then deploy the repository. The committed `vercel.json` runs `pnpm build:vercel`. Production deploys apply pending Supabase migrations before building, while Preview and Development environments run the frontend build without access to the production database URL.

Do not assign the production Supabase values to Preview. A preview without public Supabase configuration uses browser-local storage; alternatively, give Preview the three public values for a separate, already-migrated preview database. Never provide the production `SUPABASE_DB_URL` to Preview.

The first Production deploy creates the required schema and the first browser visit creates the initial board when the database is empty. Environment-variable changes affect only new Vercel deployments, so redeploy after changing a value.

## Fresh Netlify Production Deployment

1. Create a hosted Supabase project. You do not need to create tables manually.
2. In Supabase, copy the project URL and publishable key (`sb_publishable_...`) from the project's **Connect** dialog or **Settings → API Keys**.
3. Copy a Postgres connection string from **Connect** in the Supabase dashboard. Use the Session pooler string when the build environment cannot use IPv6, replace its password placeholder, and percent-encode special characters in the password.
4. Add these variables in **Netlify → Project configuration → Environment variables**:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SUPABASE_BOARD_ID
SUPABASE_DB_URL
```

If upgrading an existing deployment, replace `NEXT_PUBLIC_SUPABASE_ANON_KEY` with `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Netlify and paste an `sb_publishable_...` key. Find or create it under **Supabase → Settings → API Keys**. After all clients have migrated, use Supabase's key usage indicators before disabling the legacy anon key.

Set `NEXT_PUBLIC_SUPABASE_BOARD_ID` to an initial ID such as `default`. Scope all four variables to **Production** builds so previews cannot connect to production data. Only `SUPABASE_DB_URL` should be marked as containing a secret value; every `NEXT_PUBLIC_*` value is intentionally embedded in the browser bundle. The publishable key is designed for browser use, while authorization is enforced by Supabase Row Level Security.

Connect the repository to Netlify and deploy. The committed `netlify.toml` uses `pnpm build:production` for production deploys, which applies pending migrations before building and publishing `out/`. Deploy Previews and branch deploys run `pnpm build` and cannot modify the production database.

The first browser visit creates the initial board row when the new `boards` table is empty. Future production deploys apply only migrations that have not already been recorded by Supabase.

### Netlify environment-variable troubleshooting

Netlify does not change a `postgresql://` URI into an `https://` URI when importing an `.env` file. However, bulk imports can preserve conflicting keys or contextual values depending on the selected merge strategy, scope, and deploy context. Site-level variables also override shared team variables for the same scope and context, while values committed in `netlify.toml` override values managed in the Netlify UI.

If the production build reports that `SUPABASE_DB_URL` has the wrong protocol:

1. Filter the Netlify environment-variable view to **Production**.
2. Delete every site-level contextual value for `SUPABASE_DB_URL`.
3. Check **Team settings → Environment variables** for a shared value with the same key.
4. Recreate `SUPABASE_DB_URL` as an individual site variable with **Builds** scope and **Production** context.
5. Paste only the raw `postgresql://...` Session pooler URI—without `SUPABASE_DB_URL=`, quotes, Markdown, or a `psql` command.

For sensitive or scheme-specific values, creating the variable individually makes its key, scope, context, and secret classification easier to verify. Bulk `.env` import remains appropriate when those settings are intentionally the same for every imported variable and conflicts are reviewed carefully.

## GitHub Pages Deployment

The existing `.github/workflows/deploy.yml` workflow builds the static app and publishes `out/`. Configure the three `NEXT_PUBLIC_SUPABASE_*` values as GitHub repository secrets and apply database migrations separately before the first deployment.
