# FocusFlow – AI-Powered Study Planner

A modern, responsive study planner dashboard built with **React**, **TypeScript**, and **Vite** as part of a Frontend AI Engineering assignment.

---

## Features

- **Dashboard** – live counts of total, active, and completed tasks with an animated progress bar
- **Task management** – add, edit, complete, and delete tasks
- **Priority levels** – Low / Medium / High with colour-coded left borders and badges
- **Due dates** – optional; overdue tasks are highlighted with a warning
- **Filters** – All · Active · Completed tabs with per-filter counts
- **Search** – real-time title search with a one-click clear button
- **Persistence** – all tasks saved to `localStorage`; survive page refreshes
- **Sample tasks** – five pre-loaded tasks on first run so the UI is never empty
- **Accessible** – ARIA labels, keyboard focus indicators, live regions, and form error announcements
- **Responsive** – works on desktop and mobile

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite 6 |
| Styling | Plain CSS with CSS custom properties |
| State | `useState`, `useEffect`, `useCallback` (no external state library) |
| Persistence | Browser `localStorage` |
| Font | Inter via Google Fonts |

---

## Installation

```bash
# 1. Clone / enter the project folder
cd focusflow-ai

# 2. Install dependencies
npm install
```

---

## Running Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.  
The dev server supports hot-module replacement (HMR) so changes appear instantly.

---

## Production Build

```bash
npm run build
```

Output goes to the `dist/` folder.  
Preview the production build locally:

```bash
npm run preview
```

---

## Type Check

```bash
npm run build   # runs tsc -b (full compile) then vite build — type errors will fail the build
```

To type-check without producing a bundle:

```bash
npx tsc --noEmit
```

---

## Lint

```bash
npm run lint
```

---

## Project Structure

```
focusflow-ai/
├── index.html                  # HTML entry point (sets title, loads Inter font)
├── vite.config.ts              # Vite configuration (default react plugin)
├── tsconfig.json               # TypeScript configuration
├── package.json
├── src/
│   ├── main.tsx                # React DOM entry point
│   ├── App.tsx                 # Root component – composes all sections
│   ├── index.css               # All styles (design tokens + component rules)
│   ├── types.ts                # Shared TypeScript types (Task, Priority, FilterType)
│   ├── utils.ts                # Helpers: generateId, formatDate, isOverdue, SAMPLE_TASKS
│   ├── hooks/
│   │   └── useTasks.ts         # Custom hook: state, localStorage sync, CRUD, filter/search
│   └── components/
│       ├── Dashboard.tsx       # Stat cards + progress bar
│       ├── TaskForm.tsx        # Controlled add/edit form with validation
│       ├── FilterBar.tsx       # Filter tabs + search input
│       ├── TaskCard.tsx        # Single task row with actions
│       └── TaskList.tsx        # List renderer + empty state
├── README.md
├── PROMPTS.md
└── AI_WORKFLOW.md
```

---

## Key Design Decisions

- **Single CSS file** – kept intentionally flat and auditable; no CSS modules or Tailwind.
- **`useTasks` hook** – all business logic lives in one place; components are pure presentational.
- **No router** – single-page layout; filter state drives what renders.
- **No external UI library** – every element is hand-crafted for full transparency.
