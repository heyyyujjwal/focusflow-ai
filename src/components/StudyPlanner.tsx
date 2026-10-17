import { useState, type FormEvent } from 'react';
import type { Task } from '../types';

/** Matches api/study-plan.ts MIN_HOURS / MAX_HOURS */
const MIN_HOURS = 0.5;
const MAX_HOURS = 24;
const MAX_TASKS = 30;
const DEFAULT_HOURS = 2;

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

interface StudyPlannerProps {
  tasks: Task[];
}

function mapTasksForApi(tasks: Task[]) {
  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    subject: t.subject,
    priority: t.priority,
    ...(t.dueDate ? { dueDate: t.dueDate } : {}),
    completed: t.completed,
  }));
}

function parseHours(raw: string): number | null {
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  return value;
}

function errorFromBody(data: unknown, status: number): string {
  if (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof (data as { error: unknown }).error === 'string' &&
    (data as { error: string }).error.trim() !== ''
  ) {
    return (data as { error: string }).error;
  }
  return `Request failed (HTTP ${status}).`;
}

function isStudyPlanResponse(data: unknown): data is StudyPlanResponse {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.plan) || obj.plan.length === 0) return false;
  if (typeof obj.summary !== 'string' || obj.summary.trim() === '') return false;
  return obj.plan.every((item) => {
    if (typeof item !== 'object' || item === null) return false;
    const p = item as Record<string, unknown>;
    return (
      typeof p.taskId === 'string' &&
      typeof p.title === 'string' &&
      typeof p.subject === 'string' &&
      typeof p.allocatedMinutes === 'number' &&
      typeof p.rationale === 'string' &&
      typeof p.suggestedOrder === 'number'
    );
  });
}

export default function StudyPlanner({ tasks }: StudyPlannerProps) {
  const [hoursInput, setHoursInput] = useState(String(DEFAULT_HOURS));
  const [loading, setLoading] = useState(false);
  const [hoursError, setHoursError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [plan, setPlan] = useState<StudyPlanResponse | null>(null);

  const activeTasks = tasks.filter((t) => !t.completed);
  const hasActiveTasks = activeTasks.length > 0;
  const tooManyTasks = tasks.length > MAX_TASKS;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    setHoursError(null);
    setRequestError(null);

    if (!hasActiveTasks) {
      setPlan(null);
      return;
    }

    if (tooManyTasks) {
      setHoursError(`A plan can include at most ${MAX_TASKS} tasks. Remove some tasks and try again.`);
      setPlan(null);
      return;
    }

    const hours = parseHours(hoursInput);
    if (hours === null) {
      setHoursError('Enter a valid number of hours.');
      setPlan(null);
      return;
    }
    if (hours < MIN_HOURS || hours > MAX_HOURS) {
      setHoursError(`Available hours must be between ${MIN_HOURS} and ${MAX_HOURS}.`);
      setPlan(null);
      return;
    }

    setLoading(true);
    setPlan(null);

    try {
      const response = await fetch('/api/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: mapTasksForApi(tasks),
          availableHours: hours,
        }),
      });

      let data: unknown;
      try {
        data = await response.json();
      } catch {
        setRequestError(`Server returned an invalid response (HTTP ${response.status}).`);
        return;
      }

      if (!response.ok) {
        setRequestError(errorFromBody(data, response.status));
        return;
      }

      if (!isStudyPlanResponse(data)) {
        setRequestError('Received an unexpected response from the server. Please try again.');
        return;
      }

      setPlan(data);
    } catch {
      setRequestError('Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  const orderedPlan = plan
    ? [...plan.plan].sort((a, b) => a.suggestedOrder - b.suggestedOrder)
    : [];

  const generateDisabled = loading || !hasActiveTasks;

  return (
    <section className="study-planner" aria-labelledby="study-planner-heading">
      <h2 id="study-planner-heading" className="study-planner__heading">
        AI Study Plan
      </h2>
      <p className="study-planner__intro">
        Generate a timed study plan from your current tasks. Completed tasks are left out of the plan.
      </p>

      {!hasActiveTasks && (
        <div className="study-planner__empty" role="status">
          <p className="study-planner__empty-title">No active tasks to plan.</p>
          <p className="study-planner__empty-hint">
            Add a task or mark a completed task as active, then generate a plan.
          </p>
        </div>
      )}

      <form className="study-planner__form" onSubmit={handleSubmit} noValidate>
        <div className={`form-group ${hoursError ? 'form-group--error' : ''}`}>
          <label htmlFor="available-hours" className="form-label">
            Available study hours
          </label>
          <input
            id="available-hours"
            type="number"
            className="form-input"
            inputMode="decimal"
            min={MIN_HOURS}
            max={MAX_HOURS}
            step={0.5}
            value={hoursInput}
            onChange={(e) => {
              setHoursInput(e.target.value);
              if (hoursError) setHoursError(null);
            }}
            disabled={loading}
            aria-required="true"
            aria-invalid={hoursError ? true : undefined}
            aria-describedby={hoursError ? 'hours-error hours-hint' : 'hours-hint'}
          />
          <span id="hours-hint" className="form-hint">
            Between {MIN_HOURS} and {MAX_HOURS} hours.
          </span>
          {hoursError && (
            <span id="hours-error" className="form-error" role="alert">
              {hoursError}
            </span>
          )}
        </div>

        <div className="form-group form-group--actions study-planner__actions">
          <button
            type="submit"
            className="btn btn--primary"
            disabled={generateDisabled}
            aria-busy={loading}
          >
            {loading ? 'Generating…' : 'Generate Study Plan'}
          </button>
        </div>
      </form>

      {loading && (
        <p className="study-planner__status" role="status" aria-live="polite">
          Generating your study plan…
        </p>
      )}

      {requestError && (
        <p className="study-planner__error" role="alert">
          {requestError}
        </p>
      )}

      {plan && (
        <div className="study-plan-result" aria-live="polite">
          <p className="study-plan-result__summary">{plan.summary}</p>
          <ol className="study-plan-list">
            {orderedPlan.map((item) => (
              <li key={`${item.taskId}-${item.suggestedOrder}`} className="study-plan-item">
                <div className="study-plan-item__header">
                  <span className="study-plan-item__order" aria-hidden="true">
                    {item.suggestedOrder}
                  </span>
                  <div>
                    <p className="study-plan-item__title">{item.title}</p>
                    <p className="study-plan-item__meta">
                      <span className="task-subject">{item.subject}</span>
                      <span className="study-plan-item__minutes">
                        {item.allocatedMinutes} min
                      </span>
                    </p>
                  </div>
                </div>
                <p className="study-plan-item__rationale">{item.rationale}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
