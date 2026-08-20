import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Task } from '../types';
import { getTheme } from '../utils/theme';
import { getRelativeDueLabel } from '../utils/dateUtils';
import { useAppStore } from '../state/useAppStore';
import { playTaskCompleteSound, playSnoozeSound } from '../utils/soundEngine';

interface TaskCardProps {
  task: Task;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const {
    toggleTaskComplete,
    updateTaskProgress,
    toggleSubtask,
    deleteTask,
    setEditingTask,
    snoozeTask,
    themeMode,
  } = useAppStore();

  const currentTheme = getTheme(themeMode);
  const [showSubtasks, setShowSubtasks] = useState(true);
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);

  const dueInfo = getRelativeDueLabel(task.due_date);
  const isDone = task.status === 'COMPLETED';
  const isOverdue = task.status === 'OVERDUE' || dueInfo.isOverdue;

  const recurrenceColor =
    currentTheme.colors.recurrence[task.recurrence_type] || currentTheme.colors.textMuted;
  const priorityColor =
    currentTheme.colors.priority[task.priority] || currentTheme.colors.primary;

  const priorityFlagEmoji =
    task.priority === 'HIGH' || task.priority === 'URGENT'
      ? '🚩'
      : task.priority === 'MEDIUM'
      ? '🟡'
      : task.priority === 'LOW'
      ? '🔵'
      : '';

  const handleToggleComplete = () => {
    if (!isDone) {
      playTaskCompleteSound();
    }
    toggleTaskComplete(task.id);
  };

  const handleProgressChange = (delta: number) => {
    const newProgress = Math.max(0, Math.min(100, task.progress_percentage + delta));
    if (newProgress >= 100 && !isDone) {
      playTaskCompleteSound();
    }
    updateTaskProgress(task.id, newProgress);
  };

  const handleSnooze = (minutes: number) => {
    playSnoozeSound();
    snoozeTask(task.id, minutes);
    setShowSnoozeMenu(false);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: currentTheme.colors.surface,
          borderColor: isOverdue && !isDone
            ? `${currentTheme.colors.danger}66`
            : currentTheme.colors.cardBorder,
        },
        isDone && styles.cardDone,
      ]}
    >
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.badgeRow}>
          {/* Priority Flag */}
          {priorityFlagEmoji ? (
            <View style={[styles.priorityBadge, { backgroundColor: `${priorityColor}15` }]}>
              <Text style={[styles.priorityText, { color: priorityColor }]}>
                {priorityFlagEmoji} {task.priority}
              </Text>
            </View>
          ) : null}

          {/* Recurrence Badge */}
          {task.recurrence_type !== 'NONE' && (
            <View
              style={[
                styles.recurrenceBadge,
                { backgroundColor: `${recurrenceColor}15`, borderColor: `${recurrenceColor}40`, borderWidth: 1 },
              ]}
            >
              <Text style={[styles.recurrenceText, { color: recurrenceColor }]}>
                🔄 {task.recurrence_type}
              </Text>
            </View>
          )}

          {/* Category Tag */}
          {task.category && (
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: `${task.category.color}15`, borderColor: `${task.category.color}40`, borderWidth: 1 },
              ]}
            >
              <Text style={[styles.categoryText, { color: task.category.color }]}>
                #{task.category.name}
              </Text>
            </View>
          )}
        </View>

        {/* Top Header Actions (Edit & Delete) */}
        <View style={styles.topActions}>
          <TouchableOpacity
            style={[styles.headerActionBtn, { backgroundColor: currentTheme.colors.surfaceLight }]}
            onPress={() => setEditingTask(task)}
            activeOpacity={0.7}
          >
            <Text style={styles.headerActionText}>✏️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerActionBtn, { backgroundColor: currentTheme.colors.surfaceLight }]}
            onPress={() => deleteTask(task.id)}
            activeOpacity={0.6}
          >
            <Text style={[styles.headerActionText, { color: currentTheme.colors.danger }]}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Due Date & Snooze Row */}
      {task.due_date && (
        <View style={styles.dueRow}>
          <View style={styles.dueLeft}>
            <Text style={styles.dueEmoji}>{isOverdue && !isDone ? '🚨' : '⏰'}</Text>
            <Text
              style={[
                styles.dueText,
                { color: isOverdue && !isDone ? currentTheme.colors.danger : currentTheme.colors.textSecondary },
              ]}
            >
              {dueInfo.text}
            </Text>
          </View>

          {/* Snooze Trigger Button */}
          {!isDone && (
            <TouchableOpacity
              style={[styles.snoozeTriggerBtn, { backgroundColor: currentTheme.colors.surfaceLight }]}
              onPress={() => setShowSnoozeMenu(!showSnoozeMenu)}
              activeOpacity={0.7}
            >
              <Text style={[styles.snoozeTriggerText, { color: currentTheme.colors.warning }]}>
                💤 Snooze
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Snooze Options Popup Chips */}
      {showSnoozeMenu && !isDone && (
        <View
          style={[
            styles.snoozeMenu,
            {
              backgroundColor: currentTheme.colors.surfaceLight,
              borderColor: `${currentTheme.colors.warning}66`,
            },
          ]}
        >
          <Text style={[styles.snoozeMenuTitle, { color: currentTheme.colors.textSecondary }]}>
            Snooze Alarm By:
          </Text>
          <View style={styles.snoozeChipsRow}>
            {[
              { label: '+5m', mins: 5 },
              { label: '+15m', mins: 15 },
              { label: '+30m', mins: 30 },
              { label: '+1 hour', mins: 60 },
            ].map((s) => (
              <TouchableOpacity
                key={s.label}
                style={[styles.snoozeChip, { backgroundColor: currentTheme.colors.surface }]}
                onPress={() => handleSnooze(s.mins)}
              >
                <Text style={[styles.snoozeChipText, { color: currentTheme.colors.warning }]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Title & Description with TickTick-style circular checkbox */}
      <View style={styles.body}>
        <TouchableOpacity
          style={styles.titleRow}
          onPress={handleToggleComplete}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.circleCheckbox,
              { borderColor: priorityColor },
              isDone && {
                backgroundColor: currentTheme.colors.success,
                borderColor: currentTheme.colors.success,
              },
            ]}
          >
            {isDone && <Text style={styles.checkMark}>✓</Text>}
          </View>
          <Text
            style={[
              styles.title,
              { color: currentTheme.colors.text },
              isDone && [styles.titleDone, { color: currentTheme.colors.textMuted }],
            ]}
          >
            {task.title}
          </Text>
        </TouchableOpacity>

        {task.description ? (
          <Text
            style={[
              styles.description,
              { color: currentTheme.colors.textSecondary },
              isDone && [styles.descDone, { color: currentTheme.colors.textMuted }],
            ]}
          >
            {task.description}
          </Text>
        ) : null}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressLabelRow}>
          <Text style={[styles.progressText, { color: currentTheme.colors.textMuted }]}>
            Progress: {task.progress_percentage}%
          </Text>
          {task.subtasks && task.subtasks.length > 0 && (
            <TouchableOpacity onPress={() => setShowSubtasks(!showSubtasks)}>
              <Text style={[styles.subtaskToggleText, { color: currentTheme.colors.primary }]}>
                {showSubtasks ? 'Hide Steps' : `Steps (${task.subtasks.filter(s => s.completed).length}/${task.subtasks.length})`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={[styles.progressBarBg, { backgroundColor: currentTheme.colors.surfaceLight }]}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${task.progress_percentage}%`,
                backgroundColor: isDone
                  ? currentTheme.colors.success
                  : task.progress_percentage > 50
                  ? currentTheme.colors.primary
                  : currentTheme.colors.warning,
              },
            ]}
          />
        </View>
      </View>

      {/* Subtasks List */}
      {showSubtasks && task.subtasks && task.subtasks.length > 0 && (
        <View style={[styles.subtasksContainer, { borderTopColor: currentTheme.colors.cardBorder }]}>
          {task.subtasks.map((st) => (
            <TouchableOpacity
              key={st.id}
              style={styles.subtaskRow}
              onPress={() => toggleSubtask(task.id, st.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.subtaskBox,
                  { borderColor: currentTheme.colors.cardBorder },
                  st.completed && {
                    backgroundColor: currentTheme.colors.primary,
                    borderColor: currentTheme.colors.primary,
                  },
                ]}
              >
                {st.completed && <Text style={styles.subtaskCheckMark}>✓</Text>}
              </View>
              <Text
                style={[
                  styles.subtaskTitle,
                  { color: currentTheme.colors.text },
                  st.completed && [styles.subtaskTitleDone, { color: currentTheme.colors.textMuted }],
                ]}
              >
                {st.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Progress Control & Footer Actions */}
      <View style={styles.footerRow}>
        <View style={styles.stepperRow}>
          <TouchableOpacity
            style={[
              styles.stepBtn,
              {
                backgroundColor: currentTheme.colors.surfaceLight,
                borderColor: currentTheme.colors.cardBorder,
              },
            ]}
            onPress={() => handleProgressChange(-10)}
            disabled={isDone || task.progress_percentage <= 0}
          >
            <Text style={[styles.stepBtnText, { color: currentTheme.colors.textSecondary }]}>-10%</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.stepBtn,
              {
                backgroundColor: currentTheme.colors.surfaceLight,
                borderColor: currentTheme.colors.cardBorder,
              },
            ]}
            onPress={() => handleProgressChange(10)}
            disabled={isDone || task.progress_percentage >= 100}
          >
            <Text style={[styles.stepBtnText, { color: currentTheme.colors.textSecondary }]}>+10%</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.stepBtn,
              {
                backgroundColor: currentTheme.colors.surfaceLight,
                borderColor: currentTheme.colors.cardBorder,
              },
            ]}
            onPress={() => setEditingTask(task)}
          >
            <Text style={[styles.stepBtnText, { color: currentTheme.colors.primary }]}>✏️ Edit</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.completeBtn,
            isDone
              ? {
                  backgroundColor: currentTheme.colors.surfaceLight,
                  borderColor: currentTheme.colors.cardBorder,
                  borderWidth: 1,
                }
              : { backgroundColor: currentTheme.colors.success },
          ]}
          onPress={handleToggleComplete}
        >
          <Text
            style={[
              styles.completeBtnText,
              { color: isDone ? currentTheme.colors.textSecondary : '#FFFFFF' },
            ]}
          >
            {isDone ? 'Undo Complete' : '✓ Done'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardDone: {
    opacity: 0.6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '800',
  },
  recurrenceBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  recurrenceText: {
    fontSize: 10,
    fontWeight: '700',
  },
  categoryBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerActionBtn: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dueLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dueEmoji: {
    fontSize: 13,
  },
  dueText: {
    fontSize: 11,
    fontWeight: '700',
  },
  snoozeTriggerBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  snoozeTriggerText: {
    fontSize: 10,
    fontWeight: '800',
  },
  snoozeMenu: {
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  snoozeMenuTitle: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  snoozeChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  snoozeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  snoozeChipText: {
    fontSize: 10,
    fontWeight: '800',
  },
  body: {
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circleCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  titleDone: {
    textDecorationLine: 'line-through',
  },
  description: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 30,
    lineHeight: 16,
  },
  descDone: {
    textDecorationLine: 'line-through',
  },
  progressSection: {
    marginBottom: 8,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
  },
  subtaskToggleText: {
    fontSize: 10,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  subtasksContainer: {
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 4,
    marginBottom: 6,
    gap: 4,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  subtaskBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskCheckMark: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  subtaskTitle: {
    fontSize: 12,
  },
  subtaskTitleDone: {
    textDecorationLine: 'line-through',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  stepBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  completeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  completeBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
