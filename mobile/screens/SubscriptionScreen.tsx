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
} from 'react-native';
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
import { BackHeader } from '../components/BackHeader';
import { DarkTheme } from '../lib/theme';
import {
  getOfferings,
  purchasePackage,
  syncSubscriptionToBackend,
  restorePurchases,
} from '../lib/revenuecat/client';
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
  const { user } = useAuth();
  const { refreshSubscription } = useSubscription();
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'pro' | 'elite'>('elite');
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

  const headerOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(50);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    loadOfferings();
    
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
    if (!offerings) return;

    // Map selected tier to RevenueCat package
    // Assuming identifiers like 'pro_monthly', 'pro_yearly', 'elite_monthly', 'elite_yearly'
    const identifier = `${selectedTier}_${billingInterval}`;
    const pkg = offerings.availablePackages.find(p => 
      p.identifier.toLowerCase().includes(identifier)
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
    const identifier = `${tier}_${billingInterval}`;
    const pkg = offerings?.availablePackages.find(p => 
      p.identifier.toLowerCase().includes(identifier)
    );
    
    if (pkg) return pkg.product.priceString;
    
    // Fallback prices
    if (billingInterval === 'yearly') {
      return tier === 'pro' ? '$119.99' : '$219.99';
    }
    return tier === 'pro' ? '$12.99' : '$19.99';
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#1a1a1a', '#000000']}
        style={styles.background}
      />
      
      <BackHeader title="" variant="large" />

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, headerStyle]}>
          <Text style={styles.title}>Unlock Your{'\n'}Full Potential</Text>
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
    marginBottom: 24,
    marginTop: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    lineHeight: 42,
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
});
