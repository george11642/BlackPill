import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiGet } from '../lib/api/client';
import { useAuth } from '../lib/auth/context';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { Routine } from '../lib/types';
import { DarkTheme } from '../lib/theme';

export function RoutinesScreen() {
  const navigation = useNavigation();
  const { session } = useAuth();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoutines();
  }, []);

  const loadRoutines = async () => {
    try {
      const data = await apiGet<{ routines: Routine[] }>(
        '/api/routines/list',
        session?.access_token
      );
      setRoutines(data.routines);
    } catch (error) {
      console.error('Failed to load routines:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Routine }) => {
    const completedTasks = item.tasks.filter((t) => t.completed).length;
    const totalTasks = item.tasks.length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('RoutineDetail' as never, { routineId: item.id } as never)
        }
      >
        <GlassCard style={styles.card}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.description}>{item.description}</Text>
          <View style={styles.progress}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {completedTasks}/{totalTasks} tasks
            </Text>
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Routines</Text>
        <PrimaryButton
          title="+ New"
          onPress={() => navigation.navigate('RoutineDetail' as never, {} as never)}
          style={styles.newButton}
        />
      </View>
      {loading ? (
        <Text style={styles.loading}>Loading...</Text>
      ) : (
        <FlatList
          data={routines}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DarkTheme.spacing.lg,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  newButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  list: {
    padding: DarkTheme.spacing.md,
  },
  card: {
    marginBottom: DarkTheme.spacing.md,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.xs,
  },
  description: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.md,
  },
  progress: {
    marginTop: DarkTheme.spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: DarkTheme.colors.card,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: DarkTheme.spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: DarkTheme.colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: DarkTheme.colors.textTertiary,
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

