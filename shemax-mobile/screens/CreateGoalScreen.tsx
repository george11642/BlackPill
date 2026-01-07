import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Target, Calendar, Activity, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useAuth } from '../lib/auth/context';
import { apiPost, apiGet } from '../lib/api/client';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextInput } from '../components/TextInput';
import { BackHeader } from '../components/BackHeader';
import { GlassCard } from '../components/GlassCard';
import { GradientText } from '../components/GradientText';
import { DarkTheme } from '../lib/theme';

const DEFAULT_GOAL_TYPES = [
  { id: 'score', label: 'Overall Score', icon: Activity, unit: 'pts' },
  { id: 'routine', label: 'Routine Consistency', icon: Target, unit: '%' },
];

interface GoalType {
  id: string;
  label: string;
  icon: string;
  unit: string;
  currentScore?: number | null;
}

export function CreateGoalScreen() {
  const navigation = useNavigation();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [allGoalTypes, setAllGoalTypes] = useState<GoalType[]>(DEFAULT_GOAL_TYPES);
  const [displayedTypes, setDisplayedTypes] = useState<GoalType[]>(DEFAULT_GOAL_TYPES);
  const [showAllTypes, setShowAllTypes] = useState(false);
  
  const [selectedType, setSelectedType] = useState<GoalType>(DEFAULT_GOAL_TYPES[0]);
  const [targetValue, setTargetValue] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [deadline, setDeadline] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // Default 30 days
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadGoalTypes();
  }, []);

  const loadGoalTypes = async () => {
    try {
      setLoadingTypes(true);
      const data = await apiGet<{ goal_types: GoalType[] }>(
        '/api/goals/types',
        session?.access_token
      );
      
      if (data.goal_types && data.goal_types.length > 0) {
        setAllGoalTypes(data.goal_types);
        // Show first 4 types by default (or 6 if small screen)
        const maxDisplay = 4;
        setDisplayedTypes(data.goal_types.slice(0, maxDisplay));
        setSelectedType(data.goal_types[0]);
      }
    } catch (error) {
      console.error('Failed to load goal types:', error);
      // Fallback to default types
      setAllGoalTypes(DEFAULT_GOAL_TYPES);
      setDisplayedTypes(DEFAULT_GOAL_TYPES);
      setSelectedType(DEFAULT_GOAL_TYPES[0]);
    } finally {
      setLoadingTypes(false);
    }
  };

  const toggleShowAll = () => {
    if (showAllTypes) {
      setDisplayedTypes(allGoalTypes.slice(0, 4));
      setShowAllTypes(false);
    } else {
      setDisplayedTypes(allGoalTypes);
      setShowAllTypes(true);
    }
  };

  const handleCreateGoal = async () => {
    if (!targetValue) {
      Alert.alert('Required', 'Please enter a target value');
      return;
    }

    setLoading(true);
    try {
      await apiPost(
        '/api/goals/create',
        {
          goal_type: selectedType.id,
          target_value: parseFloat(targetValue),
          current_value: currentValue ? parseFloat(currentValue) : null,
          deadline: deadline.toISOString(),
          category: selectedType.id, // Send the frontend goal_type ID as category
        },
        session?.access_token
      );
      
      Alert.alert('Success', 'Goal created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <BackHeader title="Set New Goal" variant="large" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <GradientText 
            text="Goal Type"
            fontSize={18}
            fontWeight="700"
            colors={[DarkTheme.colors.primary, DarkTheme.colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.sectionTitleGradient}
          />
          
          {loadingTypes ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={DarkTheme.colors.primary} />
            </View>
          ) : (
            <>
              <View style={styles.typesContainer}>
                {displayedTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeCard,
                      selectedType.id === type.id && styles.selectedTypeCard
                    ]}
                    onPress={() => setSelectedType(type)}
                  >
                    <Activity 
                      size={24} 
                      color={selectedType.id === type.id ? DarkTheme.colors.primary : DarkTheme.colors.textSecondary} 
                    />
                    <Text style={[
                      styles.typeLabel,
                      selectedType.id === type.id && styles.selectedTypeLabel
                    ]}>
                      {type.label}
                    </Text>
                    {type.currentScore !== null && type.currentScore !== undefined && (
                      <Text style={styles.scoreLabel}>
                        {type.currentScore.toFixed(1)}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {allGoalTypes.length > 4 && (
                <TouchableOpacity
                  style={styles.showMoreButton}
                  onPress={toggleShowAll}
                >
                  <Text style={styles.showMoreText}>
                    {showAllTypes ? 'Show Less' : `Show All (${allGoalTypes.length})`}
                  </Text>
                  {showAllTypes ? (
                    <ChevronUp size={16} color={DarkTheme.colors.primary} />
                  ) : (
                    <ChevronDown size={16} color={DarkTheme.colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            </>
          )}

          <View style={styles.formSection}>
            <GlassCard style={styles.inputCard}>
              <Text style={styles.inputLabel}>Target Value ({selectedType.unit})</Text>
              <TextInput
                value={targetValue}
                onChangeText={setTargetValue}
                placeholder="e.g. 8.0"
                keyboardType="decimal-pad"
                style={styles.input}
              />
              
              <Text style={[styles.inputLabel, { marginTop: 16 }]}>Current Value (Optional)</Text>
              <TextInput
                value={currentValue}
                onChangeText={setCurrentValue}
                placeholder="e.g. 6.5"
                keyboardType="decimal-pad"
                style={styles.input}
              />
            </GlassCard>

            <GlassCard style={styles.inputCard}>
              <Text style={styles.inputLabel}>Target Date</Text>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={20} color={DarkTheme.colors.text} />
                <Text style={styles.dateText}>
                  {deadline.toLocaleDateString(undefined, { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </Text>
                <ArrowRight size={16} color={DarkTheme.colors.textTertiary} />
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={deadline}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minimumDate={new Date()}
                  onChange={(event, date) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (date) setDeadline(date);
                  }}
                  themeVariant="dark"
                />
              )}
            </GlassCard>
          </View>

          <PrimaryButton
            title={loading ? 'Creating Goal...' : 'Create Goal'}
            onPress={handleCreateGoal}
            disabled={loading}
            loading={loading}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: DarkTheme.spacing.lg,
    paddingTop: DarkTheme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    marginBottom: DarkTheme.spacing.md,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  sectionTitleGradient: {
    marginBottom: DarkTheme.spacing.md,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.xl,
  },
  typesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DarkTheme.spacing.sm,
    marginBottom: DarkTheme.spacing.md,
  },
  typeCard: {
    width: '48%',
    padding: DarkTheme.spacing.md,
    borderRadius: DarkTheme.borderRadius.md,
    backgroundColor: DarkTheme.colors.card,
    borderWidth: 1,
    borderColor: DarkTheme.colors.borderSubtle,
    alignItems: 'center',
    gap: DarkTheme.spacing.sm,
  },
  selectedTypeCard: {
    borderColor: DarkTheme.colors.primary,
    backgroundColor: `${DarkTheme.colors.primary}15`,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  selectedTypeLabel: {
    color: DarkTheme.colors.primary,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DarkTheme.spacing.sm,
    paddingVertical: DarkTheme.spacing.sm,
    marginBottom: DarkTheme.spacing.xl,
  },
  showMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  formSection: {
    gap: DarkTheme.spacing.md,
    marginBottom: DarkTheme.spacing.xl,
  },
  inputCard: {
    padding: DarkTheme.spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: DarkTheme.colors.textSecondary,
    marginBottom: DarkTheme.spacing.sm,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  input: {
    fontSize: 24,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    padding: 0,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DarkTheme.spacing.md,
    paddingVertical: DarkTheme.spacing.sm,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  submitButton: {
    marginTop: 'auto',
  },
});

