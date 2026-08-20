export type RecurrenceType = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
export type MoodType = 'GREAT' | 'GOOD' | 'NEUTRAL' | 'TIRED' | 'STRESSED';

export interface Subtask {
  id: number;
  title: string;
  completed: boolean;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
  created_at?: string;
}

export interface ProgressEntry {
  id: number;
  task_id: number;
  progress_value: number;
  note?: string;
  recorded_at: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  recurrence_type: RecurrenceType;
  recurrence_interval: number;
  recurrence_day_of_month?: number;
  recurrence_month_of_year?: number;
  due_date?: string;
  reminder_time?: string;
  priority: PriorityLevel;
  status: TaskStatus;
  progress_percentage: number;
  category_id?: number;
  category?: Category;
  subtasks?: Subtask[];
  progress_entries?: ProgressEntry[];
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface TaskCreateInput {
  title: string;
  description?: string;
  recurrence_type: RecurrenceType;
  recurrence_interval?: number;
  recurrence_day_of_month?: number;
  recurrence_month_of_year?: number;
  due_date?: string;
  reminder_time?: string;
  priority: PriorityLevel;
  category_id?: number;
  subtasks?: Subtask[];
}

export interface DailyActivity {
  time: string;
  activity: string;
  category?: string;
  done: boolean;
}

export interface DiaryEntry {
  id: number;
  entry_date: string;
  title?: string;
  content: string;
  mood: MoodType;
  productivity_score: number;
  tags?: string;
  activities?: DailyActivity[];
  created_at: string;
  updated_at: string;
}

export interface DiaryCreateInput {
  entry_date: string;
  title?: string;
  content: string;
  mood: MoodType;
  productivity_score: number;
  tags?: string;
  activities?: DailyActivity[];
}

export interface ReminderLog {
  id: number;
  task_id: number;
  triggered_at: string;
  alert_type: string;
  message: string;
  is_acknowledged: boolean;
  acknowledged_at?: string;
}

export interface AlertSummary {
  total_overdue: number;
  total_upcoming_today: number;
  urgent_alerts: number;
  unacknowledged_alerts: number;
}

export interface FrequencyBreakdown {
  total: number;
  completed: number;
  overdue: number;
  in_progress: number;
  completion_rate: number;
}

export interface CategoryBreakdown {
  category_id?: number;
  category_name: string;
  color: string;
  total: number;
  completed: number;
}

export interface TimeAllocationItem {
  category_name: string;
  color: string;
  count: number;
  percentage: number;
}

export interface GrowingHabitItem {
  id: number;
  name: string;
  category_name: string;
  color: string;
  completed_count: number;
  streak_days: number;
  consistency_rate: number;
}

export interface MoodDistributionItem {
  mood: MoodType;
  count: number;
  percentage: number;
}

export interface OverviewStats {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
  overall_completion_rate: number;
  current_streak_days: number;
  daily_stats: FrequencyBreakdown;
  monthly_stats: FrequencyBreakdown;
  yearly_stats: FrequencyBreakdown;
  one_time_stats: FrequencyBreakdown;
  categories: CategoryBreakdown[];
  total_diary_entries: number;
  average_productivity: number;
  time_allocation?: TimeAllocationItem[];
  growing_habits?: GrowingHabitItem[];
  mood_distribution?: MoodDistributionItem[];
}

export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  role: UserRole;
  login_count?: number;
  last_login_at?: string;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginInput {
  login: string;
  password: string;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}

export interface FamilyUserSummary {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  role: UserRole;
  is_active?: boolean;
  login_count: number;
  last_login_at?: string;
  total_tasks: number;
  completed_tasks: number;
  total_diary_entries: number;
  created_at?: string;
}

export interface AdminAnalyticsSummary {
  total_users: number;
  total_app_logins: number;
  active_recently_count: number;
  total_tasks_created: number;
  total_tasks_completed: number;
  total_diary_entries: number;
  users: FamilyUserSummary[];
}
