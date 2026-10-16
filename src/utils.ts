import type { Task } from './types';

/** Generate a simple unique ID */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Format an ISO date string to a human-readable date */
export function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Return true if a due date is overdue */
export function isOverdue(dueDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dueDate + 'T00:00:00') < today;
}

/** Today's date as YYYY-MM-DD */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/** Sample tasks for first-run experience */
export const SAMPLE_TASKS: Task[] = [
  {
    id: generateId(),
    title: 'Complete React assignment',
    subject: 'Frontend Engineering',
    priority: 'high',
    dueDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      return d.toISOString().split('T')[0];
    })(),
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    title: 'Review TypeScript generics chapter',
    subject: 'Programming Fundamentals',
    priority: 'medium',
    dueDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().split('T')[0];
    })(),
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    title: 'Practice CSS Grid and Flexbox',
    subject: 'UI/UX Design',
    priority: 'low',
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    title: 'Read React docs on hooks',
    subject: 'Frontend Engineering',
    priority: 'medium',
    completed: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    title: 'Set up Vite development environment',
    subject: 'Dev Tools',
    priority: 'high',
    completed: true,
    createdAt: new Date().toISOString(),
  },
];
