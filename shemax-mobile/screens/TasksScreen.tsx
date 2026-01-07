import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { apiGet, apiPost } from '../lib/api/client';
import { useAuth } from '../lib/auth/context';
import { GlassCard } from '../components/GlassCard';
import { BackHeader } from '../components/BackHeader';
import { RoutineTask } from '../lib/types';
import { DarkTheme } from '../lib/theme';

export function TasksScreen() {
  const { session } = useAuth();
  const [tasks, setTasks] = useState<RoutineTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const toggleTaskExpanded = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  useEffect(() => {
    loadTodayTasks();
  }, []);

  const loadTodayTasks = async () => {
    try {
      const data = await apiGet<{ tasks: RoutineTask[] }>(
        '/api/routines/today',
        session?.access_token
      );
      setTasks(data.tasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (taskId: string) => {
    try {
      await apiPost(
        '/api/routines/complete-task',
        { taskId },
        session?.access_token
      );
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
      );
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  const renderItem = ({ item }: { item: RoutineTask }) => {
    const isExpanded = expandedTasks.has(item.id);
    return (
      <GlassCard style={styles.card}>
        <View style={styles.task}>
          <TouchableOpacity
            style={styles.taskCheckbox}
            onPress={() => toggleTask(item.id)}
          >
            {item.completed && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          <View style={styles.taskContent}>
            <Text
              style={[styles.taskName, item.completed && styles.taskCompleted]}
              numberOfLines={isExpanded ? undefined : 2}
            >
              {item.name}
            </Text>
            {item.description && (
              <Text
                style={styles.taskDescription}
                numberOfLines={isExpanded ? undefined : 3}
              >
                {item.description}
              </Text>
            )}
            <TouchableOpacity
              onPress={() => toggleTaskExpanded(item.id)}
              style={styles.expandButton}
            >
              <Text style={styles.expandButtonText}>
                {isExpanded ? 'Show less' : 'Show more'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </GlassCard>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <BackHeader title="Today's Tasks" variant="large" />
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackHeader title="Today's Tasks" variant="large" />
      <FlatList
        data={tasks}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
  },
  list: {
    padding: DarkTheme.spacing.md,
  },
  card: {
    marginBottom: DarkTheme.spacing.md,
  },
  task: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: DarkTheme.colors.primary,
    marginRight: DarkTheme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DarkTheme.colors.card,
  },
  checkmark: {
    color: DarkTheme.colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  taskContent: {
    flex: 1,
  },
  taskName: {
    fontSize: 16,
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.xs,
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    color: DarkTheme.colors.textTertiary,
  },
  taskDescription: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  expandButton: {
    marginTop: DarkTheme.spacing.xs,
    paddingVertical: DarkTheme.spacing.xs,
  },
  expandButtonText: {
    fontSize: 13,
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
    fontWeight: '600',
  },
  loading: {
    color: DarkTheme.colors.text,
    fontSize: 16,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginTop: DarkTheme.spacing.xl,
  },
});

