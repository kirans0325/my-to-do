import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { getTheme } from '../utils/theme';
import { useAppStore } from '../state/useAppStore';
import { OverdueBanner } from '../components/OverdueBanner';
import { StatCard } from '../components/StatCard';
import { TaskCard } from '../components/TaskCard';
import { DiaryCard } from '../components/DiaryCard';
import { getTodayDateString, formatDiaryDate } from '../utils/dateUtils';

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
    <ScrollView
      style={[styles.container, { backgroundColor: currentTheme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Overdue Alert Banner */}
      <OverdueBanner />

      {/* Metrics Row */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Overall Progress"
          value={`${stats?.overall_completion_rate || 0}%`}
          subtitle={`${stats?.completed_tasks || 0} of ${stats?.total_tasks || 0} tasks done`}
          progressPercent={stats?.overall_completion_rate || 0}
          accentColor={currentTheme.colors.primary}
          icon="📊"
        />

        <StatCard
          title="Active Streak"
          value={`${stats?.current_streak_days || 0} Days`}
          subtitle="Keep daily consistency!"
          badgeText="Streak"
          badgeColor={currentTheme.colors.warning}
          accentColor={currentTheme.colors.warning}
          icon="🔥"
        />

        <StatCard
          title="Daily Completion"
          value={`${stats?.daily_stats?.completion_rate || 0}%`}
          subtitle={`${stats?.daily_stats?.completed || 0}/${stats?.daily_stats?.total || 0} daily habits`}
          progressPercent={stats?.daily_stats?.completion_rate || 0}
          accentColor={currentTheme.colors.info}
          icon="⚡"
        />

        <StatCard
          title="Overdue Tasks"
          value={stats?.overdue_tasks || 0}
          subtitle={stats?.overdue_tasks ? 'Action needed' : 'All clear!'}
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
            Today's Daily Diary & Activity Log
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => (todayDiary ? setActiveTab('diary') : setCreateDiaryModalOpen(true))}
        >
          <Text style={[styles.sectionLink, { color: currentTheme.colors.primary }]}>
            {todayDiary ? 'View Journal →' : '+ Write Today\'s Log'}
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
              borderColor: `${currentTheme.colors.primary}55`,
            },
          ]}
          onPress={() => setCreateDiaryModalOpen(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.emptyDiaryIcon}>✍️</Text>
          <View>
            <Text style={[styles.emptyDiaryTitle, { color: currentTheme.colors.text }]}>
              You haven't logged today's diary yet
            </Text>
            <Text style={[styles.emptyDiarySubtitle, { color: currentTheme.colors.textSecondary }]}>
              Click here to track your daily mood, activities, and reflections for {formatDiaryDate(todayStr)}.
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Today's Tasks & Reminders */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionEmoji}>🎯</Text>
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
            Today's Schedule & Routine ({todayTasks.length})
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            setTaskFilter('DAILY');
            setActiveTab('tasks');
          }}
        >
          <Text style={[styles.sectionLink, { color: currentTheme.colors.primary }]}>
            View All Daily →
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
            No tasks scheduled for today. Create one to get started!
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
                Upcoming Monthly & Yearly Reminders
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setTaskFilter('MONTHLY');
                setActiveTab('tasks');
              }}
            >
              <Text style={[styles.sectionLink, { color: currentTheme.colors.primary }]}>
                View Reminders →
              </Text>
            </TouchableOpacity>
          </View>

          {longTermReminders.slice(0, 3).map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 80,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 6,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionEmoji: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyDiaryPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 14,
    marginBottom: 14,
  },
  emptyDiaryIcon: {
    fontSize: 28,
  },
  emptyDiaryTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyDiarySubtitle: {
    fontSize: 12,
    marginTop: 2,
    maxWidth: 420,
  },
  emptyCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 14,
  },
  emptyText: {
    fontSize: 13,
  },
});
