import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { apiGet, apiPost } from '../lib/api/client';
import { useAuth } from '../lib/auth/context';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { Challenge } from '../lib/types';
import { DarkTheme } from '../lib/theme';

export function ChallengeDetailScreen() {
  const route = useRoute();
  const { session } = useAuth();
  const { challengeId } = route.params as { challengeId: string };
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenge();
  }, []);

  const loadChallenge = async () => {
    try {
      const data = await apiGet<{ challenge: Challenge }>(
        `/api/challenges/${challengeId}`,
        session?.access_token
      );
      setChallenge(data.challenge);
    } catch (error) {
      console.error('Failed to load challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinChallenge = async () => {
    try {
      await apiPost(
        '/api/challenges/join',
        { challengeId },
        session?.access_token
      );
      if (challenge) {
        setChallenge({ ...challenge, joined: true });
      }
    } catch (error) {
      console.error('Failed to join challenge:', error);
    }
  };

  const checkIn = async () => {
    try {
      await apiPost(
        '/api/challenges/checkin',
        { challengeId },
        session?.access_token
      );
      Alert.alert('Success', 'Check-in recorded!');
    } catch (error) {
      Alert.alert('Error', 'Failed to check in');
    }
  };

  if (loading || !challenge) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  const startDate = new Date(challenge.startDate);
  const endDate = new Date(challenge.endDate);
  const today = new Date();
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{challenge.name}</Text>
        <Text style={styles.description}>{challenge.description}</Text>
      </View>

      <GlassCard style={styles.card}>
        <Text style={styles.cardTitle}>Challenge Details</Text>
        <Text style={styles.detail}>
          Duration: {challenge.duration} days
        </Text>
        <Text style={styles.detail}>
          Participants: {challenge.participants}
        </Text>
        <Text style={styles.detail}>
          Days Remaining: {daysRemaining}
        </Text>
      </GlassCard>

      {challenge.joined ? (
        <PrimaryButton
          title="Check In Today"
          onPress={checkIn}
          style={styles.button}
        />
      ) : (
        <PrimaryButton
          title="Join Challenge"
          onPress={joinChallenge}
          style={styles.button}
        />
      )}
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
  description: {
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
  detail: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.xs,
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

