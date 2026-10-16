import type { Task } from '../types';
import TaskCard from './TaskCard';

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  searchActive: boolean;
}

export default function TaskList({ tasks, onToggle, onEdit, onDelete, searchActive }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="empty-state" role="status" aria-live="polite">
        <span className="empty-state__icon" aria-hidden="true">
          {searchActive ? '🔍' : '📋'}
        </span>
        <p className="empty-state__title">
          {searchActive ? 'No tasks match your search.' : 'No tasks here yet.'}
        </p>
        <p className="empty-state__hint">
          {searchActive
            ? 'Try a different search term.'
            : 'Add a task using the form above to get started.'}
        </p>
      </div>
    );
  }

  return (
    <ul className="task-list" aria-label="Task list">
      {tasks.map(task => (
        <li key={task.id} className="task-list__item">
          <TaskCard
            task={task}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </li>
      ))}
    </ul>
  );
}
