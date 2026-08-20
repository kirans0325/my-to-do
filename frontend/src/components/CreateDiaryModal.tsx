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
import { MoodType, DailyActivity } from '../types';
import { getTodayDateString } from '../utils/dateUtils';
import { useAppStore } from '../state/useAppStore';

export const CreateDiaryModal: React.FC = () => {
  const {
    isCreateDiaryModalOpen,
    setCreateDiaryModalOpen,
    selectedDiaryDate,
    diaryEntries,
    saveDiaryEntry,
    themeMode,
  } = useAppStore();

  const currentTheme = getTheme(themeMode);

  const [dateStr, setDateStr] = useState(selectedDiaryDate || getTodayDateString());
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<MoodType>('GOOD');
  const [productivityScore, setProductivityScore] = useState(8);
  const [tags, setTags] = useState('');
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [activityTime, setActivityTime] = useState('');
  const [activityText, setActivityText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const existing = diaryEntries.find((d) => d.entry_date === dateStr);
    if (existing) {
      setTitle(existing.title || '');
      setContent(existing.content || '');
      setMood(existing.mood || 'GOOD');
      setProductivityScore(existing.productivity_score || 7);
      setTags(existing.tags || '');
      setActivities(existing.activities || []);
    } else {
      setTitle('');
      setContent('');
      setMood('GOOD');
      setProductivityScore(8);
      setTags('');
      setActivities([]);
    }
  }, [dateStr, isCreateDiaryModalOpen]);

  const handleAddActivity = () => {
    if (!activityText.trim()) return;
    const newAct: DailyActivity = {
      time: activityTime.trim() || 'General',
      activity: activityText.trim(),
      done: true,
    };
    setActivities([...activities, newAct]);
    setActivityText('');
    setActivityTime('');
  };

  const handleRemoveActivity = (idx: number) => {
    setActivities(activities.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Required', 'Please write your journal entry or daily reflections.');
      return;
    }

    setIsSubmitting(true);
    const success = await saveDiaryEntry({
      entry_date: dateStr,
      title: title.trim() || undefined,
      content: content.trim(),
      mood,
      productivity_score: productivityScore,
      tags: tags.trim() || undefined,
      activities: activities.length > 0 ? activities : undefined,
    });
    setIsSubmitting(false);

    if (success) {
      setCreateDiaryModalOpen(false);
    }
  };

  if (!isCreateDiaryModalOpen) return null;

  return (
    <Modal
      visible={isCreateDiaryModalOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setCreateDiaryModalOpen(false)}
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
              Daily Diary & Activity Log
            </Text>
            <TouchableOpacity onPress={() => setCreateDiaryModalOpen(false)}>
              <Text style={[styles.closeText, { color: currentTheme.colors.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Entry Date */}
            <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
              Entry Date (YYYY-MM-DD) *
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
              placeholder="YYYY-MM-DD"
              placeholderTextColor={currentTheme.colors.textMuted}
              value={dateStr}
              onChangeText={setDateStr}
            />

            {/* Daily Mood Selector */}
            <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
              How Was Your Day? (Mood)
            </Text>
            <View style={styles.pillRow}>
              {[
                { type: 'GREAT', label: '🤩 Great' },
                { type: 'GOOD', label: '😊 Good' },
                { type: 'NEUTRAL', label: '😐 Neutral' },
                { type: 'TIRED', label: '🥱 Tired' },
                { type: 'STRESSED', label: '🤯 Stressed' },
              ].map((m) => {
                const isSelected = mood === m.type;
                const mColor = currentTheme.colors.mood[m.type as MoodType];
                return (
                  <TouchableOpacity
                    key={m.type}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: isSelected ? mColor : currentTheme.colors.surfaceLight,
                        borderColor: isSelected ? mColor : currentTheme.colors.cardBorder,
                      },
                    ]}
                    onPress={() => setMood(m.type as MoodType)}
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
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Productivity Score (1 to 10) */}
            <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
              Productivity Score ({productivityScore}/10)
            </Text>
            <View style={styles.scoreRow}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                const isSelected = productivityScore === num;
                return (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.scoreBtn,
                      {
                        backgroundColor: isSelected
                          ? currentTheme.colors.warning
                          : currentTheme.colors.surfaceLight,
                        borderColor: isSelected
                          ? currentTheme.colors.warning
                          : currentTheme.colors.cardBorder,
                      },
                    ]}
                    onPress={() => setProductivityScore(num)}
                  >
                    <Text
                      style={[
                        styles.scoreBtnText,
                        {
                          color: isSelected
                            ? '#000000'
                            : currentTheme.colors.textSecondary,
                          fontWeight: '800',
                        },
                      ]}
                    >
                      {num}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Day Title Summary */}
            <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
              Day Highlights / Summary (Optional)
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
              placeholder="e.g. Backend sprint completed & productive workout"
              placeholderTextColor={currentTheme.colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            {/* Daily Reflections & Journal Content */}
            <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
              Journal Reflections & Notes *
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
              placeholder="Write your thoughts, milestones achieved, challenges faced, or ideas for tomorrow..."
              placeholderTextColor={currentTheme.colors.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={5}
            />

            {/* Activities Timeline Builder */}
            <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
              Log Activities / Timeline
            </Text>
            <View style={styles.activityInputRow}>
              <TextInput
                style={[
                  styles.input,
                  {
                    width: 90,
                    marginBottom: 0,
                    backgroundColor: currentTheme.colors.inputBg,
                    borderColor: currentTheme.colors.inputBorder,
                    color: currentTheme.colors.text,
                  },
                ]}
                placeholder="09:00 AM"
                placeholderTextColor={currentTheme.colors.textMuted}
                value={activityTime}
                onChangeText={setActivityTime}
              />
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
                placeholder="Activity description..."
                placeholderTextColor={currentTheme.colors.textMuted}
                value={activityText}
                onChangeText={setActivityText}
                onSubmitEditing={handleAddActivity}
              />
              <TouchableOpacity
                style={[
                  styles.addActBtn,
                  {
                    backgroundColor: currentTheme.colors.surfaceLight,
                    borderColor: currentTheme.colors.cardBorder,
                  },
                ]}
                onPress={handleAddActivity}
              >
                <Text style={[styles.addActText, { color: currentTheme.colors.primary }]}>
                  + Add
                </Text>
              </TouchableOpacity>
            </View>

            {activities.map((act, idx) => (
              <View
                key={idx}
                style={[
                  styles.activityItemRow,
                  { backgroundColor: currentTheme.colors.surfaceLight },
                ]}
              >
                <Text style={[styles.actTimeText, { color: currentTheme.colors.primary }]}>
                  {act.time}
                </Text>
                <Text style={[styles.actDescText, { color: currentTheme.colors.text }]}>
                  {act.activity}
                </Text>
                <TouchableOpacity onPress={() => handleRemoveActivity(idx)}>
                  <Text style={[styles.actRemoveText, { color: currentTheme.colors.textMuted }]}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Tags */}
            <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
              Tags (Comma separated)
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
              placeholder="e.g. work, coding, gym, reading"
              placeholderTextColor={currentTheme.colors.textMuted}
              value={tags}
              onChangeText={setTags}
            />
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
              onPress={() => setCreateDiaryModalOpen(false)}
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
                {isSubmitting ? 'Saving...' : 'Save Entry'}
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
    maxWidth: 560,
    maxHeight: '90%',
    borderWidth: 1,
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
    minHeight: 100,
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
  scoreRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  scoreBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  scoreBtnText: {
    fontSize: 11,
  },
  activityInputRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    marginBottom: 8,
  },
  addActBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  addActText: {
    fontSize: 12,
    fontWeight: '700',
  },
  activityItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 4,
    gap: 8,
  },
  actTimeText: {
    fontSize: 11,
    fontWeight: '700',
    minWidth: 60,
  },
  actDescText: {
    fontSize: 12,
    flex: 1,
  },
  actRemoveText: {
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
