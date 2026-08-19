import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { getTheme } from '../utils/theme';
import { useAppStore } from '../state/useAppStore';
import { OverdueBanner } from '../components/OverdueBanner';
import { StatCard } from '../components/StatCard';
import { TaskCard } from '../components/TaskCard';
import { DiaryCard } from '../components/DiaryCard';
import { HabitRing } from '../components/HabitRing';
import { FloatingQuickAdd } from '../components/FloatingQuickAdd';
import { getTodayDateString, formatDiaryDate } from '../utils/dateUtils';

interface HabitItem {
  id: number;
  name: string;
  emoji: string;
  color: string;
  target: string;
  completed: boolean;
  streak: number;
}

export const DashboardScreen: React.FC = () => {
  const {
    tasks,
    stats,
    diaryEntries,
    themeMode,
    setActiveTab,
    setTaskFilter,
    setCreateTaskModalOpen,
    setCreateDiaryModalOpen,
  } = useAppStore();

  const currentTheme = getTheme(themeMode);
  const todayStr = getTodayDateString();
  const todayDiary = diaryEntries.find((d) => d.entry_date === todayStr);

  // Local TickTick Habit tracker items
  const [habits, setHabits] = useState<HabitItem[]>([
    { id: 1, name: 'Drink 2.5L Water', emoji: '💧', color: currentTheme.colors.habits.cyan, target: 'Daily', completed: true, streak: 5 },
    { id: 2, name: '30min Fitness / Run', emoji: '🏃', color: currentTheme.colors.habits.emerald, target: 'Daily', completed: false, streak: 3 },
    { id: 3, name: 'Read 20 Pages', emoji: '📚', color: currentTheme.colors.habits.purple, target: 'Daily', completed: false, streak: 7 },
    { id: 4, name: 'Deep Work Sprint', emoji: '💻', color: currentTheme.colors.habits.blue, target: 'Daily', completed: true, streak: 12 },
  ]);

  const handleToggleHabit = (id: number) => {
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id
          ? {
              ...h,
              completed: !h.completed,
              streak: !h.completed ? h.streak + 1 : Math.max(0, h.streak - 1),
            }
          : h
      )
    );
  };

  // Today's tasks (due today or daily tasks)
  const todayTasks = tasks.filter((t) => {
    if (t.recurrence_type === 'DAILY') return true;
    if (t.due_date) {
      const dueDate = new Date(t.due_date);
      const now = new Date();
      return dueDate.toDateString() === now.toDateString();
    }
    return false;
  });

  // Upcoming Monthly and Yearly reminders
  const longTermReminders = tasks.filter(
    (t) => (t.recurrence_type === 'MONTHLY' || t.recurrence_type === 'YEARLY') && t.status !== 'COMPLETED'
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={[styles.container, { backgroundColor: currentTheme.colors.background }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Overdue Alert Banner */}
        <OverdueBanner />

        {/* TickTick Habit Check-In Carousel */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionEmoji}>✨</Text>
            <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
              Daily Habits & Streaks
            </Text>
          </View>
          <Text style={[styles.habitCount, { color: currentTheme.colors.textSecondary }]}>
            {habits.filter((h) => h.completed).length}/{habits.length} Done
          </Text>
        </View>

        <View style={styles.habitsGrid}>
          {habits.map((habit) => (
            <HabitRing key={habit.id} habit={habit} onToggle={handleToggleHabit} />
          ))}
        </View>

        {/* Metrics Row */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Today's Progress"
            value={`${stats?.overall_completion_rate || 23.3}%`}
            subtitle={`${stats?.completed_tasks || 0} of ${stats?.total_tasks || 0} tasks`}
            progressPercent={stats?.overall_completion_rate || 23.3}
            accentColor={currentTheme.colors.primary}
            icon="📊"
          />

          <StatCard
            title="Habit Streak"
            value={`${stats?.current_streak_days || 1} Days`}
            subtitle="Consistency is key!"
            badgeText="Streak"
            badgeColor={currentTheme.colors.warning}
            accentColor={currentTheme.colors.warning}
            icon="🔥"
          />

          <StatCard
            title="Overdue Tasks"
            value={stats?.overdue_tasks || 0}
            subtitle={stats?.overdue_tasks ? 'Needs attention' : 'All clear!'}
            badgeText={stats?.overdue_tasks ? 'Urgent' : 'Clear'}
            badgeColor={stats?.overdue_tasks ? currentTheme.colors.danger : currentTheme.colors.success}
            accentColor={stats?.overdue_tasks ? currentTheme.colors.danger : currentTheme.colors.success}
            icon="⚠️"
          />
        </View>

        {/* Today's Daily Diary Activity Snapshot */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionEmoji}>📔</Text>
            <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
              Today's Diary & Reflections
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => (todayDiary ? setActiveTab('diary') : setCreateDiaryModalOpen(true))}
          >
            <Text style={[styles.sectionLink, { color: currentTheme.colors.primary }]}>
              {todayDiary ? 'View Journal →' : '+ Write Today\'s Note'}
            </Text>
          </TouchableOpacity>
        </View>

        {todayDiary ? (
          <DiaryCard entry={todayDiary} />
        ) : (
          <TouchableOpacity
            style={[
              styles.emptyDiaryPrompt,
              {
                backgroundColor: currentTheme.colors.surface,
                borderColor: `${currentTheme.colors.primary}44`,
              },
            ]}
            onPress={() => setCreateDiaryModalOpen(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.emptyDiaryIcon}>✍️</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.emptyDiaryTitle, { color: currentTheme.colors.text }]}>
                Log today's thoughts & activities
              </Text>
              <Text style={[styles.emptyDiarySubtitle, { color: currentTheme.colors.textSecondary }]}>
                Capture mood, productivity, and timeline notes saved directly in Neon Cloud DB.
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Today's Tasks & Reminders */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionEmoji}>🎯</Text>
            <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
              Today's Focus ({todayTasks.length})
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setTaskFilter('DAILY');
              setActiveTab('tasks');
            }}
          >
            <Text style={[styles.sectionLink, { color: currentTheme.colors.primary }]}>
              View All →
            </Text>
          </TouchableOpacity>
        </View>

        {todayTasks.length > 0 ? (
          todayTasks.map((task) => <TaskCard key={task.id} task={task} />)
        ) : (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: currentTheme.colors.surface,
                borderColor: currentTheme.colors.cardBorder,
              },
            ]}
          >
            <Text style={[styles.emptyText, { color: currentTheme.colors.textMuted }]}>
              No tasks scheduled for today. Tap the + button to add one!
            </Text>
          </View>
        )}

        {/* Monthly & Yearly Reminders */}
        {longTermReminders.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionEmoji}>🗓</Text>
                <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
                  Upcoming Reminders
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setTaskFilter('MONTHLY');
                  setActiveTab('tasks');
                }}
              >
                <Text style={[styles.sectionLink, { color: currentTheme.colors.primary }]}>
                  All Reminders →
                </Text>
              </TouchableOpacity>
            </View>

            {longTermReminders.slice(0, 3).map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </>
        )}
      </ScrollView>

      {/* TickTick Floating Quick-Add Button */}
      <FloatingQuickAdd />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 90,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 6,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionEmoji: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  habitCount: {
    fontSize: 11,
    fontWeight: '700',
  },
  habitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  emptyDiaryPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 12,
    marginBottom: 14,
  },
  emptyDiaryIcon: {
    fontSize: 24,
  },
  emptyDiaryTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyDiarySubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  emptyCard: {
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 14,
  },
  emptyText: {
    fontSize: 13,
  },
});
