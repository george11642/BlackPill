import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiGet } from '../lib/api/client';
import { useAuth } from '../lib/auth/context';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { Challenge } from '../lib/types';
import { DarkTheme } from '../lib/theme';

export function ChallengesScreen() {
  const navigation = useNavigation();
  const { session } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const data = await apiGet<{ challenges: Challenge[] }>(
        '/api/challenges/list',
        session?.access_token
      );
      setChallenges(data.challenges);
    } catch (error) {
      console.error('Failed to load challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Challenge }) => (
    <GlassCard style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.description}>{item.description}</Text>
      <View style={styles.meta}>
        <Text style={styles.metaText}>
          {item.duration} days • {item.participants} participants
        </Text>
      </View>
      <PrimaryButton
        title={item.joined ? 'View Progress' : 'Join Challenge'}
        onPress={() =>
          navigation.navigate('ChallengeDetail' as never, { challengeId: item.id } as never)
        }
        variant={item.joined ? 'secondary' : 'primary'}
        style={styles.button}
      />
    </GlassCard>
  );

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
        <Text style={styles.title}>Challenges</Text>
      </View>
      <FlatList
        data={challenges}
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
  },
  list: {
    padding: DarkTheme.spacing.md,
  },
  card: {
    marginBottom: DarkTheme.spacing.md,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.xs,
  },
  description: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.md,
  },
  meta: {
    marginBottom: DarkTheme.spacing.md,
  },
  metaText: {
    fontSize: 12,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  button: {
    marginTop: DarkTheme.spacing.sm,
  },
  loading: {
    color: DarkTheme.colors.text,
    fontSize: 16,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginTop: DarkTheme.spacing.xl,
  },
});

