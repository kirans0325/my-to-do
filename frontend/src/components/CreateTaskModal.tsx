import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { getTheme } from '../utils/theme';
import { RecurrenceType, PriorityLevel, Subtask } from '../types';
import { useAppStore } from '../state/useAppStore';
import {
  SOUND_PRESETS,
  NotificationSoundType,
  playNotificationSound,
} from '../utils/soundEngine';

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

  // Alarm & Sound State
  const [enableAlarm, setEnableAlarm] = useState(false);
  const [alarmTime, setAlarmTime] = useState('09:00 AM');
  const [selectedSound, setSelectedSound] = useState<NotificationSoundType>('bell');

  const alarmTimePresets = ['08:00 AM', '12:00 PM', '05:00 PM', '09:00 PM'];

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

  const handlePreviewSound = (soundId: NotificationSoundType) => {
    setSelectedSound(soundId);
    playNotificationSound(soundId);
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

    const descWithAlarm = enableAlarm
      ? `${description ? description + '\n' : ''}⏰ Alarm: ${alarmTime} • 🎵 Sound: ${selectedSound}`
      : description;

    const success = await createTask({
      title: title.trim(),
      description: descWithAlarm ? descWithAlarm.trim() : undefined,
      recurrence_type: recurrenceType,
      recurrence_interval: 1,
      priority,
      category_id: categoryId,
      due_date: parsedDueDate,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
    });

    setIsSubmitting(false);

    if (success) {
      if (enableAlarm) {
        playNotificationSound(selectedSound);
      }
      // Reset form
      setTitle('');
      setDescription('');
      setRecurrenceType('NONE');
      setPriority('MEDIUM');
      setDueDateString('');
      setSubtasks([]);
      setEnableAlarm(false);
      setCreateTaskModalOpen(false);
    }
  };

  return (
    <Modal
      visible={isCreateTaskModalOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setCreateTaskModalOpen(false)}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: currentTheme.colors.surface,
              borderColor: currentTheme.colors.cardBorder,
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: currentTheme.colors.cardBorder },
            ]}
          >
            <View style={styles.titleRow}>
              <Text style={styles.headerEmoji}>📝</Text>
              <Text
                style={[styles.modalTitle, { color: currentTheme.colors.text }]}
              >
                Create New Task / Alarm
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setCreateTaskModalOpen(false)}
            >
              <Text
                style={[
                  styles.closeBtnText,
                  { color: currentTheme.colors.textMuted },
                ]}
              >
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Body */}
          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Title Input */}
            <Text
              style={[
                styles.label,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
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
              placeholder="e.g. Server Maintenance, Daily Workout, Pay Utility Bill"
              placeholderTextColor={currentTheme.colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            {/* Description Input */}
            <Text
              style={[
                styles.label,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
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
              placeholder="Add key details, links, or instructions..."
              placeholderTextColor={currentTheme.colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            {/* Recurrence Frequency Selector */}
            <Text
              style={[
                styles.label,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              Reminder / Recurrence Frequency
            </Text>
            <View style={styles.pillRow}>
              {(
                ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as RecurrenceType[]
              ).map((r) => {
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
            <Text
              style={[
                styles.label,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              Priority Level
            </Text>
            <View style={styles.pillRow}>
              {(
                ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as PriorityLevel[]
              ).map((p) => {
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

            {/* Alarm & Unique Notification Sound Section */}
            <View
              style={[
                styles.alarmSection,
                {
                  backgroundColor: currentTheme.colors.surfaceLight,
                  borderColor: enableAlarm ? currentTheme.colors.primary : currentTheme.colors.cardBorder,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.alarmToggleRow}
                onPress={() => setEnableAlarm(!enableAlarm)}
                activeOpacity={0.7}
              >
                <View style={styles.alarmToggleLeft}>
                  <Text style={styles.alarmIcon}>{enableAlarm ? '🔔' : '🔕'}</Text>
                  <View>
                    <Text style={[styles.alarmTitle, { color: currentTheme.colors.text }]}>
                      Audible Alarm & Sound Reminder
                    </Text>
                    <Text style={[styles.alarmSubtitle, { color: currentTheme.colors.textMuted }]}>
                      Play unique audio notification chime at specified time
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.switchPill,
                    {
                      backgroundColor: enableAlarm ? currentTheme.colors.primary : currentTheme.colors.cardBorder,
                    },
                  ]}
                >
                  <Text style={styles.switchPillText}>{enableAlarm ? 'ON' : 'OFF'}</Text>
                </View>
              </TouchableOpacity>

              {enableAlarm && (
                <View style={styles.alarmSettings}>
                  {/* Alarm Time Presets */}
                  <Text style={[styles.subLabel, { color: currentTheme.colors.textSecondary }]}>
                    ⏰ Alarm Time
                  </Text>
                  <View style={styles.pillRow}>
                    {alarmTimePresets.map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[
                          styles.smallPill,
                          {
                            backgroundColor: alarmTime === t ? currentTheme.colors.primary : currentTheme.colors.surface,
                            borderColor: alarmTime === t ? currentTheme.colors.primary : currentTheme.colors.cardBorder,
                          },
                        ]}
                        onPress={() => setAlarmTime(t)}
                      >
                        <Text
                          style={[
                            styles.smallPillText,
                            {
                              color: alarmTime === t ? '#FFFFFF' : currentTheme.colors.textSecondary,
                              fontWeight: alarmTime === t ? '700' : '500',
                            },
                          ]}
                        >
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Sound Presets with Interactive Preview */}
                  <Text style={[styles.subLabel, { color: currentTheme.colors.textSecondary, marginTop: 8 }]}>
                    🎵 Select Notification Chime (Tap ▶️ to preview)
                  </Text>
                  <View style={styles.soundList}>
                    {SOUND_PRESETS.map((snd) => {
                      const isSelected = selectedSound === snd.id;
                      return (
                        <TouchableOpacity
                          key={snd.id}
                          style={[
                            styles.soundRow,
                            {
                              backgroundColor: isSelected ? `${currentTheme.colors.primary}20` : currentTheme.colors.surface,
                              borderColor: isSelected ? currentTheme.colors.primary : currentTheme.colors.cardBorder,
                            },
                          ]}
                          onPress={() => setSelectedSound(snd.id)}
                        >
                          <Text style={styles.soundEmoji}>{snd.emoji}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.soundName, { color: currentTheme.colors.text }]}>
                              {snd.name}
                            </Text>
                            <Text style={[styles.soundDesc, { color: currentTheme.colors.textMuted }]}>
                              {snd.description}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={[
                              styles.previewBtn,
                              { backgroundColor: currentTheme.colors.primary },
                            ]}
                            onPress={() => handlePreviewSound(snd.id)}
                          >
                            <Text style={styles.previewBtnText}>▶️ Play</Text>
                          </TouchableOpacity>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* Category Selector */}
            {categories.length > 0 && (
              <>
                <Text
                  style={[
                    styles.label,
                    { color: currentTheme.colors.textSecondary },
                  ]}
                >
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
            <Text
              style={[
                styles.label,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
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
            <Text
              style={[
                styles.label,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
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
                <Text
                  style={[
                    styles.addSubtaskText,
                    { color: currentTheme.colors.primary },
                  ]}
                >
                  + Add
                </Text>
              </TouchableOpacity>
            </View>

            {/* Subtasks List */}
            {subtasks.map((st) => (
              <View
                key={st.id}
                style={[
                  styles.subtaskItem,
                  {
                    backgroundColor: currentTheme.colors.surfaceLight,
                    borderColor: currentTheme.colors.cardBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.subtaskTitle,
                    { color: currentTheme.colors.text },
                  ]}
                >
                  • {st.title}
                </Text>
                <TouchableOpacity onPress={() => handleRemoveSubtask(st.id)}>
                  <Text
                    style={[
                      styles.removeSubtaskText,
                      { color: currentTheme.colors.danger },
                    ]}
                  >
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {/* Footer Actions */}
          <View
            style={[
              styles.modalFooter,
              { borderTopColor: currentTheme.colors.cardBorder },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.cancelBtn,
                {
                  backgroundColor: currentTheme.colors.surfaceLight,
                  borderColor: currentTheme.colors.cardBorder,
                },
              ]}
              onPress={() => setCreateTaskModalOpen(false)}
            >
              <Text
                style={[
                  styles.cancelBtnText,
                  { color: currentTheme.colors.textSecondary },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.createBtn,
                { backgroundColor: currentTheme.colors.primary },
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.createBtnText}>
                {isSubmitting ? 'Creating...' : '✓ Create Task & Alarm'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerEmoji: {
    fontSize: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  formScroll: {
    maxHeight: 480,
  },
  formContent: {
    padding: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    marginBottom: 14,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
  },
  alarmSection: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  alarmToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alarmToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  alarmIcon: {
    fontSize: 20,
  },
  alarmTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  alarmSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  switchPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  switchPillText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  alarmSettings: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  smallPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  smallPillText: {
    fontSize: 11,
  },
  soundList: {
    gap: 6,
    marginTop: 4,
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  soundEmoji: {
    fontSize: 16,
  },
  soundName: {
    fontSize: 12,
    fontWeight: '700',
  },
  soundDesc: {
    fontSize: 10,
  },
  previewBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  previewBtnText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  subtaskInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  addSubtaskBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  addSubtaskText: {
    fontSize: 13,
    fontWeight: '700',
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
  },
  subtaskTitle: {
    fontSize: 13,
    flex: 1,
  },
  removeSubtaskText: {
    fontSize: 13,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  createBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
