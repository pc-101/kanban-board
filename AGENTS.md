# Repository Guidance for Agents

These instructions apply to the entire repository. Verify claims against the files listed below before changing or describing behavior. Do not infer deployment behavior from framework defaults or from one hosting provider's configuration.

## Core Engineering Principles

1. **Choose the simplest sufficient solution**
   - Implement only what the current requirements need.
   - Avoid speculative flexibility, premature abstractions, and unnecessary layers.
   - Introduce a helper or abstraction only when it removes meaningful duplication or clarifies behavior.

2. **Respect the existing structure**
   - Follow established repository patterns, naming, dependencies, and file organization.
   - Extend an existing code path before creating a parallel one.
   - Do not introduce a new framework, library, architectural pattern, or tool unless the task requires it and the benefit justifies the added maintenance cost.

3. **Keep changes task-scoped**
   - Modify only files needed to complete and verify the requested work.
   - Do not refactor, reformat, rename, or clean up unrelated code.
   - If an adjacent issue must be addressed for correctness, explain why it is necessary and keep the change narrow.

4. **Prefer clarity over cleverness**
   - Write code that a future maintainer can understand without reconstructing hidden assumptions.
   - Prefer explicit control flow and descriptive names over compressed or surprising logic.
   - Add comments for non-obvious constraints and decisions, not as a substitute for readable code.

## Source-of-Truth Pointers

- Read `package.json` for supported commands and the pinned Node.js major version.
- Read `next.config.js` before making claims about output mode, asset paths, or hosting behavior. The application uses a static export and publishes `out/`.
- Read `netlify.toml` for Netlify build-context behavior.
- Read `.github/workflows/deploy.yml` for GitHub Pages behavior. Do not assume that Netlify configuration also applies to GitHub Actions.
- Read `supabase/migrations/` for the production database schema and policies.
- Read `scripts/push-production-schema.mjs` for production migration safeguards.
- Read `lib/supabase.ts`, `lib/supabase-board.ts`, and `lib/board-store.ts` before describing persistence or synchronization.
- Keep `README.md`, `docs/project-guide.md`, and `.env.production.local.example` aligned when production setup changes.

## Verified Deployment Architecture

- Netlify production deploys run `pnpm build:production`, which applies pending Supabase migrations and then runs the static Next.js build.
- Netlify Deploy Previews and branch deploys run `pnpm build`; they must not apply production migrations.
- GitHub Actions deploys to GitHub Pages with `pnpm build`. It does not currently apply Supabase migrations automatically.
- Both deployment paths use Node.js 22.
- The Netlify publish directory and GitHub Pages artifact directory are both `out/`.
- Never state that production migrations are automated for GitHub Actions unless `.github/workflows/deploy.yml` has actually been changed to do so.

## Supabase Credential Boundaries

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SUPABASE_BOARD_ID` are browser-visible configuration. They cannot be treated as confidential because Next.js embeds them in the client bundle.
- `SUPABASE_DB_URL` is an administrative, build-only secret used by the production migration script. Never expose it through a `NEXT_PUBLIC_` variable, print it, commit a real value, or pass it into browser code.
- For Netlify, scope all four variables to Production builds. Mark only `SUPABASE_DB_URL` as containing a secret value.
- The public URL and publishable key cannot create database tables. Schema creation requires the administrative database connection or another privileged migration workflow.
- Database authorization depends on Supabase Row Level Security. A board ID is not an authorization mechanism.
- Do not add `--include-seed` to production migration commands. The application creates its initial board row when the migrated table is empty.

## Safe Change and Validation Rules

- Keep production schema changes in timestamped files under `supabase/migrations/`; do not make the SQL Editor the primary documented workflow.
- Preserve the production-context guard in `scripts/push-production-schema.mjs`.
- Do not make preview or branch deploys capable of mutating the production schema or data.
- Do not disable Netlify secret scanning globally to solve a false positive. Correct the variable's secret classification or use the narrowest justified exception.
- Before reporting success, run the checks relevant to the change. For application changes, prefer `pnpm build`; for script-only changes, also run `node --check <script>`; always run `git diff --check`.
- Report exactly which checks ran and any checks that could not run. Never claim a remote migration or deploy succeeded unless it was actually executed against that environment.
- Preserve unrelated user changes in a dirty worktree.

## Documentation and Commit Style

- Use plain, reproducible deployment steps and distinguish Netlify production, Netlify previews, and GitHub Pages explicitly.
- Never place real credentials or project-specific connection strings in examples.
- Commit subjects should be imperative and concise.
- Capitalize the first letter of every bullet point in commit-message bodies.

Example:

```text
Automate Netlify Supabase setup and align deployment configs

- Apply Supabase migrations during production Netlify builds
- Document fresh production deployment
- Add production database URL template
- Align GitHub Actions with Node 22
```
