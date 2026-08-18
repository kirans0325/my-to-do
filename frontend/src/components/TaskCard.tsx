import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Task } from '../types';
import { getTheme } from '../utils/theme';
import { getRelativeDueLabel } from '../utils/dateUtils';
import { useAppStore } from '../state/useAppStore';

interface TaskCardProps {
  task: Task;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const { toggleTaskComplete, updateTaskProgress, toggleSubtask, deleteTask, themeMode } = useAppStore();
  const currentTheme = getTheme(themeMode);
  const [showSubtasks, setShowSubtasks] = useState(true);

  const dueInfo = getRelativeDueLabel(task.due_date);
  const isDone = task.status === 'COMPLETED';
  const isOverdue = task.status === 'OVERDUE' || dueInfo.isOverdue;

  const recurrenceColor =
    currentTheme.colors.recurrence[task.recurrence_type] || currentTheme.colors.textMuted;
  const priorityColor =
    currentTheme.colors.priority[task.priority] || currentTheme.colors.primary;

  const handleProgressChange = (delta: number) => {
    const newProgress = Math.max(0, Math.min(100, task.progress_percentage + delta));
    updateTaskProgress(task.id, newProgress);
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
          {/* Priority Badge */}
          <View style={[styles.priorityBadge, { borderColor: priorityColor, backgroundColor: `${priorityColor}15` }]}>
            <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
            <Text style={[styles.priorityText, { color: priorityColor }]}>{task.priority}</Text>
          </View>

          {/* Recurrence Badge */}
          {task.recurrence_type !== 'NONE' && (
            <View
              style={[
                styles.recurrenceBadge,
                { backgroundColor: `${recurrenceColor}18`, borderColor: `${recurrenceColor}44`, borderWidth: 1 },
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
                { backgroundColor: `${task.category.color}18`, borderColor: `${task.category.color}44`, borderWidth: 1 },
              ]}
            >
              <Text style={[styles.categoryText, { color: task.category.color }]}>
                {task.category.name}
              </Text>
            </View>
          )}
        </View>

        {/* Delete Action */}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => deleteTask(task.id)}
          activeOpacity={0.6}
        >
          <Text style={[styles.deleteBtnText, { color: currentTheme.colors.textMuted }]}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Title & Description */}
      <View style={styles.body}>
        <TouchableOpacity
          style={styles.titleRow}
          onPress={() => toggleTaskComplete(task.id)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.checkbox,
              { borderColor: currentTheme.colors.primary },
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
          <Text style={[styles.description, { color: currentTheme.colors.textSecondary }]} numberOfLines={2}>
            {task.description}
          </Text>
        ) : null}
      </View>

      {/* Due Date & Reminder Info */}
      <View style={styles.metaRow}>
        <View style={styles.dueRow}>
          <Text style={styles.dueIcon}>📅</Text>
          <Text
            style={[
              styles.dueText,
              { color: currentTheme.colors.textMuted },
              isOverdue && !isDone && { color: currentTheme.colors.danger, fontWeight: '700' },
              dueInfo.isToday && !isDone && { color: currentTheme.colors.warning, fontWeight: '700' },
            ]}
          >
            {dueInfo.text}
          </Text>
        </View>

        <Text style={[styles.progressLabel, { color: currentTheme.colors.textSecondary }]}>
          {task.progress_percentage}% {isDone ? 'Completed' : ''}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressBarContainer, { backgroundColor: currentTheme.colors.surfaceLight }]}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${task.progress_percentage}%`,
              backgroundColor: isDone
                ? currentTheme.colors.success
                : isOverdue
                ? currentTheme.colors.danger
                : currentTheme.colors.primary,
            },
          ]}
        />
      </View>

      {/* Subtasks Checklist */}
      {task.subtasks && task.subtasks.length > 0 && (
        <View style={[styles.subtasksContainer, { backgroundColor: currentTheme.colors.surfaceLight }]}>
          <TouchableOpacity
            style={styles.subtasksHeader}
            onPress={() => setShowSubtasks(!showSubtasks)}
          >
            <Text style={[styles.subtasksCount, { color: currentTheme.colors.textSecondary }]}>
              Subtasks ({task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length})
            </Text>
            <Text style={[styles.subtasksToggle, { color: currentTheme.colors.textMuted }]}>
              {showSubtasks ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>

          {showSubtasks &&
            task.subtasks.map((st) => (
              <TouchableOpacity
                key={st.id}
                style={styles.subtaskItem}
                onPress={() => toggleSubtask(task.id, st.id)}
              >
                <View
                  style={[
                    styles.subtaskCheckbox,
                    { borderColor: currentTheme.colors.textMuted },
                    st.completed && {
                      backgroundColor: currentTheme.colors.success,
                      borderColor: currentTheme.colors.success,
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

      {/* Progress Control Actions */}
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
          onPress={() => toggleTaskComplete(task.id)}
        >
          <Text
            style={[
              styles.completeBtnText,
              { color: isDone ? currentTheme.colors.textSecondary : '#FFFFFF' },
            ]}
          >
            {isDone ? 'Undo Complete' : '✓ Complete Task'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  cardDone: {
    opacity: 0.65,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '800',
  },
  recurrenceBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recurrenceText: {
    fontSize: 10,
    fontWeight: '800',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 4,
  },
  deleteBtnText: {
    fontSize: 14,
  },
  body: {
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#FFF',
    fontSize: 13,
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
    fontSize: 13,
    marginTop: 4,
    marginLeft: 32,
    lineHeight: 19,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 8,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueIcon: {
    fontSize: 12,
  },
  dueText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  subtasksContainer: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  subtasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  subtasksCount: {
    fontSize: 12,
    fontWeight: '700',
  },
  subtasksToggle: {
    fontSize: 10,
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
  },
  subtaskCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskCheckMark: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  subtaskTitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  subtaskTitleDone: {
    textDecorationLine: 'line-through',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    flexWrap: 'wrap',
    gap: 8,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 6,
  },
  stepBtn: {
    paddingHorizontal: 9,
    paddingVertical: 5,
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
