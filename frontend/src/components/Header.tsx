import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { getTheme } from '../utils/theme';
import { useAppStore } from '../state/useAppStore';
import { AdminConsoleModal } from '../screens/AdminConsoleModal';

export const Header: React.FC = () => {
  const {
    stats,
    reminders,
    themeMode,
    toggleTheme,
    setActiveTab,
    setCreateTaskModalOpen,
    currentUser,
    logout,
    setAuthModalOpen,
  } = useAppStore();

  const currentTheme = getTheme(themeMode);
  const unackCount = reminders.length;
  const streak = stats?.current_streak_days || 1;
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAdminConsole, setShowAdminConsole] = useState(false);

  // Format today's date TickTick-style
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: currentTheme.colors.surface,
          borderBottomColor: currentTheme.colors.cardBorder,
        },
      ]}
    >
      {/* Brand & Date */}
      <View style={styles.brandRow}>
        <View
          style={[
            styles.logoBadge,
            {
              backgroundColor: currentTheme.colors.primary,
            },
          ]}
        >
          <Text style={styles.logoText}>✓</Text>
        </View>
        <View>
          <Text style={[styles.title, { color: currentTheme.colors.text }]}>Task Flow</Text>
          <Text style={[styles.subtitle, { color: currentTheme.colors.textMuted }]}>
            {dateFormatted} • ☁️ Neon DB
          </Text>
        </View>
      </View>

      {/* Quick Action Badges */}
      <View style={styles.actionsRow}>
        {/* Admin Console Direct Button (If Admin) */}
        {currentUser?.role === 'ADMIN' && (
          <TouchableOpacity
            style={[
              styles.adminPill,
              {
                backgroundColor: currentTheme.colors.warningLight,
                borderColor: currentTheme.colors.warning,
              },
            ]}
            onPress={() => setShowAdminConsole(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.adminPillEmoji}>👑</Text>
            <Text style={[styles.adminPillText, { color: currentTheme.colors.warning }]}>
              Admin Console
            </Text>
          </TouchableOpacity>
        )}

        {/* User Profile / Sign In Pill */}
        {currentUser ? (
          <TouchableOpacity
            style={[
              styles.userPill,
              {
                backgroundColor: currentTheme.colors.surfaceLight,
                borderColor: currentUser.role === 'ADMIN' ? `${currentTheme.colors.warning}66` : currentTheme.colors.cardBorder,
              },
            ]}
            onPress={() => setShowUserMenu(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.userAvatar}>
              {currentUser.role === 'ADMIN' ? '👑' : '👤'}
            </Text>
            <Text style={[styles.userName, { color: currentTheme.colors.text }]}>
              {currentUser.username}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.signInPill,
              {
                backgroundColor: currentTheme.colors.primaryLight,
                borderColor: currentTheme.colors.primary,
              },
            ]}
            onPress={() => setAuthModalOpen(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.signInText, { color: currentTheme.colors.primary }]}>
              👤 Sign In
            </Text>
          </TouchableOpacity>
        )}

        {/* Streak Pill */}
        <View
          style={[
            styles.streakBadge,
            {
              backgroundColor: currentTheme.colors.warningLight,
              borderColor: `${currentTheme.colors.warning}44`,
            },
          ]}
        >
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={[styles.streakText, { color: currentTheme.colors.warning }]}>
            {streak}d
          </Text>
        </View>

        {/* Theme Switcher Toggle (☀️ / 🌙) */}
        <TouchableOpacity
          style={[
            styles.iconBtn,
            {
              backgroundColor: currentTheme.colors.surfaceLight,
              borderColor: currentTheme.colors.cardBorder,
            },
          ]}
          onPress={toggleTheme}
          activeOpacity={0.7}
          accessibilityLabel="Toggle Light/Dark Theme"
        >
          <Text style={styles.btnIcon}>
            {themeMode === 'dark' ? '☀️' : '🌙'}
          </Text>
        </TouchableOpacity>

        {/* Alert Bell */}
        <TouchableOpacity
          style={[
            styles.iconBtn,
            { backgroundColor: currentTheme.colors.surfaceLight, borderColor: currentTheme.colors.cardBorder },
            unackCount > 0 && {
              backgroundColor: currentTheme.colors.dangerLight,
              borderColor: currentTheme.colors.danger,
            },
          ]}
          onPress={() => setActiveTab('alerts')}
          activeOpacity={0.7}
        >
          <Text style={styles.btnIcon}>🔔</Text>
          {unackCount > 0 && (
            <View style={[styles.badge, { backgroundColor: currentTheme.colors.danger }]}>
              <Text style={styles.badgeText}>{unackCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Add Task Button */}
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: currentTheme.colors.primary }]}
          onPress={() => setCreateTaskModalOpen(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.createButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* User Dropdown / Logout Modal */}
      {showUserMenu && currentUser && (
        <Modal transparent animationType="fade" visible={showUserMenu} onRequestClose={() => setShowUserMenu(false)}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowUserMenu(false)}>
            <View
              style={[
                styles.userMenuCard,
                {
                  backgroundColor: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.cardBorder,
                },
              ]}
            >
              <View style={styles.menuHeader}>
                <Text style={styles.menuAvatar}>{currentUser.role === 'ADMIN' ? '👑' : '👤'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuName, { color: currentTheme.colors.text }]}>
                    {currentUser.full_name || currentUser.username}
                  </Text>
                  <Text style={[styles.menuEmail, { color: currentTheme.colors.textMuted }]}>
                    {currentUser.email}
                  </Text>
                  {currentUser.role === 'ADMIN' && (
                    <View style={[styles.adminBadgePill, { backgroundColor: currentTheme.colors.warningLight }]}>
                      <Text style={[styles.adminBadgeText, { color: currentTheme.colors.warning }]}>
                        👑 Administrator
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {currentUser.role === 'ADMIN' && (
                <TouchableOpacity
                  style={[styles.adminMenuBtn, { backgroundColor: currentTheme.colors.surfaceLight, borderColor: currentTheme.colors.warning }]}
                  onPress={() => {
                    setShowUserMenu(false);
                    setShowAdminConsole(true);
                  }}
                >
                  <Text style={[styles.adminMenuBtnText, { color: currentTheme.colors.warning }]}>
                    👑 Open Admin Console
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.logoutBtn, { backgroundColor: currentTheme.colors.dangerLight }]}
                onPress={() => {
                  setShowUserMenu(false);
                  logout();
                }}
              >
                <Text style={[styles.logoutBtnText, { color: currentTheme.colors.danger }]}>
                  🚪 Sign Out
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Admin Console Modal */}
      {showAdminConsole && (
        <AdminConsoleModal visible={showAdminConsole} onClose={() => setShowAdminConsole(false)} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexWrap: 'wrap',
    gap: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  adminPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
    gap: 4,
  },
  adminPillEmoji: {
    fontSize: 12,
  },
  adminPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  userPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
    gap: 4,
  },
  userAvatar: {
    fontSize: 12,
  },
  userName: {
    fontSize: 11,
    fontWeight: '700',
  },
  signInPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
  },
  signInText: {
    fontSize: 11,
    fontWeight: '700',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
    gap: 3,
  },
  streakEmoji: {
    fontSize: 12,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '800',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  btnIcon: {
    fontSize: 15,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
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
  createButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  userMenuCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  menuAvatar: {
    fontSize: 28,
  },
  menuName: {
    fontSize: 15,
    fontWeight: '800',
  },
  menuEmail: {
    fontSize: 12,
    marginTop: 1,
  },
  adminBadgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  adminMenuBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 10,
  },
  adminMenuBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  logoutBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
