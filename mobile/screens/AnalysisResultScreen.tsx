import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { apiGet } from '../lib/api/client';
import { useAuth } from '../lib/auth/context';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { Analysis } from '../lib/types';
import { DarkTheme } from '../lib/theme';

export function AnalysisResultScreen() {
  const route = useRoute();
  const { session } = useAuth();
  const { analysisId } = route.params as { analysisId: string };
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalysis();
  }, []);

  const loadAnalysis = async () => {
    try {
      const data = await apiGet<{ analysis: Analysis }>(
        `/api/analyses/${analysisId}`,
        session?.access_token
      );
      setAnalysis(data.analysis);
    } catch (error) {
      console.error('Failed to load analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={DarkTheme.colors.primary} />
      </View>
    );
  }

  if (!analysis) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Failed to load analysis</Text>
      </View>
    );
  }

  const dimensions = [
    { label: 'Facial Symmetry', value: analysis.dimensions.facialSymmetry },
    { label: 'Skin Quality', value: analysis.dimensions.skinQuality },
    { label: 'Facial Structure', value: analysis.dimensions.facialStructure },
    { label: 'Eye Area', value: analysis.dimensions.eyeArea },
    { label: 'Nose Area', value: analysis.dimensions.noseArea },
    { label: 'Mouth Area', value: analysis.dimensions.mouthArea },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Analysis Results</Text>
        <Text style={styles.score}>{analysis.score.toFixed(1)}</Text>
        <Text style={styles.subtitle}>Overall Score</Text>
      </View>

      <GlassCard style={styles.card}>
        <Text style={styles.cardTitle}>Dimension Breakdown</Text>
        {dimensions.map((dim, index) => (
          <View key={index} style={styles.dimensionRow}>
            <Text style={styles.dimensionLabel}>{dim.label}</Text>
            <View style={styles.scoreBar}>
              <View
                style={[
                  styles.scoreFill,
                  { width: `${dim.value}%` },
                ]}
              />
            </View>
            <Text style={styles.dimensionValue}>{dim.value.toFixed(1)}</Text>
          </View>
        ))}
      </GlassCard>

      <PrimaryButton
        title="View Recommendations"
        onPress={() => {}}
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
  },
  header: {
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.md,
  },
  score: {
    fontSize: 64,
    fontWeight: '700',
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  subtitle: {
    fontSize: 16,
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
  dimensionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.md,
  },
  dimensionLabel: {
    flex: 1,
    color: DarkTheme.colors.textSecondary,
    fontSize: 14,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  scoreBar: {
    flex: 2,
    height: 8,
    backgroundColor: DarkTheme.colors.card,
    borderRadius: 4,
    marginHorizontal: DarkTheme.spacing.md,
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    backgroundColor: DarkTheme.colors.primary,
    borderRadius: 4,
  },
  dimensionValue: {
    width: 50,
    textAlign: 'right',
    color: DarkTheme.colors.text,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: DarkTheme.typography.fontFamily,
  },
  button: {
    marginTop: DarkTheme.spacing.md,
  },
  error: {
    color: DarkTheme.colors.warning,
    fontSize: 16,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
  },
});

