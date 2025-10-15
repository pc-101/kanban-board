# Kanban Board

A Next.js 14 starter for organizing work on a drag-and-drop Kanban board. Rename columns inline, add tasks on the fly, switch between light and dark themes, and keep progress synced locally through browser storage.

## Features

- Drag tasks across columns with smooth reordering powered by `@hello-pangea/dnd`.
- Rename columns and add or delete tasks without leaving the board.
- Persist board state in the browser (`localStorage`) so your columns survive refreshes.
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
- `pnpm start` – launch the compiled app in production mode.
- `pnpm lint` – run ESLint checks.

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
tailwind.config.js # Tailwind configuration
postcss.config.js  # PostCSS setup
```

## Notes

- Board data persists in `localStorage` under the key `kanban-board:v1`. Clear it (e.g., through DevTools) to reset the board.
- The initial seeds are generated at runtime with `nanoid`, so IDs differ per browser session.
- For deployments, ensure your platform supports Next.js 14 (App Router) and Node.js 18+ runtime.
