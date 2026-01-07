import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import {
  Sparkles,
  AlertTriangle,
  TrendingDown,
  Target,
  CheckCircle,
  ChevronRight,
} from 'lucide-react-native';

import { GlassCard } from './GlassCard';
import { DarkTheme } from '../lib/theme';
import type { RoutineSuggestion } from '../lib/routines/routineSuggestionEngine';

interface RoutineSuggestionCardProps {
  suggestion: RoutineSuggestion;
  onAction?: () => void;
}

const SUGGESTION_ICONS: Record<string, React.ElementType> = {
  first_analysis: CheckCircle,
  new_weak_area: AlertTriangle,
  declining_trend: TrendingDown,
  no_routine: Sparkles,
  improvement_opportunity: Target,
  no_suggestion: CheckCircle,
};

const SUGGESTION_COLORS: Record<string, string> = {
  first_analysis: DarkTheme.colors.success,
  new_weak_area: DarkTheme.colors.warning,
  declining_trend: DarkTheme.colors.error,
  no_routine: DarkTheme.colors.primary,
  improvement_opportunity: DarkTheme.colors.info,
  no_suggestion: DarkTheme.colors.success,
};

export function RoutineSuggestionCard({ suggestion, onAction }: RoutineSuggestionCardProps) {
  const navigation = useNavigation();
  const Icon = SUGGESTION_ICONS[suggestion.type] || Sparkles;
  const iconColor = SUGGESTION_COLORS[suggestion.type] || DarkTheme.colors.primary;

  const handleAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onAction) {
      onAction();
    } else {
      navigation.navigate('CreateRoutine' as never);
    }
  };

  // Don't show card if no suggestion needed and not actionable
  if (suggestion.type === 'no_suggestion' && !suggestion.showAction) {
    return (
      <GlassCard variant="subtle" style={styles.successCard}>
        <CheckCircle size={20} color={DarkTheme.colors.success} />
        <Text style={styles.successText}>{suggestion.message}</Text>
      </GlassCard>
    );
  }

  return (
    <GlassCard 
      variant={suggestion.priority === 'high' ? 'elevated' : 'subtle'} 
      style={[
        styles.card,
        suggestion.priority === 'high' && styles.cardHighPriority,
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
          <Icon size={20} color={iconColor} />
        </View>
        <View style={styles.content}>
          <Text style={styles.message}>{suggestion.message}</Text>
          {suggestion.reason && (
            <Text style={styles.reason}>{suggestion.reason}</Text>
          )}
          {suggestion.weakAreas && suggestion.weakAreas.length > 0 && (
            <View style={styles.tagsContainer}>
              {suggestion.weakAreas.slice(0, 3).map((area) => (
                <View key={area} style={styles.tag}>
                  <Text style={styles.tagText}>{area}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {suggestion.showAction && suggestion.actionLabel && (
        <TouchableOpacity onPress={handleAction} style={styles.actionButton}>
          <LinearGradient
            colors={[DarkTheme.colors.primary, DarkTheme.colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionGradient}
          >
            <Text style={styles.actionText}>{suggestion.actionLabel}</Text>
            <ChevronRight size={18} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: DarkTheme.spacing.md,
  },
  cardHighPriority: {
    borderWidth: 1,
    borderColor: `${DarkTheme.colors.warning}40`,
  },
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DarkTheme.spacing.sm,
    marginBottom: DarkTheme.spacing.md,
  },
  successText: {
    flex: 1,
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DarkTheme.spacing.md,
    marginBottom: DarkTheme.spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  message: {
    fontSize: 15,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.xs,
  },
  reason: {
    fontSize: 13,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DarkTheme.spacing.xs,
    marginTop: DarkTheme.spacing.sm,
  },
  tag: {
    backgroundColor: `${DarkTheme.colors.warning}20`,
    paddingHorizontal: DarkTheme.spacing.sm,
    paddingVertical: DarkTheme.spacing.xs,
    borderRadius: DarkTheme.borderRadius.sm,
  },
  tagText: {
    fontSize: 12,
    color: DarkTheme.colors.warning,
    fontFamily: DarkTheme.typography.fontFamily,
    textTransform: 'capitalize',
  },
  actionButton: {
    borderRadius: DarkTheme.borderRadius.md,
    overflow: 'hidden',
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DarkTheme.spacing.xs,
    paddingVertical: DarkTheme.spacing.sm,
    paddingHorizontal: DarkTheme.spacing.md,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    fontFamily: DarkTheme.typography.fontFamily,
  },
});

export default RoutineSuggestionCard;

