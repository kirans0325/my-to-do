import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { getTheme } from '../utils/theme';
import { useAppStore } from '../state/useAppStore';
import { StatCard } from '../components/StatCard';

export const AnalyticsScreen: React.FC = () => {
  const { stats, themeMode } = useAppStore();
  const currentTheme = getTheme(themeMode);

  const freqItems = [
    {
      title: 'Daily Habits & Routines',
      data: stats?.daily_stats,
      color: currentTheme.colors.info,
      icon: '⚡',
    },
    {
      title: 'Monthly Deadlines & Bills',
      data: stats?.monthly_stats,
      color: currentTheme.colors.recurrence.MONTHLY,
      icon: '🗓',
    },
    {
      title: 'Yearly Renewals & Milestones',
      data: stats?.yearly_stats,
      color: currentTheme.colors.recurrence.YEARLY,
      icon: '🎯',
    },
    {
      title: 'One-Time Tasks',
      data: stats?.one_time_stats,
      color: currentTheme.colors.primary,
      icon: '📌',
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: currentTheme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Metrics Grid */}
      <View style={styles.topGrid}>
        <StatCard
          title="Overall Success Rate"
          value={`${stats?.overall_completion_rate || 0}%`}
          subtitle={`${stats?.completed_tasks || 0} finished out of ${stats?.total_tasks || 0}`}
          progressPercent={stats?.overall_completion_rate || 0}
          accentColor={currentTheme.colors.success}
          icon="🏆"
        />
        <StatCard
          title="Daily Diary Entries"
          value={stats?.total_diary_entries || 0}
          subtitle={`Avg Productivity: ${stats?.average_productivity || 0}/10`}
          accentColor={currentTheme.colors.primary}
          icon="📔"
        />
      </View>

      {/* Recurrence Frequency Performance Breakdown */}
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: currentTheme.colors.surface,
            borderColor: currentTheme.colors.cardBorder,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
          Progress by Recurrence Frequency
        </Text>

        <View style={styles.freqList}>
          {freqItems.map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.freqItem,
                { backgroundColor: currentTheme.colors.surfaceLight },
              ]}
            >
              <View style={styles.freqHeader}>
                <View style={styles.freqTitleRow}>
                  <Text style={styles.freqIcon}>{item.icon}</Text>
                  <Text style={[styles.freqTitleText, { color: currentTheme.colors.text }]}>
                    {item.title}
                  </Text>
                </View>
                <Text style={[styles.freqRateText, { color: item.color }]}>
                  {item.data?.completion_rate || 0}% Done
                </Text>
              </View>

              {/* Progress Bar */}
              <View
                style={[
                  styles.barContainer,
                  { backgroundColor: currentTheme.colors.surface },
                ]}
              >
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${item.data?.completion_rate || 0}%`,
                      backgroundColor: item.color,
                    },
                  ]}
                />
              </View>

              <View style={styles.freqMetaRow}>
                <Text style={[styles.metaItem, { color: currentTheme.colors.textMuted }]}>
                  Total: <Text style={[styles.metaVal, { color: currentTheme.colors.textSecondary }]}>{item.data?.total || 0}</Text>
                </Text>
                <Text style={[styles.metaItem, { color: currentTheme.colors.textMuted }]}>
                  Completed: <Text style={[styles.metaVal, { color: currentTheme.colors.textSecondary }]}>{item.data?.completed || 0}</Text>
                </Text>
                <Text style={[styles.metaItem, { color: currentTheme.colors.textMuted }]}>
                  In Progress: <Text style={[styles.metaVal, { color: currentTheme.colors.textSecondary }]}>{item.data?.in_progress || 0}</Text>
                </Text>
                <Text
                  style={[
                    styles.metaItem,
                    { color: currentTheme.colors.textMuted },
                    (item.data?.overdue || 0) > 0 && { color: currentTheme.colors.danger },
                  ]}
                >
                  Overdue: <Text style={[styles.metaVal, { color: (item.data?.overdue || 0) > 0 ? currentTheme.colors.danger : currentTheme.colors.textSecondary }]}>{item.data?.overdue || 0}</Text>
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Category Distribution Breakdown */}
      {stats?.categories && stats.categories.length > 0 && (
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: currentTheme.colors.surface,
              borderColor: currentTheme.colors.cardBorder,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
            Category Progress Breakdown
          </Text>

          <View style={styles.catList}>
            {stats.categories.map((cat) => {
              const rate =
                cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0;
              return (
                <View key={cat.category_id || cat.category_name} style={styles.catItem}>
                  <View style={styles.catHeader}>
                    <View style={styles.catNameRow}>
                      <View style={[styles.catColorDot, { backgroundColor: cat.color }]} />
                      <Text style={[styles.catName, { color: currentTheme.colors.text }]}>
                        {cat.category_name}
                      </Text>
                    </View>
                    <Text style={[styles.catCount, { color: currentTheme.colors.textMuted }]}>
                      {cat.completed}/{cat.total} Tasks ({rate}%)
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.barContainer,
                      { backgroundColor: currentTheme.colors.surfaceLight },
                    ]}
                  >
                    <View
                      style={[
                        styles.barFill,
                        { width: `${rate}%`, backgroundColor: cat.color },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
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
  topGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  sectionCard: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 16,
  },
  freqList: {
    gap: 12,
  },
  freqItem: {
    borderRadius: 12,
    padding: 14,
  },
  freqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  freqTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  freqIcon: {
    fontSize: 14,
  },
  freqTitleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  freqRateText: {
    fontSize: 12,
    fontWeight: '800',
  },
  barContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  freqMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaItem: {
    fontSize: 11,
  },
  metaVal: {
    fontWeight: '800',
  },
  catList: {
    gap: 12,
  },
  catItem: {
    gap: 6,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  catName: {
    fontSize: 13,
    fontWeight: '600',
  },
  catCount: {
    fontSize: 11,
    fontWeight: '500',
  },
});
