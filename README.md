# Kanban Board

A Next.js 14 Kanban board for organizing project work across multiple boards. It includes drag-and-drop tasks, editable task details, assignees, board colors, simple Supabase sync, local Docker-backed Supabase development, and Netlify or GitHub Pages deployment support.

## Features

- Create, duplicate, delete, and switch between multiple project boards.
- Drag tasks across columns with `@hello-pangea/dnd`.
- Add, delete, and reorder tasks.
- Rename boards when a project needs to be repurposed.
- Click tasks to edit title, assignee, description, and due date.
- Create and customize color-coded shared assignees from a compact toolbar dropdown and assign them to tasks.
- Show unassigned tasks explicitly with a reserved neutral color.
- Mark tasks with a completed timestamp when moved into Done.
- Clear all Done tasks when completed work should be removed from the board.
- Customize board accent colors.
- Sync to Supabase when configured, with `localStorage` as fallback/cache.
- Reflect collaborators' active-board changes through Supabase Realtime, with a 10-second polling fallback.
- Toggle light/dark mode with `next-themes`.
- Export statically for Netlify or GitHub Pages.

## Tech Stack

- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS
- Zustand
- Supabase
- @hello-pangea/dnd
- Netlify and GitHub Pages

## Prerequisites

- Node.js 22
- `pnpm` v9 recommended
- Docker Desktop for local Supabase development
- A hosted Supabase project for production deployment

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
| `pnpm start` | Serve the exported `out/` directory after a build. |
| `pnpm lint` | Run ESLint. |
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
Netlify or GitHub Pages -> hosted Supabase project -> production data
```

## Documentation

- [Project Guide](docs/project-guide.md) - architecture, state management, Supabase setup, migrations, seeds, sync behavior, and deployment notes.
- [Supabase Setup SQL](docs/supabase-setup.sql) - manual SQL fallback for hosted Supabase setup.

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
