import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { getTheme } from '../utils/theme';
import { useAppStore } from '../state/useAppStore';

interface HabitItem {
  id: number;
  name: string;
  emoji: string;
  color: string;
  target: string;
  completed: boolean;
  streak: number;
}

interface HabitRingProps {
  habit: HabitItem;
  onToggle: (id: number) => void;
}

export const HabitRing: React.FC<HabitRingProps> = ({ habit, onToggle }) => {
  const { themeMode } = useAppStore();
  const currentTheme = getTheme(themeMode);

  return (
    <TouchableOpacity
      style={[
        styles.habitCard,
        {
          backgroundColor: habit.completed
            ? `${habit.color}18`
            : currentTheme.colors.surface,
          borderColor: habit.completed
            ? habit.color
            : currentTheme.colors.cardBorder,
        },
      ]}
      onPress={() => onToggle(habit.id)}
      activeOpacity={0.7}
    >
      {/* Circular Ring Indicator */}
      <View
        style={[
          styles.ringCircle,
          {
            borderColor: habit.color,
            backgroundColor: habit.completed ? habit.color : 'transparent',
          },
        ]}
      >
        <Text style={styles.habitEmoji}>
          {habit.completed ? '✓' : habit.emoji}
        </Text>
      </View>

      {/* Habit Info */}
      <View style={styles.infoCol}>
        <Text
          style={[
            styles.habitName,
            {
              color: currentTheme.colors.text,
              textDecorationLine: habit.completed ? 'line-through' : 'none',
              opacity: habit.completed ? 0.75 : 1,
            },
          ]}
          numberOfLines={1}
        >
          {habit.name}
        </Text>
        <View style={styles.streakRow}>
          <Text style={[styles.targetText, { color: currentTheme.colors.textMuted }]}>
            {habit.target}
          </Text>
          <Text style={styles.dotSeparator}>•</Text>
          <Text style={[styles.streakText, { color: currentTheme.colors.warning }]}>
            🔥 {habit.streak}d streak
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    minWidth: 160,
    flex: 1,
  },
  ringCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitEmoji: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  infoCol: {
    flex: 1,
  },
  habitName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  targetText: {
    fontSize: 11,
  },
  dotSeparator: {
    fontSize: 10,
    color: '#808E9B',
  },
  streakText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
