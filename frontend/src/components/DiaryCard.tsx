import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DiaryEntry } from '../types';
import { getTheme } from '../utils/theme';
import { formatDiaryDate } from '../utils/dateUtils';
import { useAppStore } from '../state/useAppStore';

interface DiaryCardProps {
  entry: DiaryEntry;
}

export const DiaryCard: React.FC<DiaryCardProps> = ({ entry }) => {
  const { deleteDiaryEntry, themeMode } = useAppStore();
  const currentTheme = getTheme(themeMode);

  const moodColor = currentTheme.colors.mood[entry.mood] || currentTheme.colors.primary;
  const moodEmoji: Record<string, string> = {
    GREAT: '🤩 Great',
    GOOD: '😊 Good',
    NEUTRAL: '😐 Neutral',
    TIRED: '🥱 Tired',
    STRESSED: '🤯 Stressed',
  };

  const tagList = entry.tags ? entry.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: currentTheme.colors.surface,
          borderColor: currentTheme.colors.cardBorder,
        },
      ]}
    >
      {/* Date & Mood Row */}
      <View style={styles.headerRow}>
        <View style={styles.dateInfo}>
          <Text style={[styles.dateText, { color: currentTheme.colors.textMuted }]}>
            {formatDiaryDate(entry.entry_date)}
          </Text>
          {entry.title ? (
            <Text style={[styles.titleText, { color: currentTheme.colors.text }]}>
              {entry.title}
            </Text>
          ) : null}
        </View>

        <View style={styles.metricsRow}>
          {/* Mood Pill */}
          <View
            style={[
              styles.moodPill,
              { backgroundColor: `${moodColor}18`, borderColor: `${moodColor}55` },
            ]}
          >
            <Text style={[styles.moodText, { color: moodColor }]}>
              {moodEmoji[entry.mood] || entry.mood}
            </Text>
          </View>

          {/* Productivity Pill */}
          <View
            style={[
              styles.prodPill,
              { backgroundColor: currentTheme.colors.warningLight },
            ]}
          >
            <Text style={[styles.prodText, { color: currentTheme.colors.warning }]}>
              ⚡ {entry.productivity_score}/10
            </Text>
          </View>

          {/* Delete Button */}
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => deleteDiaryEntry(entry.id)}
            activeOpacity={0.6}
          >
            <Text style={[styles.deleteText, { color: currentTheme.colors.textMuted }]}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Diary Content / Reflections */}
      <Text style={[styles.content, { color: currentTheme.colors.text }]}>
        {entry.content}
      </Text>

      {/* Activities Timeline */}
      {entry.activities && entry.activities.length > 0 && (
        <View
          style={[
            styles.activitiesContainer,
            { backgroundColor: currentTheme.colors.surfaceLight },
          ]}
        >
          <Text style={[styles.activitiesHeader, { color: currentTheme.colors.textSecondary }]}>
            Daily Activity Log:
          </Text>
          {entry.activities.map((act, index) => (
            <View key={index} style={styles.activityItem}>
              <Text style={[styles.activityTime, { color: currentTheme.colors.primary }]}>
                {act.time}
              </Text>
              <Text style={[styles.activityBullet, { color: currentTheme.colors.textMuted }]}>•</Text>
              <Text
                style={[
                  styles.activityText,
                  { color: currentTheme.colors.text },
                  act.done && [styles.activityDone, { color: currentTheme.colors.textMuted }],
                ]}
              >
                {act.activity}
              </Text>
              {act.category && (
                <View
                  style={[
                    styles.actCatBadge,
                    {
                      backgroundColor: currentTheme.colors.surface,
                      borderColor: currentTheme.colors.cardBorder,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Text style={[styles.actCatText, { color: currentTheme.colors.textSecondary }]}>
                    {act.category}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Tags Row */}
      {tagList.length > 0 && (
        <View style={styles.tagRow}>
          {tagList.map((tag, idx) => (
            <View
              key={idx}
              style={[
                styles.tagBadge,
                {
                  backgroundColor: currentTheme.colors.surfaceLight,
                  borderColor: currentTheme.colors.cardBorder,
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={[styles.tagText, { color: currentTheme.colors.textSecondary }]}>
                #{tag}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  dateInfo: {
    flex: 1,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moodPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
  },
  moodText: {
    fontSize: 11,
    fontWeight: '800',
  },
  prodPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  prodText: {
    fontSize: 11,
    fontWeight: '800',
  },
  deleteBtn: {
    padding: 4,
    marginLeft: 4,
  },
  deleteText: {
    fontSize: 14,
  },
  content: {
    fontSize: 14,
    lineHeight: 22,
    marginVertical: 8,
  },
  activitiesContainer: {
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    gap: 6,
  },
  activitiesHeader: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityTime: {
    fontSize: 11,
    fontWeight: '700',
    minWidth: 65,
  },
  activityBullet: {
    fontSize: 12,
  },
  activityText: {
    fontSize: 12,
    flex: 1,
  },
  activityDone: {
    textDecorationLine: 'line-through',
  },
  actCatBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actCatText: {
    fontSize: 10,
    fontWeight: '600',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
