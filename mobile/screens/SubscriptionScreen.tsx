import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { apiGet, apiPost } from '../lib/api/client';
import { useAuth } from '../lib/auth/context';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { Subscription } from '../lib/types';
import { DarkTheme } from '../lib/theme';

export function SubscriptionScreen() {
  const { session } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const data = await apiGet<{ subscription: Subscription }>(
        '/api/subscriptions/status',
        session?.access_token
      );
      setSubscription(data.subscription);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCheckout = async () => {
    try {
      const data = await apiPost<{ checkoutUrl: string }>(
        '/api/subscriptions/create-checkout',
        {},
        session?.access_token
      );
      Alert.alert('Redirecting to checkout...');
      // Open checkout URL in browser
    } catch (error) {
      Alert.alert('Error', 'Failed to create checkout');
    }
  };

  const cancelSubscription = async () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await apiPost('/api/subscriptions/cancel', {}, session?.access_token);
              loadSubscription();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel subscription');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  const isActive = subscription?.status === 'active';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Subscription</Text>
      </View>

      <GlassCard style={styles.card}>
        <Text style={styles.status}>
          Status: {subscription?.status || 'No Subscription'}
        </Text>
        {isActive && subscription?.currentPeriodEnd && (
          <Text style={styles.date}>
            Renews: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
          </Text>
        )}
      </GlassCard>

      {isActive ? (
        <PrimaryButton
          title="Cancel Subscription"
          onPress={cancelSubscription}
          variant="secondary"
          style={styles.button}
        />
      ) : (
        <PrimaryButton
          title="Subscribe Now"
          onPress={createCheckout}
          variant="premium"
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
  },
  card: {
    marginBottom: DarkTheme.spacing.lg,
  },
  status: {
    fontSize: 18,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.xs,
  },
  date: {
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

