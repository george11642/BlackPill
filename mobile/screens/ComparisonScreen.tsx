import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { apiGet } from '../lib/api/client';
import { useAuth } from '../lib/auth/context';
import { GlassCard } from '../components/GlassCard';
import { Analysis } from '../lib/types';
import { DarkTheme } from '../lib/theme';

export function ComparisonScreen() {
  const route = useRoute();
  const { session } = useAuth();
  const { analysisId1, analysisId2 } = route.params as {
    analysisId1: string;
    analysisId2: string;
  };
  const [analysis1, setAnalysis1] = useState<Analysis | null>(null);
  const [analysis2, setAnalysis2] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComparisons();
  }, []);

  const loadComparisons = async () => {
    try {
      const [data1, data2] = await Promise.all([
        apiGet<{ analysis: Analysis }>(
          `/api/analyses/${analysisId1}`,
          session?.access_token
        ),
        apiGet<{ analysis: Analysis }>(
          `/api/analyses/${analysisId2}`,
          session?.access_token
        ),
      ]);
      setAnalysis1(data1.analysis);
      setAnalysis2(data2.analysis);
    } catch (error) {
      console.error('Failed to load comparisons:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analysis1 || !analysis2) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  const scoreDelta = analysis2.score - analysis1.score;
  const dimensions = [
    { key: 'facialSymmetry', label: 'Facial Symmetry' },
    { key: 'skinQuality', label: 'Skin Quality' },
    { key: 'facialStructure', label: 'Facial Structure' },
    { key: 'eyeArea', label: 'Eye Area' },
    { key: 'noseArea', label: 'Nose Area' },
    { key: 'mouthArea', label: 'Mouth Area' },
  ] as const;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress Comparison</Text>
        <Text style={styles.delta}>
          {scoreDelta > 0 ? '+' : ''}
          {scoreDelta.toFixed(1)} points
        </Text>
      </View>

      <View style={styles.comparison}>
        <View style={styles.side}>
          <Image source={{ uri: analysis1.photoUrl }} style={styles.image} />
          <Text style={styles.score}>{analysis1.score.toFixed(1)}</Text>
          <Text style={styles.date}>
            {new Date(analysis1.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.vs}>
          <Text style={styles.vsText}>VS</Text>
        </View>

        <View style={styles.side}>
          <Image source={{ uri: analysis2.photoUrl }} style={styles.image} />
          <Text style={styles.score}>{analysis2.score.toFixed(1)}</Text>
          <Text style={styles.date}>
            {new Date(analysis2.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <GlassCard style={styles.card}>
        <Text style={styles.cardTitle}>Dimension Changes</Text>
        {dimensions.map((dim) => {
          const val1 = analysis1.dimensions[dim.key];
          const val2 = analysis2.dimensions[dim.key];
          const delta = val2 - val1;
          return (
            <View key={dim.key} style={styles.dimensionRow}>
              <Text style={styles.dimensionLabel}>{dim.label}</Text>
              <Text
                style={[
                  styles.deltaValue,
                  { color: delta > 0 ? DarkTheme.colors.success : DarkTheme.colors.warning },
                ]}
              >
                {delta > 0 ? '+' : ''}
                {delta.toFixed(1)}
              </Text>
            </View>
          );
        })}
      </GlassCard>
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
    marginBottom: DarkTheme.spacing.sm,
  },
  delta: {
    fontSize: 32,
    fontWeight: '700',
    color: DarkTheme.colors.success,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  comparison: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.xl,
  },
  side: {
    alignItems: 'center',
    flex: 1,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: DarkTheme.borderRadius.md,
    marginBottom: DarkTheme.spacing.md,
  },
  score: {
    fontSize: 24,
    fontWeight: '700',
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.xs,
  },
  date: {
    fontSize: 12,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  vs: {
    paddingHorizontal: DarkTheme.spacing.md,
  },
  vsText: {
    fontSize: 18,
    fontWeight: '700',
    color: DarkTheme.colors.textTertiary,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.md,
  },
  dimensionLabel: {
    color: DarkTheme.colors.textSecondary,
    fontSize: 14,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  deltaValue: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: DarkTheme.typography.fontFamily,
  },
  loading: {
    color: DarkTheme.colors.text,
    fontSize: 16,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginTop: DarkTheme.spacing.xl,
  },
});

