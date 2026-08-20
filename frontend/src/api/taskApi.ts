import { apiClient } from './client';
import { Task, TaskCreateInput, Category, ReminderLog, AlertSummary } from '../types';

export const taskApi = {
  // Tasks
  getTasks: async (params?: {
    recurrence_type?: string;
    status?: string;
    category_id?: number;
    priority?: string;
    search?: string;
  }): Promise<Task[]> => {
    const res = await apiClient.get<Task[]>('/tasks', { params });
    return res.data;
  },

  getTaskById: async (id: number): Promise<Task> => {
    const res = await apiClient.get<Task>(`/tasks/${id}`);
    return res.data;
  },

  createTask: async (task: TaskCreateInput): Promise<Task> => {
    const res = await apiClient.post<Task>('/tasks', task);
    return res.data;
  },

  updateTask: async (id: number, updates: Partial<TaskCreateInput> & { status?: string; progress_percentage?: number }): Promise<Task> => {
    const res = await apiClient.put<Task>(`/tasks/${id}`, updates);
    return res.data;
  },

  updateProgress: async (id: number, progress_value: number, note?: string): Promise<Task> => {
    const res = await apiClient.post<Task>(`/tasks/${id}/progress`, { progress_value, note });
    return res.data;
  },

  completeTask: async (id: number): Promise<Task> => {
    const res = await apiClient.post<Task>(`/tasks/${id}/complete`);
    return res.data;
  },

  toggleSubtask: async (taskId: number, subtaskId: number): Promise<Task> => {
    const res = await apiClient.post<Task>(`/tasks/${taskId}/toggle-subtask/${subtaskId}`);
    return res.data;
  },

  deleteTask: async (id: number): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },

  snoozeTask: async (id: number, minutes = 15): Promise<Task> => {
    const res = await apiClient.post<Task>(`/tasks/${id}/snooze`, { minutes });
    return res.data;
  },

  // Categories
  getCategories: async (): Promise<Category[]> => {
    const res = await apiClient.get<Category[]>('/categories');
    return res.data;
  },

  createCategory: async (category: { name: string; color?: string; icon?: string }): Promise<Category> => {
    const res = await apiClient.post<Category>('/categories', category);
    return res.data;
  },

  // Reminders & Overdue Alerts
  getReminders: async (unacknowledgedOnly = true): Promise<ReminderLog[]> => {
    const res = await apiClient.get<ReminderLog[]>('/reminders', {
      params: { unacknowledged_only: unacknowledgedOnly }
    });
    return res.data;
  },

  getAlertSummary: async (): Promise<AlertSummary> => {
    const res = await apiClient.get<AlertSummary>('/reminders/summary');
    return res.data;
  },

  scanAlerts: async (): Promise<any> => {
    const res = await apiClient.post('/reminders/scan');
    return res.data;
  },

  acknowledgeReminder: async (id: number): Promise<ReminderLog> => {
    const res = await apiClient.post<ReminderLog>(`/reminders/${id}/acknowledge`);
    return res.data;
  },

  acknowledgeAllReminders: async (): Promise<any> => {
    const res = await apiClient.post('/reminders/acknowledge-all');
    return res.data;
  }
};
