import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { getTheme } from '../utils/theme';
import { RecurrenceType, PriorityLevel, Subtask } from '../types';
import { useAppStore } from '../state/useAppStore';

export const CreateTaskModal: React.FC = () => {
  const { isCreateTaskModalOpen, setCreateTaskModalOpen, categories, createTask, themeMode } = useAppStore();
  const currentTheme = getTheme(themeMode);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('NONE');
  const [priority, setPriority] = useState<PriorityLevel>('MEDIUM');
  const [categoryId, setCategoryId] = useState<number | undefined>(
    categories[0]?.id
  );
  const [dueDateString, setDueDateString] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddSubtask = () => {
    if (!subtaskInput.trim()) return;
    const newSt: Subtask = {
      id: Date.now(),
      title: subtaskInput.trim(),
      completed: false,
    };
    setSubtasks([...subtasks, newSt]);
    setSubtaskInput('');
  };

  const handleRemoveSubtask = (id: number) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('Please enter a task title');
      return;
    }

    setIsSubmitting(true);
    let parsedDueDate: string | undefined = undefined;
    if (dueDateString.trim()) {
      try {
        const d = new Date(dueDateString.trim());
        if (!isNaN(d.getTime())) {
          parsedDueDate = d.toISOString();
        }
      } catch (e) {
        // Ignored
      }
    }

    const success = await createTask({
      title: title.trim(),
      description: description.trim() || undefined,
      recurrence_type: recurrenceType,
      recurrence_interval: 1,
      priority,
      category_id: categoryId,
      due_date: parsedDueDate,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
    });

    setIsSubmitting(false);

    if (success) {
      // Reset form
      setTitle('');
      setDescription('');
      setRecurrenceType('NONE');
      setPriority('MEDIUM');
      setDueDateString('');
      setSubtasks([]);
      setCreateTaskModalOpen(false);
    }
  };

  if (!isCreateTaskModalOpen) return null;

  return (
    <Modal
      visible={isCreateTaskModalOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setCreateTaskModalOpen(false)}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: currentTheme.colors.surface,
              borderColor: currentTheme.colors.cardBorder,
            },
          ]}
        >
          {/* Modal Header */}
          <View
            style={[
              styles.header,
              { borderBottomColor: currentTheme.colors.cardBorder },
            ]}
          >
            <Text style={[styles.modalTitle, { color: currentTheme.colors.text }]}>
              Create New Task / Reminder
            </Text>
            <TouchableOpacity onPress={() => setCreateTaskModalOpen(false)}>
              <Text style={[styles.closeText, { color: currentTheme.colors.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Title Input */}
            <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
              Task Title *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: currentTheme.colors.inputBg,
                  borderColor: currentTheme.colors.inputBorder,
                  color: currentTheme.colors.text,
                },
              ]}
              placeholder="e.g. Monthly server backup & review"
              placeholderTextColor={currentTheme.colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            {/* Description Input */}
            <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
              Description & Notes
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: currentTheme.colors.inputBg,
                  borderColor: currentTheme.colors.inputBorder,
                  color: currentTheme.colors.text,
                },
              ]}
              placeholder="Add key details or action steps..."
              placeholderTextColor={currentTheme.colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            {/* Recurrence Frequency Selector */}
            <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
              Reminder / Recurrence Frequency
            </Text>
            <View style={styles.pillRow}>
              {(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as RecurrenceType[]).map((r) => {
                const isSelected = recurrenceType === r;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: isSelected
                          ? currentTheme.colors.primary
                          : currentTheme.colors.surfaceLight,
                        borderColor: isSelected
                          ? currentTheme.colors.primary
                          : currentTheme.colors.cardBorder,
                      },
                    ]}
                    onPress={() => setRecurrenceType(r)}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        {
                          color: isSelected
                            ? '#FFFFFF'
                            : currentTheme.colors.textSecondary,
                          fontWeight: isSelected ? '800' : '600',
                        },
                      ]}
                    >
                      {r === 'NONE' ? 'One-time' : r}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Priority Selector */}
            <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
              Priority Level
            </Text>
            <View style={styles.pillRow}>
              {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as PriorityLevel[]).map((p) => {
                const isSelected = priority === p;
                const pColor = currentTheme.colors.priority[p];
                return (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: isSelected
                          ? pColor
                          : currentTheme.colors.surfaceLight,
                        borderColor: isSelected
                          ? pColor
                          : currentTheme.colors.cardBorder,
                      },
                    ]}
                    onPress={() => setPriority(p)}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        {
                          color: isSelected
                            ? '#FFFFFF'
                            : currentTheme.colors.textSecondary,
                          fontWeight: isSelected ? '800' : '600',
                        },
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Category Selector */}
            {categories.length > 0 && (
              <>
                <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
                  Category
                </Text>
                <View style={styles.pillRow}>
                  {categories.map((c) => {
                    const isSelected = categoryId === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={[
                          styles.pill,
                          {
                            backgroundColor: isSelected
                              ? `${c.color}25`
                              : currentTheme.colors.surfaceLight,
                            borderColor: isSelected
                              ? c.color
                              : currentTheme.colors.cardBorder,
                          },
                        ]}
                        onPress={() => setCategoryId(c.id)}
                      >
                        <Text
                          style={[
                            styles.pillText,
                            {
                              color: isSelected
                                ? c.color
                                : currentTheme.colors.textSecondary,
                              fontWeight: isSelected ? '800' : '600',
                            },
                          ]}
                        >
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Due Date Input */}
            <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
              Due Date / Time (Optional)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: currentTheme.colors.inputBg,
                  borderColor: currentTheme.colors.inputBorder,
                  color: currentTheme.colors.text,
                },
              ]}
              placeholder="e.g. 2026-08-25 14:00"
              placeholderTextColor={currentTheme.colors.textMuted}
              value={dueDateString}
              onChangeText={setDueDateString}
            />

            {/* Subtasks Checklist Builder */}
            <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
              Subtasks & Milestones
            </Text>
            <View style={styles.subtaskInputRow}>
              <TextInput
                style={[
                  styles.input,
                  {
                    flex: 1,
                    marginBottom: 0,
                    backgroundColor: currentTheme.colors.inputBg,
                    borderColor: currentTheme.colors.inputBorder,
                    color: currentTheme.colors.text,
                  },
                ]}
                placeholder="Add a milestone step..."
                placeholderTextColor={currentTheme.colors.textMuted}
                value={subtaskInput}
                onChangeText={setSubtaskInput}
                onSubmitEditing={handleAddSubtask}
              />
              <TouchableOpacity
                style={[
                  styles.addSubtaskBtn,
                  {
                    backgroundColor: currentTheme.colors.surfaceLight,
                    borderColor: currentTheme.colors.cardBorder,
                  },
                ]}
                onPress={handleAddSubtask}
              >
                <Text style={[styles.addSubtaskText, { color: currentTheme.colors.primary }]}>
                  + Add
                </Text>
              </TouchableOpacity>
            </View>

            {subtasks.map((st) => (
              <View
                key={st.id}
                style={[
                  styles.subtaskItemRow,
                  { backgroundColor: currentTheme.colors.surfaceLight },
                ]}
              >
                <Text style={[styles.subtaskBullet, { color: currentTheme.colors.primary }]}>•</Text>
                <Text style={[styles.subtaskTitleItem, { color: currentTheme.colors.text }]}>
                  {st.title}
                </Text>
                <TouchableOpacity onPress={() => handleRemoveSubtask(st.id)}>
                  <Text style={[styles.subtaskRemoveText, { color: currentTheme.colors.textMuted }]}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {/* Modal Footer */}
          <View
            style={[
              styles.footer,
              { borderTopColor: currentTheme.colors.cardBorder },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.cancelBtn,
                { backgroundColor: currentTheme.colors.surfaceLight },
              ]}
              onPress={() => setCreateTaskModalOpen(false)}
            >
              <Text style={[styles.cancelBtnText, { color: currentTheme.colors.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                { backgroundColor: currentTheme.colors.primary },
                isSubmitting && { opacity: 0.6 },
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.submitBtnText}>
                {isSubmitting ? 'Saving...' : 'Create Task'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    borderRadius: 20,
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  closeText: {
    fontSize: 18,
    padding: 4,
  },
  scrollBody: {
    padding: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 11,
  },
  subtaskInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  addSubtaskBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  addSubtaskText: {
    fontSize: 12,
    fontWeight: '700',
  },
  subtaskItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 4,
    gap: 8,
  },
  subtaskBullet: {
    fontSize: 14,
  },
  subtaskTitleItem: {
    fontSize: 13,
    flex: 1,
  },
  subtaskRemoveText: {
    fontSize: 12,
    padding: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 10,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
