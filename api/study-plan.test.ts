// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const generateContent = vi.fn();

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent };
  },
}));

import handler from "./study-plan.js";

const validTask = {
  id: 'task-1',
  title: 'Review TypeScript generics',
  subject: 'Programming',
  priority: 'high',
  dueDate: '2026-10-20',
  completed: false,
};

function createRes() {
  const res = {
    headers: {} as Record<string, string>,
    statusCode: 0,
    body: undefined as unknown,
    setHeader(name: string, value: string) {
      res.headers[name] = value;
      return res;
    },
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(payload: unknown) {
      res.body = payload;
      return res;
    },
  };
  return res;
}

function callHandler(req: Partial<VercelRequest>) {
  const res = createRes();
  return handler(req as VercelRequest, res as unknown as VercelResponse).then(() => res);
}

beforeEach(() => {
  generateContent.mockReset();
  vi.stubEnv('GEMINI_API_KEY', 'test-dummy-key');
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('POST /api/study-plan', () => {
  it('rejects non-POST methods', async () => {
    const res = await callHandler({ method: 'GET' });
    expect(res.statusCode).toBe(405);
    expect(res.body).toEqual({ error: 'Method not allowed. Use POST.' });
    expect(generateContent).not.toHaveBeenCalled();
  });

  it('returns a safe error when the API key is missing', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const res = await callHandler({
      method: 'POST',
      body: { tasks: [validTask], availableHours: 2 },
    });
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      error: 'Server configuration error. Please try again later.',
    });
    expect(JSON.stringify(res.body)).not.toMatch(/GEMINI_API_KEY|test-dummy-key/i);
    expect(generateContent).not.toHaveBeenCalled();
  });

  it('validates missing tasks', async () => {
    const res = await callHandler({
      method: 'POST',
      body: { availableHours: 2 },
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: '"tasks" must be an array' });
    expect(generateContent).not.toHaveBeenCalled();
  });

  it('validates availableHours bounds', async () => {
    const res = await callHandler({
      method: 'POST',
      body: { tasks: [validTask], availableHours: 40 },
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      error: '"availableHours" must be between 0.5 and 24',
    });
    expect(generateContent).not.toHaveBeenCalled();
  });

  it('rejects when every task is already completed', async () => {
    const res = await callHandler({
      method: 'POST',
      body: {
        tasks: [{ ...validTask, completed: true }],
        availableHours: 2,
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      error: 'All supplied tasks are already completed. Add some active tasks to plan.',
    });
    expect(generateContent).not.toHaveBeenCalled();
  });

  it('returns a safe error when the model call fails', async () => {
    generateContent.mockRejectedValue(new Error('upstream unavailable'));
    const res = await callHandler({
      method: 'POST',
      body: { tasks: [validTask], availableHours: 2 },
    });
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      error: 'Failed to generate study plan. Please try again.',
    });
    expect(JSON.stringify(res.body)).not.toContain('upstream unavailable');
  });

  it('returns a safe error when model JSON is invalid', async () => {
    generateContent.mockResolvedValue({ text: 'not-json' });
    const res = await callHandler({
      method: 'POST',
      body: { tasks: [validTask], availableHours: 2 },
    });
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      error: 'Received an unexpected response from the AI model. Please try again.',
    });
    expect(JSON.stringify(res.body)).not.toContain('not-json');
  });

  it('returns a validated plan from mocked model output', async () => {
    const plan = {
      summary: 'Spend the block on TypeScript review.',
      plan: [
        {
          taskId: 'task-1',
          title: 'Review TypeScript generics',
          subject: 'Programming',
          allocatedMinutes: 60,
          rationale: 'Only active task.',
          suggestedOrder: 1,
        },
      ],
    };
    generateContent.mockResolvedValue({ text: JSON.stringify(plan) });

    const res = await callHandler({
      method: 'POST',
      body: { tasks: [validTask], availableHours: 2 },
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(plan);
  });
});

