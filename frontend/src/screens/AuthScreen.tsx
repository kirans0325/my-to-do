import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { getTheme } from '../utils/theme';
import { useAppStore } from '../state/useAppStore';

interface AuthScreenProps {
  onClose?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onClose }) => {
  const { themeMode, login, register, authLoading, authError, setAuthError } = useAppStore();
  const currentTheme = getTheme(themeMode);

  const [isRegister, setIsRegister] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    setAuthError(null);
    if (isRegister) {
      if (!username.trim() || !email.trim() || !password.trim()) {
        setAuthError('Please fill in all required fields.');
        return;
      }
      const success = await register({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        full_name: fullName.trim() || undefined,
      });
      if (success && onClose) onClose();
    } else {
      if (!loginInput.trim() || !password.trim()) {
        setAuthError('Please enter your username/email and password.');
        return;
      }
      const success = await login({
        login: loginInput.trim(),
        password: password.trim(),
      });
      if (success && onClose) onClose();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={[styles.logoBadge, { backgroundColor: currentTheme.colors.primary }]}>
            <Text style={styles.logoText}>✓</Text>
          </View>
          <Text style={[styles.title, { color: currentTheme.colors.text }]}>Task Flow</Text>
          <Text style={[styles.subtitle, { color: currentTheme.colors.textSecondary }]}>
            {isRegister
              ? 'Create a private personal workspace for tasks, habits & notes'
              : 'Sign in to access your synchronized tasks & diary'}
          </Text>
        </View>

        {/* Auth Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: currentTheme.colors.surface,
              borderColor: currentTheme.colors.cardBorder,
            },
          ]}
        >
          {/* Mode Switcher Tabs */}
          <View style={[styles.tabBar, { backgroundColor: currentTheme.colors.surfaceLight }]}>
            <TouchableOpacity
              style={[
                styles.tab,
                !isRegister && [styles.activeTab, { backgroundColor: currentTheme.colors.surface }],
              ]}
              onPress={() => {
                setIsRegister(false);
                setAuthError(null);
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: !isRegister ? currentTheme.colors.primary : currentTheme.colors.textMuted,
                    fontWeight: !isRegister ? '800' : '600',
                  },
                ]}
              >
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                isRegister && [styles.activeTab, { backgroundColor: currentTheme.colors.surface }],
              ]}
              onPress={() => {
                setIsRegister(true);
                setAuthError(null);
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: isRegister ? currentTheme.colors.primary : currentTheme.colors.textMuted,
                    fontWeight: isRegister ? '800' : '600',
                  },
                ]}
              >
                Register
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          {authError && (
            <View style={[styles.errorBox, { backgroundColor: currentTheme.colors.dangerLight, borderColor: currentTheme.colors.danger }]}>
              <Text style={[styles.errorText, { color: currentTheme.colors.danger }]}>
                ⚠️ {authError}
              </Text>
            </View>
          )}

          {/* Form Fields */}
          {isRegister ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
                  Username *
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: currentTheme.colors.surfaceLight, color: currentTheme.colors.text, borderColor: currentTheme.colors.cardBorder }]}
                  placeholder="e.g. kiran, john, alex"
                  placeholderTextColor={currentTheme.colors.textMuted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
                  Email Address *
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: currentTheme.colors.surfaceLight, color: currentTheme.colors.text, borderColor: currentTheme.colors.cardBorder }]}
                  placeholder="e.g. name@example.com"
                  placeholderTextColor={currentTheme.colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
                  Full Name (Optional)
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: currentTheme.colors.surfaceLight, color: currentTheme.colors.text, borderColor: currentTheme.colors.cardBorder }]}
                  placeholder="e.g. Kiran Kumar"
                  placeholderTextColor={currentTheme.colors.textMuted}
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </>
          ) : (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
                Username or Email *
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: currentTheme.colors.surfaceLight, color: currentTheme.colors.text, borderColor: currentTheme.colors.cardBorder }]}
                placeholder="Enter username or email"
                placeholderTextColor={currentTheme.colors.textMuted}
                value={loginInput}
                onChangeText={setLoginInput}
                autoCapitalize="none"
              />
            </View>
          )}

          {/* Password Field */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
                Password *
              </Text>
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={[styles.showPassText, { color: currentTheme.colors.primary }]}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: currentTheme.colors.surfaceLight, color: currentTheme.colors.text, borderColor: currentTheme.colors.cardBorder }]}
              placeholder="Minimum 6 characters"
              placeholderTextColor={currentTheme.colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: currentTheme.colors.primary }]}
            onPress={handleSubmit}
            disabled={authLoading}
            activeOpacity={0.8}
          >
            {authLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>
                {isRegister ? 'Create My Account' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Guest Offline Mode Option */}
        {onClose && (
          <TouchableOpacity style={styles.guestBtn} onPress={onClose}>
            <Text style={[styles.guestBtnText, { color: currentTheme.colors.textMuted }]}>
              ← Continue as Guest / Offline
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    justifyContent: 'center',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 18,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
    marginBottom: 18,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
  },
  errorBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  showPassText: {
    fontSize: 11,
    fontWeight: '700',
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  submitBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  guestBtn: {
    marginTop: 18,
    alignItems: 'center',
  },
  guestBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
