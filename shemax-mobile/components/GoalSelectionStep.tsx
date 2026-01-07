import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { 
  Sparkles, 
  TrendingUp, 
  Target, 
  Calendar,
  Heart,
  Zap,
} from 'lucide-react-native';
import { DarkTheme } from '../lib/theme';

export type OnboardingGoal = 
  | 'improve_skin'
  | 'build_habits'
  | 'track_changes'
  | 'get_routines'
  | 'boost_confidence'
  | 'stay_consistent';

export interface GoalOption {
  id: OnboardingGoal;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const GOAL_OPTIONS: GoalOption[] = [
  {
    id: 'improve_skin',
    title: 'Improve Skin Health',
    description: 'Get clearer, healthier looking skin',
    icon: <Sparkles size={24} />,
    color: '#00D9FF',
  },
  {
    id: 'build_habits',
    title: 'Build Better Habits',
    description: 'Develop consistent self-care routines',
    icon: <Calendar size={24} />,
    color: '#00FF94',
  },
  {
    id: 'track_changes',
    title: 'Track Facial Changes',
    description: 'Monitor progress over time with AI',
    icon: <TrendingUp size={24} />,
    color: '#FFB800',
  },
  {
    id: 'get_routines',
    title: 'Get Personalized Routines',
    description: 'AI-generated routines for your needs',
    icon: <Target size={24} />,
    color: '#FF6B6B',
  },
  {
    id: 'boost_confidence',
    title: 'Boost Confidence',
    description: 'Feel better about your appearance',
    icon: <Heart size={24} />,
    color: '#B700FF',
  },
  {
    id: 'stay_consistent',
    title: 'Stay Consistent',
    description: 'Get reminders and track streaks',
    icon: <Zap size={24} />,
    color: '#FF9500',
  },
];

interface GoalSelectionStepProps {
  selectedGoals: OnboardingGoal[];
  onUpdate: (goals: OnboardingGoal[]) => void;
}

function GoalCard({ 
  goal, 
  isSelected, 
  onToggle,
  index,
}: { 
  goal: GoalOption; 
  isSelected: boolean; 
  onToggle: () => void;
  index: number;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isSelected ? 1.02 : 1, { damping: 15 }) }],
    borderColor: isSelected ? goal.color : DarkTheme.colors.border,
    backgroundColor: isSelected ? `${goal.color}15` : DarkTheme.colors.card,
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).duration(400)}
    >
      <TouchableOpacity onPress={onToggle} activeOpacity={0.8}>
        <Animated.View style={[styles.goalCard, animatedStyle]}>
          <View style={[styles.iconContainer, { backgroundColor: `${goal.color}20` }]}>
            {React.cloneElement(goal.icon as React.ReactElement, { 
              color: goal.color 
            })}
          </View>
          <View style={styles.goalContent}>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            <Text style={styles.goalDescription}>{goal.description}</Text>
          </View>
          <View style={[
            styles.checkbox,
            isSelected && { backgroundColor: goal.color, borderColor: goal.color }
          ]}>
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function GoalSelectionStep({ selectedGoals, onUpdate }: GoalSelectionStepProps) {
  const toggleGoal = (goalId: OnboardingGoal) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (selectedGoals.includes(goalId)) {
      onUpdate(selectedGoals.filter(g => g !== goalId));
    } else {
      onUpdate([...selectedGoals, goalId]);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.duration(500)}>
        <Text style={styles.title}>What are your goals?</Text>
        <Text style={styles.subtitle}>
          Select all that apply - we'll personalize your experience
        </Text>
      </Animated.View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {GOAL_OPTIONS.map((goal, index) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            isSelected={selectedGoals.includes(goal.id)}
            onToggle={() => toggleGoal(goal.id)}
            index={index}
          />
        ))}
      </ScrollView>

      <Animated.View 
        style={styles.countContainer}
        entering={FadeIn.delay(600).duration(500)}
      >
        <Text style={styles.countText}>
          {selectedGoals.length === 0 
            ? 'Select at least one goal'
            : `${selectedGoals.length} goal${selectedGoals.length > 1 ? 's' : ''} selected`
          }
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: DarkTheme.spacing.lg,
    paddingTop: DarkTheme.spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginBottom: DarkTheme.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginBottom: DarkTheme.spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: DarkTheme.spacing.lg,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DarkTheme.spacing.md,
    borderRadius: DarkTheme.borderRadius.lg,
    borderWidth: 2,
    marginBottom: DarkTheme.spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DarkTheme.spacing.md,
  },
  goalContent: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: 2,
  },
  goalDescription: {
    fontSize: 13,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: DarkTheme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: DarkTheme.spacing.sm,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  countContainer: {
    alignItems: 'center',
    paddingVertical: DarkTheme.spacing.md,
  },
  countText: {
    fontSize: 14,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
});

export default GoalSelectionStep;

