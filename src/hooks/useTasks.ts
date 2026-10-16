import { useState, useEffect, useCallback } from 'react';
import type { Task, Priority, FilterType } from '../types';
import { generateId, SAMPLE_TASKS } from '../utils';

const STORAGE_KEY = 'focusflow_tasks';

export interface TaskFormData {
  title: string;
  subject: string;
  priority: Priority;
  dueDate: string;
}

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Task[];
  } catch {
    // corrupted storage — fall through to defaults
  }
  return SAMPLE_TASKS;
}

function saveTasks(tasks: Task[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Persist on every change
  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  const addTask = useCallback((data: TaskFormData) => {
    const task: Task = {
      id: generateId(),
      title: data.title.trim(),
      subject: data.subject.trim(),
      priority: data.priority,
      dueDate: data.dueDate || undefined,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [task, ...prev]);
  }, []);

  const updateTask = useCallback((id: string, data: TaskFormData) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === id
          ? { ...t, title: data.title.trim(), subject: data.subject.trim(), priority: data.priority, dueDate: data.dueDate || undefined }
          : t
      )
    );
    setEditingId(null);
  }, []);

  const toggleComplete = useCallback((id: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const startEdit = useCallback((id: string) => {
    setEditingId(id);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  const filteredTasks = tasks
    .filter(t => {
      if (filter === 'active') return !t.completed;
      if (filter === 'completed') return t.completed;
      return true;
    })
    .filter(t =>
      search.trim() === '' ||
      t.title.toLowerCase().includes(search.trim().toLowerCase())
    );

  const stats = {
    total: tasks.length,
    active: tasks.filter(t => !t.completed).length,
    completed: tasks.filter(t => t.completed).length,
    progress: tasks.length === 0 ? 0 : Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100),
  };

  return {
    tasks,
    filteredTasks,
    filter,
    setFilter,
    search,
    setSearch,
    editingId,
    addTask,
    updateTask,
    toggleComplete,
    deleteTask,
    startEdit,
    cancelEdit,
    stats,
  };
}
