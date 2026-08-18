import { create } from 'zustand';
import { Task, Category, ReminderLog, AlertSummary, DiaryEntry, OverviewStats, TaskCreateInput, DiaryCreateInput } from '../types';
import { taskApi } from '../api/taskApi';
import { diaryApi } from '../api/diaryApi';
import { statsApi } from '../api/statsApi';
import { getTodayDateString } from '../utils/dateUtils';

import { ThemeMode, getTheme } from '../utils/theme';

interface AppState {
  // Theme State
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;

  // Navigation & UI State
  activeTab: 'dashboard' | 'tasks' | 'diary' | 'alerts' | 'analytics';
  taskFilter: 'ALL' | 'DAILY' | 'MONTHLY' | 'YEARLY' | 'OVERDUE' | 'COMPLETED';
  searchQuery: string;
  selectedCategoryFilter: number | null;
  isCreateTaskModalOpen: boolean;
  isCreateDiaryModalOpen: boolean;
  selectedDiaryDate: string;

  // Data State
  tasks: Task[];
  categories: Category[];
  reminders: ReminderLog[];
  alertSummary: AlertSummary | null;
  diaryEntries: DiaryEntry[];
  stats: OverviewStats | null;
  isLoading: boolean;
  error: string | null;

  // UI Actions
  setActiveTab: (tab: 'dashboard' | 'tasks' | 'diary' | 'alerts' | 'analytics') => void;
  setTaskFilter: (filter: 'ALL' | 'DAILY' | 'MONTHLY' | 'YEARLY' | 'OVERDUE' | 'COMPLETED') => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategoryFilter: (catId: number | null) => void;
  setCreateTaskModalOpen: (open: boolean) => void;
  setCreateDiaryModalOpen: (open: boolean) => void;
  setSelectedDiaryDate: (dateStr: string) => void;

  // Async API Actions
  fetchAllData: () => Promise<void>;
  fetchTasks: () => Promise<void>;
  fetchDiaryEntries: () => Promise<void>;
  fetchAlerts: () => Promise<void>;
  fetchStats: () => Promise<void>;
  
  createTask: (input: TaskCreateInput) => Promise<boolean>;
  updateTaskProgress: (id: number, progress: number, note?: string) => Promise<void>;
  toggleTaskComplete: (id: number) => Promise<void>;
  toggleSubtask: (taskId: number, subtaskId: number) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;

  saveDiaryEntry: (input: DiaryCreateInput) => Promise<boolean>;
  deleteDiaryEntry: (id: number) => Promise<void>;

  acknowledgeAlert: (id: number) => Promise<void>;
  acknowledgeAllAlerts: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  themeMode: 'dark',
  toggleTheme: () => set((state) => ({ themeMode: state.themeMode === 'dark' ? 'light' : 'dark' })),
  setThemeMode: (mode) => set({ themeMode: mode }),

  activeTab: 'dashboard',
  taskFilter: 'ALL',
  searchQuery: '',
  selectedCategoryFilter: null,
  isCreateTaskModalOpen: false,
  isCreateDiaryModalOpen: false,
  selectedDiaryDate: getTodayDateString(),

  tasks: [],
  categories: [],
  reminders: [],
  alertSummary: null,
  diaryEntries: [],
  stats: null,
  isLoading: false,
  error: null,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setTaskFilter: (filter) => set({ taskFilter: filter }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategoryFilter: (catId) => set({ selectedCategoryFilter: catId }),
  setCreateTaskModalOpen: (open) => set({ isCreateTaskModalOpen: open }),
  setCreateDiaryModalOpen: (open) => set({ isCreateDiaryModalOpen: open }),
  setSelectedDiaryDate: (dateStr) => set({ selectedDiaryDate: dateStr }),

  fetchAllData: async () => {
    set({ isLoading: true, error: null });
    try {
      // First trigger background scan
      try {
        await taskApi.scanAlerts();
      } catch (e) {
        // Continue even if scan fails
      }

      const [tasks, categories, reminders, alertSummary, diaryEntries, stats] = await Promise.all([
        taskApi.getTasks(),
        taskApi.getCategories(),
        taskApi.getReminders(true),
        taskApi.getAlertSummary(),
        diaryApi.getDiaryEntries({ limit: 30 }),
        statsApi.getOverviewStats()
      ]);

      set({
        tasks,
        categories,
        reminders,
        alertSummary,
        diaryEntries,
        stats,
        isLoading: false
      });
    } catch (err: any) {
      console.error('Fetch all error:', err);
      set({ error: err.message || 'Failed to connect to backend server', isLoading: false });
    }
  },

  fetchTasks: async () => {
    try {
      const tasks = await taskApi.getTasks();
      set({ tasks });
    } catch (err: any) {
      console.error('Fetch tasks error:', err);
    }
  },

  fetchDiaryEntries: async () => {
    try {
      const diaryEntries = await diaryApi.getDiaryEntries({ limit: 30 });
      set({ diaryEntries });
    } catch (err: any) {
      console.error('Fetch diary error:', err);
    }
  },

  fetchAlerts: async () => {
    try {
      const [reminders, alertSummary] = await Promise.all([
        taskApi.getReminders(true),
        taskApi.getAlertSummary()
      ]);
      set({ reminders, alertSummary });
    } catch (err: any) {
      console.error('Fetch alerts error:', err);
    }
  },

  fetchStats: async () => {
    try {
      const stats = await statsApi.getOverviewStats();
      set({ stats });
    } catch (err: any) {
      console.error('Fetch stats error:', err);
    }
  },

  createTask: async (input) => {
    try {
      const newTask = await taskApi.createTask(input);
      set((state) => ({ tasks: [newTask, ...state.tasks] }));
      get().fetchStats();
      get().fetchAlerts();
      return true;
    } catch (err: any) {
      console.error('Create task error:', err);
      return false;
    }
  },

  updateTaskProgress: async (id, progress, note) => {
    try {
      const updated = await taskApi.updateProgress(id, progress, note);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updated : t))
      }));
      get().fetchStats();
      get().fetchAlerts();
    } catch (err: any) {
      console.error('Update progress error:', err);
    }
  },

  toggleTaskComplete: async (id) => {
    try {
      const updated = await taskApi.completeTask(id);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updated : t))
      }));
      get().fetchStats();
      get().fetchAlerts();
    } catch (err: any) {
      console.error('Complete task error:', err);
    }
  },

  toggleSubtask: async (taskId, subtaskId) => {
    try {
      const updated = await taskApi.toggleSubtask(taskId, subtaskId);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? updated : t))
      }));
      get().fetchStats();
    } catch (err: any) {
      console.error('Toggle subtask error:', err);
    }
  },

  deleteTask: async (id) => {
    try {
      await taskApi.deleteTask(id);
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id)
      }));
      get().fetchStats();
      get().fetchAlerts();
    } catch (err: any) {
      console.error('Delete task error:', err);
    }
  },

  saveDiaryEntry: async (input) => {
    try {
      const saved = await diaryApi.saveDiaryEntry(input);
      set((state) => {
        const existingIdx = state.diaryEntries.findIndex((d) => d.entry_date === input.entry_date);
        let updatedList: DiaryEntry[];
        if (existingIdx >= 0) {
          updatedList = [...state.diaryEntries];
          updatedList[existingIdx] = saved;
        } else {
          updatedList = [saved, ...state.diaryEntries];
        }
        return { diaryEntries: updatedList };
      });
      get().fetchStats();
      return true;
    } catch (err: any) {
      console.error('Save diary error:', err);
      return false;
    }
  },

  deleteDiaryEntry: async (id) => {
    try {
      await diaryApi.deleteDiaryEntry(id);
      set((state) => ({
        diaryEntries: state.diaryEntries.filter((d) => d.id !== id)
      }));
      get().fetchStats();
    } catch (err: any) {
      console.error('Delete diary error:', err);
    }
  },

  acknowledgeAlert: async (id) => {
    try {
      await taskApi.acknowledgeReminder(id);
      set((state) => ({
        reminders: state.reminders.filter((r) => r.id !== id)
      }));
      get().fetchAlerts();
    } catch (err: any) {
      console.error('Ack alert error:', err);
    }
  },

  acknowledgeAllAlerts: async () => {
    try {
      await taskApi.acknowledgeAllReminders();
      set({ reminders: [] });
      get().fetchAlerts();
    } catch (err: any) {
      console.error('Ack all error:', err);
    }
  }
}));
