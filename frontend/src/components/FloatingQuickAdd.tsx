import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { getTheme } from '../utils/theme';
import { useAppStore } from '../state/useAppStore';

export const FloatingQuickAdd: React.FC = () => {
  const { themeMode, setCreateTaskModalOpen, setCreateDiaryModalOpen } = useAppStore();
  const currentTheme = getTheme(themeMode);

  return (
    <View style={styles.fabContainer}>
      <TouchableOpacity
        style={[
          styles.diaryFab,
          {
            backgroundColor: currentTheme.colors.surface,
            borderColor: currentTheme.colors.cardBorder,
          },
        ]}
        onPress={() => setCreateDiaryModalOpen(true)}
        activeOpacity={0.8}
        accessibilityLabel="Add Daily Diary Note"
      >
        <Text style={styles.diaryFabIcon}>📔</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.mainFab,
          {
            backgroundColor: currentTheme.colors.primary,
            shadowColor: currentTheme.colors.primary,
          },
        ]}
        onPress={() => setCreateTaskModalOpen(true)}
        activeOpacity={0.8}
        accessibilityLabel="Create New Task"
      >
        <Text style={styles.mainFabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 75,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 999,
  },
  diaryFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  diaryFabIcon: {
    fontSize: 20,
  },
  mainFab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  mainFabText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '300',
    lineHeight: 34,
  },
});
