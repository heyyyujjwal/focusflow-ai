# PROMPTS.md – Actual Prompts Used During This Session

This file records the exact prompts submitted to the AI assistant (Antigravity / Claude Sonnet) during the development of FocusFlow. These are the genuine prompts from the assignment session, not invented after the fact.

---

## Prompt 1 – Full project generation

> Build a complete, polished React application called FocusFlow for my Frontend AI Engineering assignment: "React app development with AI."
>
> Work directly in the currently open folder.
>
> TECH STACK
> - React with TypeScript
> - Vite
> - Plain CSS
> - Browser localStorage
> - No unnecessary dependencies
>
> APPLICATION
> Create a modern, responsive study planner dashboard with:
> 1. A dashboard showing total, active, and completed task counts.
> 2. A form to add tasks with title, subject, priority, and optional due date.
> 3. Ability to edit, complete, and delete tasks.
> 4. Filters for All, Active, and Completed.
> 5. Search by task title.
> 6. A progress bar that updates automatically.
> 7. Persistent task data across browser refreshes using localStorage.
> 8. Sample tasks for a useful first-run experience.
> 9. Responsive desktop and mobile layouts.
> 10. Accessible form labels, keyboard focus indicators, validation, and empty states.
>
> DESIGN
> Use a clean productivity-dashboard design with a light neutral background, indigo/purple accent, polished typography, subtle borders, consistent spacing, and clear visual hierarchy.
>
> ASSIGNMENT DELIVERABLES
> Create:
> - README.md with installation, run, build, and test instructions.
> - PROMPTS.md containing the actual prompts used during this development session.
> - AI_WORKFLOW.md explaining where AI assisted, what I tested, and the manual corrections I made after reviewing the code.
> - A clear and maintainable source structure.
>
> IMPLEMENTATION PROCESS
> 1. Inspect the workspace.
> 2. Present a short implementation plan and file structure.
> 3. Then implement the application without waiting for further approval.
> 4. Run npm install, lint, and production build as appropriate.
> 5. Fix errors and retest.
> 6. Report the exact commands executed, their results, the files created, and any remaining limitations.
>
> Keep the scope focused so this can be completed efficiently. Do not claim that tests passed unless you actually ran them. Do not invent manual improvements or development prompts that were never used. Explain important decisions so I can understand the project and demonstrate my own contribution.

---

## Notes on Prompt Strategy

The single comprehensive prompt was intentionally structured to:

1. **Constrain the tech stack** – specifying React + TypeScript + Vite + plain CSS prevents the AI from defaulting to heavier dependencies (Redux, styled-components, etc.).
2. **List features as numbered items** – numbered requirements are harder for the AI to skip or merge ambiguously.
3. **Specify design intent** – "indigo/purple accent, polished typography, subtle borders" gives the AI enough to produce a specific look without providing a full design system.
4. **Demand honesty** – "Do not claim that tests passed unless you actually ran them" and "Do not invent prompts that were never used" are guardrails against AI hallucination in deliverable documents.
5. **Include a process section** – asking the AI to present a plan first and then implement lets the developer review the approach before it begins generating files, providing a natural checkpoint.

---

## Prompt 2 – Delete confirmation improvement

> Make one small manual-review improvement to FocusFlow.
>
> Inspect `src/components/TaskCard.tsx` and the component props before editing.
>
> Requirement: when the user clicks the delete button, show a browser confirmation dialog using `window.confirm()`. Only call the existing delete callback if the user confirms. If they cancel, the task must remain unchanged.
>
> Constraints:
> - Preserve the existing component structure, styling, and TypeScript types.
> - Do not refactor unrelated code.
> - Make the smallest appropriate change.
> - Run `npm run lint` and `npm run build`.
> - Show me the exact code change and the results of both commands.
>
> This is a deliberate usability improvement for my assignment. Explain why it prevents accidental deletion.

---

## Prompt 3 – AI_WORKFLOW.md update

> Update AI_WORKFLOW.md for my FocusFlow assignment.
>
> Document the delete-confirmation improvement in src/components/TaskCard.tsx.
>
> Include:
> - Original behavior: deleting a task immediately.
> - Improvement: asking for confirmation before deletion.
> - Why this improves usability.
> - The manual tests performed and their actual results.
> - Verification results: npm run lint completed with 0 warnings and 0 errors, and npm run build succeeded.
>
> Clearly distinguish AI-assisted changes from my own review and testing. Do not claim that browser tests passed unless I have confirmed them. Do not modify unrelated sections or files.

---

## Prompt 4 – Documentation review

> Review README.md, PROMPTS.md, and AI_WORKFLOW.md for my FocusFlow React AI assignment.
>
> Check that:
> 1. All three documents agree on the application's features and technology stack.
> 2. PROMPTS.md records prompts actually used during development.
> 3. AI_WORKFLOW.md distinguishes AI-generated changes, manual improvements, and verified tests.
> 4. The delete-confirmation test status is accurate. Do not mark tests as passed unless they were actually performed.
> 5. README.md includes the commands to install dependencies, start the app, run lint, and build for production.
>
> Make only necessary documentation corrections. Do not change application code. Report the exact files changed.
