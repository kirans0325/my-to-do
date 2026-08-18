export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceLight: string;
  surfaceHover: string;
  cardBorder: string;
  cardShadow: string;
  
  primary: string;
  primaryHover: string;
  primaryLight: string;
  
  success: string;
  successLight: string;
  
  warning: string;
  warningLight: string;
  
  danger: string;
  dangerLight: string;
  
  info: string;
  infoLight: string;
  
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  
  inputBg: string;
  inputBorder: string;

  priority: {
    LOW: string;
    MEDIUM: string;
    HIGH: string;
    URGENT: string;
  };

  recurrence: {
    DAILY: string;
    WEEKLY: string;
    MONTHLY: string;
    YEARLY: string;
    NONE: string;
  };

  mood: {
    GREAT: string;
    GOOD: string;
    NEUTRAL: string;
    TIRED: string;
    STRESSED: string;
  };
}

const darkColors: ThemeColors = {
  background: '#0B0F17',
  surface: '#151D2A',
  surfaceLight: '#1E293B',
  surfaceHover: '#2A374D',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  cardShadow: 'rgba(0, 0, 0, 0.35)',

  primary: '#6366F1',
  primaryHover: '#4F46E5',
  primaryLight: 'rgba(99, 102, 241, 0.15)',

  success: '#10B981',
  successLight: 'rgba(16, 185, 129, 0.15)',

  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.15)',

  danger: '#EF4444',
  dangerLight: 'rgba(239, 68, 68, 0.15)',

  info: '#0EA5E9',
  infoLight: 'rgba(14, 165, 233, 0.15)',

  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0B0F17',

  inputBg: '#1E293B',
  inputBorder: 'rgba(255, 255, 255, 0.12)',

  priority: {
    LOW: '#10B981',
    MEDIUM: '#3B82F6',
    HIGH: '#F59E0B',
    URGENT: '#EF4444',
  },

  recurrence: {
    DAILY: '#0EA5E9',
    WEEKLY: '#6366F1',
    MONTHLY: '#8B5CF6',
    YEARLY: '#EC4899',
    NONE: '#64748B',
  },

  mood: {
    GREAT: '#10B981',
    GOOD: '#3B82F6',
    NEUTRAL: '#F59E0B',
    TIRED: '#8B5CF6',
    STRESSED: '#EF4444',
  },
};

const lightColors: ThemeColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceLight: '#F1F5F9',
  surfaceHover: '#E2E8F0',
  cardBorder: '#E2E8F0',
  cardShadow: 'rgba(0, 0, 0, 0.05)',

  primary: '#4F46E5',
  primaryHover: '#4338CA',
  primaryLight: '#EEF2FF',

  success: '#059669',
  successLight: '#ECFDF5',

  warning: '#D97706',
  warningLight: '#FFFBEB',

  danger: '#DC2626',
  dangerLight: '#FEF2F2',

  info: '#0284C7',
  infoLight: '#F0F9FF',

  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  inputBg: '#FFFFFF',
  inputBorder: '#CBD5E1',

  priority: {
    LOW: '#059669',
    MEDIUM: '#2563EB',
    HIGH: '#D97706',
    URGENT: '#DC2626',
  },

  recurrence: {
    DAILY: '#0284C7',
    WEEKLY: '#4F46E5',
    MONTHLY: '#7C3AED',
    YEARLY: '#DB2777',
    NONE: '#94A3B8',
  },

  mood: {
    GREAT: '#059669',
    GOOD: '#2563EB',
    NEUTRAL: '#D97706',
    TIRED: '#7C3AED',
    STRESSED: '#DC2626',
  },
};

const commonMetrics = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
    xxl: 36,
  },
  borderRadius: {
    sm: 6,
    md: 10,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  typography: {
    fontFamily: 'System',
    sizes: {
      xs: 11,
      sm: 13,
      base: 15,
      lg: 18,
      xl: 22,
      xxl: 28,
      title: 34,
    },
  },
};

export const getTheme = (mode: ThemeMode = 'dark') => ({
  colors: mode === 'light' ? lightColors : darkColors,
  isDark: mode === 'dark',
  ...commonMetrics,
});

// Default export for backward compatibility
export const theme = getTheme('dark');
