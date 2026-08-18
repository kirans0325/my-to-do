import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { getTheme } from '../utils/theme';
import { useAppStore } from '../state/useAppStore';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, reminders, themeMode } = useAppStore();
  const currentTheme = getTheme(themeMode);

  const unackAlerts = reminders.filter((r) => !r.is_acknowledged).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '⚡' },
    { id: 'tasks', label: 'Tasks & Reminders', icon: '📋' },
    { id: 'diary', label: 'Daily Diary', icon: '📔' },
    { id: 'alerts', label: 'Alert Center', icon: '🔔', badge: unackAlerts },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
  ] as const;

  return (
    <View
      style={[
        styles.navBar,
        {
          backgroundColor: currentTheme.colors.surface,
          borderTopColor: currentTheme.colors.cardBorder,
        },
      ]}
    >
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.navItem,
              isActive && {
                backgroundColor: currentTheme.colors.primaryLight,
              },
            ]}
            onPress={() => setActiveTab(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{item.icon}</Text>
              {'badge' in item && item.badge ? item.badge > 0 ? (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: currentTheme.colors.danger },
                  ]}
                >
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              ) : null : null}
            </View>
            <Text
              style={[
                styles.label,
                {
                  color: isActive
                    ? currentTheme.colors.primary
                    : currentTheme.colors.textMuted,
                  fontWeight: isActive ? '700' : '600',
                },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  iconContainer: {
    position: 'relative',
  },
  icon: {
    fontSize: 18,
    marginBottom: 2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 11,
  },
});
