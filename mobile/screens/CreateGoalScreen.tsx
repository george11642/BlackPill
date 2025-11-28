import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Target, Calendar, Activity, ArrowRight } from 'lucide-react-native';
import { useAuth } from '../lib/auth/context';
import { apiPost } from '../lib/api/client';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextInput } from '../components/TextInput';
import { BackHeader } from '../components/BackHeader';
import { GlassCard } from '../components/GlassCard';
import { DarkTheme } from '../lib/theme';

const GOAL_TYPES = [
  { id: 'score', label: 'Overall Score', icon: Activity, unit: 'pts' },
  { id: 'skin', label: 'Skin Quality', icon: Activity, unit: 'pts' },
  { id: 'jawline', label: 'Jawline', icon: Activity, unit: 'pts' },
  { id: 'routine', label: 'Routine Consistency', icon: Target, unit: '%' },
];

export function CreateGoalScreen() {
  const navigation = useNavigation();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [selectedType, setSelectedType] = useState(GOAL_TYPES[0]);
  const [targetValue, setTargetValue] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [deadline, setDeadline] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // Default 30 days
  const [showDatePicker, setShowDatePicker] = useState(false);

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
          category: selectedType.id === 'routine' ? 'habit' : 'analysis',
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
          <Text style={styles.sectionTitle}>Goal Type</Text>
          <View style={styles.typesContainer}>
            {GOAL_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeCard,
                  selectedType.id === type.id && styles.selectedTypeCard
                ]}
                onPress={() => setSelectedType(type)}
              >
                <type.icon 
                  size={24} 
                  color={selectedType.id === type.id ? DarkTheme.colors.primary : DarkTheme.colors.textSecondary} 
                />
                <Text style={[
                  styles.typeLabel,
                  selectedType.id === type.id && styles.selectedTypeLabel
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

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
  typesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DarkTheme.spacing.sm,
    marginBottom: DarkTheme.spacing.xl,
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

