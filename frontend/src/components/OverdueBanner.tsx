import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { getTheme } from '../utils/theme';
import { useAppStore } from '../state/useAppStore';

export const OverdueBanner: React.FC = () => {
  const { tasks, reminders, themeMode, setActiveTab, toggleTaskComplete } = useAppStore();
  const currentTheme = getTheme(themeMode);

  const overdueTasks = tasks.filter((t) => t.status === 'OVERDUE');
  const unackAlerts = reminders.filter((r) => !r.is_acknowledged);

  if (overdueTasks.length === 0 && unackAlerts.length === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.bannerContainer,
        {
          backgroundColor: currentTheme.colors.dangerLight,
          borderColor: `${currentTheme.colors.danger}44`,
        },
      ]}
    >
      <View style={styles.bannerHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.alertIcon}>⚠️</Text>
          <Text style={[styles.bannerTitle, { color: currentTheme.colors.danger }]}>
            Action Required: {overdueTasks.length} Overdue Task{overdueTasks.length === 1 ? '' : 's'} & {unackAlerts.length} Unresolved Alert{unackAlerts.length === 1 ? '' : 's'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setActiveTab('alerts')}>
          <Text style={[styles.viewAllText, { color: currentTheme.colors.danger }]}>
            View Alert Center →
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.itemsList}>
        {overdueTasks.slice(0, 2).map((task) => (
          <View
            key={task.id}
            style={[
              styles.taskRow,
              {
                backgroundColor: currentTheme.colors.surface,
                borderColor: currentTheme.colors.cardBorder,
              },
            ]}
          >
            <View style={styles.taskInfo}>
              <View
                style={[
                  styles.priorityDot,
                  { backgroundColor: currentTheme.colors.priority[task.priority] || currentTheme.colors.danger },
                ]}
              />
              <Text
                style={[styles.taskTitle, { color: currentTheme.colors.text }]}
                numberOfLines={1}
              >
                {task.title}
              </Text>
              <Text style={[styles.recurrenceTag, { color: currentTheme.colors.textMuted }]}>
                [{task.recurrence_type}]
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.quickCompleteBtn, { backgroundColor: currentTheme.colors.danger }]}
              onPress={() => toggleTaskComplete(task.id)}
            >
              <Text style={styles.quickCompleteText}>Mark Done</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 8,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertIcon: {
    fontSize: 16,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  itemsList: {
    gap: 6,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 10,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  recurrenceTag: {
    fontSize: 10,
    fontWeight: '700',
  },
  quickCompleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  quickCompleteText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
