import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { getTheme } from '../utils/theme';
import { useAppStore } from '../state/useAppStore';
import { TaskCard } from '../components/TaskCard';
import { StatCard } from '../components/StatCard';
import { formatDateTime } from '../utils/dateUtils';
import { taskApi } from '../api/taskApi';

export const AlertsScreen: React.FC = () => {
  const {
    tasks,
    reminders,
    alertSummary,
    acknowledgeAlert,
    acknowledgeAllAlerts,
    fetchAllData,
    themeMode,
  } = useAppStore();

  const currentTheme = getTheme(themeMode);
  const overdueTasks = tasks.filter((t) => t.status === 'OVERDUE');

  const handleScanNow = async () => {
    try {
      await taskApi.scanAlerts();
      await fetchAllData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: currentTheme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Alert Metrics Header */}
      <View style={styles.metricsGrid}>
        <StatCard
          title="Overdue Tasks"
          value={overdueTasks.length}
          subtitle="Past due deadline"
          accentColor={currentTheme.colors.danger}
          icon="🚨"
        />
        <StatCard
          title="Urgent Alerts"
          value={alertSummary?.urgent_alerts || 0}
          subtitle="High priority items"
          accentColor={currentTheme.colors.warning}
          icon="⚡"
        />
        <StatCard
          title="Unresolved Alerts"
          value={reminders.length}
          subtitle="System notifications"
          accentColor={currentTheme.colors.primary}
          icon="🔔"
        />
      </View>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[
            styles.scanBtn,
            {
              backgroundColor: currentTheme.colors.surface,
              borderColor: currentTheme.colors.cardBorder,
            },
          ]}
          onPress={handleScanNow}
        >
          <Text style={[styles.scanBtnText, { color: currentTheme.colors.text }]}>
            🔄 Scan For Alerts Now
          </Text>
        </TouchableOpacity>

        {reminders.length > 0 && (
          <TouchableOpacity
            style={[
              styles.ackAllBtn,
              { backgroundColor: currentTheme.colors.surfaceLight },
            ]}
            onPress={acknowledgeAllAlerts}
          >
            <Text style={[styles.ackAllBtnText, { color: currentTheme.colors.textSecondary }]}>
              ✓ Acknowledge All Alerts
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Overdue Tasks Section */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: currentTheme.colors.textSecondary }]}>
          Overdue Tasks ({overdueTasks.length})
        </Text>
      </View>

      {overdueTasks.length > 0 ? (
        overdueTasks.map((task) => <TaskCard key={task.id} task={task} />)
      ) : (
        <View
          style={[
            styles.clearCard,
            {
              backgroundColor: currentTheme.colors.surface,
              borderColor: `${currentTheme.colors.success}44`,
            },
          ]}
        >
          <Text style={styles.clearIcon}>🎉</Text>
          <Text style={[styles.clearTitle, { color: currentTheme.colors.success }]}>
            Zero Overdue Tasks!
          </Text>
          <Text style={[styles.clearSubtitle, { color: currentTheme.colors.textSecondary }]}>
            Great job staying on top of your daily, monthly, and yearly goals.
          </Text>
        </View>
      )}

      {/* System Reminder & Alert Logs */}
      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <Text style={[styles.sectionTitle, { color: currentTheme.colors.textSecondary }]}>
          Active Reminder Notifications ({reminders.length})
        </Text>
      </View>

      {reminders.length > 0 ? (
        reminders.map((log) => (
          <View
            key={log.id}
            style={[
              styles.logCard,
              {
                backgroundColor: currentTheme.colors.surface,
                borderColor: currentTheme.colors.cardBorder,
              },
            ]}
          >
            <View style={styles.logHeader}>
              <View style={styles.logTypeRow}>
                <View
                  style={[
                    styles.logDot,
                    {
                      backgroundColor:
                        log.alert_type === 'OVERDUE'
                          ? currentTheme.colors.danger
                          : currentTheme.colors.primary,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.logType,
                    {
                      color:
                        log.alert_type === 'OVERDUE'
                          ? currentTheme.colors.danger
                          : currentTheme.colors.primary,
                    },
                  ]}
                >
                  {log.alert_type} ALERT
                </Text>
              </View>

              <Text style={[styles.logTime, { color: currentTheme.colors.textMuted }]}>
                {formatDateTime(log.triggered_at)}
              </Text>
            </View>

            <Text style={[styles.logMessage, { color: currentTheme.colors.text }]}>
              {log.message}
            </Text>

            <TouchableOpacity
              style={[
                styles.ackBtn,
                {
                  backgroundColor: currentTheme.colors.surfaceLight,
                  borderColor: currentTheme.colors.cardBorder,
                  borderWidth: 1,
                },
              ]}
              onPress={() => acknowledgeAlert(log.id)}
            >
              <Text style={[styles.ackBtnText, { color: currentTheme.colors.textSecondary }]}>
                Dismiss / Acknowledge
              </Text>
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <View
          style={[
            styles.emptyLogCard,
            {
              backgroundColor: currentTheme.colors.surface,
              borderColor: currentTheme.colors.cardBorder,
            },
          ]}
        >
          <Text style={[styles.emptyLogText, { color: currentTheme.colors.textMuted }]}>
            No unacknowledged alerts in your notification queue.
          </Text>
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 8,
  },
  scanBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  scanBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  ackAllBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  ackAllBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 14,
  },
  clearIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  clearTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  clearSubtitle: {
    fontSize: 12,
  },
  logCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  logType: {
    fontSize: 10,
    fontWeight: '800',
  },
  logTime: {
    fontSize: 10,
  },
  logMessage: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },
  ackBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ackBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyLogCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyLogText: {
    fontSize: 12,
  },
});
