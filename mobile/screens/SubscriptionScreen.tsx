import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Check, Crown, Zap, Shield, Star, Sparkles } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

import { useAuth } from '../lib/auth/context';
import { useSubscription } from '../lib/subscription/context';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { GradientText } from '../components/GradientText';
import { BackHeader } from '../components/BackHeader';
import { DarkTheme } from '../lib/theme';
import {
  getOfferings,
  purchasePackage,
  syncSubscriptionToBackend,
  restorePurchases,
} from '../lib/revenuecat/client';
import {
  PREMIUM_WEEKLY_PRODUCT_ID,
  PREMIUM_MONTHLY_PRODUCT_ID,
  PREMIUM_YEARLY_PRODUCT_ID,
  getProductId,
  ALL_PRODUCT_IDS,
  BillingInterval,
} from '../lib/subscription/constants';
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Premium features list - all Elite features included
const PREMIUM_FEATURES = [
  { icon: '🔍', title: '30 Unblurred Scans', description: 'High-definition face analysis every month' },
  { icon: '🤖', title: 'Unlimited AI Coach', description: 'Get personalized advice anytime' },
  { icon: '📋', title: 'Unlimited Routines', description: 'Create custom routines with AI optimization' },
  { icon: '🏆', title: 'All Challenges', description: 'Access exclusive challenges and competitions' },
  { icon: '✨', title: 'AI Transform', description: 'See your potential with AI visualization' },
  { icon: '📊', title: 'Deep Insights', description: 'Advanced progress tracking and analytics' },
  { icon: '⚡', title: 'Priority Support', description: 'Get help when you need it most' },
];

export function SubscriptionScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { tier, refreshSubscription } = useSubscription();
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [managingSubscription, setManagingSubscription] = useState(false);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');

  // Check if user has an active subscription
  const hasActiveSubscription = tier !== 'free';

  const headerOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(50);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    loadOfferings();

    // Reference product IDs to ensure they're included in the binary
    if (__DEV__) {
      console.log('Subscription Product IDs:', {
        PREMIUM_WEEKLY_PRODUCT_ID,
        PREMIUM_MONTHLY_PRODUCT_ID,
        PREMIUM_YEARLY_PRODUCT_ID,
        ALL_PRODUCT_IDS,
      });
    }

    // Animations
    headerOpacity.value = withTiming(1, { duration: 800 });
    contentTranslateY.value = withSpring(0, { damping: 15 });
    contentOpacity.value = withTiming(1, { duration: 800 });
  }, []);

  const loadOfferings = async () => {
    try {
      const currentOffering = await getOfferings();
      setOfferings(currentOffering);
    } catch (error) {
      console.error('Failed to load offerings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    // Prevent purchase if user already has an active subscription
    if (hasActiveSubscription) {
      Alert.alert(
        'Already Subscribed',
        'You already have an active Premium subscription. Use "Manage Subscription" to change or cancel your plan.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!offerings) return;

    // Get the product ID for selected billing interval
    const productId = getProductId(billingInterval);
    const pkg = offerings.availablePackages.find((p: PurchasesPackage) =>
      p.identifier.toLowerCase().includes(billingInterval) ||
      p.product.identifier === productId
    );

    if (!pkg) {
      Alert.alert('Error', 'Plan not available');
      return;
    }

    setPurchasing(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // Get stored referral code
      const referralCode = await AsyncStorage.getItem('@blackpill_referral_code');
      const customerInfo = await purchasePackage(pkg, referralCode || undefined);

      // Clear referral code after successful purchase
      if (referralCode) {
        await AsyncStorage.removeItem('@blackpill_referral_code');
      }

      // Only sync to backend if user is logged in
      if (user) {
        await syncSubscriptionToBackend(customerInfo);
        await refreshSubscription();
        Alert.alert('Success', 'Welcome to Premium! Your subscription is now active.');
      } else {
        // Guest purchase successful
        Alert.alert(
          'Success',
          'Premium activated! Create an account to sync this purchase across your devices.',
          [
            { text: 'Later', style: 'cancel' },
            { text: 'Create Account', onPress: () => navigation.navigate('Signup' as never) }
          ]
        );
      }
    } catch (error: any) {
      if (error.message !== 'Purchase was cancelled') {
        Alert.alert('Error', error.message || 'Failed to purchase');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setManagingSubscription(true);

      if (Platform.OS === 'ios') {
        const url = 'https://apps.apple.com/account/subscriptions';
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          Alert.alert(
            'Manage Subscription',
            'To manage your subscription:\n\n1. Open Settings\n2. Tap your name at the top\n3. Tap Subscriptions\n4. Find BlackPill and manage your subscription',
            [{ text: 'OK' }]
          );
        }
      } else {
        const packageName = 'com.blackpill.app';
        const playStoreUrl = `https://play.google.com/store/account/subscriptions?package=${packageName}`;

        try {
          const canOpen = await Linking.canOpenURL(playStoreUrl);
          if (canOpen) {
            await Linking.openURL(playStoreUrl);
          } else {
            Alert.alert(
              'Manage Subscription',
              'To manage your subscription:\n\n1. Open Google Play Store\n2. Tap Menu (☰)\n3. Tap Subscriptions\n4. Find BlackPill and manage your subscription',
              [{ text: 'OK' }]
            );
          }
        } catch {
          Alert.alert(
            'Manage Subscription',
            'To manage your subscription:\n\n1. Open Google Play Store\n2. Tap Menu (☰)\n3. Tap Subscriptions\n4. Find BlackPill and manage your subscription',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error: any) {
      console.error('Error opening subscription management:', error);
      Alert.alert(
        'Error',
        'Failed to open subscription management. Please use your device\'s App Store or Google Play Store settings to manage your subscription.'
      );
    } finally {
      setManagingSubscription(false);
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    try {
      const info = await restorePurchases();
      await syncSubscriptionToBackend(info);
      await refreshSubscription();
      Alert.alert('Success', 'Purchases restored successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases');
    } finally {
      setPurchasing(false);
    }
  };

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={DarkTheme.colors.primary} />
      </View>
    );
  }

  const getPriceString = (interval: BillingInterval) => {
    const productId = getProductId(interval);
    const pkg = offerings?.availablePackages.find((p: PurchasesPackage) =>
      p.identifier.toLowerCase().includes(interval) ||
      p.product.identifier === productId
    );

    // Use StoreKit's localized price if available
    if (pkg) return pkg.product.priceString;

    // Fallback prices (should match App Store Connect)
    switch (interval) {
      case 'weekly':
        return '$4.99';
      case 'monthly':
        return '$12.99';
      case 'yearly':
        return '$39.99';
    }
  };

  const getPeriodLabel = (interval: BillingInterval) => {
    switch (interval) {
      case 'weekly':
        return '/week';
      case 'monthly':
        return '/month';
      case 'yearly':
        return '/year';
    }
  };

  const getSavingsText = (interval: BillingInterval) => {
    switch (interval) {
      case 'weekly':
        return null;
      case 'monthly':
        return 'Save 35%';
      case 'yearly':
        return 'Best Value';
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#1a1a1a', '#000000']}
        style={styles.background}
      />

      <BackHeader title="Premium" variant="large" onBackPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, headerStyle]}>
          <View style={styles.crownContainer}>
            <Crown size={40} color={DarkTheme.colors.primary} fill={DarkTheme.colors.primary} />
          </View>
          <GradientText
            text="Unlock Premium"
            fontSize={32}
            fontWeight="800"
            colors={[DarkTheme.colors.primary, DarkTheme.colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <Text style={styles.subtitle}>Get unlimited access to all features</Text>
        </Animated.View>

        <Animated.View style={[styles.mainContent, contentStyle]}>
          {/* Billing Interval Selection */}
          <View style={styles.billingContainer}>
            {(['weekly', 'monthly', 'yearly'] as BillingInterval[]).map((interval) => (
              <TouchableOpacity
                key={interval}
                style={[
                  styles.billingOption,
                  billingInterval === interval && styles.billingOptionActive,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setBillingInterval(interval);
                }}
              >
                {getSavingsText(interval) && (
                  <View style={[
                    styles.savingsBadge,
                    interval === 'yearly' && styles.savingsBadgeBest
                  ]}>
                    <Text style={styles.savingsText}>{getSavingsText(interval)}</Text>
                  </View>
                )}
                <Text style={styles.billingIntervalText}>
                  {interval.charAt(0).toUpperCase() + interval.slice(1)}
                </Text>
                <Text style={[
                  styles.billingPriceText,
                  billingInterval === interval && styles.billingPriceActive
                ]}>
                  {getPriceString(interval)}
                </Text>
                <Text style={styles.billingPeriodText}>
                  {getPeriodLabel(interval)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Features Card */}
          <GlassCard variant="gold" style={styles.featuresCard}>
            <View style={styles.featuresHeader}>
              <Sparkles size={20} color={DarkTheme.colors.primary} />
              <Text style={styles.featuresTitle}>Everything Included</Text>
            </View>

            {PREMIUM_FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
                <Check size={18} color={DarkTheme.colors.primary} />
              </View>
            ))}
          </GlassCard>

          {/* Footer */}
          <View style={styles.footer}>
            {hasActiveSubscription ? (
              <>
                <View style={styles.currentSubscriptionInfo}>
                  <Crown size={20} color={DarkTheme.colors.primary} fill={DarkTheme.colors.primary} />
                  <Text style={styles.currentSubscriptionText}>
                    You're a <Text style={styles.tierNameText}>PREMIUM</Text> member
                  </Text>
                </View>
                <PrimaryButton
                  title={managingSubscription ? 'Opening...' : 'Manage Subscription'}
                  onPress={handleManageSubscription}
                  disabled={managingSubscription}
                  style={styles.subscribeButton}
                  icon={<Shield size={20} color="#000" fill="#000" />}
                />
              </>
            ) : (
              <>
                {/* Apple Required Subscription Disclosures */}
                <View style={styles.disclosureContainer}>
                  <Text style={styles.disclosureTitle}>
                    Premium {billingInterval.charAt(0).toUpperCase() + billingInterval.slice(1)} Subscription
                  </Text>
                  <View style={styles.disclosureRow}>
                    <Text style={styles.disclosureLabel}>Price:</Text>
                    <Text style={styles.disclosureValue}>
                      {getPriceString(billingInterval)}{getPeriodLabel(billingInterval)}
                    </Text>
                  </View>
                  <View style={styles.disclosureRow}>
                    <Text style={styles.disclosureLabel}>Auto-renew:</Text>
                    <Text style={styles.disclosureValue}>
                      Auto-renews until canceled
                    </Text>
                  </View>
                  <View style={styles.disclosureLinks}>
                    <TouchableOpacity
                      onPress={() => Linking.openURL('https://www.black-pill.app/privacy')}
                      style={styles.disclosureLink}
                    >
                      <Text style={styles.disclosureLinkText}>Privacy Policy</Text>
                    </TouchableOpacity>
                    <Text style={styles.disclosureSeparator}> • </Text>
                    <TouchableOpacity
                      onPress={() => Linking.openURL('https://www.black-pill.app/terms')}
                      style={styles.disclosureLink}
                    >
                      <Text style={styles.disclosureLinkText}>Terms of Use</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <PrimaryButton
                  title={purchasing ? 'Processing...' : 'Subscribe to Premium'}
                  onPress={handlePurchase}
                  disabled={purchasing}
                  style={styles.subscribeButton}
                  icon={<Zap size={20} color="#000" fill="#000" />}
                />
                <TouchableOpacity onPress={handleRestore} disabled={purchasing}>
                  <Text style={styles.restoreText}>Restore Purchases</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  crownContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${DarkTheme.colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: `${DarkTheme.colors.primary}40`,
  },
  subtitle: {
    fontSize: 16,
    color: DarkTheme.colors.textSecondary,
    marginTop: 8,
  },
  mainContent: {
    paddingHorizontal: 16,
  },
  billingContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  billingOption: {
    flex: 1,
    backgroundColor: DarkTheme.colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  billingOptionActive: {
    borderColor: DarkTheme.colors.primary,
    backgroundColor: `${DarkTheme.colors.primary}15`,
  },
  savingsBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: DarkTheme.colors.success,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  savingsBadgeBest: {
    backgroundColor: DarkTheme.colors.primary,
  },
  savingsText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.5,
  },
  billingIntervalText: {
    fontSize: 12,
    fontWeight: '600',
    color: DarkTheme.colors.textSecondary,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  billingPriceText: {
    fontSize: 20,
    fontWeight: '800',
    color: DarkTheme.colors.text,
  },
  billingPriceActive: {
    color: DarkTheme.colors.primary,
  },
  billingPeriodText: {
    fontSize: 11,
    color: DarkTheme.colors.textTertiary,
    marginTop: 2,
  },
  featuresCard: {
    padding: 20,
    marginBottom: 24,
  },
  featuresHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    justifyContent: 'center',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DarkTheme.colors.primary,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 12,
  },
  featureIcon: {
    fontSize: 24,
    width: 32,
    textAlign: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 12,
    color: DarkTheme.colors.textTertiary,
  },
  footer: {
    alignItems: 'center',
  },
  subscribeButton: {
    width: '100%',
    marginBottom: 16,
  },
  restoreText: {
    color: DarkTheme.colors.textSecondary,
    fontSize: 14,
    marginBottom: 24,
    textDecorationLine: 'underline',
  },
  currentSubscriptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
    justifyContent: 'center',
  },
  currentSubscriptionText: {
    color: DarkTheme.colors.textSecondary,
    fontSize: 15,
  },
  tierNameText: {
    color: DarkTheme.colors.primary,
    fontWeight: '700',
  },
  disclosureContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    width: '100%',
  },
  disclosureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  disclosureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  disclosureLabel: {
    fontSize: 13,
    color: DarkTheme.colors.textSecondary,
    fontWeight: '500',
  },
  disclosureValue: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  disclosureLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  disclosureLink: {
    paddingVertical: 4,
  },
  disclosureLinkText: {
    fontSize: 12,
    color: DarkTheme.colors.primary,
    textDecorationLine: 'underline',
  },
  disclosureSeparator: {
    fontSize: 12,
    color: DarkTheme.colors.textSecondary,
    marginHorizontal: 4,
  },
});
