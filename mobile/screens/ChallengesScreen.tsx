import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiGet } from '../lib/api/client';
import { useAuth } from '../lib/auth/context';
import { useSubscription } from '../lib/subscription/context';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { BackHeader } from '../components/BackHeader';
import { LockedFeatureOverlay } from '../components/LockedFeatureOverlay';
import { Challenge } from '../lib/types';
import { DarkTheme } from '../lib/theme';

export function ChallengesScreen() {
  const navigation = useNavigation();
  const { session } = useAuth();
  const { features } = useSubscription();
  const isLocked = features.challenges.access === 'locked';
  
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      setError(null);
      const data = await apiGet<{ challenges: Challenge[] }>(
        '/api/challenges',
        session?.access_token
      );
      console.log('Challenges data:', data);
      setChallenges(data.challenges || []);
    } catch (error: any) {
      console.error('Failed to load challenges:', error);
      setError(error.message || 'Failed to load challenges');
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
        <BackHeader title="Challenges" variant="large" />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={DarkTheme.colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <BackHeader title="Challenges" variant="large" />
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
          <PrimaryButton title="Retry" onPress={loadChallenges} style={{ marginTop: 20 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackHeader title="Challenges" variant="large" />
      <LockedFeatureOverlay
        isVisible={isLocked}
        title="Challenges Locked"
        description="Join the community and compete in challenges. Upgrade to Pro or Elite to unlock."
        style={{ marginTop: 60 }}
      />
      <FlatList
        data={challenges}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, isLocked && styles.listLocked]}
        scrollEnabled={!isLocked}
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No challenges available right now.</Text>
              <Text style={styles.emptySubtext}>Check back later!</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: DarkTheme.spacing.md,
  },
  listLocked: {
    opacity: 0.3,
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
  loadingText: {
    color: DarkTheme.colors.text,
    fontSize: 16,
    fontFamily: DarkTheme.typography.fontFamily,
    marginTop: DarkTheme.spacing.md,
  },
  errorText: {
    color: DarkTheme.colors.error,
    fontSize: 16,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: DarkTheme.colors.text,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
  },
  emptySubtext: {
    color: DarkTheme.colors.textSecondary,
    fontSize: 14,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginTop: 8,
  },
});
