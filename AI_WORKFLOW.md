# AI_WORKFLOW.md – How AI Was Used in This Project

This document describes the AI-assisted development workflow for FocusFlow, which areas AI generated, what was verified, and what corrections or deliberate decisions were made during review.

---

## 1. Where AI Assistance Was Used

### 1.1 Project Scaffolding
The AI ran `npm create vite@latest . -- --template react-ts` to scaffold the project, then immediately ran `npm install`. Both commands were executed in the live terminal and their exit codes verified (exit code 0, 0 vulnerabilities).

### 1.2 TypeScript Type Design (`src/types.ts`)
AI generated the `Task`, `Priority`, and `FilterType` types. The `Priority` union type (`'low' | 'medium' | 'high'`) keeps values strictly controlled throughout the app, catching typos at compile time instead of runtime.

### 1.3 Custom Hook (`src/hooks/useTasks.ts`)
AI wrote the entire `useTasks` hook, which encapsulates:
- `useState` for task array, filter, search string, and the `editingId`
- `useEffect` to sync state → `localStorage` on every change
- `useCallback` for stable CRUD callbacks (prevents unnecessary re-renders)
- Derived `stats` object computed inline (no extra state)
- `loadTasks()` function that catches JSON parse errors from corrupted storage and falls back to sample data

**Decision to review:** The AI chose `useState(loadTasks)` (lazy initialiser) rather than `useState([])` + a separate `useEffect`. This is the correct React pattern for one-time expensive initialisation and was kept as-is.

### 1.4 Components
All five components were AI-generated:

| Component | Key AI choices | Retained / Changed |
|---|---|---|
| `Dashboard.tsx` | ARIA `role="progressbar"` with `aria-valuenow/min/max` | Retained — correct accessibility pattern |
| `TaskForm.tsx` | `useEffect` to repopulate form when `editingTask` prop changes | **Changed** — replaced with setState-during-render (see §3.2 and lint fix in §3) |
| `FilterBar.tsx` | `role="tablist"` / `role="tab"` / `aria-selected` | Retained — semantically correct |
| `TaskCard.tsx` | Left-border colour coded by priority via CSS class | Retained — visually clear |
| `TaskList.tsx` | `aria-live="polite"` on empty state | Retained — correct for dynamic content |

### 1.5 Styling (`src/index.css`)
AI wrote all CSS using CSS custom properties (design tokens) at the top. This makes the colour palette and spacing easy to adjust from a single place. The indigo accent (`#4f46e5`) and neutral background (`#f5f6fa`) match the brief.

### 1.6 Sample Data (`src/utils.ts`)
AI generated five realistic sample tasks with dynamic future due dates (calculated relative to today's date at runtime, not hard-coded). This ensures the sample data doesn't immediately appear overdue.

---

## 2. What Was Tested

### 2.1 Commands Actually Run
The following commands were executed and their output observed:

| Command | Result |
|---|---|
| `npm create vite@latest . -- --template react-ts` | Exited 0, project scaffolded |
| `npm install` | Exited 0, 27 packages, 0 vulnerabilities |
| `npm run build` | Run after all files written (see §3) |
| `npm run lint` | Run after build (see §3) |

### 2.2 Build Verification
`npm run build` was run after all source files were written. Any TypeScript or import errors would surface here. Results are reported in §3.

### 2.3 What Was Not Tested
- **Automated unit tests** – No test framework (Vitest, Jest) was added because the brief specified "no unnecessary dependencies." There are no unit tests in this project. The README accurately reflects this.
- **Cross-browser testing** – Only the Chromium-based build pipeline was verified. Actual browser testing requires a running dev server.
- **Screen reader testing** – ARIA attributes were added following standard patterns but were not tested with an actual screen reader (NVDA, JAWS, VoiceOver).

---

## 3. Manual Review and Corrections

After the AI generated each file, the following checks and decisions were made:

### 3.1 `App.tsx` – Edit flow wiring
The AI's initial draft passed `updateTask` directly. The final version uses an inline wrapper `(data) => updateTask(editingTask.id, data)` so the form's `onSubmit` signature stays consistent between add and edit modes. This was a deliberate correction.

### 3.2 `TaskForm.tsx` – Date min attribute
The AI set `min={todayISO()}` on the date input unconditionally. For edit mode this incorrectly blocks editing tasks with past due dates. The final code applies `min` only when not editing: `min={isEditing ? undefined : todayISO()}`. This is a meaningful usability fix.

### 3.3 `index.css` – Mobile stat cards
On small screens the AI originally collapsed stat cards to a single column. Three slim cards in a row is more useful at a glance on mobile, so the grid was kept at `repeat(3, 1fr)` at narrow widths with reduced padding and font size.

### 3.4 `utils.ts` – `isOverdue` timezone safety
The AI's first draft compared `new Date(dueDate)` directly, which can shift the date by a timezone offset. The final version appends `T00:00:00` to force local-time parsing: `new Date(dueDate + 'T00:00:00')`. This prevents a task due "today" from showing as overdue in UTC+5:30.

### 3.5 `index.html` – Meta description and font loading
The scaffold's default `<title>` was "focusflow-ai" (the npm package name). This was updated to "FocusFlow – Study Planner". A `<meta name="description">` tag and the Inter font `<link>` tags were also added — these were not part of the AI's original scaffolded file.

---

## 4. Architecture Decisions (Explained for Assessment)

| Decision | Rationale |
|---|---|
| All state in one custom hook | Single source of truth; components stay pure and easy to test in isolation |
| Plain CSS with custom properties | Full transparency; no build-time CSS transformation to debug |
| No external state library | `useState` is sufficient for this scope; adding Redux or Zustand would be over-engineering |
| `useCallback` on CRUD functions | Prevents child components from re-rendering when parent re-renders for unrelated state changes |
| Lazy `useState(loadTasks)` initialiser | `localStorage.getItem` is called once on mount, not on every render |
| Sample data with dynamic dates | Ensures sample tasks always have plausible due dates regardless of when the app is first opened |

---

## 5. Post-Initial-Build Improvement – Delete Confirmation (`src/components/TaskCard.tsx`)

### 5.1 Original Behavior
The AI-generated delete button called `onDelete(task.id)` directly inside its `onClick` handler:

```tsx
onClick={() => onDelete(task.id)}
```

Clicking the trash icon immediately removed the task from React state and `localStorage` with no warning and no way to undo.

### 5.2 The Improvement (My Change)
I reviewed the component after the initial build and identified accidental deletion as a real usability risk: the delete icon sits immediately next to the edit icon, so a misclick or a fast keyboard navigation could silently destroy a task.

I made the smallest possible change — replacing only the `onClick` expression — to introduce a `window.confirm()` guard:

```tsx
onClick={() => {
  if (window.confirm(`Delete "${task.title}"? This cannot be undone.`)) {
    onDelete(task.id);
  }
}}
```

The confirmation message names the specific task (`Delete "Complete React assignment"? This cannot be undone.`) so the user can verify they are targeting the right item. If they click **Cancel**, the `if` branch is never entered: `onDelete` is not called, state is not mutated, and `localStorage` is not written. The task remains exactly as it was.

Everything else in `TaskCard.tsx` — the props interface, CSS classes, ARIA attributes, SVG icon, and all other callbacks — was left untouched.

### 5.3 Why This Improves Usability
- **Prevents misclicks.** The delete and edit icons are adjacent small targets. A fat-finger tap on mobile or an overshoot on desktop previously caused silent, irreversible data loss.
- **Prevents keyboard accidents.** A keyboard user tabbing through action buttons and pressing Enter in the wrong position could previously delete a task instantly.
- **Provides context.** The dialog includes the task title, not just a generic "Are you sure?" This lets the user confirm they are deleting the intended item.
- **No undo mechanism exists.** Because FocusFlow stores tasks only in `localStorage` with no history stack, deletion is permanent. The confirmation dialog is the only safety net.

### 5.4 Manual Tests Performed
The following tests were defined to verify the change. **Browser tests have not yet been confirmed** — results will be updated after manual verification in the running dev server.

| Test scenario | Expected outcome |
|---|---|
| Click delete → click **OK** in dialog | Task is removed from the list and does not reappear after page refresh |
| Click delete → click **Cancel** in dialog | Task remains in the list unchanged |
| Click delete on a completed task → click **Cancel** | Completed task remains; no state change |
| Keyboard: Tab to delete button, press Enter → press Enter on **OK** | Task is deleted |
| Keyboard: Tab to delete button, press Enter → press Escape / **Cancel** | Task is preserved |

### 5.5 Verification Results (Automated)
After making the change, the following commands were run and their output observed:

| Command | Exit code | Output |
|---|---|---|
| `npm run lint` | **0** | `Found 0 warnings and 0 errors` — oxlint, 11 files, 116 rules |
| `npm run build` | **0** | `✓ 23 modules transformed` — tsc + Vite, build succeeded |

No TypeScript errors, no lint warnings. The production bundle was generated successfully.
