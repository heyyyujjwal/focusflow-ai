
/**
 * Vercel serverless function: POST /api/study-plan
 *
 * API contract:
 * POST /api/study-plan
 *
 * Request:
 * {
 *   tasks: Array<{
 *     id: string;
 *     title: string;
 *     subject: string;
 *     priority: "low" | "medium" | "high";
 *     dueDate?: string;
 *     completed: boolean;
 *   }>;
 *   availableHours: number;
 * }
 *
 * Success response:
 * {
 *   plan: Array<{
 *     taskId: string;
 *     title: string;
 *     subject: string;
 *     allocatedMinutes: number;
 *     rationale: string;
 *     suggestedOrder: number;
 *   }>;
 *   summary: string;
 * }
 *
 * Security:
 * - GEMINI_API_KEY is read only from process.env.
 * - Secrets and stack traces are never returned to the client.
 * - Input is validated before calling Gemini.
 * - Model output is validated before being returned.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

// Constants
const MODEL = "gemini-3.5-flash";
const MAX_TASKS = 30;
const MAX_TITLE_LEN = 200;
const MAX_SUBJECT_LEN = 100;
const MIN_HOURS = 0.5;
const MAX_HOURS = 24;
const MAX_ATTEMPTS = 3;

const VALID_PRIORITIES = new Set(["low", "medium", "high"]);

// Request types
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

// Response types
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

// Validation helpers
function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0;
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function validateTask(task: unknown, index: number): string | null {
  if (typeof task !== "object" || task === null) {
    return `tasks[${index}] must be an object`;
  }

  const t = task as Record<string, unknown>;

  if (!isNonEmptyString(t.id)) {
    return `tasks[${index}].id must be a non-empty string`;
  }

  if (!isNonEmptyString(t.title)) {
    return `tasks[${index}].title must be a non-empty string`;
  }

  if (t.title.length > MAX_TITLE_LEN) {
    return `tasks[${index}].title exceeds ${MAX_TITLE_LEN} characters`;
  }

  if (!isNonEmptyString(t.subject)) {
    return `tasks[${index}].subject must be a non-empty string`;
  }

  if (t.subject.length > MAX_SUBJECT_LEN) {
    return `tasks[${index}].subject exceeds ${MAX_SUBJECT_LEN} characters`;
  }

  if (
    !isString(t.priority) ||
    !VALID_PRIORITIES.has(t.priority)
  ) {
    return `tasks[${index}].priority must be "low", "medium", or "high"`;
  }

  if (!isBoolean(t.completed)) {
    return `tasks[${index}].completed must be a boolean`;
  }

  if (t.dueDate !== undefined && !isString(t.dueDate)) {
    return `tasks[${index}].dueDate must be a string if provided`;
  }

  return null;
}

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
    const error = validateTask(b.tasks[i], i);

    if (error) {
      throw new Error(error);
    }
  }

  if (!isFiniteNumber(b.availableHours)) {
    throw new Error('"availableHours" must be a number');
  }

  if (
    b.availableHours < MIN_HOURS ||
    b.availableHours > MAX_HOURS
  ) {
    throw new Error(
      `"availableHours" must be between ${MIN_HOURS} and ${MAX_HOURS}`
    );
  }

  return {
    tasks: b.tasks as RequestTask[],
    availableHours: b.availableHours,
  };
}

// Model output validation
function validatePlanItem(
  item: unknown,
  taskIds: Set<string>
): string | null {
  if (typeof item !== "object" || item === null) {
    return "plan item must be an object";
  }

  const p = item as Record<string, unknown>;

  if (!isString(p.taskId) || !taskIds.has(p.taskId)) {
    return "plan item taskId does not match any request task id";
  }

  if (!isNonEmptyString(p.title)) {
    return "plan item title must be a non-empty string";
  }

  if (!isNonEmptyString(p.subject)) {
    return "plan item subject must be a non-empty string";
  }

  if (
    !isFiniteNumber(p.allocatedMinutes) ||
    p.allocatedMinutes <= 0
  ) {
    return "plan item allocatedMinutes must be a positive number";
  }

  if (!isNonEmptyString(p.rationale)) {
    return "plan item rationale must be a non-empty string";
  }

  if (
    !isFiniteNumber(p.suggestedOrder) ||
    !Number.isInteger(p.suggestedOrder) ||
    p.suggestedOrder < 1
  ) {
    return "plan item suggestedOrder must be a positive integer";
  }

  return null;
}

function parseModelOutput(
  raw: string | undefined,
  taskIds: Set<string>,
  availableMinutes: number
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

  let totalMinutes = 0;

  for (let i = 0; i < obj.plan.length; i++) {
    const item = obj.plan[i];
    const error = validatePlanItem(item, taskIds);

    if (error) {
      throw new Error(`plan[${i}]: ${error}`);
    }

    totalMinutes += (item as PlanItem).allocatedMinutes;
  }

  if (totalMinutes > availableMinutes) {
    throw new Error("Model allocated more time than the available study time");
  }

  if (!isNonEmptyString(obj.summary)) {
    throw new Error('Model JSON must contain a non-empty "summary" string');
  }

  return {
    plan: obj.plan as PlanItem[],
    summary: obj.summary,
  };
}

// Prompt builder
function buildPrompt(req: StudyPlanRequest): string {
  const activeTasks = req.tasks.filter((task) => !task.completed);

  const taskList = activeTasks
    .map((task) => {
      const due = task.dueDate ? `, due ${task.dueDate}` : "";

      return `- id: "${task.id}" | "${task.title}" (${task.subject}, ${task.priority} priority${due})`;
    })
    .join("\n");

  const totalMinutes = Math.round(req.availableHours * 60);

  return `You are a study planning assistant. The student has ${req.availableHours} hour(s) (${totalMinutes} minutes) of study time available today.

Active tasks to plan:
${taskList}

Create a realistic, prioritized study plan that:
1. Allocates time only to the tasks listed above, using their exact task IDs.
2. Generally gives high-priority tasks more time or earlier slots.
3. Schedules tasks with nearer due dates earlier.
4. Keeps the total allocatedMinutes at or below ${totalMinutes}.
5. Provides a brief, concrete rationale for each allocation.
6. Uses suggestedOrder as a 1-based work sequence.
7. Does not add tasks that are not in the input list.
8. Uses positive integer values for allocatedMinutes.

Respond with ONLY a JSON object in this exact shape, with no markdown or extra prose:
{
  "plan": [
    {
      "taskId": "<exact id from input>",
      "title": "<task title>",
      "subject": "<subject>",
      "allocatedMinutes": 30,
      "rationale": "<one sentence>",
      "suggestedOrder": 1
    }
  ],
  "summary": "<one paragraph overview of the plan>"
}`;
}

// Error helper for temporary Gemini availability failures
function isTemporaryGeminiError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const e = error as {
    status?: unknown;
    code?: unknown;
    message?: unknown;
    error?: {
      code?: unknown;
      status?: unknown;
      message?: unknown;
    };
  };

  const code = Number(e.status ?? e.code ?? e.error?.code);
  const status = String(e.error?.status ?? e.status ?? "");
  const message = String(e.error?.message ?? e.message ?? "");

  return (
    code === 503 ||
    status === "UNAVAILABLE" ||
    /high demand|temporarily unavailable|try again later/i.test(message)
  );
}

// Handler
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // 1. Method guard
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({
      error: "Method not allowed. Use POST.",
    });
    return;
  }

  // 2. API key guard
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error(
      "[study-plan] GEMINI_API_KEY environment variable is not set"
    );

    res.status(500).json({
      error: "Server configuration error. Please try again later.",
    });
    return;
  }

  // 3. Parse and validate request
  let request: StudyPlanRequest;

  try {
    request = validateBody(req.body);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Invalid request body";

    res.status(400).json({ error: message });
    return;
  }

  // 4. Exclude completed tasks
  const activeTasks = request.tasks.filter((task) => !task.completed);

  if (activeTasks.length === 0) {
    res.status(400).json({
      error:
        "All supplied tasks are already completed. Add some active tasks to plan.",
    });
    return;
  }

  // 5. Call Gemini with retries for temporary availability failures
  let rawText: string | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: MODEL,
        contents: buildPrompt(request),
        config: {
          responseMimeType: "application/json",
          temperature: 0.4,
          maxOutputTokens: 2048,
        },
      });

      rawText = response.text;
      break;
    } catch (error: unknown) {
      const temporary = isTemporaryGeminiError(error);

      console.error(
        `[study-plan] Gemini request failed (attempt ${attempt}/${MAX_ATTEMPTS}):`,
        error
      );

      if (!temporary || attempt === MAX_ATTEMPTS) {
        res.status(500).json({
          error: temporary
            ? "The AI service is temporarily busy. Please try again shortly."
            : "Failed to generate study plan. Please try again.",
        });
        return;
      }

      // Retry after 1.2 seconds, then 2.4 seconds.
      await new Promise((resolve) =>
        setTimeout(resolve, 1200 * attempt)
      );
    }
  }

  if (!rawText) {
    res.status(500).json({
      error: "Failed to generate study plan. Please try again.",
    });
    return;
  }

  // 6. Validate model output before returning it
  const taskIds = new Set(activeTasks.map((task) => task.id));
  let studyPlan: StudyPlanResponse;

  try {
    studyPlan = parseModelOutput(
      rawText,
      taskIds,
      Math.round(request.availableHours * 60)
    );
  } catch (error: unknown) {
    console.error("[study-plan] Model output validation failed:", error);

    // Do not log or return the raw model output.
    res.status(500).json({
      error: "Received an unexpected response from the AI model. Please try again.",
    });
    return;
  }

  // 7. Return validated plan
  res.status(200).json(studyPlan);
}
