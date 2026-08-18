import React, { useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { getTheme } from './src/utils/theme';
import { useAppStore } from './src/state/useAppStore';
import { Header } from './src/components/Header';
import { Navigation } from './src/components/Navigation';
import { CreateTaskModal } from './src/components/CreateTaskModal';
import { CreateDiaryModal } from './src/components/CreateDiaryModal';

import { DashboardScreen } from './src/screens/DashboardScreen';
import { TasksScreen } from './src/screens/TasksScreen';
import { DiaryScreen } from './src/screens/DiaryScreen';
import { AlertsScreen } from './src/screens/AlertsScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';

export default function App() {
  const { activeTab, isLoading, error, themeMode, fetchAllData } = useAppStore();
  const currentTheme = getTheme(themeMode);

  useEffect(() => {
    fetchAllData();
    // Auto refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchAllData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'tasks':
        return <TasksScreen />;
      case 'diary':
        return <DiaryScreen />;
      case 'alerts':
        return <AlertsScreen />;
      case 'analytics':
        return <AnalyticsScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: currentTheme.colors.background },
      ]}
    >
      <StatusBar
        barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={currentTheme.colors.surface}
      />

      <View
        style={[
          styles.appContainer,
          { backgroundColor: currentTheme.colors.background },
        ]}
      >
        {/* Top Header */}
        <Header />

        {/* Error Warning Banner if backend not reachable */}
        {error && (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: currentTheme.colors.dangerLight,
                borderBottomColor: `${currentTheme.colors.danger}44`,
              },
            ]}
          >
            <Text
              style={[
                styles.errorText,
                { color: currentTheme.colors.danger },
              ]}
            >
              ⚠️ Backend connection notice: Make sure your FastAPI backend is running on port 8000. ({error})
            </Text>
          </View>
        )}

        {/* Main Content Area */}
        <View style={styles.mainContent}>
          {isLoading && !error ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={currentTheme.colors.primary} />
              <Text
                style={[
                  styles.loadingText,
                  { color: currentTheme.colors.textSecondary },
                ]}
              >
                Syncing TaskFlow Pro...
              </Text>
            </View>
          ) : (
            renderActiveScreen()
          )}
        </View>

        {/* Navigation Bar */}
        <Navigation />

        {/* Global Modals */}
        <CreateTaskModal />
        <CreateDiaryModal />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  appContainer: {
    flex: 1,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  mainContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorBanner: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  errorText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
});
