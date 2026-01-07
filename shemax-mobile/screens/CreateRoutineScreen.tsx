import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft,
  Sparkles,
  Check,
  Clock,
  Zap,
  Target,
  AlertCircle,
  Calendar,
  CalendarDays,
  CalendarClock,
  CalendarRange,
} from 'lucide-react-native';

import { apiGet, apiPost } from '../lib/api/client';
import { useAuth } from '../lib/auth/context';
import { useSubscription } from '../lib/subscription/context';
import { GlassCard } from '../components/GlassCard';
import { IconButton } from '../components/PrimaryButton';
import { LockedFeatureOverlay } from '../components/LockedFeatureOverlay';
import { DarkTheme } from '../lib/theme';

interface Analysis {
  id: string;
  score: number;
  breakdown: Record<string, number>;
  created_at: string;
}

const FOCUS_AREAS = [
  { id: 'skin', label: 'Skin Quality', emoji: '✨', description: 'Clearer, healthier skin' },
  { id: 'jawline', label: 'Jawline', emoji: '💪', description: 'More defined jaw' },
  { id: 'symmetry', label: 'Symmetry', emoji: '⚖️', description: 'Facial balance' },
  { id: 'eyes', label: 'Eyes', emoji: '👁️', description: 'Brighter, healthier eyes' },
  { id: 'cheekbones', label: 'Cheekbones', emoji: '💎', description: 'Enhanced bone structure' },
  { id: 'lips', label: 'Lips', emoji: '👄', description: 'Fuller, healthier lips' },
  { id: 'hair', label: 'Hair', emoji: '💇', description: 'Better hair health' },
  { id: 'femininity', label: 'Femininity', emoji: '🔥', description: 'Feminine features' },
  { id: 'overall', label: 'Overall', emoji: '🎯', description: 'General improvement' },
];

const TIME_COMMITMENTS = [
  { id: 'quick', label: '10-15 min', description: 'Quick daily routine', icon: Zap },
  { id: 'medium', label: '20-30 min', description: 'Balanced approach', icon: Clock },
  { id: 'dedicated', label: '45+ min', description: 'Maximum results', icon: Target },
];

type ScheduleType = 'daily' | 'weekly' | 'monthly' | 'custom';

const SCHEDULE_TYPES = [
  { id: 'daily' as ScheduleType, label: 'Daily', description: 'Every day routine', icon: Calendar },
  { id: 'weekly' as ScheduleType, label: 'Weekly', description: 'Once per week tasks', icon: CalendarDays },
  { id: 'monthly' as ScheduleType, label: 'Monthly', description: 'Once per month tasks', icon: CalendarRange },
  { id: 'custom' as ScheduleType, label: 'Custom', description: 'Select specific days', icon: CalendarClock },
];

type TierPreference = 'all' | 'diy-only' | 'diy-otc';

const TIER_PREFERENCES = [
  { id: 'all' as TierPreference, label: 'All Tiers', emoji: '🎯', description: 'DIY, Products & Professional' },
  { id: 'diy-only' as TierPreference, label: 'DIY Only', emoji: '🏠', description: 'Free habits only' },
  { id: 'diy-otc' as TierPreference, label: 'DIY + Products', emoji: '💪', description: 'Home & over-the-counter' },
];

const DAYS_OF_WEEK = [
  { id: 0, label: 'Sun', short: 'S' },
  { id: 1, label: 'Mon', short: 'M' },
  { id: 2, label: 'Tue', short: 'T' },
  { id: 3, label: 'Wed', short: 'W' },
  { id: 4, label: 'Thu', short: 'T' },
  { id: 5, label: 'Fri', short: 'F' },
  { id: 6, label: 'Sat', short: 'S' },
];

export function CreateRoutineScreen() {
  const navigation = useNavigation();
  const { session } = useAuth();
  const { features } = useSubscription();
  
  const [step, setStep] = useState(1);
  const [latestAnalysis, setLatestAnalysis] = useState<Analysis | null>(null);
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>('medium');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [tierPreference, setTierPreference] = useState<TierPreference>('all');
  const [customGoal, setCustomGoal] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [showAllFocusAreas, setShowAllFocusAreas] = useState(false);

  const headerOpacity = useSharedValue(0);

  useEffect(() => {
    checkRoutineLimit();
    loadLatestAnalysis();
  }, []);

  const checkRoutineLimit = async () => {
    const limit = features.routines.customCount;
    if (limit === 'unlimited') return;

    try {
      const data = await apiGet<{ routines: any[] }>('/api/routines', session?.access_token);
      const count = data.routines?.length || 0;
      if (count >= limit) {
        setIsLimitReached(true);
      }
    } catch (err) {
      console.error('Failed to check routine limit:', err);
    }
  };

  const loadLatestAnalysis = async () => {
    try {
      const data = await apiGet<{ analyses: Analysis[] }>(
        '/api/analyses/history?limit=1',
        session?.access_token
      );
      if (data.analyses && data.analyses.length > 0) {
        setLatestAnalysis(data.analyses[0]);
        // Pre-select weak areas
        const breakdown = data.analyses[0].breakdown;
        const weakAreas = Object.entries(breakdown)
          .filter(([, score]) => score < 7.0)
          .map(([area]) => area);
        setSelectedFocusAreas(weakAreas.length > 0 ? weakAreas : ['overall']);
      }
      headerOpacity.value = withTiming(1, { duration: 500 });
    } catch (err) {
      console.error('Failed to load analysis:', err);
      setError('Failed to load your analysis data');
    } finally {
      setLoading(false);
    }
  };

  const toggleFocusArea = (areaId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFocusAreas((prev: string[]) => {
      if (prev.includes(areaId)) {
        return prev.filter((id: string) => id !== areaId);
      }
      return [...prev, areaId];
    });
  };

  const selectTimeCommitment = (timeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTime(timeId);
  };

  const selectScheduleType = (type: ScheduleType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScheduleType(type);
    // Reset days based on schedule type
    if (type === 'daily') {
      setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    } else if (type === 'weekly' || type === 'monthly') {
      // Weekly and monthly don't need day selection
      setSelectedDays([]);
    }
  };

  const selectTierPreference = (preference: TierPreference) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTierPreference(preference);
  };

  const toggleDay = (dayId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDays((prev: number[]) => {
      if (prev.includes(dayId)) {
        // Don't allow removing the last day
        if (prev.length === 1) return prev;
        return prev.filter((d: number) => d !== dayId);
      }
      return [...prev, dayId].sort();
    });
  };

  const generateRoutine = async () => {
    if (!latestAnalysis) {
      setError('Please complete a face scan first');
      return;
    }

    if (selectedFocusAreas.length === 0) {
      setError('Please select at least one focus area');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const response = await apiPost<{ routine: any }>(
        '/api/routines/generate',
        {
          analysisId: latestAnalysis.id,
          focusAreas: selectedFocusAreas,
          timeCommitment: selectedTime,
          scheduleType: scheduleType,
          daysOfWeek: selectedDays,
          customGoal: customGoal.trim() || undefined,
          tierPreference: tierPreference,
          preferences: {},
        },
        session?.access_token
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Go back to the Routines screen
      navigation.goBack();
    } catch (err: any) {
      console.error('Failed to generate routine:', err);
      setError(err.message || 'Failed to generate routine. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setGenerating(false);
    }
  };

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const getWeakAreas = () => {
    if (!latestAnalysis?.breakdown) return [];
    return Object.entries(latestAnalysis.breakdown)
      .filter(([, score]) => (score as number) < 7.0)
      .sort((a, b) => (a[1] as number) - (b[1] as number))
      .map(([area, score]) => ({ area, score: score as number }));
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[DarkTheme.colors.background, '#0a0a0a']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DarkTheme.colors.primary} />
          <Text style={styles.loadingText}>Loading your analysis...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[DarkTheme.colors.background, '#0a0a0a']}
        style={StyleSheet.absoluteFill}
      />
      
      <LockedFeatureOverlay
        isVisible={isLimitReached}
        title="Routine Limit Reached"
        description={`You have reached the limit of ${features.routines.customCount} active routines. Upgrade to create more.`}
        style={{ zIndex: 100 }}
      />

      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon={<ChevronLeft size={24} color={DarkTheme.colors.text} />}
          onPress={() => navigation.goBack()}
          variant="ghost"
        />
        <Text style={styles.headerTitle}>Create Routine</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* No Analysis Warning */}
        {!latestAnalysis && (
          <Animated.View entering={FadeIn.duration(400)}>
            <GlassCard variant="elevated" style={styles.warningCard}>
              <AlertCircle size={24} color={DarkTheme.colors.warning} />
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>Complete a Scan First</Text>
                <Text style={styles.warningText}>
                  We need to analyze your face to create a personalized routine
                </Text>
              </View>
              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => navigation.navigate('Camera' as never)}
              >
                <Text style={styles.scanButtonText}>Scan Now</Text>
              </TouchableOpacity>
            </GlassCard>
          </Animated.View>
        )}

        {/* Step 1: Focus Areas */}
        <Animated.View entering={FadeIn.delay(200).duration(400)}>
          <Text style={styles.sectionTitle}>1. Select Focus Areas</Text>
          <Text style={styles.sectionSubtitle}>
            Choose what you want to improve (we've pre-selected your weak areas)
          </Text>
          <View style={styles.focusGrid}>
            {(showAllFocusAreas ? FOCUS_AREAS : FOCUS_AREAS.slice(0, 4)).map((area, index) => {
              const isSelected = selectedFocusAreas.includes(area.id);
              const isWeak = (latestAnalysis?.breakdown?.[area.id] ?? 10) < 7.0;
              
              return (
                <TouchableOpacity
                  key={area.id}
                  style={[
                    styles.focusCard,
                    isSelected && styles.focusCardSelected,
                  ]}
                  onPress={() => toggleFocusArea(area.id)}
                >
                  <Text style={styles.focusEmoji}>{area.emoji}</Text>
                  <Text style={[
                    styles.focusLabel,
                    isSelected && styles.focusLabelSelected,
                  ]}>
                    {area.label}
                  </Text>
                  {isWeak && (
                    <View style={styles.weakIndicator}>
                      <Text style={styles.weakIndicatorText}>Weak</Text>
                    </View>
                  )}
                  {isSelected && (
                    <View style={styles.checkContainer}>
                      <Check size={16} color={DarkTheme.colors.background} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            style={styles.showMoreButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowAllFocusAreas(!showAllFocusAreas);
            }}
          >
            <Text style={styles.showMoreText}>
              {showAllFocusAreas ? '▲ Show Less' : `▼ Show More (${FOCUS_AREAS.length - 4} more)`}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Step 2: Time Commitment */}
        <Animated.View entering={FadeIn.delay(400).duration(400)}>
          <Text style={styles.sectionTitle}>2. Daily Time Commitment</Text>
          <Text style={styles.sectionSubtitle}>
            How much time can you dedicate each day?
          </Text>
          <View style={styles.timeOptions}>
            {TIME_COMMITMENTS.map((time) => {
              const isSelected = selectedTime === time.id;
              const Icon = time.icon;
              
              return (
                <TouchableOpacity
                  key={time.id}
                  style={[
                    styles.timeCard,
                    isSelected && styles.timeCardSelected,
                  ]}
                  onPress={() => selectTimeCommitment(time.id)}
                >
                  <Icon
                    size={24}
                    color={isSelected ? DarkTheme.colors.primary : DarkTheme.colors.textSecondary}
                  />
                  <Text style={[
                    styles.timeLabel,
                    isSelected && styles.timeLabelSelected,
                  ]}>
                    {time.label}
                  </Text>
                  <Text style={styles.timeDescription}>{time.description}</Text>
                  {isSelected && (
                    <View style={styles.timeCheckContainer}>
                      <Check size={16} color={DarkTheme.colors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* Step 3: Schedule Type */}
        <Animated.View entering={FadeIn.delay(600).duration(400)}>
          <Text style={styles.sectionTitle}>3. Schedule Type</Text>
          <Text style={styles.sectionSubtitle}>
            How often do you want to follow this routine?
          </Text>
          <View style={styles.scheduleOptions}>
            {SCHEDULE_TYPES.map((schedule) => {
              const isSelected = scheduleType === schedule.id;
              const Icon = schedule.icon;
              
              return (
                <TouchableOpacity
                  key={schedule.id}
                  style={[
                    styles.scheduleCard,
                    isSelected && styles.scheduleCardSelected,
                  ]}
                  onPress={() => selectScheduleType(schedule.id)}
                >
                  <Icon
                    size={20}
                    color={isSelected ? DarkTheme.colors.primary : DarkTheme.colors.textSecondary}
                  />
                  <Text style={[
                    styles.scheduleLabel,
                    isSelected && styles.scheduleLabelSelected,
                  ]}>
                    {schedule.label}
                  </Text>
                  {isSelected && (
                    <View style={styles.scheduleCheckContainer}>
                      <Check size={14} color={DarkTheme.colors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Day Selector for Custom Schedule */}
          {scheduleType === 'custom' && (
            <View style={styles.daysContainer}>
              <Text style={styles.daysLabel}>Select days:</Text>
              <View style={styles.daysRow}>
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = selectedDays.includes(day.id);
                  
                  return (
                    <TouchableOpacity
                      key={day.id}
                      style={[
                        styles.dayButton,
                        isSelected && styles.dayButtonSelected,
                      ]}
                      onPress={() => toggleDay(day.id)}
                    >
                      <Text style={[
                        styles.dayButtonText,
                        isSelected && styles.dayButtonTextSelected,
                      ]}>
                        {day.short}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.daysHint}>
                {selectedDays.length === 7 
                  ? 'Every day' 
                  : `${selectedDays.length} days per week`}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Step 4: Tier Preference */}
        <Animated.View entering={FadeIn.delay(700).duration(400)}>
          <Text style={styles.sectionTitle}>4. Routine Approach</Text>
          <Text style={styles.sectionSubtitle}>
            What types of tasks do you want to include?
          </Text>
          <View style={styles.tierOptions}>
            {TIER_PREFERENCES.map((tier) => {
              const isSelected = tierPreference === tier.id;
              
              return (
                <TouchableOpacity
                  key={tier.id}
                  style={[
                    styles.tierCard,
                    isSelected && styles.tierCardSelected,
                  ]}
                  onPress={() => selectTierPreference(tier.id)}
                >
                  <Text style={styles.tierEmoji}>{tier.emoji}</Text>
                  <Text style={[
                    styles.tierLabel,
                    isSelected && styles.tierLabelSelected,
                  ]}>
                    {tier.label}
                  </Text>
                  <Text style={styles.tierDescription}>{tier.description}</Text>
                  {isSelected && (
                    <View style={styles.tierCheckContainer}>
                      <Check size={16} color={DarkTheme.colors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* Step 5: Custom Goal (Optional) */}
        <Animated.View entering={FadeIn.delay(800).duration(400)}>
          <Text style={styles.sectionTitle}>5. Custom Goal (Optional)</Text>
          <Text style={styles.sectionSubtitle}>
            Describe your specific goals for more personalized tasks
          </Text>
          <View style={styles.customGoalContainer}>
            <TextInput
              style={styles.customGoalInput}
              placeholder="e.g., Preparing for a wedding in 3 months, want to reduce acne scars, improve jawline definition..."
              placeholderTextColor={DarkTheme.colors.textTertiary}
              value={customGoal}
              onChangeText={setCustomGoal}
              multiline
              numberOfLines={3}
              maxLength={300}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>
              {customGoal.length}/300
            </Text>
          </View>
        </Animated.View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <AlertCircle size={20} color={DarkTheme.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Generate Button */}
        <Animated.View entering={FadeIn.delay(900).duration(400)}>
          <TouchableOpacity
            style={[
              styles.generateButton,
              (!latestAnalysis || selectedFocusAreas.length === 0 || generating) && styles.generateButtonDisabled,
            ]}
            onPress={generateRoutine}
            disabled={!latestAnalysis || selectedFocusAreas.length === 0 || generating}
          >
            <LinearGradient
              colors={
                generating || !latestAnalysis || selectedFocusAreas.length === 0
                  ? [DarkTheme.colors.surface, DarkTheme.colors.surface]
                  : [DarkTheme.colors.primary, DarkTheme.colors.primaryDark]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.generateGradient}
            >
              {generating ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.generateText}>Generating Your Routine...</Text>
                </>
              ) : (
                <>
                  <Sparkles size={22} color="#fff" />
                  <Text style={styles.generateText}>Generate My Routine</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Info Card */}
        <Animated.View entering={FadeIn.delay(900).duration(400)}>
          <GlassCard variant="subtle" style={styles.infoCard}>
            <Sparkles size={20} color={DarkTheme.colors.primary} />
            <Text style={styles.infoText}>
              Our AI will create a personalized daily routine with morning and evening tasks tailored to your specific needs.
            </Text>
          </GlassCard>
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: DarkTheme.spacing.md,
  },
  loadingText: {
    fontSize: 16,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DarkTheme.spacing.md,
    paddingTop: 60,
    paddingBottom: DarkTheme.spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: DarkTheme.spacing.lg,
    paddingBottom: 40,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DarkTheme.spacing.md,
    marginBottom: DarkTheme.spacing.lg,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DarkTheme.colors.warning,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  warningText: {
    fontSize: 13,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  scanButton: {
    backgroundColor: DarkTheme.colors.warning,
    paddingHorizontal: DarkTheme.spacing.md,
    paddingVertical: DarkTheme.spacing.sm,
    borderRadius: DarkTheme.borderRadius.md,
  },
  scanButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: DarkTheme.colors.background,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.md,
  },
  focusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DarkTheme.spacing.sm,
    marginBottom: DarkTheme.spacing.xl,
  },
  focusCard: {
    width: '48%',
    backgroundColor: DarkTheme.colors.surface,
    borderRadius: DarkTheme.borderRadius.lg,
    padding: DarkTheme.spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  focusCardSelected: {
    borderColor: DarkTheme.colors.primary,
    backgroundColor: `${DarkTheme.colors.primary}15`,
  },
  focusEmoji: {
    fontSize: 28,
    marginBottom: DarkTheme.spacing.xs,
  },
  focusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  focusLabelSelected: {
    color: DarkTheme.colors.primary,
  },
  weakIndicator: {
    position: 'absolute',
    top: DarkTheme.spacing.xs,
    right: DarkTheme.spacing.xs,
    backgroundColor: `${DarkTheme.colors.error}30`,
    paddingHorizontal: DarkTheme.spacing.xs,
    paddingVertical: 2,
    borderRadius: DarkTheme.borderRadius.sm,
  },
  weakIndicatorText: {
    fontSize: 10,
    color: DarkTheme.colors.error,
    fontFamily: DarkTheme.typography.fontFamily,
    fontWeight: '600',
  },
  checkContainer: {
    position: 'absolute',
    top: DarkTheme.spacing.xs,
    left: DarkTheme.spacing.xs,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: DarkTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  showMoreButton: {
    alignItems: 'center',
    paddingVertical: DarkTheme.spacing.sm,
    marginBottom: DarkTheme.spacing.md,
  },
  showMoreText: {
    fontSize: 14,
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
    fontWeight: '600',
  },
  timeOptions: {
    gap: DarkTheme.spacing.sm,
    marginBottom: DarkTheme.spacing.xl,
  },
  timeCard: {
    backgroundColor: DarkTheme.colors.surface,
    borderRadius: DarkTheme.borderRadius.lg,
    padding: DarkTheme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DarkTheme.spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  timeCardSelected: {
    borderColor: DarkTheme.colors.primary,
    backgroundColor: `${DarkTheme.colors.primary}15`,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  timeLabelSelected: {
    color: DarkTheme.colors.primary,
  },
  timeDescription: {
    fontSize: 13,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    flex: 1,
  },
  timeCheckContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${DarkTheme.colors.primary}30`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleOptions: {
    flexDirection: 'row',
    gap: DarkTheme.spacing.sm,
    marginBottom: DarkTheme.spacing.lg,
  },
  scheduleCard: {
    flex: 1,
    backgroundColor: DarkTheme.colors.surface,
    borderRadius: DarkTheme.borderRadius.lg,
    padding: DarkTheme.spacing.md,
    alignItems: 'center',
    gap: DarkTheme.spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  scheduleCardSelected: {
    borderColor: DarkTheme.colors.primary,
    backgroundColor: `${DarkTheme.colors.primary}15`,
  },
  scheduleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  scheduleLabelSelected: {
    color: DarkTheme.colors.primary,
  },
  scheduleCheckContainer: {
    position: 'absolute',
    top: DarkTheme.spacing.xs,
    right: DarkTheme.spacing.xs,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: `${DarkTheme.colors.primary}30`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysContainer: {
    marginBottom: DarkTheme.spacing.xl,
  },
  daysLabel: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.sm,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: DarkTheme.spacing.xs,
  },
  dayButton: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 44,
    backgroundColor: DarkTheme.colors.surface,
    borderRadius: DarkTheme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayButtonSelected: {
    borderColor: DarkTheme.colors.primary,
    backgroundColor: `${DarkTheme.colors.primary}30`,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  dayButtonTextSelected: {
    color: DarkTheme.colors.primary,
  },
  daysHint: {
    fontSize: 12,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginTop: DarkTheme.spacing.sm,
    textAlign: 'center',
  },
  tierOptions: {
    flexDirection: 'row',
    gap: DarkTheme.spacing.sm,
    marginBottom: DarkTheme.spacing.xl,
  },
  tierCard: {
    flex: 1,
    backgroundColor: DarkTheme.colors.surface,
    borderRadius: DarkTheme.borderRadius.lg,
    padding: DarkTheme.spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  tierCardSelected: {
    borderColor: DarkTheme.colors.primary,
    backgroundColor: `${DarkTheme.colors.primary}15`,
  },
  tierEmoji: {
    fontSize: 28,
    marginBottom: DarkTheme.spacing.xs,
  },
  tierLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: 2,
  },
  tierLabelSelected: {
    color: DarkTheme.colors.primary,
  },
  tierDescription: {
    fontSize: 12,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
  },
  tierCheckContainer: {
    position: 'absolute',
    top: DarkTheme.spacing.xs,
    right: DarkTheme.spacing.xs,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: `${DarkTheme.colors.primary}30`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customGoalContainer: {
    marginBottom: DarkTheme.spacing.xl,
  },
  customGoalInput: {
    backgroundColor: DarkTheme.colors.surface,
    borderRadius: DarkTheme.borderRadius.lg,
    padding: DarkTheme.spacing.md,
    paddingTop: DarkTheme.spacing.md,
    fontSize: 15,
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    minHeight: 100,
    borderWidth: 1,
    borderColor: DarkTheme.colors.borderSubtle,
  },
  charCount: {
    fontSize: 12,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'right',
    marginTop: DarkTheme.spacing.xs,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DarkTheme.spacing.sm,
    backgroundColor: `${DarkTheme.colors.error}20`,
    padding: DarkTheme.spacing.md,
    borderRadius: DarkTheme.borderRadius.md,
    marginBottom: DarkTheme.spacing.lg,
  },
  errorText: {
    fontSize: 14,
    color: DarkTheme.colors.error,
    fontFamily: DarkTheme.typography.fontFamily,
    flex: 1,
  },
  generateButton: {
    borderRadius: DarkTheme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: DarkTheme.spacing.lg,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DarkTheme.spacing.sm,
    paddingVertical: DarkTheme.spacing.lg,
  },
  generateText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    fontFamily: DarkTheme.typography.fontFamily,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DarkTheme.spacing.sm,
  },
  infoText: {
    fontSize: 13,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    flex: 1,
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default CreateRoutineScreen;

