# Kanban Board

A Next.js 14 Kanban board for organizing project work across multiple boards. It includes drag-and-drop tasks, editable task details, assignees, board colors, simple Supabase sync, local Docker-backed Supabase development, and GitHub Pages deployment support.

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
- Poll Supabase every 10 seconds for newer remote board updates.
- Toggle light/dark mode with `next-themes`.
- Export statically for GitHub Pages.

## Tech Stack

- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS
- Zustand
- Supabase
- @hello-pangea/dnd
- GitHub Pages

## Prerequisites

- Node.js 18.17+ or 20+
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
| `pnpm start` | Serve the exported `out/` directory after a build. |
| `pnpm lint` | Run ESLint. |
| `pnpm supabase:start` | Start local Supabase Docker containers. |
| `pnpm supabase:stop` | Stop local Supabase Docker containers. |
| `pnpm supabase:reset` | Rebuild local DB from migrations and `seed.sql`. |
| `pnpm supabase:status` | Print local Supabase URLs and keys. |
| `pnpm supabase:env` | Write `.env.development.local` from local Supabase status. |
| `pnpm supabase:dump:seed` | Save current local public data into `supabase/seed.sql`. |
| `pnpm db:seed` | Seed one configured hosted Supabase board row from env values. |

## Local Vs Production

Local development uses Docker-backed Supabase:

```text
Next dev server -> local Supabase Docker -> local seeded data
```

Production uses the static GitHub Pages app and your hosted Supabase project:

```text
GitHub Pages static app -> hosted Supabase project -> production data
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

## Deployment

This project is configured for static export and GitHub Pages. Production Supabase values should be set as GitHub repository secrets:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SUPABASE_BOARD_ID
```

The deployment workflow builds the app and publishes the exported `out/` directory to GitHub Pages.
