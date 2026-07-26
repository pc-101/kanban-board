# Project Guide

This guide explains how the Kanban board is structured, how the local Supabase workflow works, and how to safely manage migrations, seed data, local development, and production deployment.

## Application Overview

The app is a static-exportable Next.js 14 Kanban board. The browser owns the user interface and talks directly to Supabase through the public anon key when Supabase env values are configured.

Core capabilities:

- multiple project boards with create, duplicate, delete, and switch actions
- board renaming
- drag-and-drop tasks
- editable columns
- task detail modal
- shared assignee list with color-coded pills, search, add, and manage flows
- explicit unassigned task labels
- completed timestamps for tasks moved to Done
- bulk clearing for Done tasks
- board accent colors
- local cache/fallback through `localStorage`
- Supabase persistence and polling sync
- GitHub Pages deployment

## Code Map

```text
app/
  layout.tsx                Root layout with header and theme provider
  page.tsx                  Kanban board page shell
  globals.css               Tailwind and global styles
components/
  board.tsx                 Board orchestration, hydration, polling, drag context
  board-switcher.tsx        Switch boards and open board-level actions
  board-title.tsx           Active board title and rename controls
  board-color-picker.tsx    Board accent color picker
  assignee-manager.tsx      Create/remove shared assignees
  column.tsx                Column view with inline editing and task creation
  task-card.tsx             Draggable task card
  task-detail-modal.tsx     Editable task detail modal
  header.tsx                Top navigation
  theme-provider.tsx        Theme provider wrapper
  theme-toggle.tsx          Light/dark switch
lib/
  board-store.ts            Zustand store, actions, local persistence, remote sync
  supabase.ts               Lazy Supabase browser client
  supabase-board.ts         Board list/load/save helpers
scripts/
  seed-supabase-board.mjs   Hosted/default board seeding helper
  write-local-supabase-env.mjs Writes local env values from Supabase CLI
supabase/
  config.toml               Local Supabase Docker configuration
  seed.sql                  Local sample data baseline
  migrations/               Schema history
docs/
  supabase-setup.sql        Manual hosted Supabase setup fallback
.github/workflows/
  deploy.yml                GitHub Pages deployment workflow
```

## State Management

The app uses Zustand in `lib/board-store.ts`.

The store tracks:

- active board ID
- available board metadata
- board title
- board color
- assignees
- columns
- tasks
- loading/sync state
- latest remote update timestamp
- sync errors

Actions in the store handle creating boards, duplicating the active board, deleting boards, switching boards, moving tasks, updating task details, adding/removing assignees, updating board color, and syncing with Supabase. The UI disables board deletion when only one board remains.

## Data Shape

Supabase stores each board as one row in `public.boards`:

```sql
public.boards (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
)
```

The `data` JSON contains the current board snapshot:

```text
boardTitle
boardColor
assignees
assigneeColors
columns
tasks
```

Task records can include title, assignee, description, due date, and completed timestamp fields. Assignee colors live at the board level in `assigneeColors`, keyed by assignee name, so tasks can keep a simple assignee string. Moving a task into a column named `Done` records `completedAt`; moving it back out clears that timestamp.

This keeps the schema intentionally simple for a starter app. A larger production app would likely normalize boards, columns, tasks, assignees, users, and memberships into separate tables.

## Local Vs Production

Local development uses Docker-backed Supabase:

```text
Next dev server -> local Supabase Docker -> local seeded data
```

Production uses GitHub Pages and hosted Supabase:

```text
GitHub Pages static app -> hosted Supabase project -> production data
```

The main reason for the split is safety. Local experiments should not mutate production data.

## Local Development

Start the normal local environment:

```bash
pnpm dev:local
```

That runs:

```bash
pnpm supabase:start && pnpm supabase:env && pnpm dev
```

Use the reset version when you want to start from a clean seeded database:

```bash
pnpm dev:local:reset
```

That runs:

```bash
pnpm supabase:start && pnpm supabase:reset && pnpm supabase:env && pnpm dev
```

Use `&&` instead of `;` in combined commands so setup stops if an earlier command fails.

## Local Supabase Commands

```bash
pnpm supabase:start      # start local Supabase containers
pnpm supabase:stop       # stop local Supabase containers
pnpm supabase:status     # show local URLs and keys
pnpm supabase:env        # write .env.development.local from local Supabase
pnpm supabase:reset      # rebuild local DB from migrations + seed.sql
pnpm supabase:dump:seed  # save current local public data into supabase/seed.sql
```

Local Supabase Studio usually runs at:

```text
http://127.0.0.1:54323
```

Local Supabase API usually runs at:

```text
http://127.0.0.1:54321
```

## Environment Files

Local Docker Supabase uses:

```text
.env.development.local
```

Generate it from the running local stack:

```bash
pnpm supabase:env
```

It should contain local values similar to:

```text
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local anon key>
NEXT_PUBLIC_SUPABASE_BOARD_ID=dev-product-launch
```

Production values should live in GitHub repository secrets:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SUPABASE_BOARD_ID
```

Avoid storing production credentials in local development env files.

## Migrations

Migrations are the saved recipe for building the database structure.

Create a migration:

```bash
pnpm exec supabase migration new describe_the_change
```

This creates a timestamped file in `supabase/migrations/`, for example:

```text
supabase/migrations/20260725124510_add_archived_flag.sql
```

Edit the generated file with your schema change:

```sql
alter table public.boards
add column archived boolean not null default false;
```

Apply migrations locally by resetting the database:

```bash
pnpm supabase:reset
```

Supabase applies every migration from earliest to latest filename, then runs `supabase/seed.sql`.

Use migrations for:

- tables
- columns
- indexes
- functions
- policies
- grants

## Seed Data

Seed data lives in:

```text
supabase/seed.sql
```

Think of `seed.sql` as the local sample data baseline. After a reset, the local database returns to whatever is in this file.

The reset order is:

```text
1. supabase/migrations/*
2. supabase/seed.sql
```

Use seed data for sample boards, tasks, assignees, and board colors.

If you change sample data in the app or Supabase Studio and want that data to become the new baseline, run:

```bash
pnpm supabase:dump:seed
```

Then verify that the saved baseline can be rebuilt:

```bash
pnpm supabase:reset
```

Use this for data changes, not schema changes.

## Reset Workflow

Use `pnpm supabase:reset` when local experiments should be thrown away.

It will:

```text
1. recreate the local database
2. apply all migrations in timestamp order
3. run supabase/seed.sql
```

Anything only stored in the local Docker database is lost. Anything captured in migrations or `seed.sql` comes back.

## Production Supabase Setup

For hosted Supabase, run the manual setup SQL:

```text
docs/supabase-setup.sql
```

That SQL mirrors the local migration and creates the `public.boards` table, RLS policies, and anon grants.

The starter currently uses permissive anonymous policies so the static GitHub Pages app can read and write without authentication. This is useful for learning and demos. A real private board should add Supabase Auth and restrict access by user, board, or workspace.

## GitHub Pages Deployment

This app uses static export:

```js
output: "export"
```

The deployment workflow is:

```text
.github/workflows/deploy.yml
```

In CI, GitHub injects hosted Supabase values from repository secrets during `pnpm build`. The static app then talks directly to hosted Supabase from the browser.

Because static export is enabled, `next start` is not used. To preview a production build locally:

```bash
pnpm build
pnpm start
```

`pnpm start` serves the generated `out/` directory.

## Sync Model

The collaboration model is intentionally simple.

Each browser session saves changes to Supabase. While the board is visible, it polls Supabase every 10 seconds and applies a newer remote snapshot if one exists.

This is last-write-wins sync. It is not Google Docs-style operational transform or CRDT collaboration. If two people edit the same board at the same time, the newest saved board snapshot can overwrite the older one.

## Persistence Layers

The app uses two persistence layers:

- Supabase when env values are configured.
- Browser `localStorage` as a fallback/cache.

Local cache keys use the `kanban-board:v2` prefix. The cache helps the app remain usable if Supabase is unavailable, but Supabase is the shared source when configured.

## Helpful Tips

- Use `pnpm supabase:reset` when local experiments should be discarded.
- Use `pnpm supabase:dump:seed` when local sample data should become the new baseline.
- Use migrations for schema changes, not `seed.sql`.
- Use `seed.sql` for sample rows, not tables or policies.
- Keep hosted Supabase credentials in GitHub Secrets for production.
- Keep local Docker credentials in `.env.development.local`, which should not be committed.
- If Supabase warns that `[inbucket]` is deprecated, update `supabase/config.toml` to use `[local_smtp]` for the local email testing service.
