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
    setCreateDiaryModalOpen,
  } = useAppStore();

  const currentTheme = getTheme(themeMode);
  const unackCount = reminders.length;
  const streak = stats?.current_streak_days || 0;

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
      <View style={styles.brandRow}>
        <View
          style={[
            styles.logoBadge,
            {
              backgroundColor: currentTheme.colors.primary,
              shadowColor: currentTheme.colors.primary,
            },
          ]}
        >
          <Text style={styles.logoText}>✓</Text>
        </View>
        <View>
          <Text style={[styles.title, { color: currentTheme.colors.text }]}>TaskFlow Pro</Text>
          <Text style={[styles.subtitle, { color: currentTheme.colors.textMuted }]}>
            Tasks • Reminders • Daily Diary
          </Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        {/* Streak Badge */}
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
            {streak} Day{streak === 1 ? '' : 's'} Streak
          </Text>
        </View>

        {/* Theme Switcher Toggle (☀️ Light / 🌙 Dark) */}
        <TouchableOpacity
          style={[
            styles.themeToggleBtn,
            {
              backgroundColor: currentTheme.colors.surfaceLight,
              borderColor: currentTheme.colors.cardBorder,
            },
          ]}
          onPress={toggleTheme}
          activeOpacity={0.7}
          accessibilityLabel="Toggle Light or Dark Mode"
        >
          <Text style={styles.themeToggleIcon}>
            {themeMode === 'dark' ? '☀️' : '🌙'}
          </Text>
        </TouchableOpacity>

        {/* Alert Bell */}
        <TouchableOpacity
          style={[
            styles.alertButton,
            { backgroundColor: currentTheme.colors.surfaceLight },
            unackCount > 0 && {
              backgroundColor: currentTheme.colors.dangerLight,
              borderColor: currentTheme.colors.danger,
              borderWidth: 1,
            },
          ]}
          onPress={() => setActiveTab('alerts')}
          activeOpacity={0.7}
        >
          <Text style={styles.alertIcon}>🔔</Text>
          {unackCount > 0 && (
            <View style={[styles.badge, { backgroundColor: currentTheme.colors.danger }]}>
              <Text style={styles.badgeText}>{unackCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Quick Action Buttons */}
        <TouchableOpacity
          style={[
            styles.diaryButton,
            {
              backgroundColor: currentTheme.colors.surfaceLight,
              borderColor: currentTheme.colors.cardBorder,
            },
          ]}
          onPress={() => setCreateDiaryModalOpen(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.diaryButtonText, { color: currentTheme.colors.text }]}>
            + Daily Log
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: currentTheme.colors.primary }]}
          onPress={() => setCreateTaskModalOpen(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.createButtonText}>+ New Task</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexWrap: 'wrap',
    gap: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  logoText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 20,
  },
  title: {
    fontSize: 18,
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
    flexWrap: 'wrap',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    gap: 4,
  },
  streakEmoji: {
    fontSize: 13,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '700',
  },
  themeToggleBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeToggleIcon: {
    fontSize: 16,
  },
  alertButton: {
    position: 'relative',
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertIcon: {
    fontSize: 16,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  diaryButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  diaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  createButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
