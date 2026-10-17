import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Task } from '../types';
import StudyPlanner from './StudyPlanner';

const activeTask: Task = {
  id: 'task-1',
  title: 'Review TypeScript generics',
  subject: 'Programming',
  priority: 'high',
  dueDate: '2026-10-20',
  completed: false,
  createdAt: '2026-10-01T00:00:00.000Z',
};

const completedTask: Task = {
  id: 'task-2',
  title: 'Finished reading',
  subject: 'History',
  priority: 'low',
  completed: true,
  createdAt: '2026-10-01T00:00:00.000Z',
};

const planResponse = {
  summary: 'Focus on TypeScript first, then lighter review work.',
  plan: [
    {
      taskId: 'task-1',
      title: 'Review TypeScript generics',
      subject: 'Programming',
      allocatedMinutes: 90,
      rationale: 'High priority and due soon.',
      suggestedOrder: 2,
    },
    {
      taskId: 'task-3',
      title: 'Practice React hooks',
      subject: 'Frontend',
      allocatedMinutes: 30,
      rationale: 'Shorter follow-up session.',
      suggestedOrder: 1,
    },
  ],
};

function mockFetchOk(data: unknown, options?: { delay?: Promise<void> }) {
  return vi.fn(async () => {
    if (options?.delay) await options.delay;
    return {
      ok: true,
      status: 200,
      json: async () => data,
    };
  });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('StudyPlanner', () => {
  it('shows an empty-task state and does not call the API', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<StudyPlanner tasks={[completedTask]} />);

    expect(screen.getByText('No active tasks to plan.')).toBeTruthy();
    expect(
      (screen.getByRole('button', { name: 'Generate Study Plan' }) as HTMLButtonElement).disabled
    ).toBe(true);

    fireEvent.submit(screen.getByRole('button', { name: 'Generate Study Plan' }).closest('form')!);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('validates available hours and skips the network request', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<StudyPlanner tasks={[activeTask]} />);

    fireEvent.change(screen.getByLabelText('Available study hours'), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Study Plan' }));

    expect(screen.getByRole('alert').textContent).toContain(
      'Available hours must be between 0.5 and 24.'
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows a loading state and sends the API payload without createdAt', async () => {
    let resolveFetch: ((value: unknown) => void) | undefined;
    const pending = new Promise((resolve) => {
      resolveFetch = resolve;
    });

    const fetchMock = vi.fn<
  (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
>(() =>
  pending.then(() => ({
    ok: true,
    status: 200,
    json: async () => planResponse,
  }) as Response),
);
    vi.stubGlobal('fetch', fetchMock);

    render(<StudyPlanner tasks={[activeTask]} />);

    fireEvent.change(screen.getByLabelText('Available study hours'), { target: { value: '3.5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Study Plan' }));

    expect(await screen.findByText('Generating your study plan…')).toBeTruthy();
    expect(
      (screen.getByRole('button', { name: 'Generating…' }) as HTMLButtonElement).disabled
    ).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Generating…' }));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const firstCall = fetchMock.mock.calls[0];

expect(firstCall).toBeDefined();
expect(firstCall?.[0]).toBe('/api/study-plan');


if (!firstCall) {
  throw new Error('Expected fetch to be called');
}

expect(firstCall[0]).toBe('/api/study-plan');

const requestInit = firstCall![1];
expect(requestInit?.method).toBe('POST');
expect(requestInit?.headers).toEqual({
  'Content-Type': 'application/json',
});

const body = JSON.parse(String(requestInit?.body));
    expect(body).toEqual({
      availableHours: 3.5,
      tasks: [
        {
          id: 'task-1',
          title: 'Review TypeScript generics',
          subject: 'Programming',
          priority: 'high',
          dueDate: '2026-10-20',
          completed: false,
        },
      ],
    });
    expect(body.tasks[0]).not.toHaveProperty('createdAt');

    resolveFetch?.(undefined);
    await waitFor(() => {
      expect(screen.getByText(planResponse.summary)).toBeTruthy();
    });
  });

  it('renders the returned summary and plan in suggested order', async () => {
    vi.stubGlobal('fetch', mockFetchOk(planResponse));

    render(<StudyPlanner tasks={[activeTask]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Generate Study Plan' }));

    expect(await screen.findByText(planResponse.summary)).toBeTruthy();
    expect(screen.getByText('Practice React hooks')).toBeTruthy();
    expect(screen.getByText('Review TypeScript generics')).toBeTruthy();
    expect(screen.getByText('Frontend')).toBeTruthy();
    expect(screen.getByText('Programming')).toBeTruthy();
    expect(screen.getByText('30 min')).toBeTruthy();
    expect(screen.getByText('90 min')).toBeTruthy();
    expect(screen.getByText('Shorter follow-up session.')).toBeTruthy();
    expect(screen.getByText('High priority and due soon.')).toBeTruthy();

    const titles = screen.getAllByText(/Practice React hooks|Review TypeScript generics/).map(
      (el) => el.textContent
    );
    expect(titles[0]).toBe('Practice React hooks');
    expect(titles[1]).toBe('Review TypeScript generics');
  });

  it('shows HTTP error messages from the API body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Failed to generate study plan. Please try again.' }),
      }))
    );

    render(<StudyPlanner tasks={[activeTask]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Generate Study Plan' }));

    expect(
      await screen.findByText('Failed to generate study plan. Please try again.')
    ).toBeTruthy();
    expect(screen.queryByText(planResponse.summary)).toBeNull();
  });

  it('shows a network error when fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      })
    );

    render(<StudyPlanner tasks={[activeTask]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Generate Study Plan' }));

    expect(
      await screen.findByText('Network error. Check your connection and try again.')
    ).toBeTruthy();
  });
});
