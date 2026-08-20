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
  PriorityLevel,
  User,
  LoginInput,
  RegisterInput,
} from '../types';
import { taskApi } from '../api/taskApi';
import { diaryApi } from '../api/diaryApi';
import { statsApi } from '../api/statsApi';
import { authApi } from '../api/authApi';
import { setAuthToken, getStoredAuthToken } from '../api/client';
import { getTodayDateString } from '../utils/dateUtils';
import { ThemeMode, getTheme } from '../utils/theme';

const defaultCategories: Category[] = [
  { id: 1, name: 'Work', color: '#6366F1', icon: 'briefcase' },
  { id: 2, name: 'Personal', color: '#10B981', icon: 'user' },
  { id: 3, name: 'Health', color: '#F59E0B', icon: 'heart' },
  { id: 4, name: 'Finance', color: '#8B5CF6', icon: 'credit-card' },
];

const defaultTasks: Task[] = [];

const defaultStats: OverviewStats = {
  total_tasks: 0,
  completed_tasks: 0,
  in_progress_tasks: 0,
  pending_tasks: 0,
  overdue_tasks: 0,
  overall_completion_rate: 0.0,
  current_streak_days: 0,
  daily_stats: {
    total: 0,
    completed: 0,
    overdue: 0,
    in_progress: 0,
    completion_rate: 0.0
  },
  monthly_stats: {
    total: 0,
    completed: 0,
    overdue: 0,
    in_progress: 0,
    completion_rate: 0.0
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
    total: 0,
    completed: 0
  })),
  total_diary_entries: 0,
  average_productivity: 0.0,
  time_allocation: [],
  growing_habits: [],
  mood_distribution: []
};

interface AppState {
  // Theme State
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;

  // Auth State
  currentUser: User | null;
  authToken: string | null;
  isAuthModalOpen: boolean;
  authLoading: boolean;
  authError: string | null;
  setAuthModalOpen: (open: boolean) => void;
  setAuthError: (error: string | null) => void;
  login: (input: LoginInput) => Promise<boolean>;
  register: (input: RegisterInput) => Promise<boolean>;
  logout: () => void;
  initAuth: () => Promise<void>;

  // Navigation & UI State
  activeTab: 'dashboard' | 'tasks' | 'diary' | 'alerts' | 'analytics';
  taskFilter: 'ALL' | 'DAILY' | 'MONTHLY' | 'YEARLY' | 'OVERDUE' | 'COMPLETED';
  searchQuery: string;
  selectedCategoryFilter: number | null;
  selectedPriorityFilter: PriorityLevel | 'ALL' | null;
  isCreateTaskModalOpen: boolean;
  isCreateDiaryModalOpen: boolean;
  selectedDiaryDate: string;
  editingTask: Task | null;

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
  setSelectedPriorityFilter: (priority: PriorityLevel | 'ALL' | null) => void;
  setCreateTaskModalOpen: (open: boolean) => void;
  setCreateDiaryModalOpen: (open: boolean) => void;
  setSelectedDiaryDate: (dateStr: string) => void;
  setEditingTask: (task: Task | null) => void;

  // Async API Actions with Offline Resiliency
  fetchAllData: () => Promise<void>;
  fetchTasks: () => Promise<void>;
  fetchDiaryEntries: () => Promise<void>;
  fetchAlerts: () => Promise<void>;
  fetchStats: () => Promise<void>;
  
  createTask: (input: TaskCreateInput) => Promise<boolean>;
  updateExistingTask: (id: number, input: Partial<TaskCreateInput>) => Promise<boolean>;
  snoozeTask: (id: number, minutes?: number) => Promise<void>;
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

  // Auth Defaults
  currentUser: null,
  authToken: null,
  isAuthModalOpen: false,
  authLoading: false,
  authError: null,

  setAuthModalOpen: (open) => set({ isAuthModalOpen: open, authError: null }),
  setAuthError: (error) => set({ authError: error }),

  initAuth: async () => {
    const token = getStoredAuthToken();
    if (token) {
      set({ authToken: token });
      try {
        const user = await authApi.getMe();
        set({ currentUser: user });
      } catch (e) {
        console.warn('Stored auth token expired or invalid');
        setAuthToken(null);
        set({ currentUser: null, authToken: null });
      }
    }
  },

  login: async (input: LoginInput) => {
    set({ authLoading: true, authError: null });
    try {
      const res = await authApi.login(input);
      set({
        currentUser: res.user,
        authToken: res.access_token,
        authLoading: false,
        authError: null,
        isAuthModalOpen: false,
      });
      get().fetchAllData();
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Invalid username or password.';
      set({ authError: msg, authLoading: false });
      return false;
    }
  },

  register: async (input: RegisterInput) => {
    set({ authLoading: true, authError: null });
    try {
      const res = await authApi.register(input);
      set({
        currentUser: res.user,
        authToken: res.access_token,
        authLoading: false,
        authError: null,
        isAuthModalOpen: false,
      });
      get().fetchAllData();
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Registration failed. Username or email may already be in use.';
      set({ authError: msg, authLoading: false });
      return false;
    }
  },

  logout: () => {
    setAuthToken(null);
    set({
      currentUser: null,
      authToken: null,
      tasks: [],
      diaryEntries: [],
      stats: defaultStats,
    });
    get().fetchAllData();
  },

  activeTab: 'dashboard',
  taskFilter: 'ALL',
  searchQuery: '',
  selectedCategoryFilter: null,
  selectedPriorityFilter: null,
  isCreateTaskModalOpen: false,
  isCreateDiaryModalOpen: false,
  selectedDiaryDate: getTodayDateString(),
  editingTask: null,

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
  setSelectedPriorityFilter: (priority) => set({ selectedPriorityFilter: priority }),
  setCreateTaskModalOpen: (open) => set({ isCreateTaskModalOpen: open }),
  setCreateDiaryModalOpen: (open) => set({ isCreateDiaryModalOpen: open }),
  setSelectedDiaryDate: (dateStr) => set({ selectedDiaryDate: dateStr }),
  setEditingTask: (task) => set({ editingTask: task }),

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
        tasks,
        categories: categories.length > 0 ? categories : defaultCategories,
        reminders,
        alertSummary,
        diaryEntries,
        stats,
        isLoading: false,
        error: null
      });
    } catch (err: any) {
      console.warn('Running in offline / local mode:', err.message);
      set({
        error: null,
        isLoading: false
      });
    }
  },

  fetchTasks: async () => {
    try {
      const tasks = await taskApi.getTasks();
      set({ tasks });
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

  updateExistingTask: async (id: number, input: Partial<TaskCreateInput>) => {
    try {
      const updated = await taskApi.updateTask(id, input);
      const category = get().categories.find((c) => c.id === updated.category_id);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { ...updated, category } : t)),
        editingTask: null,
      }));
      get().fetchStats();
      return true;
    } catch (err: any) {
      // Local fallback
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id
            ? {
                ...t,
                title: input.title !== undefined ? input.title : t.title,
                description: input.description !== undefined ? input.description : t.description,
                priority: input.priority || t.priority,
                recurrence_type: input.recurrence_type || t.recurrence_type,
                category_id: input.category_id !== undefined ? input.category_id : t.category_id,
                due_date: input.due_date !== undefined ? input.due_date : t.due_date,
                subtasks: input.subtasks || t.subtasks,
                updated_at: new Date().toISOString(),
              }
            : t
        ),
        editingTask: null,
      }));
      return true;
    }
  },

  snoozeTask: async (id: number, minutes = 15) => {
    try {
      const updated = await taskApi.snoozeTask(id, minutes);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { ...updated, category: t.category } : t)),
        reminders: state.reminders.filter((r) => r.task_id !== id),
      }));
      get().fetchStats();
    } catch (err: any) {
      // Local fallback
      const now = new Date();
      now.setMinutes(now.getMinutes() + minutes);
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id
            ? {
                ...t,
                due_date: now.toISOString(),
                status: t.status === 'OVERDUE' ? 'PENDING' : t.status,
                updated_at: new Date().toISOString(),
              }
            : t
        ),
        reminders: state.reminders.filter((r) => r.task_id !== id),
      }));
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
