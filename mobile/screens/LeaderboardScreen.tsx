import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
} from 'react-native';
import { apiGet } from '../lib/api/client';
import { useAuth } from '../lib/auth/context';
import { GlassCard } from '../components/GlassCard';
import { LeaderboardEntry } from '../lib/types';
import { DarkTheme } from '../lib/theme';

export function LeaderboardScreen() {
  const { session } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'referrals'>('all');

  useEffect(() => {
    loadLeaderboard();
  }, [filter]);

  const loadLeaderboard = async () => {
    try {
      const endpoint =
        filter === 'referrals'
          ? '/api/leaderboard/referrals'
          : '/api/leaderboard';
      const data = await apiGet<{ entries: LeaderboardEntry[] }>(
        endpoint,
        session?.access_token
      );
      setEntries(data.entries);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;

    return (
      <GlassCard style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rank}>
            {medal ? (
              <Text style={styles.medal}>{medal}</Text>
            ) : (
              <Text style={styles.rankText}>#{item.rank}</Text>
            )}
          </View>
          {item.avatarUrl && (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
          )}
          <View style={styles.info}>
            <Text style={styles.username}>{item.username || 'Anonymous'}</Text>
            <Text style={styles.score}>{item.score.toFixed(1)} points</Text>
          </View>
        </View>
      </GlassCard>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <View style={styles.filters}>
          <Text
            style={[styles.filter, filter === 'all' && styles.filterActive]}
            onPress={() => setFilter('all')}
          >
            All
          </Text>
          <Text
            style={[styles.filter, filter === 'referrals' && styles.filterActive]}
            onPress={() => setFilter('referrals')}
          >
            Referrals
          </Text>
        </View>
      </View>
      <FlatList
        data={entries}
        renderItem={renderItem}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
  },
  header: {
    padding: DarkTheme.spacing.lg,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.md,
  },
  filters: {
    flexDirection: 'row',
    gap: DarkTheme.spacing.md,
  },
  filter: {
    fontSize: 14,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
    paddingVertical: DarkTheme.spacing.xs,
    paddingHorizontal: DarkTheme.spacing.md,
    borderRadius: DarkTheme.borderRadius.sm,
    backgroundColor: DarkTheme.colors.card,
  },
  filterActive: {
    color: DarkTheme.colors.primary,
    backgroundColor: DarkTheme.colors.hover,
  },
  list: {
    padding: DarkTheme.spacing.md,
  },
  card: {
    marginBottom: DarkTheme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rank: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: '600',
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  medal: {
    fontSize: 24,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: DarkTheme.spacing.md,
  },
  info: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.xs,
  },
  score: {
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

