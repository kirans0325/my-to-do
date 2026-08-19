import { create } from 'zustand';
import {
  Task,
  Category,
  ReminderLog,
  AlertSummary,
  DiaryEntry,
  OverviewStats,
  TaskCreateInput,
  DiaryCreateInput,
} from '../types';
import { taskApi } from '../api/taskApi';
import { diaryApi } from '../api/diaryApi';
import { statsApi } from '../api/statsApi';
import { getTodayDateString } from '../utils/dateUtils';
import { ThemeMode, getTheme } from '../utils/theme';

const defaultCategories: Category[] = [
  { id: 1, name: 'Work', color: '#6366F1', icon: 'briefcase' },
  { id: 2, name: 'Personal', color: '#10B981', icon: 'user' },
  { id: 3, name: 'Health', color: '#F59E0B', icon: 'heart' },
  { id: 4, name: 'Finance', color: '#8B5CF6', icon: 'credit-card' },
];

const defaultTasks: Task[] = [
  {
    id: 1,
    title: 'Daily Standup & Goal Review',
    description: 'Review daily priority tasks and milestones',
    recurrence_type: 'DAILY',
    recurrence_interval: 1,
    priority: 'HIGH',
    status: 'PENDING',
    progress_percentage: 50,
    category_id: 1,
    category: defaultCategories[0],
    subtasks: [
      { id: 1, title: 'Check emails and notifications', completed: true },
      { id: 2, title: 'Plan top 3 daily priorities', completed: false },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: '30-Minute Evening Workout / Walk',
    description: 'Daily fitness and physical activity routine',
    recurrence_type: 'DAILY',
    recurrence_interval: 1,
    priority: 'MEDIUM',
    status: 'PENDING',
    progress_percentage: 0,
    category_id: 3,
    category: defaultCategories[2],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    title: 'Monthly Server Backup & Cloud Sync',
    description: 'Backup local tasks database to cloud storage',
    recurrence_type: 'MONTHLY',
    recurrence_interval: 1,
    priority: 'HIGH',
    status: 'PENDING',
    progress_percentage: 20,
    category_id: 1,
    category: defaultCategories[0],
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

const defaultStats: OverviewStats = {
  total_tasks: defaultTasks.length,
  completed_tasks: 0,
  in_progress_tasks: 2,
  pending_tasks: 1,
  overdue_tasks: 0,
  overall_completion_rate: 23.3,
  current_streak_days: 1,
  daily_stats: {
    total: 2,
    completed: 0,
    overdue: 0,
    in_progress: 1,
    completion_rate: 25.0
  },
  monthly_stats: {
    total: 1,
    completed: 0,
    overdue: 0,
    in_progress: 1,
    completion_rate: 20.0
  },
  yearly_stats: {
    total: 0,
    completed: 0,
    overdue: 0,
    in_progress: 0,
    completion_rate: 0.0
  },
  one_time_stats: {
    total: 0,
    completed: 0,
    overdue: 0,
    in_progress: 0,
    completion_rate: 0.0
  },
  categories: defaultCategories.map(c => ({
    category_id: c.id,
    category_name: c.name,
    color: c.color,
    total: c.id === 1 ? 2 : (c.id === 3 ? 1 : 0),
    completed: 0
  })),
  total_diary_entries: 0,
  average_productivity: 8.0
};

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

  // Async API Actions with Offline Resiliency
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

  tasks: defaultTasks,
  categories: defaultCategories,
  reminders: [],
  alertSummary: null,
  diaryEntries: [],
  stats: defaultStats,
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
    set({ isLoading: true });
    try {
      try {
        await taskApi.scanAlerts();
      } catch (e) {
        // Background scan optional
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
        tasks: tasks.length > 0 ? tasks : get().tasks,
        categories: categories.length > 0 ? categories : defaultCategories,
        reminders,
        alertSummary,
        diaryEntries,
        stats,
        isLoading: false,
        error: null
      });
    } catch (err: any) {
      console.warn('Backend connection offline, running in local mode:', err.message);
      set({
        error: 'Backend offline: Running in offline local mode (Hotspot IP: 10.130.151.61:8000)',
        isLoading: false
      });
    }
  },

  fetchTasks: async () => {
    try {
      const tasks = await taskApi.getTasks();
      if (tasks.length > 0) set({ tasks });
    } catch (err: any) {
      console.warn('Fetch tasks offline fallback');
    }
  },

  fetchDiaryEntries: async () => {
    try {
      const diaryEntries = await diaryApi.getDiaryEntries({ limit: 30 });
      set({ diaryEntries });
    } catch (err: any) {
      console.warn('Fetch diary offline fallback');
    }
  },

  fetchAlerts: async () => {
    try {
      const reminders = await taskApi.getReminders(true);
      const alertSummary = await taskApi.getAlertSummary();
      set({ reminders, alertSummary });
    } catch (err: any) {
      console.warn('Fetch alerts offline fallback');
    }
  },

  fetchStats: async () => {
    try {
      const stats = await statsApi.getOverviewStats();
      set({ stats });
    } catch (err: any) {
      console.warn('Fetch stats offline fallback');
    }
  },

  createTask: async (input: TaskCreateInput) => {
    try {
      const newTask = await taskApi.createTask(input);
      const category = get().categories.find((c) => c.id === input.category_id);
      const taskWithCategory = { ...newTask, category };
      set((state) => ({ tasks: [taskWithCategory, ...state.tasks] }));
      get().fetchStats();
      return true;
    } catch (err: any) {
      const localId = Date.now();
      const category = get().categories.find((c) => c.id === input.category_id);
      const localTask: Task = {
        id: localId,
        title: input.title,
        description: input.description,
        recurrence_type: input.recurrence_type || 'NONE',
        recurrence_interval: input.recurrence_interval || 1,
        priority: input.priority || 'MEDIUM',
        status: 'PENDING',
        progress_percentage: 0,
        category_id: input.category_id,
        category,
        due_date: input.due_date,
        subtasks: input.subtasks || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      set((state) => ({ tasks: [localTask, ...state.tasks] }));
      return true;
    }
  },

  updateTaskProgress: async (id: number, progress: number, note?: string) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              progress_percentage: progress,
              status: progress >= 100 ? 'COMPLETED' : progress > 0 ? 'IN_PROGRESS' : 'PENDING'
            }
          : t
      )
    }));
    try {
      await taskApi.updateProgress(id, progress, note);
      get().fetchStats();
    } catch (err) {
      // Offline
    }
  },

  toggleTaskComplete: async (id: number) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    const newProgress = newStatus === 'COMPLETED' ? 100 : 0;

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              status: newStatus,
              progress_percentage: newProgress,
              completed_at: newStatus === 'COMPLETED' ? new Date().toISOString() : undefined
            }
          : t
      )
    }));

    try {
      if (newStatus === 'COMPLETED' && task.recurrence_type !== 'NONE') {
        const updated = await taskApi.completeTask(id);
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...updated, category: t.category } : t))
        }));
      } else {
        await taskApi.updateProgress(id, newProgress);
      }
      get().fetchStats();
    } catch (err) {
      // Offline
    }
  },

  toggleSubtask: async (taskId: number, subtaskId: number) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task || !task.subtasks) return;

    const updatedSubtasks = task.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    const completedCount = updatedSubtasks.filter((st) => st.completed).length;
    const progress = Math.round((completedCount / updatedSubtasks.length) * 100);

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: updatedSubtasks,
              progress_percentage: progress,
              status: progress >= 100 ? 'COMPLETED' : progress > 0 ? 'IN_PROGRESS' : 'PENDING'
            }
          : t
      )
    }));

    try {
      await taskApi.toggleSubtask(taskId, subtaskId);
      get().fetchStats();
    } catch (err) {
      // Offline
    }
  },

  deleteTask: async (id: number) => {
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
    try {
      await taskApi.deleteTask(id);
      get().fetchStats();
    } catch (err) {
      // Offline
    }
  },

  saveDiaryEntry: async (input: DiaryCreateInput) => {
    try {
      const saved = await diaryApi.saveDiaryEntry(input);
      set((state) => {
        const filtered = state.diaryEntries.filter((d) => d.entry_date !== input.entry_date);
        return { diaryEntries: [saved, ...filtered] };
      });
      get().fetchStats();
      return true;
    } catch (err) {
      const localEntry: DiaryEntry = {
        id: Date.now(),
        entry_date: input.entry_date,
        title: input.title,
        content: input.content,
        mood: input.mood || 'GOOD',
        productivity_score: input.productivity_score || 8,
        tags: input.tags,
        activities: input.activities || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      set((state) => {
        const filtered = state.diaryEntries.filter((d) => d.entry_date !== input.entry_date);
        return { diaryEntries: [localEntry, ...filtered] };
      });
      return true;
    }
  },

  deleteDiaryEntry: async (id: number) => {
    set((state) => ({ diaryEntries: state.diaryEntries.filter((d) => d.id !== id) }));
    try {
      await diaryApi.deleteDiaryEntry(id);
      get().fetchStats();
    } catch (err) {
      // Offline
    }
  },

  acknowledgeAlert: async (id: number) => {
    set((state) => ({
      reminders: state.reminders.filter((r) => r.id !== id)
    }));
    try {
      await taskApi.acknowledgeReminder(id);
    } catch (err) {
      // Offline
    }
  },

  acknowledgeAllAlerts: async () => {
    set({ reminders: [] });
    try {
      await taskApi.acknowledgeAllReminders();
    } catch (err) {
      // Offline
    }
  },
}));
