import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getTheme } from '../utils/theme';
import { useAppStore } from '../state/useAppStore';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badgeText?: string;
  badgeColor?: string;
  progressPercent?: number;
  accentColor?: string;
  icon?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  badgeText,
  badgeColor,
  progressPercent,
  accentColor,
  icon,
}) => {
  const { themeMode } = useAppStore();
  const currentTheme = getTheme(themeMode);

  const finalAccent = accentColor || currentTheme.colors.primary;
  const finalBadgeColor = badgeColor || finalAccent;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: currentTheme.colors.surface,
          borderColor: currentTheme.colors.cardBorder,
          borderLeftColor: finalAccent,
          borderLeftWidth: 4,
        },
      ]}
    >
      <View style={styles.topRow}>
        <Text style={[styles.title, { color: currentTheme.colors.textMuted }]}>{title}</Text>
        {icon && <Text style={styles.icon}>{icon}</Text>}
      </View>

      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: currentTheme.colors.text }]}>{value}</Text>
        {badgeText && (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: `${finalBadgeColor}18`,
                borderColor: `${finalBadgeColor}44`,
                borderWidth: 1,
              },
            ]}
          >
            <Text style={[styles.badgeText, { color: finalBadgeColor }]}>{badgeText}</Text>
          </View>
        )}
      </View>

      {progressPercent !== undefined && (
        <View
          style={[
            styles.progressContainer,
            { backgroundColor: currentTheme.colors.surfaceLight },
          ]}
        >
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(100, Math.max(0, progressPercent))}%`,
                backgroundColor: finalAccent,
              },
            ]}
          />
        </View>
      )}

      {subtitle ? (
        <Text style={[styles.subtitle, { color: currentTheme.colors.textSecondary }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    flex: 1,
    minWidth: 140,
    borderWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  icon: {
    fontSize: 16,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginVertical: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressContainer: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
});
