import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { apiGet, apiPost } from '../lib/api/client';
import { useAuth } from '../lib/auth/context';
import { GlassCard } from '../components/GlassCard';
import { Routine, RoutineTask } from '../lib/types';
import { DarkTheme } from '../lib/theme';

export function RoutineDetailScreen() {
  const route = useRoute();
  const { session } = useAuth();
  const { routineId } = route.params as { routineId?: string };
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (routineId) {
      loadRoutine();
    } else {
      setLoading(false);
    }
  }, [routineId]);

  const loadRoutine = async () => {
    try {
      const data = await apiGet<{ routine: Routine }>(
        `/api/routines/${routineId}`,
        session?.access_token
      );
      setRoutine(data.routine);
    } catch (error) {
      console.error('Failed to load routine:', error);
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
      if (routine) {
        const updatedTasks = routine.tasks.map((t) =>
          t.id === taskId ? { ...t, completed: !t.completed } : t
        );
        setRoutine({ ...routine, tasks: updatedTasks });
      }
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  if (!routine) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Create a new routine</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{routine.name}</Text>
        <Text style={styles.description}>{routine.description}</Text>
      </View>

      <GlassCard style={styles.card}>
        <Text style={styles.cardTitle}>Tasks</Text>
        {routine.tasks.map((task) => (
          <TouchableOpacity
            key={task.id}
            style={styles.task}
            onPress={() => toggleTask(task.id)}
          >
            <View style={styles.taskCheckbox}>
              {task.completed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={styles.taskContent}>
              <Text
                style={[
                  styles.taskName,
                  task.completed && styles.taskCompleted,
                ]}
              >
                {task.name}
              </Text>
              {task.description && (
                <Text style={styles.taskDescription}>{task.description}</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
  },
  content: {
    padding: DarkTheme.spacing.lg,
    paddingTop: 60,
  },
  header: {
    marginBottom: DarkTheme.spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.xs,
  },
  description: {
    fontSize: 16,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  card: {
    marginBottom: DarkTheme.spacing.lg,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.md,
  },
  task: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: DarkTheme.spacing.md,
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

