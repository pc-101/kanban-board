# Kanban Board

A Next.js 14 starter for organizing work on a drag-and-drop Kanban board. Rename columns inline, add tasks on the fly, switch between light and dark themes, and keep progress synced locally through browser storage.

## Features

- Drag tasks across columns with smooth reordering powered by `@hello-pangea/dnd`.
- Rename columns and add or delete tasks without leaving the board.
- Create assignees and assign tasks from the shared assignee list.
- Sync board state to Supabase when configured, with `localStorage` as a local fallback.
- Poll Supabase every 10 seconds to pick up newer board changes from other browser sessions.
- Responsive, horizontally scrollable layout optimized for multiple columns.
- Light/dark theme toggle that respects the system preference via `next-themes`.
- Adjust the board accent color with a built-in palette, saved per browser.

## Prerequisites

- Node.js 18.17+ or 20+ (matching Next.js 14 requirements).
- `pnpm` package manager (v9 recommended; swap with `npm`/`yarn` if you prefer and adjust commands).

## Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Run the development server:
   ```bash
   pnpm dev
   ```
3. Open `http://localhost:3000` to interact with the board. Try adding tasks and dragging them between columns.

## Available Scripts

- `pnpm dev` – start the Next.js development server with hot reloading.
- `pnpm build` – create an optimized production build (also generates static assets in `out/` when using GitHub Pages).
- `pnpm start` – serve the exported static site from `out/` after running `pnpm build`.
- `pnpm lint` – run ESLint checks.
- `pnpm db:seed` – seed or reset one configured Supabase board row from `.env.local`.
- `pnpm db:seed:dev` – reset the local Supabase database and load `supabase/seed.sql`.
- `pnpm supabase:start` – start the local Supabase Docker stack.
- `pnpm supabase:stop` – stop the local Supabase Docker stack.
- `pnpm supabase:reset` – reset local Supabase from migrations and seed data.
- `pnpm supabase:env` – write `.env.development.local` from the running local Supabase stack.

## Project Structure

```
app/
  layout.tsx       # Root layout with header and theme provider
  page.tsx         # Kanban board page shell
  globals.css      # Tailwind layer setup and global styles
components/
  board.tsx        # Drag-and-drop board wrapper
  column.tsx       # Column view with inline editing
  task-card.tsx    # Individual task card with delete control
  header.tsx       # Top navigation with theme toggle
  theme-provider.tsx
  theme-toggle.tsx # Light/dark switch
lib/
  board-store.ts   # Zustand store, seed data, and persistence helpers
  supabase.ts      # Lazy Supabase browser client
  supabase-board.ts # Board load/save helpers
scripts/
  seed-supabase-board.mjs # Upsert the starter board into Supabase
tailwind.config.js # Tailwind configuration
postcss.config.js  # PostCSS setup
```

## Supabase Setup

Use local Supabase for development and the hosted Supabase project for production. The schema is tracked in `supabase/migrations/`, and mock dev boards live in `supabase/seed.sql`, so local testing cannot mutate production rows.

1. Install and start Docker Desktop.
2. Start the local Supabase stack:
   ```bash
   pnpm supabase:start
   ```
3. Generate the local development env file from the running stack:
   ```bash
   pnpm supabase:env
   ```
4. Reset/seed the local database with mock project boards:
   ```bash
   pnpm db:seed:dev
   ```
5. Run the app locally with `pnpm dev`. Next.js reads `.env.development.local`, so the local app points at the Docker-backed Supabase stack.

For production, run `docs/supabase-setup.sql` in the hosted Supabase project or apply the matching migration there, then configure GitHub Pages with production secrets:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_BOARD_ID` (optional; defaults to `default`)

Avoid putting production Supabase values in `.env.development.local`. Also avoid using `.env.local` for production credentials on your development machine; treat it as a personal local override because Next.js can load it for local commands. The SQL file uses permissive anonymous policies so this starter works without authentication. For a real multi-user board, add Supabase Auth and restrict rows by user.

Each project board is stored as a separate row in `public.boards`, and the board switcher loads the selected row by ID.

The collaboration model is intentionally simple: each active board polls Supabase every 10 seconds and applies the newest remote snapshot. This is last-write-wins synchronization, not Google Docs-style operational transform or CRDT conflict resolution.

## Notes

- Board data is cached in `localStorage` under the key `kanban-board:v1` and synced to Supabase when configured.
- The initial seeds are generated at runtime with `nanoid`, so IDs differ per browser session.
- For deployments, ensure your platform supports Next.js 14 (App Router) and Node.js 18+ runtime.
