export type Priority = 'low' | 'medium' | 'high';
export type FilterType = 'all' | 'active' | 'completed';

export interface Task {
  id: string;
  title: string;
  subject: string;
  priority: Priority;
  dueDate?: string; // ISO date string YYYY-MM-DD
  completed: boolean;
  createdAt: string; // ISO date string
}
