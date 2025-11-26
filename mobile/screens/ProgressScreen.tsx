import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { apiGet } from '../lib/api/client';
import { useAuth } from '../lib/auth/context';
import { GlassCard } from '../components/GlassCard';
import { DarkTheme } from '../lib/theme';

const screenWidth = Dimensions.get('window').width;

export function ProgressScreen() {
  const { session } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await apiGet<{ stats: any }>(
        '/api/routines/stats',
        session?.access_token
      );
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: stats.weeklyScores || [0, 0, 0, 0, 0, 0, 0],
        color: (opacity = 1) => DarkTheme.colors.primary,
        strokeWidth: 2,
      },
    ],
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Progress</Text>
      </View>

      <GlassCard style={styles.card}>
        <Text style={styles.cardTitle}>Weekly Score Trend</Text>
        <LineChart
          data={chartData}
          width={screenWidth - 64}
          height={220}
          chartConfig={{
            backgroundColor: DarkTheme.colors.card,
            backgroundGradientFrom: DarkTheme.colors.card,
            backgroundGradientTo: DarkTheme.colors.card,
            decimalPlaces: 1,
            color: (opacity = 1) => DarkTheme.colors.primary,
            labelColor: (opacity = 1) => DarkTheme.colors.textSecondary,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: DarkTheme.colors.primary,
            },
          }}
          bezier
          style={styles.chart}
        />
      </GlassCard>

      <View style={styles.statsGrid}>
        <GlassCard style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalAnalyses || 0}</Text>
          <Text style={styles.statLabel}>Total Analyses</Text>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <Text style={styles.statValue}>{stats.currentStreak || 0}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <Text style={styles.statValue}>{stats.averageScore?.toFixed(1) || '0.0'}</Text>
          <Text style={styles.statLabel}>Avg Score</Text>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <Text style={styles.statValue}>{stats.completedTasks || 0}</Text>
          <Text style={styles.statLabel}>Tasks Done</Text>
        </GlassCard>
      </View>
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
  chart: {
    marginVertical: DarkTheme.spacing.md,
    borderRadius: DarkTheme.borderRadius.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    marginBottom: DarkTheme.spacing.md,
    alignItems: 'center',
    padding: DarkTheme.spacing.lg,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.xs,
  },
  statLabel: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
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

