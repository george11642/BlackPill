import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Star, AlertTriangle, ShoppingBag, Users, Lock } from 'lucide-react-native';
import { apiGet, apiPost } from '../lib/api/client';
import { useAuth } from '../lib/auth/context';
import { useSubscription } from '../lib/subscription/context';
import { GlassCard } from '../components/GlassCard';
import { BackHeader } from '../components/BackHeader';
import { Routine, RoutineTask } from '../lib/types';
import { DarkTheme } from '../lib/theme';

// Helper component to render effectiveness stars
function EffectivenessRating({ effectiveness }: { effectiveness?: string }) {
  if (!effectiveness) return null;

  const effectivenessMap: Record<string, number> = {
    'low': 2,
    'medium': 3,
    'high': 4,
    'very high': 5,
  };

  const stars = effectivenessMap[effectiveness] || 3;
  const emptyStars = 5 - stars;

  return (
    <View style={styles.effectivenessContainer}>
      {Array(stars).fill(0).map((_, i) => (
        <Star key={`filled-${i}`} size={14} color={DarkTheme.colors.warning} fill={DarkTheme.colors.warning} />
      ))}
      {Array(emptyStars).fill(0).map((_, i) => (
        <Star key={`empty-${i}`} size={14} color={DarkTheme.colors.textTertiary} />
      ))}
      <Text style={styles.effectivenessLabel}>{effectiveness}</Text>
    </View>
  );
}

// Helper to get tier color
function getTierColor(tier?: string): string {
  switch (tier) {
    case 'DIY': return DarkTheme.colors.success; // Green
    case 'OTC': return DarkTheme.colors.primary; // Cyan
    case 'Professional': return '#B700FF'; // Purple
    default: return DarkTheme.colors.textSecondary;
  }
}

// Helper to get tier emoji
function getTierEmoji(tier?: string): string {
  switch (tier) {
    case 'DIY': return '🏠';
    case 'OTC': return '💊';
    case 'Professional': return '👨‍⚕️';
    default: return '📋';
  }
}

export function RoutineDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { session } = useAuth();
  const { tier } = useSubscription();
  const { routineId } = route.params as { routineId?: string };
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  
  // Free users can only see first task in each group
  const isFreeUser = tier === 'free';

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

  const toggleTaskExpanded = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <BackHeader title="Routine" />
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  if (!routine) {
    return (
      <View style={styles.container}>
        <BackHeader title="Routine" />
        <Text style={styles.loading}>Create a new routine</Text>
      </View>
    );
  }

  // Group tasks by tier
  const diyTasks = routine.tasks.filter(t => t.tier === 'DIY' || !t.tier); // Default to DIY if no tier
  const otcTasks = routine.tasks.filter(t => t.tier === 'OTC');
  const proTasks = routine.tasks.filter(t => t.tier === 'Professional');

  const renderTaskGroup = (title: string, tierType: string, tasks: RoutineTask[], description?: string) => {
    if (tasks.length === 0) return null;
    
    // Free users only see first task unblurred
    const visibleTasks = isFreeUser ? tasks.slice(0, 1) : tasks;
    const blurredTasks = isFreeUser ? tasks.slice(1) : [];
    
    return (
      <View style={styles.groupContainer}>
        <View style={styles.groupHeader}>
          <Text style={styles.groupTitle}>{getTierEmoji(tierType)} {title}</Text>
          {tierType === 'Professional' && <View style={styles.warningBadge}><Text style={styles.warningBadgeText}>⚠️ Professional</Text></View>}
        </View>
        {description && <Text style={styles.groupDescription}>{description}</Text>}
        <GlassCard style={styles.card}>
          {/* Visible tasks */}
          {visibleTasks.map((task, index) => {
            const isExpanded = expandedTasks.has(task.id);
            return (
              <View key={task.id}>
                <TouchableOpacity
                  style={[styles.task, index > 0 && styles.taskBorder]}
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
                    {/* Tier metadata row */}
                    {(task.estimatedCost || task.timeToResults) && (
                      <View style={styles.metadataRow}>
                        {task.estimatedCost && <Text style={styles.metadataText}>💰 {task.estimatedCost}</Text>}
                        {task.timeToResults && <Text style={styles.metadataText}>⏱️ {task.timeToResults}</Text>}
                      </View>
                    )}
                  </View>
                  {(task.scienceBacking || task.effectiveness) && (
                    <TouchableOpacity 
                      onPress={() => toggleTaskExpanded(task.id)}
                      style={styles.expandButton}
                    >
                      <Text style={styles.expandButtonText}>{isExpanded ? '▼' : '▶'}</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>

                {/* Expanded content */}
                {isExpanded && (
                  <View style={styles.expandedContent}>
                    {task.effectiveness && (
                      <View style={styles.expandedSection}>
                        <Text style={styles.expandedLabel}>Effectiveness</Text>
                        <EffectivenessRating effectiveness={task.effectiveness} />
                      </View>
                    )}
                    {task.scienceBacking && (
                      <View style={styles.expandedSection}>
                        <Text style={styles.expandedLabel}>Why it works</Text>
                        <Text style={styles.scienceText}>{task.scienceBacking}</Text>
                      </View>
                    )}
                    {tierType === 'OTC' && (
                      <TouchableOpacity 
                        style={styles.shopButton}
                        onPress={() => {
                          if (task.productLink) {
                            Linking.openURL(task.productLink);
                          } else {
                            // Navigate to marketplace with search
                            navigation.navigate('Marketplace' as never, { search: task.product_name || task.name } as never);
                          }
                        }}
                      >
                        <ShoppingBag size={16} color="#fff" />
                        <Text style={styles.shopButtonText}>Shop Product</Text>
                      </TouchableOpacity>
                    )}
                    {task.professionalWarning && tierType === 'Professional' && (
                      <View style={styles.warningSection}>
                        <AlertTriangle size={16} color={DarkTheme.colors.warning} />
                        <Text style={styles.warningText}>{task.professionalWarning}</Text>
                      </View>
                    )}
                    {tierType === 'Professional' && (
                      <TouchableOpacity 
                        style={styles.findProButton}
                        onPress={() => Linking.openURL('https://www.dermatology.org')} // Placeholder link
                      >
                        <Users size={16} color="#fff" />
                        <Text style={styles.findProButtonText}>Find Professional</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })}
          
          {/* Blurred tasks for free users */}
          {blurredTasks.length > 0 && (
            <View style={styles.blurredSection}>
              <View style={styles.blurredContent}>
                {blurredTasks.map((task, index) => (
                  <View key={task.id} style={[styles.blurredTask, index > 0 && styles.taskBorder]}>
                    <View style={styles.taskCheckbox}>
                      <View style={styles.blurredCheckbox} />
                    </View>
                    <View style={styles.taskContent}>
                      <View style={styles.blurredTextLine} />
                      <View style={[styles.blurredTextLine, styles.blurredTextLineShort]} />
                    </View>
                  </View>
                ))}
              </View>
              <View style={styles.blurOverlay}>
                <View style={styles.upgradePrompt}>
                  <Lock size={20} color={DarkTheme.colors.primary} />
                  <Text style={styles.upgradeText}>+{blurredTasks.length} more steps</Text>
                  <TouchableOpacity 
                    style={styles.upgradeButton}
                    onPress={() => navigation.navigate('Subscription' as never)}
                  >
                    <Text style={styles.upgradeButtonText}>Upgrade to Unlock</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </GlassCard>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <BackHeader title={routine.name} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.description}>{routine.description}</Text>
        </View>

        {/* Horizontal tier groups - side by side */}
        <View style={styles.tierGroupsRow}>
          {renderTaskGroup('DIY', 'DIY', diyTasks, 'Free habits')}
          {renderTaskGroup('OTC', 'OTC', otcTasks, 'Products')}
          {renderTaskGroup('Pro', 'Professional', proTasks, 'Treatments')}
        </View>
      </ScrollView>
    </View>
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
    padding: DarkTheme.spacing.lg,
    paddingTop: DarkTheme.spacing.md,
  },
  header: {
    marginBottom: DarkTheme.spacing.lg,
  },
  description: {
    fontSize: 16,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  tierGroupsRow: {
    flexDirection: 'row',
    gap: DarkTheme.spacing.sm,
  },
  groupContainer: {
    flex: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  warningBadge: {
    backgroundColor: `${DarkTheme.colors.warning}30`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  warningBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: DarkTheme.colors.warning,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  groupDescription: {
    fontSize: 12,
    color: DarkTheme.colors.textSecondary,
    marginBottom: DarkTheme.spacing.sm,
    fontFamily: DarkTheme.typography.fontFamily,
    lineHeight: 16,
  },
  card: {
    marginBottom: 0,
  },
  task: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: DarkTheme.spacing.sm,
    paddingRight: 8,
  },
  taskBorder: {
    paddingTop: DarkTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: DarkTheme.colors.borderSubtle,
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
    marginTop: 2,
    flexShrink: 0,
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
    fontSize: 14,
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: 2,
    fontWeight: '600',
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    color: DarkTheme.colors.textTertiary,
  },
  taskDescription: {
    fontSize: 11,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: 4,
    lineHeight: 14,
  },
  metadataRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  metadataText: {
    fontSize: 12,
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
    fontWeight: '500',
  },
  expandButton: {
    paddingVertical: 8,
    paddingLeft: 8,
  },
  expandButtonText: {
    fontSize: 12,
    color: DarkTheme.colors.textTertiary,
    fontWeight: '700',
  },
  expandedContent: {
    backgroundColor: `${DarkTheme.colors.primary}10`,
    borderRadius: 8,
    padding: 12,
    marginBottom: DarkTheme.spacing.md,
    marginLeft: 32,
  },
  expandedSection: {
    marginBottom: 12,
  },
  expandedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: DarkTheme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  scienceText: {
    fontSize: 13,
    color: DarkTheme.colors.textSecondary,
    lineHeight: 18,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  effectivenessContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  effectivenessLabel: {
    fontSize: 12,
    color: DarkTheme.colors.textSecondary,
    marginLeft: 4,
    fontFamily: DarkTheme.typography.fontFamily,
    textTransform: 'capitalize',
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DarkTheme.colors.primary,
    borderRadius: 6,
    paddingVertical: 8,
    gap: 6,
    marginTop: 8,
  },
  shopButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    fontFamily: DarkTheme.typography.fontFamily,
  },
  findProButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B700FF',
    borderRadius: 6,
    paddingVertical: 8,
    gap: 6,
    marginTop: 8,
  },
  findProButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    fontFamily: DarkTheme.typography.fontFamily,
  },
  warningSection: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: `${DarkTheme.colors.warning}20`,
    borderRadius: 6,
    padding: 10,
    marginTop: 8,
  },
  warningText: {
    fontSize: 12,
    color: DarkTheme.colors.warning,
    flex: 1,
    lineHeight: 16,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  loading: {
    color: DarkTheme.colors.text,
    fontSize: 16,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginTop: DarkTheme.spacing.xl,
  },
  // Blurred section styles
  blurredSection: {
    position: 'relative',
    marginTop: DarkTheme.spacing.sm,
    paddingTop: DarkTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: DarkTheme.colors.borderSubtle,
  },
  blurredContent: {
    opacity: 0.3,
  },
  blurredTask: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: DarkTheme.spacing.sm,
    paddingRight: 8,
  },
  blurredCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    backgroundColor: DarkTheme.colors.borderSubtle,
  },
  blurredTextLine: {
    height: 12,
    backgroundColor: DarkTheme.colors.borderSubtle,
    borderRadius: 4,
    marginBottom: 6,
    width: '100%',
  },
  blurredTextLineShort: {
    width: '60%',
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 10, 0.7)',
    borderRadius: 8,
  },
  upgradePrompt: {
    alignItems: 'center',
    padding: DarkTheme.spacing.md,
  },
  upgradeText: {
    fontSize: 14,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginTop: 8,
    marginBottom: 12,
  },
  upgradeButton: {
    backgroundColor: DarkTheme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  upgradeButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: DarkTheme.colors.background,
    fontFamily: DarkTheme.typography.fontFamily,
  },
});
