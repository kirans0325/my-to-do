import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { getTheme } from '../utils/theme';
import { useAppStore } from '../state/useAppStore';
import { authApi } from '../api/authApi';
import { FamilyUserSummary, AdminAnalyticsSummary } from '../types';

interface AdminConsoleModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AdminConsoleModal: React.FC<AdminConsoleModalProps> = ({ visible, onClose }) => {
  const { themeMode, currentUser } = useAppStore();
  const currentTheme = getTheme(themeMode);

  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<AdminAnalyticsSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Password Reset State
  const [selectedUserForReset, setSelectedUserForReset] = useState<FamilyUserSummary | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<{ isError: boolean; message: string } | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const data = await authApi.getAdminAnalytics();
      setAnalytics(data);
    } catch (err: any) {
      console.warn('Failed to load admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchAnalytics();
      setSelectedUserForReset(null);
      setNewPassword('');
      setResetFeedback(null);
    }
  }, [visible]);

  const handleOpenReset = (user: FamilyUserSummary) => {
    setSelectedUserForReset(user);
    setNewPassword('Welcome@123'); // Helpful friendly default
    setResetFeedback(null);
  };

  const handleConfirmReset = async () => {
    if (!selectedUserForReset) return;
    if (!newPassword.trim() || newPassword.length < 6) {
      setResetFeedback({
        isError: true,
        message: 'Password must be at least 6 characters.',
      });
      return;
    }

    setIsResetting(true);
    setResetFeedback(null);
    try {
      const res = await authApi.resetUserPassword(selectedUserForReset.id, newPassword.trim());
      setResetFeedback({
        isError: false,
        message: res.message || `Password reset successfully for ${selectedUserForReset.username}!`,
      });
      setTimeout(() => {
        setSelectedUserForReset(null);
        setNewPassword('');
        setResetFeedback(null);
        fetchAnalytics();
      }, 2000);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to reset password.';
      setResetFeedback({ isError: true, message: msg });
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteUser = async (user: FamilyUserSummary) => {
    if (user.id === currentUser?.id) {
      alert('You cannot delete your own active Admin account.');
      return;
    }

    let confirmed = true;
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.confirm === 'function') {
      confirmed = window.confirm(`Are you sure you want to delete user '${user.username}' (${user.email})?`);
    }

    if (!confirmed) return;

    try {
      await authApi.deleteUser(user.id);
      fetchAnalytics();
    } catch (err: any) {
      console.warn('Delete user error:', err);
    }
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Never logged in';
    try {
      const date = new Date(isoString);
      const diffSecs = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diffSecs < 60) return 'Just now';
      if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
      if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
      return `${Math.floor(diffSecs / 86400)}d ago`;
    } catch (e) {
      return isoString;
    }
  };

  const filteredUsers = (analytics?.users || []).filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.full_name && u.full_name.toLowerCase().includes(q))
    );
  });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: currentTheme.colors.surface,
              borderColor: currentTheme.colors.cardBorder,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: currentTheme.colors.cardBorder }]}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerIcon}>👑</Text>
              <View>
                <Text style={[styles.headerTitle, { color: currentTheme.colors.text }]}>
                  Admin Console & User Management
                </Text>
                <Text style={[styles.headerSubtitle, { color: currentTheme.colors.textMuted }]}>
                  Manage family accounts, track logins trend & reset passwords
                </Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.refreshBtn, { backgroundColor: currentTheme.colors.surfaceLight }]}
                onPress={fetchAnalytics}
                disabled={loading}
              >
                <Text style={{ fontSize: 14 }}>🔄</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={[styles.closeBtnText, { color: currentTheme.colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Scroll Content */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* KPI Summary Cards */}
            <View style={styles.kpiGrid}>
              <View style={[styles.kpiCard, { backgroundColor: currentTheme.colors.surfaceLight, borderColor: currentTheme.colors.cardBorder }]}>
                <Text style={styles.kpiEmoji}>👥</Text>
                <Text style={[styles.kpiVal, { color: currentTheme.colors.text }]}>
                  {analytics?.total_users || 0}
                </Text>
                <Text style={[styles.kpiLabel, { color: currentTheme.colors.textSecondary }]}>
                  Registered Members
                </Text>
              </View>

              <View style={[styles.kpiCard, { backgroundColor: currentTheme.colors.surfaceLight, borderColor: currentTheme.colors.cardBorder }]}>
                <Text style={styles.kpiEmoji}>🔐</Text>
                <Text style={[styles.kpiVal, { color: currentTheme.colors.primary }]}>
                  {analytics?.total_app_logins || 0}
                </Text>
                <Text style={[styles.kpiLabel, { color: currentTheme.colors.textSecondary }]}>
                  App Logins Trend
                </Text>
              </View>

              <View style={[styles.kpiCard, { backgroundColor: currentTheme.colors.surfaceLight, borderColor: currentTheme.colors.cardBorder }]}>
                <Text style={styles.kpiEmoji}>🟢</Text>
                <Text style={[styles.kpiVal, { color: currentTheme.colors.success }]}>
                  {analytics?.active_recently_count || 0}
                </Text>
                <Text style={[styles.kpiLabel, { color: currentTheme.colors.textSecondary }]}>
                  Active (Last 48h)
                </Text>
              </View>

              <View style={[styles.kpiCard, { backgroundColor: currentTheme.colors.surfaceLight, borderColor: currentTheme.colors.cardBorder }]}>
                <Text style={styles.kpiEmoji}>📋</Text>
                <Text style={[styles.kpiVal, { color: currentTheme.colors.warning }]}>
                  {analytics?.total_tasks_created || 0}
                </Text>
                <Text style={[styles.kpiLabel, { color: currentTheme.colors.textSecondary }]}>
                  Total Tasks Created
                </Text>
              </View>
            </View>

            {/* Password Reset Modal Overlay (Inside Console) */}
            {selectedUserForReset && (
              <View
                style={[
                  styles.resetCard,
                  {
                    backgroundColor: currentTheme.colors.surfaceLight,
                    borderColor: currentTheme.colors.primary,
                  },
                ]}
              >
                <View style={styles.resetHeader}>
                  <Text style={styles.resetTitle}>
                    🔑 Reset Password for <Text style={{ fontWeight: '800' }}>{selectedUserForReset.username}</Text> ({selectedUserForReset.email})
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedUserForReset(null)}>
                    <Text style={[styles.closeReset, { color: currentTheme.colors.textMuted }]}>✕</Text>
                  </TouchableOpacity>
                </View>

                {resetFeedback && (
                  <View
                    style={[
                      styles.feedbackBox,
                      {
                        backgroundColor: resetFeedback.isError ? currentTheme.colors.dangerLight : currentTheme.colors.successLight,
                        borderColor: resetFeedback.isError ? currentTheme.colors.danger : currentTheme.colors.success,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: resetFeedback.isError ? currentTheme.colors.danger : currentTheme.colors.success,
                        fontSize: 12,
                        fontWeight: '700',
                      }}
                    >
                      {resetFeedback.message}
                    </Text>
                  </View>
                )}

                <Text style={[styles.resetLabel, { color: currentTheme.colors.textSecondary }]}>
                  Set New Password (Minimum 6 characters):
                </Text>
                <View style={styles.resetInputRow}>
                  <TextInput
                    style={[
                      styles.resetInput,
                      {
                        backgroundColor: currentTheme.colors.surface,
                        color: currentTheme.colors.text,
                        borderColor: currentTheme.colors.cardBorder,
                      },
                    ]}
                    placeholder="Enter new password"
                    placeholderTextColor={currentTheme.colors.textMuted}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={[styles.confirmResetBtn, { backgroundColor: currentTheme.colors.primary }]}
                    onPress={handleConfirmReset}
                    disabled={isResetting}
                  >
                    {isResetting ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <Text style={styles.confirmResetText}>✓ Save New Password</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Search Directory Bar */}
            <View style={styles.directoryHeader}>
              <Text style={[styles.directoryTitle, { color: currentTheme.colors.text }]}>
                User Directory ({filteredUsers.length})
              </Text>
              <TextInput
                style={[
                  styles.searchInput,
                  {
                    backgroundColor: currentTheme.colors.surfaceLight,
                    color: currentTheme.colors.text,
                    borderColor: currentTheme.colors.cardBorder,
                  },
                ]}
                placeholder="🔍 Search by name or email..."
                placeholderTextColor={currentTheme.colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Users Cards */}
            {loading && !analytics ? (
              <ActivityIndicator size="large" color={currentTheme.colors.primary} style={{ marginTop: 24 }} />
            ) : filteredUsers.length === 0 ? (
              <View style={[styles.emptyBox, { borderColor: currentTheme.colors.cardBorder }]}>
                <Text style={[styles.emptyText, { color: currentTheme.colors.textMuted }]}>
                  No user accounts found matching '{searchQuery}'
                </Text>
              </View>
            ) : (
              filteredUsers.map((user) => {
                const isAdmin = user.role === 'ADMIN';
                const isSelf = user.id === currentUser?.id;
                return (
                  <View
                    key={user.id}
                    style={[
                      styles.userCard,
                      {
                        backgroundColor: currentTheme.colors.surfaceLight,
                        borderColor: isAdmin ? `${currentTheme.colors.warning}66` : currentTheme.colors.cardBorder,
                      },
                    ]}
                  >
                    {/* User Info Row */}
                    <View style={styles.userInfoRow}>
                      <View style={styles.userMainInfo}>
                        <View style={styles.avatarPill}>
                          <Text style={{ fontSize: 18 }}>{isAdmin ? '👑' : '👤'}</Text>
                        </View>
                        <View>
                          <View style={styles.nameBadgeRow}>
                            <Text style={[styles.cardUsername, { color: currentTheme.colors.text }]}>
                              {user.username}
                            </Text>
                            {user.full_name ? (
                              <Text style={[styles.cardFullName, { color: currentTheme.colors.textSecondary }]}>
                                ({user.full_name})
                              </Text>
                            ) : null}
                            <View
                              style={[
                                styles.roleBadge,
                                {
                                  backgroundColor: isAdmin ? currentTheme.colors.warningLight : currentTheme.colors.primaryLight,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.roleBadgeText,
                                  { color: isAdmin ? currentTheme.colors.warning : currentTheme.colors.primary },
                                ]}
                              >
                                {isAdmin ? 'ADMIN' : 'USER'}
                              </Text>
                            </View>
                            {isSelf && (
                              <View style={[styles.selfBadge, { backgroundColor: currentTheme.colors.successLight }]}>
                                <Text style={[styles.selfBadgeText, { color: currentTheme.colors.success }]}>
                                  YOU
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.cardEmail, { color: currentTheme.colors.textMuted }]}>
                            ✉️ {user.email}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Stats & Login Trend Line */}
                    <View style={styles.userStatsRow}>
                      <View style={styles.statPill}>
                        <Text style={[styles.statPillText, { color: currentTheme.colors.textSecondary }]}>
                          🔐 <Text style={{ fontWeight: '800' }}>{user.login_count || 0}</Text> Logins
                        </Text>
                      </View>
                      <View style={styles.statPill}>
                        <Text style={[styles.statPillText, { color: currentTheme.colors.textSecondary }]}>
                          ⏱️ Active: <Text style={{ fontWeight: '700' }}>{formatRelativeTime(user.last_login_at)}</Text>
                        </Text>
                      </View>
                      <View style={styles.statPill}>
                        <Text style={[styles.statPillText, { color: currentTheme.colors.textSecondary }]}>
                          📋 <Text style={{ fontWeight: '800' }}>{user.total_tasks}</Text> Tasks
                        </Text>
                      </View>
                      <View style={styles.statPill}>
                        <Text style={[styles.statPillText, { color: currentTheme.colors.textSecondary }]}>
                          📔 <Text style={{ fontWeight: '800' }}>{user.total_diary_entries}</Text> Diary Logs
                        </Text>
                      </View>
                    </View>

                    {/* Admin Action Buttons */}
                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity
                        style={[styles.resetBtn, { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.cardBorder }]}
                        onPress={() => handleOpenReset(user)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.resetBtnText, { color: currentTheme.colors.primary }]}>
                          🔑 Reset Password
                        </Text>
                      </TouchableOpacity>

                      {!isSelf && (
                        <TouchableOpacity
                          style={[styles.deleteBtn, { backgroundColor: currentTheme.colors.dangerLight }]}
                          onPress={() => handleDeleteUser(user)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.deleteBtnText, { color: currentTheme.colors.danger }]}>
                            🗑️ Delete
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 720,
    maxHeight: '92%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshBtn: {
    padding: 6,
    borderRadius: 8,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollArea: {
    maxHeight: 600,
  },
  scrollContent: {
    padding: 20,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    minWidth: 130,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  kpiEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  kpiVal: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  resetCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  resetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resetTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  closeReset: {
    fontSize: 14,
    fontWeight: 'bold',
    padding: 4,
  },
  feedbackBox: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  resetLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  resetInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  resetInput: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    borderWidth: 1,
  },
  confirmResetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmResetText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  directoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  directoryTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  searchInput: {
    flex: 1,
    minWidth: 200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 12,
    borderWidth: 1,
  },
  emptyBox: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 13,
  },
  userCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  userMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarPill: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  cardUsername: {
    fontSize: 14,
    fontWeight: '800',
  },
  cardFullName: {
    fontSize: 12,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  selfBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  selfBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  cardEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  userStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  statPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  statPillText: {
    fontSize: 11,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 8,
  },
  resetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  resetBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deleteBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
