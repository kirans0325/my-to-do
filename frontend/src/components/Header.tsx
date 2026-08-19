import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { getTheme } from '../utils/theme';
import { useAppStore } from '../state/useAppStore';

export const Header: React.FC = () => {
  const {
    stats,
    reminders,
    themeMode,
    toggleTheme,
    setActiveTab,
    setCreateTaskModalOpen,
  } = useAppStore();

  const currentTheme = getTheme(themeMode);
  const unackCount = reminders.length;
  const streak = stats?.current_streak_days || 1;

  // Format today's date TickTick-style
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: currentTheme.colors.surface,
          borderBottomColor: currentTheme.colors.cardBorder,
        },
      ]}
    >
      {/* Brand & Date */}
      <View style={styles.brandRow}>
        <View
          style={[
            styles.logoBadge,
            {
              backgroundColor: currentTheme.colors.primary,
            },
          ]}
        >
          <Text style={styles.logoText}>✓</Text>
        </View>
        <View>
          <Text style={[styles.title, { color: currentTheme.colors.text }]}>Task Flow</Text>
          <Text style={[styles.subtitle, { color: currentTheme.colors.textMuted }]}>
            {dateFormatted} • ☁️ Neon DB
          </Text>
        </View>
      </View>

      {/* Quick Action Badges */}
      <View style={styles.actionsRow}>
        {/* Streak Pill */}
        <View
          style={[
            styles.streakBadge,
            {
              backgroundColor: currentTheme.colors.warningLight,
              borderColor: `${currentTheme.colors.warning}44`,
            },
          ]}
        >
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={[styles.streakText, { color: currentTheme.colors.warning }]}>
            {streak}d
          </Text>
        </View>

        {/* Theme Switcher Toggle (☀️ / 🌙) */}
        <TouchableOpacity
          style={[
            styles.iconBtn,
            {
              backgroundColor: currentTheme.colors.surfaceLight,
              borderColor: currentTheme.colors.cardBorder,
            },
          ]}
          onPress={toggleTheme}
          activeOpacity={0.7}
          accessibilityLabel="Toggle Light/Dark Theme"
        >
          <Text style={styles.btnIcon}>
            {themeMode === 'dark' ? '☀️' : '🌙'}
          </Text>
        </TouchableOpacity>

        {/* Alert Bell */}
        <TouchableOpacity
          style={[
            styles.iconBtn,
            { backgroundColor: currentTheme.colors.surfaceLight, borderColor: currentTheme.colors.cardBorder },
            unackCount > 0 && {
              backgroundColor: currentTheme.colors.dangerLight,
              borderColor: currentTheme.colors.danger,
            },
          ]}
          onPress={() => setActiveTab('alerts')}
          activeOpacity={0.7}
        >
          <Text style={styles.btnIcon}>🔔</Text>
          {unackCount > 0 && (
            <View style={[styles.badge, { backgroundColor: currentTheme.colors.danger }]}>
              <Text style={styles.badgeText}>{unackCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Add Task Button */}
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: currentTheme.colors.primary }]}
          onPress={() => setCreateTaskModalOpen(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.createButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexWrap: 'wrap',
    gap: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
    gap: 3,
  },
  streakEmoji: {
    fontSize: 12,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '800',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  btnIcon: {
    fontSize: 15,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  createButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
