import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { apiGet, apiPost } from '../lib/api/client';
import { useAuth } from '../lib/auth/context';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { DarkTheme } from '../lib/theme';

export function WellnessScreen() {
  const { session } = useAuth();
  const [wellnessData, setWellnessData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWellnessData();
  }, []);

  const loadWellnessData = async () => {
    try {
      const data = await apiGet<{ data: any }>(
        '/api/wellness/data',
        session?.access_token
      );
      setWellnessData(data.data);
    } catch (error) {
      console.error('Failed to load wellness data:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncHealthData = async () => {
    try {
      await apiPost('/api/wellness/sync', {}, session?.access_token);
      Alert.alert('Success', 'Health data synced');
      loadWellnessData();
    } catch (error) {
      Alert.alert('Error', 'Failed to sync health data');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Wellness & Health</Text>
        <Text style={styles.subtitle}>
          Track correlations between health metrics and your scores
        </Text>
      </View>

      <GlassCard style={styles.card}>
        <Text style={styles.cardTitle}>Health Metrics</Text>
        <Text style={styles.metric}>
          Sleep: {wellnessData?.sleepHours || 'N/A'} hours
        </Text>
        <Text style={styles.metric}>
          Exercise: {wellnessData?.exerciseMinutes || 'N/A'} min/week
        </Text>
        <Text style={styles.metric}>
          Water: {wellnessData?.waterIntake || 'N/A'} cups/day
        </Text>
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={styles.cardTitle}>Correlations</Text>
        <Text style={styles.correlation}>
          {wellnessData?.correlations || 'No correlation data available'}
        </Text>
      </GlassCard>

      <PrimaryButton
        title="Sync Health Data"
        onPress={syncHealthData}
        style={styles.button}
      />
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
  subtitle: {
    fontSize: 14,
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
  metric: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.xs,
  },
  correlation: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  button: {
    marginTop: DarkTheme.spacing.md,
  },
  loading: {
    color: DarkTheme.colors.text,
    fontSize: 16,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginTop: DarkTheme.spacing.xl,
  },
});

