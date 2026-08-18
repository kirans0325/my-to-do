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
import { DiaryCard } from '../components/DiaryCard';
import { getTodayDateString } from '../utils/dateUtils';

export const DiaryScreen: React.FC = () => {
  const {
    diaryEntries,
    selectedDiaryDate,
    setSelectedDiaryDate,
    setCreateDiaryModalOpen,
    themeMode,
  } = useAppStore();

  const currentTheme = getTheme(themeMode);
  const todayStr = getTodayDateString();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: currentTheme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Banner */}
      <View
        style={[
          styles.banner,
          {
            backgroundColor: currentTheme.colors.surface,
            borderColor: currentTheme.colors.cardBorder,
          },
        ]}
      >
        <View style={styles.bannerInfo}>
          <Text style={[styles.bannerTitle, { color: currentTheme.colors.text }]}>
            📖 Daily Diary & Activity Journal
          </Text>
          <Text style={[styles.bannerSubtitle, { color: currentTheme.colors.textSecondary }]}>
            Capture daily reflections, habits, productivity scores, and activity timelines saved directly to your database.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.newEntryBtn, { backgroundColor: currentTheme.colors.primary }]}
          onPress={() => {
            setSelectedDiaryDate(todayStr);
            setCreateDiaryModalOpen(true);
          }}
        >
          <Text style={styles.newEntryBtnText}>+ Today's Log</Text>
        </TouchableOpacity>
      </View>

      {/* Diary Timeline Entries */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: currentTheme.colors.textSecondary }]}>
          Journal History ({diaryEntries.length} Recorded Days)
        </Text>
      </View>

      {diaryEntries.length > 0 ? (
        diaryEntries.map((entry) => <DiaryCard key={entry.id} entry={entry} />)
      ) : (
        <View
          style={[
            styles.emptyState,
            {
              backgroundColor: currentTheme.colors.surface,
              borderColor: currentTheme.colors.cardBorder,
            },
          ]}
        >
          <Text style={styles.emptyIcon}>✍️</Text>
          <Text style={[styles.emptyTitle, { color: currentTheme.colors.text }]}>
            No diary entries yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: currentTheme.colors.textSecondary }]}>
            Start journaling your daily milestones, mood ratings, and timeline activities!
          </Text>
          <TouchableOpacity
            style={[styles.newEntryBtn, { backgroundColor: currentTheme.colors.primary }]}
            onPress={() => {
              setSelectedDiaryDate(todayStr);
              setCreateDiaryModalOpen(true);
            }}
          >
            <Text style={styles.newEntryBtnText}>+ Write First Diary Entry</Text>
          </TouchableOpacity>
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
  banner: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
  },
  bannerInfo: {
    flex: 1,
    minWidth: 240,
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 12,
    lineHeight: 18,
  },
  newEntryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  newEntryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
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
  emptyState: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 16,
  },
});
