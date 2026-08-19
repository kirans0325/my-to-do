export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceLight: string;
  surfaceHover: string;
  surfaceActive: string;
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
    NONE: string;
  };

  priorityFlags: {
    HIGH: string;
    MEDIUM: string;
    LOW: string;
    NONE: string;
  };

  recurrence: {
    DAILY: string;
    WEEKLY: string;
    MONTHLY: string;
    YEARLY: string;
    NONE: string;
  };

  habits: {
    coral: string;
    emerald: string;
    purple: string;
    amber: string;
    cyan: string;
    blue: string;
  };

  mood: {
    GREAT: string;
    GOOD: string;
    NEUTRAL: string;
    TIRED: string;
    STRESSED: string;
  };
}

// TickTick-Inspired Charcoal & Indigo Dark Palette
const darkColors: ThemeColors = {
  background: '#16171A',
  surface: '#1E2024',
  surfaceLight: '#272A30',
  surfaceHover: '#31343C',
  surfaceActive: '#3A3E47',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  cardShadow: 'rgba(0, 0, 0, 0.45)',

  primary: '#4B89FF', // TickTick Blue
  primaryHover: '#3B79EF',
  primaryLight: 'rgba(75, 137, 255, 0.16)',

  success: '#20BF6B', // TickTick Mint Green
  successLight: 'rgba(32, 191, 107, 0.16)',

  warning: '#FA8231', // TickTick Amber
  warningLight: 'rgba(250, 130, 49, 0.16)',

  danger: '#FF4757', // TickTick Vibrant Red
  dangerLight: 'rgba(255, 71, 87, 0.16)',

  info: '#0FB9B1',
  infoLight: 'rgba(15, 185, 177, 0.16)',

  text: '#F5F6F8',
  textSecondary: '#A4B0BE',
  textMuted: '#747D8C',
  textInverse: '#16171A',

  inputBg: '#272A30',
  inputBorder: 'rgba(255, 255, 255, 0.12)',

  priority: {
    LOW: '#2ED573',
    MEDIUM: '#FFA502',
    HIGH: '#FF4757',
    URGENT: '#FF3838',
    NONE: '#747D8C',
  },

  priorityFlags: {
    HIGH: '🚩 High',
    MEDIUM: '🚩 Medium',
    LOW: '🚩 Low',
    NONE: '🏳️ None',
  },

  recurrence: {
    DAILY: '#0FB9B1',
    WEEKLY: '#4B89FF',
    MONTHLY: '#8854D0',
    YEARLY: '#FF6B6B',
    NONE: '#747D8C',
  },

  habits: {
    coral: '#FF6B6B',
    emerald: '#20BF6B',
    purple: '#8854D0',
    amber: '#FA8231',
    cyan: '#0FB9B1',
    blue: '#4B89FF',
  },

  mood: {
    GREAT: '#20BF6B',
    GOOD: '#4B89FF',
    NEUTRAL: '#FA8231',
    TIRED: '#8854D0',
    STRESSED: '#FF4757',
  },
};

// TickTick-Inspired Crisp & Minimal Light Palette
const lightColors: ThemeColors = {
  background: '#F5F6F8',
  surface: '#FFFFFF',
  surfaceLight: '#F0F2F5',
  surfaceHover: '#E4E7ED',
  surfaceActive: '#DCDFE6',
  cardBorder: '#E4E7ED',
  cardShadow: 'rgba(0, 0, 0, 0.04)',

  primary: '#3F78E0', // TickTick Blue
  primaryHover: '#3367CC',
  primaryLight: '#EDF3FF',

  success: '#10AC84',
  successLight: '#E8F8F5',

  warning: '#F79F1F',
  warningLight: '#FEF9E7',

  danger: '#EE5253',
  dangerLight: '#FDEDEC',

  info: '#0ABDE3',
  infoLight: '#EBF5FB',

  text: '#1E272E',
  textSecondary: '#485460',
  textMuted: '#808E9B',
  textInverse: '#FFFFFF',

  inputBg: '#F8F9FB',
  inputBorder: '#D2DAE2',

  priority: {
    LOW: '#10AC84',
    MEDIUM: '#F79F1F',
    HIGH: '#EE5253',
    URGENT: '#EA2027',
    NONE: '#808E9B',
  },

  priorityFlags: {
    HIGH: '🚩 High',
    MEDIUM: '🚩 Medium',
    LOW: '🚩 Low',
    NONE: '🏳️ None',
  },

  recurrence: {
    DAILY: '#0ABDE3',
    WEEKLY: '#3F78E0',
    MONTHLY: '#6C5CE7',
    YEARLY: '#FF6B6B',
    NONE: '#808E9B',
  },

  habits: {
    coral: '#FF6B6B',
    emerald: '#10AC84',
    purple: '#6C5CE7',
    amber: '#F79F1F',
    cyan: '#0ABDE3',
    blue: '#3F78E0',
  },

  mood: {
    GREAT: '#10AC84',
    GOOD: '#3F78E0',
    NEUTRAL: '#F79F1F',
    TIRED: '#6C5CE7',
    STRESSED: '#EE5253',
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

export const theme = getTheme('dark');
