import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { getTheme } from '../utils/theme';
import { useAppStore } from '../state/useAppStore';
import { TaskCard } from '../components/TaskCard';

export const TasksScreen: React.FC = () => {
  const {
    tasks,
    categories,
    taskFilter,
    setTaskFilter,
    searchQuery,
    setSearchQuery,
    selectedCategoryFilter,
    setSelectedCategoryFilter,
    setCreateTaskModalOpen,
    themeMode,
  } = useAppStore();

  const currentTheme = getTheme(themeMode);

  const filterTabs = [
    { id: 'ALL', label: 'All Tasks' },
    { id: 'DAILY', label: 'Daily Routine' },
    { id: 'MONTHLY', label: 'Monthly Reminders' },
    { id: 'YEARLY', label: 'Yearly Reminders' },
    { id: 'OVERDUE', label: '⚠️ Overdue' },
    { id: 'COMPLETED', label: '✓ Done' },
  ] as const;

  // Filter tasks based on active filters and search
  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === 'DAILY' && t.recurrence_type !== 'DAILY' && t.recurrence_type !== 'WEEKLY') {
      return false;
    }
    if (taskFilter === 'MONTHLY' && t.recurrence_type !== 'MONTHLY') {
      return false;
    }
    if (taskFilter === 'YEARLY' && t.recurrence_type !== 'YEARLY') {
      return false;
    }
    if (taskFilter === 'OVERDUE' && t.status !== 'OVERDUE') {
      return false;
    }
    if (taskFilter === 'COMPLETED' && t.status !== 'COMPLETED') {
      return false;
    }

    if (selectedCategoryFilter !== null && t.category_id !== selectedCategoryFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description ? t.description.toLowerCase().includes(q) : false;
      if (!matchTitle && !matchDesc) return false;
    }

    return true;
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: currentTheme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Search Input Bar */}
      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: currentTheme.colors.surface,
            borderColor: currentTheme.colors.cardBorder,
          },
        ]}
      >
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: currentTheme.colors.text }]}
          placeholder="Search tasks, reminders, categories..."
          placeholderTextColor={currentTheme.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={[styles.clearSearch, { color: currentTheme.colors.textMuted }]}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Recurrence & Status Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContainer}
      >
        {filterTabs.map((tab) => {
          const isActive = taskFilter === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.filterTab,
                {
                  backgroundColor: isActive
                    ? currentTheme.colors.primary
                    : currentTheme.colors.surface,
                  borderColor: isActive
                    ? currentTheme.colors.primary
                    : currentTheme.colors.cardBorder,
                },
              ]}
              onPress={() => setTaskFilter(tab.id)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  {
                    color: isActive
                      ? '#FFFFFF'
                      : currentTheme.colors.textSecondary,
                    fontWeight: isActive ? '800' : '600',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Category Pills */}
      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContainer}
        >
          <TouchableOpacity
            style={[
              styles.catPill,
              {
                backgroundColor:
                  selectedCategoryFilter === null
                    ? currentTheme.colors.primaryLight
                    : currentTheme.colors.surface,
                borderColor:
                  selectedCategoryFilter === null
                    ? currentTheme.colors.primary
                    : currentTheme.colors.cardBorder,
              },
            ]}
            onPress={() => setSelectedCategoryFilter(null)}
          >
            <Text
              style={[
                styles.catPillText,
                {
                  color:
                    selectedCategoryFilter === null
                      ? currentTheme.colors.primary
                      : currentTheme.colors.textMuted,
                  fontWeight: selectedCategoryFilter === null ? '700' : '500',
                },
              ]}
            >
              All Categories
            </Text>
          </TouchableOpacity>

          {categories.map((cat) => {
            const isSelected = selectedCategoryFilter === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.catPill,
                  {
                    backgroundColor: isSelected
                      ? `${cat.color}25`
                      : currentTheme.colors.surface,
                    borderColor: isSelected
                      ? cat.color
                      : currentTheme.colors.cardBorder,
                  },
                ]}
                onPress={() =>
                  setSelectedCategoryFilter(isSelected ? null : cat.id)
                }
              >
                <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                <Text
                  style={[
                    styles.catPillText,
                    {
                      color: isSelected
                        ? cat.color
                        : currentTheme.colors.textSecondary,
                      fontWeight: isSelected ? '800' : '500',
                    },
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Task Count Header */}
      <View style={styles.countRow}>
        <Text style={[styles.countText, { color: currentTheme.colors.textSecondary }]}>
          Showing {filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'}
        </Text>
        <TouchableOpacity onPress={() => setCreateTaskModalOpen(true)}>
          <Text style={[styles.addTaskText, { color: currentTheme.colors.primary }]}>
            + Add Task
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tasks List */}
      {filteredTasks.length > 0 ? (
        filteredTasks.map((task) => <TaskCard key={task.id} task={task} />)
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
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={[styles.emptyTitle, { color: currentTheme.colors.text }]}>
            No matching tasks found
          </Text>
          <Text style={[styles.emptySubtitle, { color: currentTheme.colors.textSecondary }]}>
            {searchQuery || selectedCategoryFilter !== null
              ? 'Try adjusting your search query or filters.'
              : 'Add your first task or reminder using the button below!'}
          </Text>
          <TouchableOpacity
            style={[styles.emptyAddBtn, { backgroundColor: currentTheme.colors.primary }]}
            onPress={() => setCreateTaskModalOpen(true)}
          >
            <Text style={styles.emptyAddBtnText}>+ Create Task</Text>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    gap: 8,
  },
  searchIcon: {
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  clearSearch: {
    fontSize: 14,
    padding: 4,
  },
  tabsScroll: {
    marginBottom: 10,
  },
  tabsContainer: {
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 12,
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryContainer: {
    gap: 6,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    gap: 6,
  },
  catDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  catPillText: {
    fontSize: 11,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addTaskText: {
    fontSize: 12,
    fontWeight: '800',
  },
  emptyState: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 14,
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
  emptyAddBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
