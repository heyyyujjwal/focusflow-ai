
import type { Task } from '../types';
import { formatDate, isOverdue } from '../utils';

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export default function TaskCard({
  task,
  onToggle,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const overdue =
    !task.completed && task.dueDate && isOverdue(task.dueDate);

  return (
    <article
      className={`task-card task-card--${task.priority} ${
        task.completed ? 'task-card--completed' : ''
      } ${overdue ? 'task-card--overdue' : ''}`}
      aria-label={`Task: ${task.title}`}
    >
      <div className="task-card__left">
        <input
          type="checkbox"
          id={`check-${task.id}`}
          className="task-checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          aria-label={`Mark "${task.title}" as ${
            task.completed ? 'incomplete' : 'complete'
          }`}
        />
      </div>

      <div className="task-card__body">
        <label htmlFor={`check-${task.id}`} className="task-card__title">
          {task.title}
        </label>

        <div className="task-card__meta">
          <span className="task-subject">{task.subject}</span>

          <span className={`task-priority task-priority--${task.priority}`}>
            {PRIORITY_LABELS[task.priority]}
          </span>

          {task.dueDate && (
            <span
              className={`task-due ${
                overdue ? 'task-due--overdue' : ''
              }`}
            >
              {overdue ? '⚠ Overdue · ' : '📅 '}
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>

      <div className="task-card__actions">
        {!task.completed && (
          <button
            className="icon-btn icon-btn--edit"
            onClick={() => onEdit(task.id)}
            aria-label={`Edit task: ${task.title}`}
            title="Edit"
          >
            <svg
              aria-hidden="true"
              focusable="false"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}

        <button
          className="icon-btn icon-btn--delete"
          onClick={() => {
            if (window.confirm(`Delete "${task.title}"? This cannot be undone.`)) {
              onDelete(task.id);
            }
          }}
          aria-label={`Delete task: ${task.title}`}
          title="Delete"
        >
          <svg
            aria-hidden="true"
            focusable="false"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      </div>
    </article>
  );
}
