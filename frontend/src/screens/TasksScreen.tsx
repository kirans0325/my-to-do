import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { getTheme } from '../utils/theme';
import { useAppStore } from '../state/useAppStore';
import { TaskCard } from '../components/TaskCard';
import { FloatingQuickAdd } from '../components/FloatingQuickAdd';
import { Task, PriorityLevel } from '../types';

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
    selectedPriorityFilter,
    setSelectedPriorityFilter,
    setCreateTaskModalOpen,
    themeMode,
  } = useAppStore();

  const currentTheme = getTheme(themeMode);

  const filterTabs = [
    { id: 'ALL', label: 'All Tasks' },
    { id: 'DAILY', label: 'Daily Habits' },
    { id: 'MONTHLY', label: 'Monthly' },
    { id: 'YEARLY', label: 'Yearly' },
    { id: 'OVERDUE', label: '⚠️ Overdue' },
    { id: 'COMPLETED', label: '✓ Done' },
  ] as const;

  const priorityOptions: Array<{ id: PriorityLevel | 'ALL'; label: string; color: string; icon: string }> = [
    { id: 'ALL', label: 'All Priorities', color: currentTheme.colors.textMuted, icon: '🏳️' },
    { id: 'HIGH', label: 'High Priority', color: currentTheme.colors.priority.HIGH, icon: '🔴' },
    { id: 'MEDIUM', label: 'Medium Priority', color: currentTheme.colors.priority.MEDIUM, icon: '🟡' },
    { id: 'LOW', label: 'Low Priority', color: currentTheme.colors.priority.LOW, icon: '🔵' },
  ];

  // Comprehensive Search & Filter Engine (Matches Title, Description, Priority, Category, Recurrence, Subtasks)
  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return tasks.filter((t) => {
      // 1. Recurrence / Status Tab filter
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

      // 2. Category filter
      if (selectedCategoryFilter !== null && t.category_id !== selectedCategoryFilter) {
        return false;
      }

      // 3. Dedicated Priority filter chip
      if (selectedPriorityFilter !== null && selectedPriorityFilter !== 'ALL') {
        if (selectedPriorityFilter === 'HIGH') {
          if (t.priority !== 'HIGH' && t.priority !== 'URGENT') return false;
        } else if (t.priority !== selectedPriorityFilter) {
          return false;
        }
      }

      // 4. Keyword search matching (Title, Description, Priority, Category, Recurrence, Subtasks)
      if (q) {
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = t.description ? t.description.toLowerCase().includes(q) : false;
        const matchCategory = t.category ? t.category.name.toLowerCase().includes(q) : false;
        const matchPriority = t.priority.toLowerCase().includes(q) ||
          (q === 'p1' && (t.priority === 'HIGH' || t.priority === 'URGENT')) ||
          (q === 'p2' && t.priority === 'MEDIUM') ||
          (q === 'p3' && t.priority === 'LOW');
        const matchRecurrence = t.recurrence_type.toLowerCase().includes(q);
        const matchSubtasks = t.subtasks
          ? t.subtasks.some((st) => st.title.toLowerCase().includes(q))
          : false;

        if (!matchTitle && !matchDesc && !matchCategory && !matchPriority && !matchRecurrence && !matchSubtasks) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, taskFilter, selectedCategoryFilter, selectedPriorityFilter, searchQuery]);

  const renderTaskItem = useCallback(
    ({ item }: { item: Task }) => <TaskCard task={item} />,
    []
  );

  const keyExtractor = useCallback((item: Task) => `task-${item.id}`, []);

  const hasActiveFilter =
    Boolean(searchQuery) ||
    selectedCategoryFilter !== null ||
    (selectedPriorityFilter !== null && selectedPriorityFilter !== 'ALL') ||
    taskFilter !== 'ALL';

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategoryFilter(null);
    setSelectedPriorityFilter(null);
    setTaskFilter('ALL');
  };

  const ListHeader = (
    <View>
      {/* Search Input Bar with Priority Keyword Support */}
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
          placeholder="Search by title, priority (high/medium/low), category, tag..."
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

      {/* Priority Filter Chips Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.priorityScroll}
        contentContainerStyle={styles.priorityContainer}
      >
        {priorityOptions.map((p) => {
          const isSelected =
            p.id === 'ALL'
              ? selectedPriorityFilter === null || selectedPriorityFilter === 'ALL'
              : selectedPriorityFilter === p.id;
          
          const count = tasks.filter((t) => {
            if (p.id === 'ALL') return true;
            if (p.id === 'HIGH') return t.priority === 'HIGH' || t.priority === 'URGENT';
            return t.priority === p.id;
          }).length;

          return (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.priorityChip,
                {
                  backgroundColor: isSelected
                    ? `${p.color}25`
                    : currentTheme.colors.surface,
                  borderColor: isSelected
                    ? p.color
                    : currentTheme.colors.cardBorder,
                },
              ]}
              onPress={() => setSelectedPriorityFilter(p.id === 'ALL' ? null : p.id)}
            >
              <Text style={styles.priorityIcon}>{p.icon}</Text>
              <Text
                style={[
                  styles.priorityChipText,
                  {
                    color: isSelected ? currentTheme.colors.text : currentTheme.colors.textSecondary,
                    fontWeight: isSelected ? '800' : '600',
                  },
                ]}
              >
                {p.label}
              </Text>
              <View
                style={[
                  styles.countPill,
                  {
                    backgroundColor: isSelected ? p.color : currentTheme.colors.surfaceLight,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.countPillText,
                    {
                      color: isSelected ? '#FFFFFF' : currentTheme.colors.textMuted,
                    },
                  ]}
                >
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Category Filter Pills */}
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

      {/* Filter Summary & Task Count Header */}
      <View style={styles.countRow}>
        <View style={styles.countInfoRow}>
          <Text style={[styles.countText, { color: currentTheme.colors.textSecondary }]}>
            Showing <Text style={{ color: currentTheme.colors.text, fontWeight: '800' }}>{filteredTasks.length}</Text> task{filteredTasks.length === 1 ? '' : 's'}
          </Text>
          {hasActiveFilter && (
            <TouchableOpacity onPress={clearAllFilters} style={styles.resetBtn}>
              <Text style={[styles.resetBtnText, { color: currentTheme.colors.primary }]}>
                (Reset filters)
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={() => setCreateTaskModalOpen(true)}>
          <Text style={[styles.addTaskText, { color: currentTheme.colors.primary }]}>
            + Add Task
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const ListEmptyComponent = (
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
        {hasActiveFilter
          ? 'Try clearing your search query, priority, or category filters.'
          : 'Tap the + button below to create your first task!'}
      </Text>
      {hasActiveFilter && (
        <TouchableOpacity
          style={[styles.emptyResetBtn, { backgroundColor: currentTheme.colors.surfaceLight }]}
          onPress={clearAllFilters}
        >
          <Text style={[styles.emptyResetBtnText, { color: currentTheme.colors.textSecondary }]}>
            Clear All Filters
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={filteredTasks}
        keyExtractor={keyExtractor}
        renderItem={renderTaskItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmptyComponent}
        style={[styles.container, { backgroundColor: currentTheme.colors.background }]}
        contentContainerStyle={styles.contentContainer}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        showsVerticalScrollIndicator={false}
      />
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 8,
    borderWidth: 1,
    gap: 8,
  },
  searchIcon: {
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  clearSearch: {
    fontSize: 14,
    padding: 4,
  },
  tabsScroll: {
    marginBottom: 8,
  },
  tabsContainer: {
    gap: 6,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 12,
  },
  priorityScroll: {
    marginBottom: 8,
  },
  priorityContainer: {
    gap: 6,
  },
  priorityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  priorityIcon: {
    fontSize: 12,
  },
  priorityChipText: {
    fontSize: 11,
  },
  countPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 9999,
    marginLeft: 2,
  },
  countPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  categoryScroll: {
    marginBottom: 10,
  },
  categoryContainer: {
    gap: 6,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
    gap: 5,
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
    marginBottom: 10,
  },
  countInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countText: {
    fontSize: 12,
    fontWeight: '500',
  },
  resetBtn: {
    paddingVertical: 2,
  },
  resetBtnText: {
    fontSize: 11,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  addTaskText: {
    fontSize: 12,
    fontWeight: '800',
  },
  emptyState: {
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 10,
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
  emptyResetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyResetBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
