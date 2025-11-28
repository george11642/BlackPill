import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Settings, ChevronRight, ChevronDown, Check, Flame, Scan, Sparkles, Clock, Target, RotateCcw, ShoppingBag } from 'lucide-react-native';

import { apiGet, apiPost } from '../lib/api/client';
import { useAuth } from '../lib/auth/context';
import { GlassCard } from '../components/GlassCard';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { PrimaryButton, IconButton } from '../components/PrimaryButton';
import { GradientText } from '../components/GradientText';
import { DarkTheme } from '../lib/theme';
import { deduplicateTasks } from '../lib/routines/taskNormalization';

interface RoutineTask {
  id: string;
  title: string;
  description?: string;
  category: string;
  completed: boolean;
  emoji?: string;
  routine_id: string;
  routine_name?: string;
  duration_minutes?: number;
  why_it_helps?: string;
  time_of_day?: string[];
  frequency?: 'daily' | 'weekly' | 'monthly' | 'every_other_day';
}

type TaskFilter = 'all' | 'daily' | 'weekly' | 'monthly';

interface UserStats {
  overall_score: number;
  potential_score: number;
  streak: number;
  weekly_streak?: number;
  monthly_streak?: number;
  avatar_url?: string;
  latest_analysis_id?: string;
  latest_analysis_image?: string;
}

interface UserStatsResponse {
  overall_score: number;
  potential_score: number;
  streak: number;
  weekly_streak?: number;
  monthly_streak?: number;
  avatar_url?: string;
  tier: string;
  scans_remaining: number;
  latest_analysis_id?: string;
  latest_analysis_image?: string;
}

interface Goal {
  id: string;
  goal_type: string;
  target_value: number;
  current_value?: number;
  deadline: string;
  status: string;
  created_at: string;
  goal_milestones?: Array<{
    id: string;
    milestone_name: string;
    target_value: number;
    target_date: string;
    completed: boolean;
  }>;
}

interface GoalsResponse {
  goals: Goal[];
}

interface TasksResponse {
  tasks: Array<{
    id: string;
    title: string;
    category: string;
    completed: boolean;
    emoji?: string;
    routine_id: string;
  }>;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  grooming: '✨',
  skincare: '🧴',
  style: '💇',
  fitness: '💪',
  nutrition: '🥗',
  sleep: '😴',
  mindset: '🧠',
  mewing: '👅',
  posture: '🧘',
  hygiene: '🚿',
  hair: '💈',
  eyes: '👁️',
  default: '📋',
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function DailyRoutineScreen() {
  const navigation = useNavigation();
  const { session } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<RoutineTask[]>([]);
  const [completedTasks, setCompletedTasks] = useState<RoutineTask[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');
  const [stats, setStats] = useState<UserStats>({
    overall_score: 0,
    potential_score: 0,
    streak: 0,
    latest_analysis_id: undefined,
    latest_analysis_image: undefined,
  });
  const [primaryGoal, setPrimaryGoal] = useState<Goal | null>(null);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const streakScale = useSharedValue(0);

  const startAnimations = () => {
    headerOpacity.value = withTiming(1, { duration: 500 });
    streakScale.value = withDelay(
      300,
      withSpring(1, { damping: 12, stiffness: 100 })
    );
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load user stats from API
      const statsData = await apiGet<UserStatsResponse>(
        '/api/user/stats',
        session?.access_token
      );
      
      setStats({
        overall_score: statsData.overall_score,
        potential_score: statsData.potential_score,
        streak: statsData.streak,
        weekly_streak: statsData.weekly_streak || 0,
        monthly_streak: statsData.monthly_streak || 0,
        avatar_url: statsData.avatar_url,
        latest_analysis_id: statsData.latest_analysis_id,
        latest_analysis_image: statsData.latest_analysis_image,
      });

      // Load today's tasks from API
      const tasksData = await apiGet<TasksResponse>(
        '/api/routines/today',
        session?.access_token
      );
      
      // Add emojis based on category
      const tasksWithEmojis = tasksData.tasks.map(task => ({
        ...task,
        emoji: task.emoji || CATEGORY_EMOJIS[task.category] || CATEGORY_EMOJIS.default,
      }));
      
      // Deduplicate tasks automatically
      const deduplicatedTasks = deduplicateTasks(tasksWithEmojis as any) as RoutineTask[];
      
      // Separate completed and pending tasks
      const pendingTasks = deduplicatedTasks.filter(t => !t.completed);
      const completedTasksList = deduplicatedTasks.filter(t => t.completed);
      
      setTasks(pendingTasks);
      setCompletedTasks(completedTasksList);

      // Load primary active goal
      try {
        const goalsData = await apiGet<GoalsResponse>(
          '/api/goals?status=active',
          session?.access_token
        );
        // Get the first active goal (most recent or primary)
        if (goalsData.goals && goalsData.goals.length > 0) {
          setPrimaryGoal(goalsData.goals[0]);
        } else {
          setPrimaryGoal(null);
        }
      } catch (error) {
        console.error('Failed to load goals:', error);
        setPrimaryGoal(null);
      }

      startAnimations();
    } catch (error) {
      console.error('Failed to load routine data:', error);
      // Start animations even on error so UI doesn't stay frozen
      startAnimations();
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const toggleTask = async (taskId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newCompleted = !task.completed;
    
    // Optimistic update
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId ? { ...t, completed: newCompleted } : t
      )
    );

    try {
      // Sync with API - send taskId and routineId as expected by the API
      await apiPost(
        '/api/routines/complete-task',
        { 
          taskId: taskId, 
          routineId: task.routine_id,
          skipped: false 
        },
        session?.access_token
      );
      
      // Update streak if completing a task
      if (newCompleted) {
        setStats(prev => ({
          ...prev,
          streak: prev.streak + (prev.streak === 0 ? 1 : 0), // Only increment if starting new streak
        }));
        
        // Move task to completed section after brief delay to show completion animation
        setTimeout(() => {
          setTasks(prev => prev.filter(t => t.id !== taskId));
          setCompletedTasks(prev => [...prev, { ...task, completed: true }]);
        }, 600); // Let animation play
      }
    } catch (error) {
      console.error('Failed to toggle task:', error);
      // Revert on error
      setTasks(prev =>
        prev.map(t =>
          t.id === taskId ? { ...t, completed: !newCompleted } : t
        )
      );
    }
  };

  const undoTask = async (taskId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const task = completedTasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Optimistic update - move back to active tasks
    setCompletedTasks(prev => prev.filter(t => t.id !== taskId));
    setTasks(prev => [...prev, { ...task, completed: false }]);

    try {
      // Sync with API - mark as not completed
      await apiPost(
        '/api/routines/complete-task',
        { 
          taskId: taskId, 
          routineId: task.routine_id,
          skipped: false,
          undo: true
        },
        session?.access_token
      );
    } catch (error) {
      console.error('Failed to undo task:', error);
      // Revert on error
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setCompletedTasks(prev => [...prev, { ...task, completed: true }]);
    }
  };

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const streakAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: streakScale.value }],
  }));

  const totalTaskCount = tasks.length + completedTasks.length;
  const completedCount = completedTasks.length;
  const progressPercentage = totalTaskCount > 0 ? (completedCount / totalTaskCount) * 100 : 0;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={DarkTheme.colors.primary}
          />
        }
      >
        {/* Header - BlackPill Title with Buttons */}
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            {Platform.OS === 'web' ? (
              <Text style={styles.brandTitle}>BlackPill</Text>
            ) : (
              <GradientText
                text="BlackPill"
                fontSize={28}
                fontWeight="700"
                colors={[DarkTheme.colors.primary, DarkTheme.colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            )}
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Marketplace' as never);
              }}
              style={styles.headerIconButton}
            >
              <ShoppingBag size={22} color={DarkTheme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Settings' as never);
              }}
              style={styles.headerIconButton}
            >
              <Settings size={22} color={DarkTheme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Dashboard Grid - Stats Card & Scan Button */}
        <Animated.View style={[styles.dashboardGrid, headerAnimatedStyle]}>
          {/* Stats Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.dashboardGridItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (stats.latest_analysis_id) {
                (navigation as any).navigate('AnalysisResult', {
                  analysisId: stats.latest_analysis_id,
                });
              } else {
                (navigation as any).navigate('Camera');
              }
            }}
          >
            <GlassCard variant="gold" style={styles.statsCardCompact}>
              <View style={styles.statsContentCompact}>
                <ProfileAvatar
                  imageUrl={stats.latest_analysis_image || stats.avatar_url}
                  size="md"
                  showGoldRing
                />
                <View style={styles.scoresCompact}>
                  <Text style={styles.scoreValueCompact}>{stats.overall_score.toFixed(1)}</Text>
                </View>
              </View>
            </GlassCard>
          </TouchableOpacity>

          {/* Scan Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.dashboardGridItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate('Camera' as never);
            }}
          >
            <View style={styles.scanCardWrapper}>
              <LinearGradient
                colors={[DarkTheme.colors.primary, DarkTheme.colors.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.scanCardGradient}
              >
                <Scan size={32} color={DarkTheme.colors.background} />
                <Text style={styles.scanCardText}>Scan</Text>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Goal Progress Card */}
        {primaryGoal && (
          <Animated.View style={headerAnimatedStyle}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Progress' as never);
              }}
            >
              <GlassCard variant="elevated" style={styles.goalCard}>
                <View style={styles.goalCardHeader}>
                  <View style={styles.goalCardTitleRow}>
                    <Target size={20} color={DarkTheme.colors.primary} />
                    <Text style={styles.goalCardTitle}>
                      {primaryGoal.goal_type === 'score_improvement' ? 'Overall Score' :
                       primaryGoal.goal_type === 'category_improvement' ? 'Category Improvement' :
                       primaryGoal.goal_type === 'routine_consistency' ? 'Routine Consistency' :
                       'Goal'}
                    </Text>
                  </View>
                  <Text style={styles.goalCardDeadline}>
                    {(() => {
                      const daysLeft = Math.ceil(
                        (new Date(primaryGoal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                      );
                      return daysLeft > 0 ? `${daysLeft}d left` : 'Overdue';
                    })()}
                  </Text>
                </View>
                <View style={styles.goalCardProgress}>
                  <View style={styles.goalCardValues}>
                    <Text style={styles.goalCardCurrent}>
                      {primaryGoal.current_value?.toFixed(1) || '0.0'}
                    </Text>
                    <Text style={styles.goalCardTarget}>
                      → {primaryGoal.target_value.toFixed(1)}
                    </Text>
                  </View>
                  <View style={styles.goalCardProgressBar}>
                    <View 
                      style={[
                        styles.goalCardProgressFill, 
                        { 
                          width: `${Math.min(100, primaryGoal.current_value 
                            ? ((primaryGoal.current_value / primaryGoal.target_value) * 100)
                            : 0)}%` 
                        }
                      ]} 
                    />
                  </View>
                </View>
              </GlassCard>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Streak Counters with Create Routine */}
        <View style={styles.streaksRow}>
          <View style={styles.streaksContainer}>
            <Animated.View style={[styles.streakContainer, streakAnimatedStyle]}>
              <Flame size={20} color={DarkTheme.colors.warning} />
              <Text style={styles.streakText}>
                {stats.streak} <Text style={styles.streakLabel}>day</Text>
              </Text>
            </Animated.View>
            {(stats.weekly_streak || 0) > 0 && (
              <Animated.View style={[styles.streakContainer, streakAnimatedStyle]}>
                <Flame size={20} color={DarkTheme.colors.primary} />
                <Text style={styles.streakText}>
                  {stats.weekly_streak} <Text style={styles.streakLabel}>week{stats.weekly_streak !== 1 ? 's' : ''}</Text>
                </Text>
              </Animated.View>
            )}
            {(stats.monthly_streak || 0) > 0 && (
              <Animated.View style={[styles.streakContainer, streakAnimatedStyle]}>
                <Flame size={20} color={DarkTheme.colors.accent} />
                <Text style={styles.streakText}>
                  {stats.monthly_streak} <Text style={styles.streakLabel}>month{stats.monthly_streak !== 1 ? 's' : ''}</Text>
                </Text>
              </Animated.View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('CreateRoutine' as never);
            }}
            style={styles.createRoutineSmall}
          >
            <Sparkles size={18} color={DarkTheme.colors.primary} />
            <Text style={styles.createRoutineSmallText}>New</Text>
          </TouchableOpacity>
        </View>

        {/* Glow Up Routine Section */}
        <Animated.View style={[styles.routineSectionHeader, headerAnimatedStyle]}>
          {Platform.OS === 'web' ? (
            <Text style={styles.routineSectionTitle}>✨ Glow up routine</Text>
          ) : (
            <GradientText
              text="✨ Glow up routine"
              fontSize={22}
              fontWeight="700"
              colors={[DarkTheme.colors.primary, DarkTheme.colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          )}
        </Animated.View>

        {/* Task Filter Tabs */}
        {tasks.length > 0 && (
          <View style={styles.filterContainer}>
            {(['all', 'daily', 'weekly', 'monthly'] as TaskFilter[]).map((filter) => {
              const isActive = taskFilter === filter;
              const count = filter === 'all' 
                ? tasks.length 
                : tasks.filter(t => {
                    if (filter === 'daily') {
                      return !t.frequency || t.frequency === 'daily' || t.frequency === 'every_other_day';
                    }
                    if (filter === 'weekly') {
                      return t.frequency === 'weekly';
                    }
                    if (filter === 'monthly') {
                      return t.frequency === 'monthly';
                    }
                    return true;
                  }).length;
              
              // Don't show filter if no tasks of that type
              if (filter !== 'all' && count === 0) return null;
              
              return (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterTab,
                    isActive && styles.filterTabActive,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setTaskFilter(filter);
                  }}
                >
                  <Text style={[
                    styles.filterTabText,
                    isActive && styles.filterTabTextActive,
                  ]}>
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Text>
                  {count > 0 && (
                    <View style={[
                      styles.filterBadge,
                      isActive && styles.filterBadgeActive,
                    ]}>
                      <Text style={[
                        styles.filterBadgeText,
                        isActive && styles.filterBadgeTextActive,
                      ]}>
                        {count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Progress Bar */}
        {totalTaskCount > 0 && (
          <Animated.View style={headerAnimatedStyle}>
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressText}>
                  {completedCount} of {totalTaskCount} completed
                </Text>
                <Text style={styles.progressPercentage}>
                  {Math.round(progressPercentage)}%
                </Text>
              </View>
              <View style={styles.progressBarBackground}>
                <Animated.View 
                  style={[
                    styles.progressBarFill,
                    { width: `${progressPercentage}%` }
                  ]} 
                />
              </View>
            </View>
          </Animated.View>
        )}

        {/* Tasks List or Empty State */}
        {tasks.length > 0 ? (
          <View style={styles.tasksContainer}>
            {tasks
              .filter(task => {
                if (taskFilter === 'all') return true;
                if (taskFilter === 'daily') {
                  return !task.frequency || task.frequency === 'daily' || task.frequency === 'every_other_day';
                }
                if (taskFilter === 'weekly') {
                  return task.frequency === 'weekly';
                }
                if (taskFilter === 'monthly') {
                  return task.frequency === 'monthly';
                }
                return true;
              })
              .map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  onToggle={() => toggleTask(task.id)}
                />
              ))}
          </View>
        ) : !loading && completedTasks.length === 0 && (
          <View style={styles.emptyStateContainer}>
            <GlassCard variant="elevated" style={styles.emptyStateCard}>
              <View style={styles.emptyStateIconContainer}>
                <Sparkles size={40} color={DarkTheme.colors.primary} />
              </View>
              <Text style={styles.emptyStateTitle}>Create Your Custom Routine</Text>
              <Text style={styles.emptyStateDescription}>
                Get a personalized daily routine based on your facial analysis. Our AI will create tasks tailored to your specific improvement areas.
              </Text>
              
              <View style={styles.emptyStateBenefits}>
                <View style={styles.benefitRow}>
                  <Target size={18} color={DarkTheme.colors.success} />
                  <Text style={styles.benefitText}>Personalized to your weak areas</Text>
                </View>
                <View style={styles.benefitRow}>
                  <Clock size={18} color={DarkTheme.colors.info} />
                  <Text style={styles.benefitText}>Morning & evening schedules</Text>
                </View>
                <View style={styles.benefitRow}>
                  <Flame size={18} color={DarkTheme.colors.warning} />
                  <Text style={styles.benefitText}>Build streaks & track progress</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.createRoutineButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  navigation.navigate('CreateRoutine' as never);
                }}
              >
                <LinearGradient
                  colors={[DarkTheme.colors.primary, DarkTheme.colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.createRoutineGradient}
                >
                  <Sparkles size={20} color="#fff" />
                  <Text style={styles.createRoutineText}>Generate My Routine</Text>
                </LinearGradient>
              </TouchableOpacity>
            </GlassCard>
          </View>
        )}

        {/* Completed Tasks Section */}
        {completedTasks.length > 0 && (
          <CompletedSection
            tasks={completedTasks}
            isExpanded={showCompleted}
            onToggle={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCompleted(!showCompleted);
            }}
            onUndoTask={undoTask}
          />
        )}

        {/* All Done Message */}
        {tasks.length === 0 && completedTasks.length > 0 && (
          <View style={styles.allDoneContainer}>
            <GlassCard variant="elevated" style={styles.allDoneCard}>
              <Text style={styles.allDoneEmoji}>🎉</Text>
              <Text style={styles.allDoneTitle}>All done for today!</Text>
              <Text style={styles.allDoneSubtitle}>
                You've completed all {completedTasks.length} task{completedTasks.length !== 1 ? 's' : ''}. Great work!
              </Text>
            </GlassCard>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

// Task Card Component
interface TaskCardProps {
  task: RoutineTask;
  index: number;
  onToggle: () => void;
}

function TaskCard({ task, index, onToggle }: TaskCardProps) {
  const scale = useSharedValue(0);
  const checkScale = useSharedValue(task.completed ? 1 : 0);
  const exitOpacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const marginBottom = useSharedValue(12); // Normal task spacing

  useEffect(() => {
    scale.value = withDelay(
      index * 100,
      withSpring(1, { damping: 15, stiffness: 100 })
    );
  }, []);

  useEffect(() => {
    checkScale.value = withSpring(task.completed ? 1 : 0, {
      damping: 15,
      stiffness: 200,
    });
    
    // If task is completed, animate up and fade out
    if (task.completed) {
      // Slide up and collapse
      translateY.value = withTiming(-80, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
      
      // Fade out after sliding up
      exitOpacity.value = withDelay(
        100,
        withTiming(0, {
          duration: 200,
          easing: Easing.inOut(Easing.ease),
        })
      );
      
      // Reduce margin bottom to collapse the space
      marginBottom.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [task.completed]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value }
    ],
    opacity: scale.value * exitOpacity.value,
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    marginBottom: marginBottom.value,
  }));

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  const handlePress = () => {
    onToggle();
  };

  return (
    <Animated.View style={containerAnimatedStyle}>
      <Animated.View style={cardAnimatedStyle}>
        <Pressable onPress={handlePress}>
        <LinearGradient
          colors={
            task.completed
              ? [DarkTheme.colors.primaryDark, DarkTheme.colors.primary]
              : [DarkTheme.colors.card, DarkTheme.colors.cardElevated]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.taskCard}
        >
          <View style={styles.taskMainContent}>
            <Text style={styles.taskEmoji}>{task.emoji}</Text>
            <View style={styles.taskTextContent}>
              <Text
                style={[
                  styles.taskTitle,
                  task.completed && styles.taskTitleCompleted,
                ]}
              >
                {task.title}
              </Text>
              {task.description && (
                <Text
                  style={[
                    styles.taskDescription,
                    task.completed && styles.taskDescriptionCompleted,
                  ]}
                  numberOfLines={2}
                >
                  {task.description}
                </Text>
              )}
              {(task.duration_minutes || task.time_of_day) && (
                <View style={styles.taskMeta}>
                  {task.duration_minutes && (
                    <Text style={styles.taskMetaText}>
                      {task.duration_minutes} min
                    </Text>
                  )}
                  {task.time_of_day && task.time_of_day.length > 0 && (
                    <Text style={styles.taskMetaText}>
                      {task.time_of_day.includes('morning') && task.time_of_day.includes('evening')
                        ? '🌅 🌙'
                        : task.time_of_day.includes('morning')
                        ? '🌅 Morning'
                        : '🌙 Evening'}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
          <View
            style={[
              styles.checkbox,
              task.completed && styles.checkboxCompleted,
            ]}
          >
            <Animated.View style={checkAnimatedStyle}>
              <Check size={16} color={DarkTheme.colors.background} strokeWidth={3} />
            </Animated.View>
          </View>
        </LinearGradient>
      </Pressable>
        </Animated.View>
    </Animated.View>
  );
}

// Completed Section Component
interface CompletedSectionProps {
  tasks: RoutineTask[];
  isExpanded: boolean;
  onToggle: () => void;
  onUndoTask: (taskId: string) => void;
}

function CompletedSection({ tasks, isExpanded, onToggle, onUndoTask }: CompletedSectionProps) {
  const rotation = useSharedValue(0);
  const contentHeight = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    rotation.value = withTiming(isExpanded ? 180 : 0, { duration: 300 });
    contentHeight.value = withTiming(isExpanded ? 1 : 0, { duration: 300 });
    contentOpacity.value = withTiming(isExpanded ? 1 : 0, { duration: 200 });
  }, [isExpanded]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    maxHeight: contentHeight.value * (tasks.length * 80 + 20), // Approximate height per task
  }));

  return (
    <View style={styles.completedSection}>
      <TouchableOpacity
        style={styles.completedHeader}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={styles.completedHeaderLeft}>
          <View style={styles.completedIconContainer}>
            <Check size={16} color={DarkTheme.colors.success} strokeWidth={3} />
          </View>
          <Text style={styles.completedHeaderText}>
            Completed ({tasks.length})
          </Text>
        </View>
        <Animated.View style={chevronStyle}>
          <ChevronDown size={20} color={DarkTheme.colors.textSecondary} />
        </Animated.View>
      </TouchableOpacity>

      {isExpanded && (
        <Animated.View style={[styles.completedContent, contentStyle]}>
          {tasks.map((task, index) => (
            <CompletedTaskCard
              key={task.id}
              task={task}
              index={index}
              onUndo={() => onUndoTask(task.id)}
            />
          ))}
        </Animated.View>
      )}
    </View>
  );
}

// Completed Task Card Component
interface CompletedTaskCardProps {
  task: RoutineTask;
  index: number;
  onUndo: () => void;
}

function CompletedTaskCard({ task, index, onUndo }: CompletedTaskCardProps) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      index * 50,
      withSpring(1, { damping: 15, stiffness: 100 })
    );
  }, []);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  return (
    <Animated.View style={cardAnimatedStyle}>
      <View style={styles.completedTaskCard}>
        <View style={styles.completedTaskMain}>
          <Text style={styles.completedTaskEmoji}>{task.emoji}</Text>
          <View style={styles.completedTaskTextContent}>
            <Text style={styles.completedTaskTitle}>{task.title}</Text>
            {task.description && (
              <Text style={styles.completedTaskDescription} numberOfLines={1}>
                {task.description}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.undoButton}
          onPress={onUndo}
          activeOpacity={0.7}
        >
          <RotateCcw size={16} color={DarkTheme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: DarkTheme.spacing.lg,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.lg,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DarkTheme.spacing.xs,
    flexShrink: 0,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardGrid: {
    flexDirection: 'row',
    gap: DarkTheme.spacing.md,
    marginBottom: DarkTheme.spacing.md,
  },
  dashboardGridItem: {
    flex: 1,
  },
  statsCardCompact: {
    marginBottom: 0,
    height: 100,
    justifyContent: 'center',
  },
  statsContentCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DarkTheme.spacing.sm,
  },
  scoresCompact: {
    flex: 1,
    alignItems: 'flex-start',
    paddingLeft: DarkTheme.spacing.sm,
  },
  scoreValueCompact: {
    fontSize: 28,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  scoreLabelCompact: {
    fontSize: 10,
    fontWeight: '500',
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scanCardWrapper: {
    height: 100,
    borderRadius: DarkTheme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: DarkTheme.colors.borderGold,
    ...DarkTheme.shadows.gold,
  },
  scanCardGradient: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DarkTheme.spacing.xs,
  },
  scanCardText: {
    fontSize: 14,
    fontWeight: '700',
    color: DarkTheme.colors.background,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  streaksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DarkTheme.spacing.lg,
  },
  createRoutineSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DarkTheme.spacing.sm,
    paddingVertical: DarkTheme.spacing.sm,
    paddingHorizontal: DarkTheme.spacing.md,
    borderRadius: DarkTheme.borderRadius.md,
    backgroundColor: `${DarkTheme.colors.primary}15`,
    borderWidth: 1,
    borderColor: `${DarkTheme.colors.primary}30`,
  },
  createRoutineSmallText: {
    fontSize: 13,
    fontWeight: '600',
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  routineSectionHeader: {
    marginBottom: DarkTheme.spacing.md,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
    letterSpacing: -0.5,
  },
  routineSectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    letterSpacing: -0.5,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: DarkTheme.spacing.md,
    marginBottom: DarkTheme.spacing.lg,
  },
  actionButtonWrapper: {
    flex: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DarkTheme.spacing.md,
    paddingHorizontal: DarkTheme.spacing.lg,
    borderRadius: DarkTheme.borderRadius.lg,
    gap: DarkTheme.spacing.sm,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: DarkTheme.colors.background,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  actionButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DarkTheme.spacing.md,
    paddingHorizontal: DarkTheme.spacing.lg,
    borderRadius: DarkTheme.borderRadius.lg,
    gap: DarkTheme.spacing.sm,
    backgroundColor: DarkTheme.colors.card,
    borderWidth: 1,
    borderColor: DarkTheme.colors.primary,
  },
  actionButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '700',
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  statsCard: {
    marginBottom: DarkTheme.spacing.lg,
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoresContainer: {
    flex: 1,
    flexDirection: 'row',
    marginLeft: DarkTheme.spacing.md,
    gap: DarkTheme.spacing.lg,
  },
  scoreItem: {
    alignItems: 'flex-start',
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  potentialRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  potentialBadge: {
    backgroundColor: DarkTheme.colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: DarkTheme.borderRadius.xs,
    marginLeft: 4,
    marginTop: 4,
  },
  potentialBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: DarkTheme.colors.background,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  streaksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DarkTheme.spacing.md,
    flexWrap: 'wrap',
    flex: 1,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DarkTheme.spacing.xs,
    paddingHorizontal: DarkTheme.spacing.sm,
    paddingVertical: DarkTheme.spacing.xs,
    backgroundColor: DarkTheme.colors.card,
    borderRadius: DarkTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: DarkTheme.colors.borderSubtle,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  streakLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: DarkTheme.spacing.md,
    gap: DarkTheme.spacing.sm,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DarkTheme.spacing.sm,
    paddingHorizontal: DarkTheme.spacing.md,
    borderRadius: DarkTheme.borderRadius.full,
    backgroundColor: DarkTheme.colors.card,
    borderWidth: 1,
    borderColor: DarkTheme.colors.borderSubtle,
    gap: DarkTheme.spacing.xs,
  },
  filterTabActive: {
    backgroundColor: DarkTheme.colors.primary,
    borderColor: DarkTheme.colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  filterTabTextActive: {
    color: DarkTheme.colors.background,
  },
  filterBadge: {
    backgroundColor: DarkTheme.colors.borderSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: DarkTheme.borderRadius.full,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  filterBadgeTextActive: {
    color: DarkTheme.colors.background,
  },
  tasksContainer: {
    gap: DarkTheme.spacing.sm,
    marginBottom: DarkTheme.spacing.xl,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: DarkTheme.spacing.md,
    paddingHorizontal: DarkTheme.spacing.md,
    borderRadius: DarkTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: DarkTheme.colors.borderSubtle,
  },
  taskMainContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: DarkTheme.spacing.sm,
  },
  taskTextContent: {
    flex: 1,
  },
  taskEmoji: {
    fontSize: 20,
    marginRight: DarkTheme.spacing.md,
    marginTop: 2,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  taskTitleCompleted: {
    color: DarkTheme.colors.background,
  },
  taskDescription: {
    fontSize: 13,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginTop: 2,
    lineHeight: 18,
  },
  taskDescriptionCompleted: {
    color: 'rgba(0, 0, 0, 0.5)',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DarkTheme.spacing.sm,
    marginTop: DarkTheme.spacing.xs,
  },
  taskMetaText: {
    fontSize: 11,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: DarkTheme.borderRadius.full,
    borderWidth: 2,
    borderColor: DarkTheme.colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxCompleted: {
    backgroundColor: DarkTheme.colors.background,
    borderColor: DarkTheme.colors.background,
  },
  emptyStateContainer: {
    marginTop: DarkTheme.spacing.lg,
  },
  emptyStateCard: {
    alignItems: 'center',
    padding: DarkTheme.spacing.xl,
  },
  emptyStateIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${DarkTheme.colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DarkTheme.spacing.lg,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginBottom: DarkTheme.spacing.sm,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: DarkTheme.spacing.lg,
  },
  emptyStateBenefits: {
    width: '100%',
    gap: DarkTheme.spacing.sm,
    marginBottom: DarkTheme.spacing.xl,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DarkTheme.spacing.sm,
  },
  benefitText: {
    fontSize: 14,
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  createRoutineButton: {
    width: '100%',
    borderRadius: DarkTheme.borderRadius.lg,
    overflow: 'hidden',
  },
  createRoutineGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DarkTheme.spacing.sm,
    paddingVertical: DarkTheme.spacing.md,
    paddingHorizontal: DarkTheme.spacing.xl,
  },
  createRoutineText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    fontFamily: DarkTheme.typography.fontFamily,
  },
  bottomSpacer: {
    height: 100,
  },
  // Progress Bar Styles
  progressContainer: {
    marginBottom: DarkTheme.spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.xs,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: DarkTheme.colors.card,
    borderRadius: DarkTheme.borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: DarkTheme.colors.primary,
    borderRadius: DarkTheme.borderRadius.full,
  },
  // Completed Section Styles
  completedSection: {
    marginTop: DarkTheme.spacing.lg,
    marginBottom: DarkTheme.spacing.md,
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: DarkTheme.spacing.md,
    paddingHorizontal: DarkTheme.spacing.md,
    backgroundColor: DarkTheme.colors.card,
    borderRadius: DarkTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: DarkTheme.colors.borderSubtle,
  },
  completedHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DarkTheme.spacing.sm,
  },
  completedIconContainer: {
    width: 28,
    height: 28,
    borderRadius: DarkTheme.borderRadius.full,
    backgroundColor: `${DarkTheme.colors.success}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  completedContent: {
    marginTop: DarkTheme.spacing.sm,
    gap: DarkTheme.spacing.xs,
    overflow: 'hidden',
  },
  completedTaskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: DarkTheme.spacing.sm,
    paddingHorizontal: DarkTheme.spacing.md,
    backgroundColor: DarkTheme.colors.card,
    borderRadius: DarkTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: DarkTheme.colors.borderSubtle,
    opacity: 0.7,
  },
  completedTaskMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: DarkTheme.spacing.sm,
  },
  completedTaskEmoji: {
    fontSize: 16,
    marginRight: DarkTheme.spacing.sm,
    opacity: 0.6,
  },
  completedTaskTextContent: {
    flex: 1,
  },
  completedTaskTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    textDecorationLine: 'line-through',
  },
  completedTaskDescription: {
    fontSize: 12,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  undoButton: {
    width: 32,
    height: 32,
    borderRadius: DarkTheme.borderRadius.full,
    backgroundColor: DarkTheme.colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // All Done Styles
  allDoneContainer: {
    marginTop: DarkTheme.spacing.md,
  },
  allDoneCard: {
    alignItems: 'center',
    padding: DarkTheme.spacing.xl,
  },
  allDoneEmoji: {
    fontSize: 48,
    marginBottom: DarkTheme.spacing.md,
  },
  allDoneTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginBottom: DarkTheme.spacing.xs,
  },
  allDoneSubtitle: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
  },
  goalCard: {
    marginBottom: DarkTheme.spacing.md,
    padding: DarkTheme.spacing.md,
  },
  goalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.sm,
  },
  goalCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DarkTheme.spacing.sm,
  },
  goalCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  goalCardDeadline: {
    fontSize: 12,
    fontWeight: '500',
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  goalCardProgress: {
    marginTop: DarkTheme.spacing.xs,
  },
  goalCardValues: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: DarkTheme.spacing.xs,
    marginBottom: DarkTheme.spacing.xs,
  },
  goalCardCurrent: {
    fontSize: 24,
    fontWeight: '700',
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  goalCardTarget: {
    fontSize: 18,
    fontWeight: '600',
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  goalCardProgressBar: {
    height: 6,
    backgroundColor: DarkTheme.colors.borderSubtle,
    borderRadius: 3,
    overflow: 'hidden',
  },
  goalCardProgressFill: {
    height: '100%',
    backgroundColor: DarkTheme.colors.primary,
    borderRadius: 3,
  },
});

export default DailyRoutineScreen;

