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
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Check, Crown, Sparkles, Zap, Shield, Star } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring, 
  withDelay 
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
  PRO_MONTHLY_PRODUCT_ID,
  PRO_YEARLY_PRODUCT_ID,
  ELITE_MONTHLY_PRODUCT_ID,
  ELITE_YEARLY_PRODUCT_ID,
  getProductId,
  ALL_PRODUCT_IDS,
} from '../lib/subscription/constants';
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FEATURES = [
  { id: 'analyses', label: 'Monthly Unblurred Scans', pro: '10/mo', elite: '30/mo' },
  { id: 'coach', label: 'AI Coach Chat', pro: '20 msgs', elite: 'Unlimited' },
  { id: 'routines', label: 'Active Routines', pro: '5 Routines', elite: 'Unlimited + AI' },
  { id: 'challenges', label: 'Challenges Access', pro: 'Standard', elite: 'All + Exclusive' },
  { id: 'transform', label: 'AI Transform', pro: false, elite: true },
  { id: 'progress', label: 'Deep Progress Insights', pro: false, elite: true },
  { id: 'priority', label: 'Priority Support', pro: false, elite: true },
];

export function SubscriptionScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { tier, refreshSubscription } = useSubscription();
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [managingSubscription, setManagingSubscription] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'pro' | 'elite'>('elite');
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  
  // Check if user has an active subscription
  const hasActiveSubscription = tier !== 'free';

  const headerOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(50);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    loadOfferings();
    
    // Reference product IDs to ensure they're included in the binary
    // This helps Apple App Store Connect detect subscriptions during submission
    if (__DEV__) {
      console.log('Subscription Product IDs:', {
        PRO_MONTHLY_PRODUCT_ID,
        PRO_YEARLY_PRODUCT_ID,
        ELITE_MONTHLY_PRODUCT_ID,
        ELITE_YEARLY_PRODUCT_ID,
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
        'You already have an active subscription. Use "Manage Subscription" to change or cancel your plan.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!offerings) return;

    // Map selected tier to RevenueCat package
    // Use product ID constants to ensure they're included in the binary
    const productId = getProductId(selectedTier, billingInterval);
    const identifier = `${selectedTier}_${billingInterval}`;
    const pkg = offerings.availablePackages.find((p: PurchasesPackage) => 
      p.identifier.toLowerCase().includes(identifier) ||
      p.product.identifier === productId
    );

    if (!pkg) {
      Alert.alert('Error', 'Plan not available');
      return;
    }

    setPurchasing(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const customerInfo = await purchasePackage(pkg);
      await syncSubscriptionToBackend(customerInfo);
      await refreshSubscription();
      Alert.alert('Success', 'Welcome to the club! Subscription activated.');
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
      
      // For iOS, open App Store subscription management
      if (Platform.OS === 'ios') {
        const url = 'https://apps.apple.com/account/subscriptions';
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          // Fallback: Show instructions
          Alert.alert(
            'Manage Subscription',
            'To manage your subscription:\n\n1. Open Settings\n2. Tap your name at the top\n3. Tap Subscriptions\n4. Find BlackPill and manage your subscription',
            [{ text: 'OK' }]
          );
        }
      } else {
        // Android: Open Google Play Store subscription management
        // Try to open Play Store subscriptions page
        const packageName = 'com.blackpill.app'; // Update with actual package name if different
        const playStoreUrl = `https://play.google.com/store/account/subscriptions?package=${packageName}&sku=${packageName}`;
        
        try {
          const canOpen = await Linking.canOpenURL(playStoreUrl);
          if (canOpen) {
            await Linking.openURL(playStoreUrl);
          } else {
            // Fallback: Open Play Store app
            const playStoreAppUrl = `market://details?id=${packageName}`;
            const canOpenApp = await Linking.canOpenURL(playStoreAppUrl);
            if (canOpenApp) {
              await Linking.openURL(playStoreAppUrl);
            } else {
              // Final fallback: Show instructions
              Alert.alert(
                'Manage Subscription',
                'To manage your subscription:\n\n1. Open Google Play Store\n2. Tap Menu (☰)\n3. Tap Subscriptions\n4. Find BlackPill and manage your subscription',
                [{ text: 'OK' }]
              );
            }
          }
        } catch (linkError) {
          // Fallback: Show instructions
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

  const getPriceString = (tier: 'pro' | 'elite') => {
    // Use product ID constants to ensure they're included in the binary
    const productId = getProductId(tier, billingInterval);
    const identifier = `${tier}_${billingInterval}`;
    const pkg = offerings?.availablePackages.find((p: PurchasesPackage) => 
      p.identifier.toLowerCase().includes(identifier) ||
      p.product.identifier === productId
    );
    
    // Always use StoreKit's localized price if available
    if (pkg) return pkg.product.priceString;
    
    // Fallback prices (should match App Store Connect)
    if (billingInterval === 'yearly') {
      return tier === 'pro' ? '$119.99' : '$219.99';
    }
    // Monthly prices: Pro = $12.99, Elite = $19.99
    return tier === 'pro' ? '$12.99' : '$19.99';
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#1a1a1a', '#000000']}
        style={styles.background}
      />

      <BackHeader title="Plans" variant="large" onBackPress={() => navigation.goBack()} />

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, headerStyle]}>
          <GradientText 
            text="Unlock Your Full Potential"
            fontSize={36}
            fontWeight="800"
            colors={[DarkTheme.colors.primary, DarkTheme.colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <Text style={styles.subtitle}>Choose the plan that fits your goals</Text>
        </Animated.View>

        <View style={styles.toggleContainer}>
          <View style={styles.toggleWrapper}>
            <TouchableOpacity 
              style={[styles.toggleOption, billingInterval === 'monthly' && styles.toggleOptionActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setBillingInterval('monthly');
              }}
            >
              <Text style={[styles.toggleText, billingInterval === 'monthly' && styles.toggleTextActive]}>Monthly</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleOption, billingInterval === 'yearly' && styles.toggleOptionActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setBillingInterval('yearly');
              }}
            >
              <Text style={[styles.toggleText, billingInterval === 'yearly' && styles.toggleTextActive]}>Yearly</Text>
              {billingInterval === 'yearly' && (
                <View style={styles.saveBadge}>
                  <Text style={styles.saveText}>SAVE 20%</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Animated.View style={[styles.cardsContainer, contentStyle]}>
          {/* Pro Card */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedTier('pro');
            }}
            style={[
              styles.tierCard, 
              selectedTier === 'pro' && styles.selectedCard
            ]}
          >
            <GlassCard variant="subtle" style={styles.cardInner}>
              <View style={styles.cardHeader}>
                <Text style={styles.tierName}>PRO</Text>
                <Text style={styles.tierPrice}>{getPriceString('pro')}<Text style={styles.period}>/{billingInterval === 'monthly' ? 'mo' : 'yr'}</Text></Text>
              </View>
              <View style={styles.divider} />
              {FEATURES.slice(0, 4).map((feature, i) => (
                <View key={i} style={styles.featureRow}>
                  <Check size={14} color={DarkTheme.colors.textSecondary} />
                  <Text style={styles.featureText}>
                    {feature.pro || feature.label}
                  </Text>
                </View>
              ))}
            </GlassCard>
          </TouchableOpacity>

          {/* Elite Card */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedTier('elite');
            }}
            style={[
              styles.tierCard,
              selectedTier === 'elite' && styles.selectedCardElite
            ]}
          >
            {selectedTier === 'elite' && (
              <LinearGradient
                colors={[DarkTheme.colors.primary, DarkTheme.colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.popularBadge}
              >
                <Text style={styles.popularText}>MOST POPULAR</Text>
              </LinearGradient>
            )}
            <GlassCard variant="gold" style={styles.cardInner}>
              <View style={styles.cardHeader}>
                <View style={styles.eliteTitleRow}>
                  <Crown size={16} color={DarkTheme.colors.primary} fill={DarkTheme.colors.primary} />
                  <Text style={[styles.tierName, { color: DarkTheme.colors.primary }]}>ELITE</Text>
                </View>
                <Text style={styles.tierPrice}>{getPriceString('elite')}<Text style={styles.period}>/{billingInterval === 'monthly' ? 'mo' : 'yr'}</Text></Text>
              </View>
              <View style={styles.divider} />
              {FEATURES.map((feature, i) => (
                <View key={i} style={styles.featureRow}>
                  <Star 
                    size={14} 
                    color={feature.elite === true || typeof feature.elite === 'string' ? DarkTheme.colors.primary : DarkTheme.colors.textDisabled} 
                    fill={feature.elite === true || typeof feature.elite === 'string' ? DarkTheme.colors.primary : 'transparent'}
                  />
                  <Text style={[
                    styles.featureText,
                    (feature.elite === true || typeof feature.elite === 'string') && styles.featureTextHighlight
                  ]}>
                    {feature.elite === true ? feature.label : (feature.elite || feature.label)}
                  </Text>
                </View>
              ))}
            </GlassCard>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.footer, contentStyle]}>
          {hasActiveSubscription ? (
            <>
              <View style={styles.currentSubscriptionInfo}>
                <Text style={styles.currentSubscriptionText}>
                  You're currently subscribed to <Text style={styles.tierNameText}>{tier.toUpperCase()}</Text>
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
                  {selectedTier.toUpperCase()} Subscription
                </Text>
                <View style={styles.disclosureRow}>
                  <Text style={styles.disclosureLabel}>Duration:</Text>
                  <Text style={styles.disclosureValue}>
                    {billingInterval === 'monthly' ? 'Monthly' : 'Yearly'}
                  </Text>
                </View>
                <View style={styles.disclosureRow}>
                  <Text style={styles.disclosureLabel}>Price:</Text>
                  <Text style={styles.disclosureValue}>
                    {getPriceString(selectedTier)}/{billingInterval === 'monthly' ? 'month' : 'year'}
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
                title={purchasing ? 'Processing...' : `Subscribe to ${selectedTier.toUpperCase()}`}
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
    paddingHorizontal: 24,
    marginBottom: 16,
    marginTop: 0,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: DarkTheme.colors.textSecondary,
  },
  toggleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  toggleWrapper: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 4,
  },
  toggleOption: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleOptionActive: {
    backgroundColor: DarkTheme.colors.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: DarkTheme.colors.textSecondary,
  },
  toggleTextActive: {
    color: '#000',
  },
  saveBadge: {
    backgroundColor: '#000',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  saveText: {
    fontSize: 10,
    fontWeight: '800',
    color: DarkTheme.colors.primary,
  },
  cardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 32,
    height: 420, 
  },
  tierCard: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  selectedCard: {
    borderColor: DarkTheme.colors.textSecondary,
    transform: [{ scale: 1.02 }],
  },
  selectedCardElite: {
    borderColor: DarkTheme.colors.primary,
    transform: [{ scale: 1.02 }],
    shadowColor: DarkTheme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  cardInner: {
    flex: 1,
    padding: 16,
    justifyContent: 'flex-start',
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 1,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 16,
  },
  eliteTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  tierName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: 1,
  },
  tierPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  period: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontWeight: '400',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    color: DarkTheme.colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  featureTextHighlight: {
    color: '#fff',
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  currentSubscriptionText: {
    color: DarkTheme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
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
  },
  disclosureTitle: {
    fontSize: 16,
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
