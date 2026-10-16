import { useState, type FormEvent } from 'react';
import type { Priority, Task } from '../types';
import type { TaskFormData } from '../hooks/useTasks';
import { todayISO } from '../utils';

interface TaskFormProps {
  /** If provided, we're editing an existing task */
  editingTask?: Task;
  onSubmit: (data: TaskFormData) => void;
  onCancel?: () => void;
}

const EMPTY_FORM: TaskFormData = {
  title: '',
  subject: '',
  priority: 'medium',
  dueDate: '',
};

function taskToFormData(task: Task): TaskFormData {
  return {
    title: task.title,
    subject: task.subject,
    priority: task.priority,
    dueDate: task.dueDate ?? '',
  };
}

export default function TaskForm({ editingTask, onSubmit, onCancel }: TaskFormProps) {
  // Track which task the form is initialised for so we can reset when it changes
  const [lastEditingId, setLastEditingId] = useState<string | undefined>(editingTask?.id);
  const [form, setForm] = useState<TaskFormData>(editingTask ? taskToFormData(editingTask) : EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof TaskFormData, string>>>({});

  // React-recommended pattern: setState during render (not in an effect) when derived from props
  if (editingTask?.id !== lastEditingId) {
    setLastEditingId(editingTask?.id);
    setForm(editingTask ? taskToFormData(editingTask) : EMPTY_FORM);
    setErrors({});
  }

  const isEditing = Boolean(editingTask);

  function validate(): boolean {
    const next: Partial<Record<keyof TaskFormData, string>> = {};
    if (!form.title.trim()) next.title = 'Task title is required.';
    if (!form.subject.trim()) next.subject = 'Subject is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
    if (!editingTask) setForm(EMPTY_FORM);
  }

  function handleChange(field: keyof TaskFormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  return (
    <section className={`task-form-section ${isEditing ? 'task-form-section--editing' : ''}`}>
      <h2 className="task-form-section__heading">
        {isEditing ? 'Edit Task' : 'Add New Task'}
      </h2>

      <form className="task-form" onSubmit={handleSubmit} noValidate>
        <div className="form-row">
          {/* Title */}
          <div className={`form-group form-group--wide ${errors.title ? 'form-group--error' : ''}`}>
            <label htmlFor="task-title" className="form-label">
              Task Title <span aria-hidden="true" className="required-mark">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              className="form-input"
              placeholder="e.g. Complete reading chapter 5"
              value={form.title}
              onChange={e => handleChange('title', e.target.value)}
              aria-required="true"
              aria-describedby={errors.title ? 'title-error' : undefined}
              maxLength={120}
            />
            {errors.title && (
              <span id="title-error" className="form-error" role="alert">
                {errors.title}
              </span>
            )}
          </div>

          {/* Subject */}
          <div className={`form-group ${errors.subject ? 'form-group--error' : ''}`}>
            <label htmlFor="task-subject" className="form-label">
              Subject <span aria-hidden="true" className="required-mark">*</span>
            </label>
            <input
              id="task-subject"
              type="text"
              className="form-input"
              placeholder="e.g. Mathematics"
              value={form.subject}
              onChange={e => handleChange('subject', e.target.value)}
              aria-required="true"
              aria-describedby={errors.subject ? 'subject-error' : undefined}
              maxLength={60}
            />
            {errors.subject && (
              <span id="subject-error" className="form-error" role="alert">
                {errors.subject}
              </span>
            )}
          </div>
        </div>

        <div className="form-row">
          {/* Priority */}
          <div className="form-group">
            <label htmlFor="task-priority" className="form-label">Priority</label>
            <select
              id="task-priority"
              className="form-select"
              value={form.priority}
              onChange={e => handleChange('priority', e.target.value as Priority)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Due Date */}
          <div className="form-group">
            <label htmlFor="task-due" className="form-label">
              Due Date <span className="optional-mark">(optional)</span>
            </label>
            <input
              id="task-due"
              type="date"
              className="form-input"
              value={form.dueDate}
              min={isEditing ? undefined : todayISO()}
              onChange={e => handleChange('dueDate', e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="form-group form-group--actions">
            <button type="submit" className="btn btn--primary">
              {isEditing ? 'Save Changes' : 'Add Task'}
            </button>
            {isEditing && onCancel && (
              <button type="button" className="btn btn--ghost" onClick={onCancel}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>
    </section>
  );
}
