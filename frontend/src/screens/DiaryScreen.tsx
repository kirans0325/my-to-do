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
import { FloatingQuickAdd } from '../components/FloatingQuickAdd';
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
    <View style={{ flex: 1 }}>
      <ScrollView
        style={[styles.container, { backgroundColor: currentTheme.colors.background }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* TickTick Header Banner */}
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
              📖 Daily Diary & Notes
            </Text>
            <Text style={[styles.bannerSubtitle, { color: currentTheme.colors.textSecondary }]}>
              Track reflections, habit notes, mood ratings, and timeline activities saved to Neon Cloud DB.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.newEntryBtn, { backgroundColor: currentTheme.colors.primary }]}
            onPress={() => {
              setSelectedDiaryDate(todayStr);
              setCreateDiaryModalOpen(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.newEntryBtnText}>+ Today's Note</Text>
          </TouchableOpacity>
        </View>

        {/* Diary Timeline Entries */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.textSecondary }]}>
            Journal Notes ({diaryEntries.length} Recorded Days)
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
              No diary notes yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: currentTheme.colors.textSecondary }]}>
              Write down your thoughts, daily wins, productivity rating, and timeline activities!
            </Text>
            <TouchableOpacity
              style={[styles.newEntryBtn, { backgroundColor: currentTheme.colors.primary }]}
              onPress={() => {
                setSelectedDiaryDate(todayStr);
                setCreateDiaryModalOpen(true);
              }}
            >
              <Text style={styles.newEntryBtnText}>+ Write First Diary Note</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <FloatingQuickAdd />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 90,
  },
  banner: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  bannerInfo: {
    flex: 1,
    minWidth: 200,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 11,
    lineHeight: 16,
  },
  newEntryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newEntryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: 14,
  },
});
