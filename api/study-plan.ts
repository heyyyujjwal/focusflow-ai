/**
 * Vercel serverless function: POST /api/study-plan
 *
 * â”€â”€â”€ API CONTRACT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 *
 * REQUEST  POST /api/study-plan
 * Headers  Content-Type: application/json
 * Body     StudyPlanRequest (see type below)
 *
 * RESPONSE 200  StudyPlanResponse  â€“ structured study plan from Gemini
 *          400  ErrorResponse      â€“ bad request (validation failure)
 *          405  ErrorResponse      â€“ method not allowed
 *          500  ErrorResponse      â€“ server / model error (safe message only)
 *
 * â”€â”€â”€ REQUEST SHAPE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * {
 *   tasks: Array<{
 *     id:        string           // opaque identifier; echoed back in plan
 *     title:     string           // task description (max 200 chars)
 *     subject:   string           // subject / topic (max 100 chars)
 *     priority:  "low" | "medium" | "high"
 *     dueDate?:  string           // YYYY-MM-DD or omitted
 *     completed: boolean          // completed tasks are excluded from plan
 *   }>
 *   availableHours: number        // study time available: 0.5 â€“ 24
 * }
 *
 * â”€â”€â”€ RESPONSE SHAPE (200) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * {
 *   plan: Array<{
 *     taskId:          string     // matches an id from the request tasks array
 *     title:           string     // task title (echoed or summarised)
 *     subject:         string
 *     allocatedMinutes: number   // > 0, sum â‰¤ availableHours * 60
 *     rationale:       string    // one-sentence explanation of slot choice
 *     suggestedOrder:  number    // 1-based order in which to work on tasks
 *   }>
 *   summary: string              // one-paragraph overview of the plan
 * }
 *
 * â”€â”€â”€ ERROR RESPONSE SHAPE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * { error: string }
 *
 * â”€â”€â”€ SECURITY NOTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * â€¢ GEMINI_API_KEY is read from process.env only â€“ never from VITE_ variables.
 * â€¢ Stack traces and raw exceptions are never forwarded to the client.
 * â€¢ Input is length-capped and type-checked before reaching the model.
 * â€¢ Model output is structurally validated before being forwarded to the client.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const MODEL = "gemini-3.5-flash";
const MAX_TASKS = 30;
const MAX_TITLE_LEN = 200;
const MAX_SUBJECT_LEN = 100;
const MIN_HOURS = 0.5;
const MAX_HOURS = 24;
const VALID_PRIORITIES = new Set(["low", "medium", "high"]);

// â”€â”€â”€ Input types (mirrors src/types.ts Task, but only the fields we need) â”€â”€â”€â”€

interface RequestTask {
  id: string;
  title: string;
  subject: string;
  priority: string;
  dueDate?: string;
  completed: boolean;
}

interface StudyPlanRequest {
  tasks: RequestTask[];
  availableHours: number;
}

// â”€â”€â”€ Output types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface PlanItem {
  taskId: string;
  title: string;
  subject: string;
  allocatedMinutes: number;
  rationale: string;
  suggestedOrder: number;
}

interface StudyPlanResponse {
  plan: PlanItem[];
  summary: string;
}

// â”€â”€â”€ Validation helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isNonEmptyString(v: unknown): v is string {
  return isString(v) && v.trim().length > 0;
}

function isBoolean(v: unknown): v is boolean {
  return typeof v === "boolean";
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/** Returns an error message string or null if the task is valid. */
function validateTask(task: unknown, index: number): string | null {
  if (typeof task !== "object" || task === null) {
    return `tasks[${index}] must be an object`;
  }
  const t = task as Record<string, unknown>;

  if (!isNonEmptyString(t.id))
    return `tasks[${index}].id must be a non-empty string`;
  if (!isNonEmptyString(t.title))
    return `tasks[${index}].title must be a non-empty string`;
  if ((t.title as string).length > MAX_TITLE_LEN)
    return `tasks[${index}].title exceeds ${MAX_TITLE_LEN} characters`;
  if (!isNonEmptyString(t.subject))
    return `tasks[${index}].subject must be a non-empty string`;
  if ((t.subject as string).length > MAX_SUBJECT_LEN)
    return `tasks[${index}].subject exceeds ${MAX_SUBJECT_LEN} characters`;
  if (!isString(t.priority) || !VALID_PRIORITIES.has(t.priority))
    return `tasks[${index}].priority must be "low", "medium", or "high"`;
  if (!isBoolean(t.completed))
    return `tasks[${index}].completed must be a boolean`;
  if (t.dueDate !== undefined && !isString(t.dueDate))
    return `tasks[${index}].dueDate must be a string if provided`;

  return null;
}

/** Returns a validated StudyPlanRequest or throws with a user-readable message. */
function validateBody(body: unknown): StudyPlanRequest {
  if (typeof body !== "object" || body === null) {
    throw new Error("Request body must be a JSON object");
  }

  const b = body as Record<string, unknown>;

  if (!Array.isArray(b.tasks)) {
    throw new Error('"tasks" must be an array');
  }
  if (b.tasks.length === 0) {
    throw new Error('"tasks" must contain at least one task');
  }
  if (b.tasks.length > MAX_TASKS) {
    throw new Error(`"tasks" must not exceed ${MAX_TASKS} items`);
  }

  for (let i = 0; i < b.tasks.length; i++) {
    const err = validateTask(b.tasks[i], i);
    if (err) throw new Error(err);
  }

  if (!isFiniteNumber(b.availableHours)) {
    throw new Error('"availableHours" must be a number');
  }
  if (b.availableHours < MIN_HOURS || b.availableHours > MAX_HOURS) {
    throw new Error(
      `"availableHours" must be between ${MIN_HOURS} and ${MAX_HOURS}`
    );
  }

  return {
    tasks: b.tasks as RequestTask[],
    availableHours: b.availableHours,
  };
}

// â”€â”€â”€ Model output validation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Validates a single plan item from the model. Returns an error string or null. */
function validatePlanItem(item: unknown, taskIds: Set<string>): string | null {
  if (typeof item !== "object" || item === null) return "plan item must be an object";
  const p = item as Record<string, unknown>;

  if (!isString(p.taskId) || !taskIds.has(p.taskId))
    return `plan item taskId "${String(p.taskId)}" does not match any request task id`;
  if (!isNonEmptyString(p.title)) return "plan item title must be a non-empty string";
  if (!isNonEmptyString(p.subject)) return "plan item subject must be a non-empty string";
  if (!isFiniteNumber(p.allocatedMinutes) || (p.allocatedMinutes as number) <= 0)
    return "plan item allocatedMinutes must be a positive number";
  if (!isNonEmptyString(p.rationale)) return "plan item rationale must be a non-empty string";
  if (!isFiniteNumber(p.suggestedOrder) || !Number.isInteger(p.suggestedOrder) || (p.suggestedOrder as number) < 1)
    return "plan item suggestedOrder must be a positive integer";

  return null;
}

/** Parses and validates the raw JSON string returned by Gemini. */
function parseModelOutput(
  raw: string | undefined,
  taskIds: Set<string>
): StudyPlanResponse {
  if (!raw || raw.trim() === "") {
    throw new Error("Model returned an empty response");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Model did not return valid JSON");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Model JSON root must be an object");
  }

  const obj = parsed as Record<string, unknown>;

  if (!Array.isArray(obj.plan) || obj.plan.length === 0) {
    throw new Error('Model JSON must contain a non-empty "plan" array');
  }

  for (let i = 0; i < obj.plan.length; i++) {
    const err = validatePlanItem(obj.plan[i], taskIds);
    if (err) throw new Error(`plan[${i}]: ${err}`);
  }

  if (!isNonEmptyString(obj.summary)) {
    throw new Error('Model JSON must contain a non-empty "summary" string');
  }

  return {
    plan: obj.plan as PlanItem[],
    summary: obj.summary as string,
  };
}

// â”€â”€â”€ Prompt builder â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function buildPrompt(req: StudyPlanRequest): string {
  const activeTasks = req.tasks.filter((t) => !t.completed);

  const taskList = activeTasks
    .map((t) => {
      const due = t.dueDate ? `, due ${t.dueDate}` : "";
      return `- id: "${t.id}" | "${t.title}" (${t.subject}, ${t.priority} priority${due})`;
    })
    .join("\n");

  const totalMinutes = Math.round(req.availableHours * 60);

  return `You are a study planning assistant. The student has ${req.availableHours} hour(s) (${totalMinutes} minutes) of study time available today.

Active tasks to plan:
${taskList}

Create a realistic, prioritized study plan that:
1. Allocates time only to the tasks listed above (use the exact task id values).
2. Respects priority levels: high-priority tasks should generally receive more time or earlier slots.
3. Accounts for due dates: tasks due sooner should be scheduled earlier.
4. Keeps total allocatedMinutes across all plan items â‰¤ ${totalMinutes}.
5. Assigns a brief, concrete rationale for each time allocation.
6. Assigns suggestedOrder (1-based integer) indicating the recommended work sequence.
7. Does not add tasks that are not in the input list.

Respond with ONLY a JSON object in this exact shape, no markdown, no prose outside the JSON:
{
  "plan": [
    {
      "taskId": "<exact id from input>",
      "title": "<task title>",
      "subject": "<subject>",
      "allocatedMinutes": <positive integer>,
      "rationale": "<one sentence>",
      "suggestedOrder": <positive integer>
    }
  ],
  "summary": "<one paragraph overview of the plan>"
}`;
}

// â”€â”€â”€ Handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // 1. Method guard
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed. Use POST." });
    return;
  }

  // 2. API key guard (fail fast; never expose the key)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[study-plan] GEMINI_API_KEY environment variable is not set");
    res.status(500).json({ error: "Server configuration error. Please try again later." });
    return;
  }

  // 3. Parse & validate request body
  let request: StudyPlanRequest;
  try {
    validateBody(req.body); // throws with user-readable messages
    request = req.body as StudyPlanRequest;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid request body";
    res.status(400).json({ error: message });
    return;
  }

  // 4. Filter out completed tasks â€” no point planning them
  const activeTasks = request.tasks.filter((t) => !t.completed);
  if (activeTasks.length === 0) {
    res.status(400).json({ error: "All supplied tasks are already completed. Add some active tasks to plan." });
    return;
  }

  // 5. Call Gemini
  let rawText: string | undefined;
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: buildPrompt(request),
      config: {
        responseMimeType: "application/json",
        temperature: 0.4,  // low temperature for deterministic, structured output
        maxOutputTokens: 2048,
      },
    });

    rawText = response.text;
  } catch (err: unknown) {
    // Log the real error server-side; return a safe message to the client
    console.error("[study-plan] Gemini API call failed:", err);
    res.status(500).json({ error: "Failed to generate study plan. Please try again." });
    return;
  }

  // 6. Validate model output before forwarding to client
  const taskIds = new Set(activeTasks.map((t) => t.id));
  let studyPlan: StudyPlanResponse;
  try {
    studyPlan = parseModelOutput(rawText, taskIds);
  } catch (err: unknown) {
    // Log the raw response server-side for debugging; never send it to the client
    console.error("[study-plan] Model output validation failed:", err);
    console.error("[study-plan] Raw model output:", rawText);
    res.status(500).json({ error: "Received an unexpected response from the AI model. Please try again." });
    return;
  }

  // 7. Return validated plan
  res.status(200).json(studyPlan);
}
