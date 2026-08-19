import React, { useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Modal,
  Platform,
} from 'react-native';
import { getTheme } from './src/utils/theme';
import { useAppStore } from './src/state/useAppStore';
import { Header } from './src/components/Header';
import { Navigation } from './src/components/Navigation';
import { CreateTaskModal } from './src/components/CreateTaskModal';
import { CreateDiaryModal } from './src/components/CreateDiaryModal';
import { AuthScreen } from './src/screens/AuthScreen';

import { DashboardScreen } from './src/screens/DashboardScreen';
import { TasksScreen } from './src/screens/TasksScreen';
import { DiaryScreen } from './src/screens/DiaryScreen';
import { AlertsScreen } from './src/screens/AlertsScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';

export default function App() {
  const {
    activeTab,
    isLoading,
    themeMode,
    fetchAllData,
    initAuth,
    isAuthModalOpen,
    setAuthModalOpen,
  } = useAppStore();

  const currentTheme = getTheme(themeMode);

  useEffect(() => {
    initAuth().then(() => {
      fetchAllData();
    });
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
        {
          backgroundColor: currentTheme.colors.background,
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
        },
      ]}
    >
      <StatusBar
        barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={currentTheme.colors.surface}
        translucent={Platform.OS === 'android'}
      />

      <View
        style={[
          styles.appContainer,
          { backgroundColor: currentTheme.colors.background },
        ]}
      >
        {/* Top Header */}
        <Header />

        {/* Top Syncing Indicator (non-blocking) */}
        {isLoading && (
          <View
            style={[
              styles.syncingBar,
              { backgroundColor: currentTheme.colors.primaryLight },
            ]}
          >
            <ActivityIndicator size="small" color={currentTheme.colors.primary} />
            <Text style={[styles.syncingText, { color: currentTheme.colors.primary }]}>
              Syncing with backend...
            </Text>
          </View>
        )}

        {/* Main Content Area - Always Rendered */}
        <View style={styles.mainContent}>
          {renderActiveScreen()}
        </View>

        {/* Navigation Bar */}
        <Navigation />

        {/* Global Modals */}
        <CreateTaskModal />
        <CreateDiaryModal />

        {/* Auth Modal (Sign In / Register) */}
        {isAuthModalOpen && (
          <Modal
            visible={isAuthModalOpen}
            animationType="slide"
            onRequestClose={() => setAuthModalOpen(false)}
          >
            <AuthScreen onClose={() => setAuthModalOpen(false)} />
          </Modal>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  appContainer: {
    flex: 1,
    height: '100%',
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  mainContent: {
    flex: 1,
    height: '100%',
  },
  syncingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  syncingText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
