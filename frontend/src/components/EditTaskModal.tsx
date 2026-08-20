import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { getTheme } from '../utils/theme';
import { RecurrenceType, PriorityLevel, Subtask } from '../types';
import { useAppStore } from '../state/useAppStore';
import {
  SOUND_PRESETS,
  NotificationSoundType,
  playNotificationSound,
} from '../utils/soundEngine';

export const EditTaskModal: React.FC = () => {
  const { editingTask, setEditingTask, categories, updateExistingTask, themeMode } = useAppStore();
  const currentTheme = getTheme(themeMode);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('NONE');
  const [priority, setPriority] = useState<PriorityLevel>('MEDIUM');
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [dueDateString, setDueDateString] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Alarm & Sound State
  const [enableAlarm, setEnableAlarm] = useState(false);
  const [alarmTab, setAlarmTab] = useState<'EXACT_TIME' | 'COUNTDOWN'>('EXACT_TIME');
  const [selectedHour, setSelectedHour] = useState('09');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');
  const [countdownMinutes, setCountdownMinutes] = useState(15);
  const [selectedSound, setSelectedSound] = useState<NotificationSoundType>('bell');

  const hoursList = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const minutesList = ['00', '15', '30', '45'];
  const countdownPresets = [
    { label: '10 mins', val: 10 },
    { label: '15 mins', val: 15 },
    { label: '30 mins', val: 30 },
    { label: '45 mins', val: 45 },
    { label: '1 hour', val: 60 },
    { label: '2 hours', val: 120 },
  ];

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title || '');
      setDescription(editingTask.description || '');
      setRecurrenceType(editingTask.recurrence_type || 'NONE');
      setPriority(editingTask.priority || 'MEDIUM');
      setCategoryId(editingTask.category_id || categories[0]?.id);
      setSubtasks(editingTask.subtasks || []);
      setDueDateString(editingTask.due_date ? editingTask.due_date.slice(0, 16).replace('T', ' ') : '');

      // Parse existing alarm info from description if present
      if (editingTask.description && editingTask.description.includes('⏰ Alarm:')) {
        setEnableAlarm(true);
      } else if (editingTask.due_date) {
        setEnableAlarm(true);
      } else {
        setEnableAlarm(false);
      }
    }
  }, [editingTask]);

  if (!editingTask) return null;

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

  const getComputedAlarmTimeLabel = () => {
    if (alarmTab === 'COUNTDOWN') {
      const ringTime = new Date(Date.now() + countdownMinutes * 60 * 1000);
      return `In ${countdownMinutes} mins (${ringTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
    }
    return `${selectedHour}:${selectedMinute} ${selectedPeriod}`;
  };

  const getComputedDueDate = (): string | undefined => {
    if (enableAlarm) {
      if (alarmTab === 'COUNTDOWN') {
        return new Date(Date.now() + countdownMinutes * 60 * 1000).toISOString();
      } else {
        const now = new Date();
        let hr = parseInt(selectedHour, 10);
        if (selectedPeriod === 'PM' && hr < 12) hr += 12;
        if (selectedPeriod === 'AM' && hr === 12) hr = 0;
        const target = new Date();
        target.setHours(hr, parseInt(selectedMinute, 10), 0, 0);
        if (target.getTime() < now.getTime()) {
          target.setDate(target.getDate() + 1);
        }
        return target.toISOString();
      }
    }

    if (dueDateString.trim()) {
      try {
        const d = new Date(dueDateString.trim());
        if (!isNaN(d.getTime())) {
          return d.toISOString();
        }
      } catch (e) {}
    }
    return undefined;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a task title');
      return;
    }

    setIsSubmitting(true);
    const parsedDueDate = getComputedDueDate();
    const alarmTimeLabel = getComputedAlarmTimeLabel();

    // Clean old alarm tag from description if re-saving
    let cleanDesc = (description || '').replace(/\n?⏰ Alarm:.*$/gm, '').trim();
    if (enableAlarm) {
      cleanDesc = `${cleanDesc ? cleanDesc + '\n' : ''}⏰ Alarm: ${alarmTimeLabel} • 🎵 Sound: ${selectedSound}`;
    }

    const success = await updateExistingTask(editingTask.id, {
      title: title.trim(),
      description: cleanDesc ? cleanDesc.trim() : undefined,
      recurrence_type: recurrenceType,
      priority,
      category_id: categoryId,
      due_date: parsedDueDate,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
    });

    setIsSubmitting(false);
    if (success) {
      if (enableAlarm) playNotificationSound(selectedSound);
      setEditingTask(null);
    }
  };

  return (
    <Modal
      visible={!!editingTask}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setEditingTask(null)}
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
              <Text style={styles.headerEmoji}>✏️</Text>
              <Text style={[styles.modalTitle, { color: currentTheme.colors.text }]}>
                Edit Task #{editingTask.id}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setEditingTask(null)}>
              <Text style={[styles.closeBtnText, { color: currentTheme.colors.textMuted }]}>
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
              placeholder="Task title"
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
              placeholder="Add key details..."
              placeholderTextColor={currentTheme.colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            {/* Recurrence Frequency */}
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
                          color: isSelected ? '#FFFFFF' : currentTheme.colors.textSecondary,
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
                        backgroundColor: isSelected ? pColor : currentTheme.colors.surfaceLight,
                        borderColor: isSelected ? pColor : currentTheme.colors.cardBorder,
                      },
                    ]}
                    onPress={() => setPriority(p)}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        {
                          color: isSelected ? '#FFFFFF' : currentTheme.colors.textSecondary,
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

            {/* Alarm & Notification Sound Section */}
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
                      {enableAlarm ? `Active: ${getComputedAlarmTimeLabel()}` : 'Set custom hours of day or countdown timer'}
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
                  {/* Mode Switcher */}
                  <View style={[styles.modeTabBar, { backgroundColor: currentTheme.colors.surface }]}>
                    <TouchableOpacity
                      style={[
                        styles.modeTab,
                        alarmTab === 'EXACT_TIME' && [styles.activeModeTab, { backgroundColor: currentTheme.colors.primary }],
                      ]}
                      onPress={() => setAlarmTab('EXACT_TIME')}
                    >
                      <Text
                        style={[
                          styles.modeTabText,
                          { color: alarmTab === 'EXACT_TIME' ? '#FFF' : currentTheme.colors.textSecondary },
                        ]}
                      >
                        ⏰ Exact Time of Day
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.modeTab,
                        alarmTab === 'COUNTDOWN' && [styles.activeModeTab, { backgroundColor: currentTheme.colors.primary }],
                      ]}
                      onPress={() => setAlarmTab('COUNTDOWN')}
                    >
                      <Text
                        style={[
                          styles.modeTabText,
                          { color: alarmTab === 'COUNTDOWN' ? '#FFF' : currentTheme.colors.textSecondary },
                        ]}
                      >
                        ⏱️ Countdown Timer
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Mode 1: Exact Time */}
                  {alarmTab === 'EXACT_TIME' ? (
                    <View style={styles.timePickerContainer}>
                      <Text style={[styles.subLabel, { color: currentTheme.colors.textSecondary }]}>
                        Quick Hour of Day:
                      </Text>
                      <View style={styles.pillRow}>
                        {[
                          { label: '🌅 08:00 AM', h: '08', m: '00', p: 'AM' },
                          { label: '☀️ 12:00 PM', h: '12', m: '00', p: 'PM' },
                          { label: '🌆 05:00 PM', h: '05', m: '00', p: 'PM' },
                          { label: '🌙 09:00 PM', h: '09', m: '00', p: 'PM' },
                        ].map((q) => {
                          const isMatch = selectedHour === q.h && selectedMinute === q.m && selectedPeriod === q.p;
                          return (
                            <TouchableOpacity
                              key={q.label}
                              style={[
                                styles.smallPill,
                                {
                                  backgroundColor: isMatch ? currentTheme.colors.primary : currentTheme.colors.surface,
                                  borderColor: isMatch ? currentTheme.colors.primary : currentTheme.colors.cardBorder,
                                },
                              ]}
                              onPress={() => {
                                setSelectedHour(q.h);
                                setSelectedMinute(q.m);
                                setSelectedPeriod(q.p as any);
                              }}
                            >
                              <Text
                                style={[
                                  styles.smallPillText,
                                  { color: isMatch ? '#FFF' : currentTheme.colors.textSecondary },
                                ]}
                              >
                                {q.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {/* Hour selector */}
                      <Text style={[styles.subLabel, { color: currentTheme.colors.textSecondary, marginTop: 6 }]}>
                        Select Hour:
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          {hoursList.map((h) => {
                            const isSel = selectedHour === h;
                            return (
                              <TouchableOpacity
                                key={h}
                                style={[
                                  styles.hourChip,
                                  {
                                    backgroundColor: isSel ? currentTheme.colors.primary : currentTheme.colors.surface,
                                    borderColor: isSel ? currentTheme.colors.primary : currentTheme.colors.cardBorder,
                                  },
                                ]}
                                onPress={() => setSelectedHour(h)}
                              >
                                <Text style={{ color: isSel ? '#FFF' : currentTheme.colors.text, fontWeight: '700', fontSize: 13 }}>
                                  {h}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </ScrollView>

                      {/* Minute & AM/PM */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.subLabel, { color: currentTheme.colors.textSecondary }]}>
                            Minute:
                          </Text>
                          <View style={{ flexDirection: 'row', gap: 6 }}>
                            {minutesList.map((m) => {
                              const isSel = selectedMinute === m;
                              return (
                                <TouchableOpacity
                                  key={m}
                                  style={[
                                    styles.minChip,
                                    {
                                      backgroundColor: isSel ? currentTheme.colors.primary : currentTheme.colors.surface,
                                      borderColor: isSel ? currentTheme.colors.primary : currentTheme.colors.cardBorder,
                                    },
                                  ]}
                                  onPress={() => setSelectedMinute(m)}
                                >
                                  <Text style={{ color: isSel ? '#FFF' : currentTheme.colors.text, fontWeight: '700', fontSize: 12 }}>
                                    :{m}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>

                        <View>
                          <Text style={[styles.subLabel, { color: currentTheme.colors.textSecondary }]}>
                            Period:
                          </Text>
                          <View style={[styles.periodToggle, { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.cardBorder }]}>
                            <TouchableOpacity
                              style={[styles.periodBtn, selectedPeriod === 'AM' && { backgroundColor: currentTheme.colors.primary }]}
                              onPress={() => setSelectedPeriod('AM')}
                            >
                              <Text style={{ color: selectedPeriod === 'AM' ? '#FFF' : currentTheme.colors.textSecondary, fontWeight: '800', fontSize: 11 }}>
                                AM
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.periodBtn, selectedPeriod === 'PM' && { backgroundColor: currentTheme.colors.primary }]}
                              onPress={() => setSelectedPeriod('PM')}
                            >
                              <Text style={{ color: selectedPeriod === 'PM' ? '#FFF' : currentTheme.colors.textSecondary, fontWeight: '800', fontSize: 11 }}>
                                PM
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>
                  ) : (
                    /* Mode 2: Countdown Timer */
                    <View style={styles.countdownContainer}>
                      <Text style={[styles.subLabel, { color: currentTheme.colors.textSecondary }]}>
                        Ring Alarm After:
                      </Text>
                      <View style={styles.pillRow}>
                        {countdownPresets.map((cd) => {
                          const isSel = countdownMinutes === cd.val;
                          return (
                            <TouchableOpacity
                              key={cd.val}
                              style={[
                                styles.smallPill,
                                {
                                  backgroundColor: isSel ? currentTheme.colors.primary : currentTheme.colors.surface,
                                  borderColor: isSel ? currentTheme.colors.primary : currentTheme.colors.cardBorder,
                                },
                              ]}
                              onPress={() => setCountdownMinutes(cd.val)}
                            >
                              <Text style={{ color: isSel ? '#FFF' : currentTheme.colors.textSecondary, fontWeight: '700', fontSize: 11 }}>
                                {cd.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                        <Text style={{ fontSize: 12, color: currentTheme.colors.textSecondary }}>
                          Custom Timer:
                        </Text>
                        <TextInput
                          style={[
                            styles.customMinInput,
                            {
                              backgroundColor: currentTheme.colors.surface,
                              color: currentTheme.colors.text,
                              borderColor: currentTheme.colors.cardBorder,
                            },
                          ]}
                          keyboardType="number-pad"
                          placeholder="mins"
                          placeholderTextColor={currentTheme.colors.textMuted}
                          value={String(countdownMinutes)}
                          onChangeText={(txt: string) => {
                            const val = parseInt(txt.replace(/\D/g, ''), 10);
                            if (!isNaN(val)) setCountdownMinutes(Math.max(1, Math.min(1440, val)));
                          }}
                        />
                        <Text style={{ fontSize: 12, color: currentTheme.colors.textMuted }}>minutes from now</Text>
                      </View>
                    </View>
                  )}

                  {/* Sound Presets */}
                  <Text style={[styles.subLabel, { color: currentTheme.colors.textSecondary, marginTop: 12 }]}>
                    🎵 Select Alarm Sound (Tap ▶️ to test sound)
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
                            backgroundColor: isSelected ? `${c.color}25` : currentTheme.colors.surfaceLight,
                            borderColor: isSelected ? c.color : currentTheme.colors.cardBorder,
                          },
                        ]}
                        onPress={() => setCategoryId(c.id)}
                      >
                        <Text
                          style={[
                            styles.pillText,
                            {
                              color: isSelected ? c.color : currentTheme.colors.textSecondary,
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

            {/* Subtasks Checklist */}
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
                placeholder="Add milestone step..."
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
                  styles.subtaskItem,
                  {
                    backgroundColor: currentTheme.colors.surfaceLight,
                    borderColor: currentTheme.colors.cardBorder,
                  },
                ]}
              >
                <Text style={[styles.subtaskTitle, { color: currentTheme.colors.text }]}>
                  • {st.title}
                </Text>
                <TouchableOpacity onPress={() => handleRemoveSubtask(st.id)}>
                  <Text style={[styles.removeSubtaskText, { color: currentTheme.colors.danger }]}>
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
              onPress={() => setEditingTask(null)}
            >
              <Text style={[styles.cancelBtnText, { color: currentTheme.colors.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: currentTheme.colors.primary }]}
              onPress={handleSave}
              disabled={isSubmitting}
            >
              <Text style={styles.createBtnText}>
                {isSubmitting ? 'Saving...' : '✓ Save Changes'}
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
  modeTabBar: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 3,
    marginBottom: 12,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeModeTab: {},
  modeTabText: {
    fontSize: 11,
    fontWeight: '700',
  },
  timePickerContainer: {
    marginBottom: 6,
  },
  countdownContainer: {
    marginBottom: 6,
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
  hourChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 34,
    alignItems: 'center',
  },
  minChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  periodToggle: {
    flexDirection: 'row',
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
  },
  periodBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  customMinInput: {
    width: 60,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    borderWidth: 1,
    textAlign: 'center',
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
