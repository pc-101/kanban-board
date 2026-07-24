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
- `pnpm db:seed` – seed or reset the configured Supabase board row from `.env.local`.

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

1. Create a Supabase project.
2. Open the SQL editor and run `docs/supabase-setup.sql`.
3. Copy `.env.local.example` to `.env.local` and fill in your project URL and anon/publishable key:
   ```bash
   cp .env.local.example .env.local
   ```
4. Seed the initial board row:
   ```bash
   pnpm db:seed
   ```
5. Run the app locally with `pnpm dev`. The board loads from Supabase when the environment variables are present and falls back to `localStorage` if they are missing.

For GitHub Pages, add these as repository secrets or environment variables during the build if you want the deployed static bundle to point at Supabase:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_BOARD_ID` (optional; defaults to `default`)

The SQL file uses permissive anonymous policies so this starter works without authentication. For a real multi-user board, add Supabase Auth and restrict rows by user.

Each project board is stored as a separate row in `public.boards`, and the board switcher loads the selected row by ID.

The collaboration model is intentionally simple: each active board polls Supabase every 10 seconds and applies the newest remote snapshot. This is last-write-wins synchronization, not Google Docs-style operational transform or CRDT conflict resolution.

## Notes

- Board data is cached in `localStorage` under the key `kanban-board:v1` and synced to Supabase when configured.
- The initial seeds are generated at runtime with `nanoid`, so IDs differ per browser session.
- For deployments, ensure your platform supports Next.js 14 (App Router) and Node.js 18+ runtime.
