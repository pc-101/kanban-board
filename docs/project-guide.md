# Project Guide

This guide explains how the Kanban board is structured, how the local Supabase workflow works, and how to safely manage migrations, seed data, local development, and production deployment.

## Application Overview

The app is a static-exportable Next.js 14 Kanban board. The browser owns the user interface and talks directly to Supabase through a publishable key when Supabase env values are configured.

Core capabilities:

- multiple project boards with create, duplicate, delete, and switch actions
- board renaming
- drag-and-drop tasks
- editable columns
- task detail modal
- shared assignee list with color-coded pills, search, add, color customization, and manage flows
- explicit unassigned task labels with a reserved neutral color
- completed timestamps for tasks moved to Done
- reversible individual and bulk archiving for Done tasks
- hourly automatic archival 14 days after completion
- board accent colors
- local cache/fallback through `localStorage`
- Supabase persistence, Realtime updates, and polling fallback
- Vercel, Netlify, and GitHub Pages deployment

## Code Map

```text
app/
  layout.tsx                Root layout with header and theme provider
  page.tsx                  Kanban board page shell
  globals.css               Tailwind and global styles
components/
  board.tsx                 Board orchestration, hydration, Realtime/polling sync, drag context
  board-switcher.tsx        Switch boards and open board-level actions
  board-title.tsx           Active board title and rename controls
  board-color-picker.tsx    Board accent color picker
  assignee-manager.tsx      Create/remove shared assignees
  column.tsx                Column view with inline editing and task creation
  task-card.tsx             Draggable task card
  archived-tasks-modal.tsx  Browse and restore archived Done tasks
  task-detail-modal.tsx     Editable task detail modal
  header.tsx                Top navigation
  theme-provider.tsx        Theme provider wrapper
  theme-toggle.tsx          Light/dark switch
lib/
  board-store.ts            Zustand store, actions, local persistence, remote sync
  supabase.ts               Lazy Supabase browser client
  supabase-board.ts         Board list/load/save helpers
scripts/
  build-vercel.mjs          Vercel production/preview build router
  seed-supabase-board.mjs   Hosted/default board seeding helper
  write-local-supabase-env.mjs Writes local env values from Supabase CLI
supabase/
  config.toml               Local Supabase Docker configuration
  seed.sql                  Local sample data baseline
  migrations/               Schema history
docs/
.github/workflows/
  deploy.yml                GitHub Pages deployment workflow
vercel.json                 Vercel build-command configuration
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

The browser still uses one convenient `BoardSnapshot` object for rendering, but Supabase stores its independently editable parts in normalized tables:

```sql
public.boards (
  id text primary key,
  data jsonb not null, -- temporary compatibility copy
  title text not null,
  color text not null,
  updated_at timestamptz not null default now()
)

public.board_columns (
  board_id text,
  id text,
  title text,
  position integer
)

public.board_tasks (
  board_id text,
  id text,
  column_id text,
  position integer,
  title text,
  assignee text,
  description text,
  due_date text,
  completed_at timestamptz,
  archived_at timestamptz
)

public.board_assignees (
  board_id text,
  name text,
  color text,
  position integer
)
```

`lib/supabase-board.ts` reconstructs the UI snapshot from those rows:

```text
boardTitle
boardColor
assignees
assigneeColors
columns
tasks
```

Task records can include title, assignee, description, due date, completed timestamp, and archived timestamp fields. Assignee colors live at the board level in `assigneeColors`, keyed by assignee name, so tasks can keep a simple assignee string. The unassigned state uses a reserved neutral color that is intentionally excluded from the selectable assignee palette. Moving a task into a column named `Done` records `completedAt`; moving it back out clears that timestamp.

Archiving sets `archivedAt` without removing the task from its Done column or deleting its normalized database row. Archived tasks are filtered from the active Done list and remain available from the **Archived** dialog, where they can be restored. **Archive all** applies the same reversible state to every visible Done task. The X control remains the only permanent task-deletion action.

The `archive-stale-board-tasks` Supabase Cron job runs at the start of every hour and archives tasks whose `completed_at` value is at least 14 days old. The job updates each affected parent board timestamp so Realtime subscribers and the polling fallback reload the archived state. Because this runs in Postgres, archival does not depend on a browser tab remaining open.

The `boards.data` JSON column remains temporarily as a compatibility copy for boards created under the original schema. Current clients read the normalized tables and must not treat that JSON copy as the shared source of truth.

## Local Vs Production

Local development uses Docker-backed Supabase:

```text
Next dev server -> local Supabase Docker -> local seeded data
```

Production uses a static host and hosted Supabase:

```text
Vercel, Netlify, or GitHub Pages -> hosted Supabase project -> production data
```

The main reason for the split is safety. Local experiments should not mutate production data.

## Local Development

The committed `.nvmrc`, `packageManager` field, and `.npmrc` keep Node and pnpm consistent across macOS and WSL. After completing the one-time Corepack setup documented in `README.md`, run `nvm use` whenever returning from a repository that uses another Node version. Corepack selects the project-pinned pnpm version automatically.

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

Run the two-browser collaboration test with:

```bash
pnpm test:e2e:dev
```

Playwright resets local Supabase, starts the development server, and verifies different-entity merging, Realtime delivery, and the same-entity last-write-wins boundary. Install its Chromium browser once per machine with `pnpm exec playwright install chromium`. Because the test uses `dev:local:reset`, it intentionally replaces current local data with the committed seed.

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
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local public API key>
NEXT_PUBLIC_SUPABASE_BOARD_ID=dev-product-launch
```

Production browser values should live in the deployment provider's environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
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
- scheduled database jobs

The task-archiving migration enables Supabase Cron through the `pg_cron` extension. Applying the migration creates the hourly job automatically. Job runs can be inspected in **Supabase Dashboard → Integrations → Cron**, or in the local database's `cron.job_run_details` table.

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

The recommended Vercel and Netlify flows apply version-controlled migrations automatically during Production deploys. Configure these variables in the production environment of the selected provider:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SUPABASE_BOARD_ID
SUPABASE_DB_URL
```

Existing deployments must replace `NEXT_PUBLIC_SUPABASE_ANON_KEY` with `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and use an `sb_publishable_...` value from **Supabase → Settings → API Keys**. Keep the legacy key active until every deployed client has switched; review Supabase's key usage indicators before disabling it.

`SUPABASE_DB_URL` is an administrative Postgres connection string used only while applying migrations. Scope all four variables to Production builds so previews cannot connect to production data. Mark only `SUPABASE_DB_URL` as secret: every `NEXT_PUBLIC_*` value is intentionally embedded in the browser bundle. Never give the database URL a `NEXT_PUBLIC_` prefix. Copy it from the Supabase dashboard's **Connect** dialog; use the Session pooler when the build environment does not support IPv6 and percent-encode special characters in the database password.

Production deploys run:

```bash
pnpm build:production
```

This calls `supabase db push --db-url ...` and then `next build`. Supabase records applied migration versions, so later deploys apply only pending files from `supabase/migrations`. Netlify previews and Vercel Preview or Development builds use `pnpm build` and do not receive or use the production database URL.

If another host is used, run `pnpm db:push:production` once with the required production variables available before building. The versioned files under `supabase/migrations/` are the only supported schema setup path; this avoids a separate manual SQL file drifting out of date.

The archive UI requires the `archived_at` migration. For GitHub Pages, which does not apply production migrations during its frontend build, run `pnpm db:push:production` before deploying the archive-enabled frontend. Netlify and Vercel Production builds apply the migration through their existing production build routes.

The starter currently uses permissive anonymous policies so the static GitHub Pages app can read and write without authentication. This is useful for learning and demos. A real private board should add Supabase Auth and restrict access by user, board, or workspace.

## Vercel Deployment

The committed `vercel.json` selects `pnpm build:vercel` for every Vercel deployment. `scripts/build-vercel.mjs` reads `VERCEL_TARGET_ENV` or `VERCEL_ENV`: Production routes to `pnpm build:production`, while every other environment routes to `pnpm build`.

Enable **Automatically expose System Environment Variables** in the Vercel project so the build router can identify its environment. The router fails closed when neither environment variable is available. The production migration script independently rejects any Vercel invocation whose environment is not Production.

Configure all four Supabase variables for Production and mark only `SUPABASE_DB_URL` as sensitive. Do not expose production values to Preview. Preview can remain local-storage-only or use the three public variables for a separate, previously migrated preview database.

This separation means a fresh Vercel Production deployment applies the complete schema before building the static frontend, while Preview and Development builds cannot mutate the production database.

## Netlify Deployment

The committed `netlify.toml` publishes `out/`. Its production context applies database migrations before the static build, while preview contexts only build the frontend. A fresh deployment therefore requires creating an empty Supabase project, adding the four environment variables above, connecting the repository to Netlify, and deploying.

The app creates the initial board row on first use if the migrated table is empty; production seed data is optional.

### Environment-variable precedence and imports

Importing an `.env` file does not convert URI protocols. A `postgresql://` value remains a `postgresql://` value. Problems can arise when an import encounters an existing key or when variables that need different scopes, contexts, or secret classifications are imported together.

Netlify resolves relevant conflicts as follows:

- A value committed in `netlify.toml` overrides a value with the same key from the UI, CLI, or API.
- A site-level variable overrides a shared team variable for the same scope and deploy context.
- Contextual values can differ across Production, Deploy Previews, branch deploys, and local development.
- An `.env` import's merge strategy determines whether conflicting values are skipped or updated; scope changes may not apply to an existing conflicting variable in every import mode.

When a build receives an unexpected value, filter the environment-variable view to the failing deploy context and inspect both project and team settings. For `SUPABASE_DB_URL`, the safest recovery is to delete its site-level contextual values and recreate it individually with **Builds** scope, **Production** context, and secret classification. Store only the raw Session pooler URI, without a key prefix, quotes, or command-line wrapper.

Prefer individual entry for administrative credentials or variables that require unique scopes and contexts. Bulk import is useful for groups of variables that intentionally share configuration, provided conflicts and the selected merge strategy are reviewed.

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

The collaboration model uses entity-level patches.

Each browser remembers the last normalized snapshot it loaded. When local state changes, `lib/supabase-board.ts` compares the new snapshot with that baseline and sends only the changed board metadata, columns, tasks, assignees, and deletions to the `apply_board_patch` database function. That function applies the patch in one transaction. The client reloads the merged normalized rows after the save.

Every successful patch also updates the parent board timestamp. The active board subscribes to that row through Supabase Realtime and reloads when another client saves. A 10-second poll runs while the tab is visible as a fallback for missed or interrupted Realtime events.

Edits to different entities merge: for example, one person can rename task A while another edits task B without either whole board overwriting the other. Concurrent edits to the same task, the same board metadata, or the same ordering positions remain last-write-wins. This is a practical collaboration improvement, not operational transform or a CRDT.

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
- Keep hosted Supabase credentials in deployment-provider secrets for production.
- Keep local Docker credentials in `.env.development.local`, which should not be committed.
- If Supabase warns that `[inbucket]` is deprecated, update `supabase/config.toml` to use `[local_smtp]` for the local email testing service.
