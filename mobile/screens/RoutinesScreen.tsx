import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { apiGet, apiDelete } from '../lib/api/client';
import { useAuth } from '../lib/auth/context';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { BackHeader } from '../components/BackHeader';
import { Routine } from '../lib/types';
import { DarkTheme } from '../lib/theme';

export function RoutinesScreen() {
  const navigation = useNavigation();
  const { session } = useAuth();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Reload routines when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadRoutines();
    }, [session?.access_token])
  );

  const loadRoutines = async () => {
    try {
      const data = await apiGet<{ routines: Routine[] }>(
        '/api/routines',
        session?.access_token
      );
      setRoutines(data.routines);
    } catch (error) {
      console.error('Failed to load routines:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteRoutine = async (routineId: string) => {
    Alert.alert(
      'Delete Routine',
      'Are you sure you want to delete this routine? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(routineId);
            try {
              await apiDelete(
                `/api/routines/delete?routine_id=${routineId}`,
                session?.access_token
              );
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setRoutines(prev => prev.filter(r => r.id !== routineId));
            } catch (error) {
              console.error('Failed to delete routine:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', 'Failed to delete routine. Please try again.');
            } finally {
              setDeleting(null);
            }
          },
        },
      ]
    );
  };

  const renderRightActions = (routineId: string) => {
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => deleteRoutine(routineId)}
      >
        {deleting === routineId ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Ionicons name="trash-outline" size={24} color="#fff" />
        )}
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: Routine }) => {
    // API returns routine_tasks, not tasks
    const tasks = (item as any).routine_tasks || item.tasks || [];
    const completedTasks = tasks.filter((t: any) => t.completed).length;
    const totalTasks = tasks.length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const isActive = item.is_active;

    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item.id)}
        overshootRight={false}
      >
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('RoutineDetail' as never, { routineId: item.id } as never)
          }
          activeOpacity={0.7}
        >
          <GlassCard style={[styles.card, !isActive && styles.inactiveCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
              {isActive && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>Active</Text>
                </View>
              )}
            </View>
            {item.goal && (
              <Text style={styles.goal} numberOfLines={2}>{item.goal}</Text>
            )}
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
      </Swipeable>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" size={64} color={DarkTheme.colors.textTertiary} />
      <Text style={styles.emptyTitle}>No Routines Yet</Text>
      <Text style={styles.emptySubtitle}>
        Create a personalized routine based on your face analysis to start improving.
      </Text>
      <PrimaryButton
        title="Create Your First Routine"
        onPress={() => navigation.navigate('CreateRoutine' as never)}
        style={styles.emptyButton}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <BackHeader 
        title="My Routines" 
        variant="large"
        rightElement={
          routines.length > 0 ? (
            <PrimaryButton
              title="+ New"
              onPress={() => navigation.navigate('CreateRoutine' as never)}
              size="sm"
            />
          ) : undefined
        }
      />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DarkTheme.colors.primary} />
          <Text style={styles.loading}>Loading routines...</Text>
        </View>
      ) : routines.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <Text style={styles.swipeHint}>Swipe left to delete</Text>
          <FlatList
            data={routines}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
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
    paddingBottom: 100,
  },
  card: {
    marginBottom: DarkTheme.spacing.md,
  },
  inactiveCard: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DarkTheme.spacing.xs,
  },
  name: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginRight: DarkTheme.spacing.sm,
  },
  activeBadge: {
    backgroundColor: DarkTheme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: DarkTheme.colors.background,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: DarkTheme.typography.fontFamily,
  },
  goal: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.sm,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loading: {
    color: DarkTheme.colors.textSecondary,
    fontSize: 16,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginTop: DarkTheme.spacing.md,
  },
  deleteAction: {
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginBottom: DarkTheme.spacing.md,
    borderRadius: DarkTheme.borderRadius.lg,
    marginLeft: DarkTheme.spacing.sm,
  },
  swipeHint: {
    color: DarkTheme.colors.textTertiary,
    fontSize: 12,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    paddingHorizontal: DarkTheme.spacing.md,
    marginBottom: DarkTheme.spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DarkTheme.spacing.xl,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginTop: DarkTheme.spacing.lg,
    marginBottom: DarkTheme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: 15,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: DarkTheme.spacing.xl,
  },
  emptyButton: {
    minWidth: 200,
  },
});
