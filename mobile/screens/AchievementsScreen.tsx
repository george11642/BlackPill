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
import { Achievement } from '../lib/types';
import { DarkTheme } from '../lib/theme';

export function AchievementsScreen() {
  const { session } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const data = await apiGet<{ achievements: Achievement[] }>(
        '/api/achievements/list',
        session?.access_token
      );
      setAchievements(data.achievements);
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Achievement }) => (
    <GlassCard style={[styles.card, !item.unlocked && styles.locked]}>
      <View style={styles.row}>
        <Image source={{ uri: item.iconUrl }} style={styles.icon} />
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.description}>{item.description}</Text>
          {item.unlocked && item.unlockedAt && (
            <Text style={styles.unlockedDate}>
              Unlocked {new Date(item.unlockedAt).toLocaleDateString()}
            </Text>
          )}
        </View>
        {item.unlocked && <Text style={styles.badge}>✓</Text>}
      </View>
    </GlassCard>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Achievements</Text>
        <Text style={styles.subtitle}>
          {unlockedCount} / {achievements.length} unlocked
        </Text>
      </View>
      <FlatList
        data={achievements}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
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
    marginBottom: DarkTheme.spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  list: {
    padding: DarkTheme.spacing.md,
  },
  card: {
    marginBottom: DarkTheme.spacing.md,
  },
  locked: {
    opacity: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: DarkTheme.spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.xs,
  },
  description: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.xs,
  },
  unlockedDate: {
    fontSize: 12,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  badge: {
    fontSize: 24,
    color: DarkTheme.colors.success,
  },
  loading: {
    color: DarkTheme.colors.text,
    fontSize: 16,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginTop: DarkTheme.spacing.xl,
  },
});

