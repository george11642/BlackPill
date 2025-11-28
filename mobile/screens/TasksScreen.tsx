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

  const renderItem = ({ item }: { item: RoutineTask }) => (
    <GlassCard style={styles.card}>
      <TouchableOpacity
        style={styles.task}
        onPress={() => toggleTask(item.id)}
      >
        <View style={styles.taskCheckbox}>
          {item.completed && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <View style={styles.taskContent}>
          <Text
            style={[styles.taskName, item.completed && styles.taskCompleted]}
          >
            {item.name}
          </Text>
          {item.description && (
            <Text style={styles.taskDescription}>{item.description}</Text>
          )}
        </View>
      </TouchableOpacity>
    </GlassCard>
  );

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
  loading: {
    color: DarkTheme.colors.text,
    fontSize: 16,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginTop: DarkTheme.spacing.xl,
  },
});

