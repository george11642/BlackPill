import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Copy, Share2, Users, TrendingUp, Gift } from 'lucide-react-native';

import { useAuth } from '../lib/auth/context';
import { useSubscription } from '../lib/subscription/context';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { BackHeader } from '../components/BackHeader';
import { DarkTheme } from '../lib/theme';
import { apiPost } from '../lib/api/client';
import { supabase } from '../lib/supabase/client';

export function ReferralsScreen() {
  const navigation = useNavigation();
  const { user, session } = useAuth();
  const { unblurCredits, refreshSubscription, tier } = useSubscription();
  const [referralCode, setReferralCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [referralStats, setReferralStats] = useState({
    referralCount: 0,
    unblurCreditsEarned: 0,
    totalReferred: 0,
  });
  const [inputReferralCode, setInputReferralCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    contentOpacity.value = withTiming(1, { duration: 500 });
    loadReferralData();
  }, [user]);

  const loadReferralData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch user's referral code
      const { data: userData } = await supabase
        .from('users')
        .select('referral_code')
        .eq('id', user.id)
        .single();

      if (userData?.referral_code) {
        setReferralCode(userData.referral_code);
      }

      // Check if user has active subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      setHasActiveSubscription(!!subscription);

      // Load referral stats - check users who were referred by this user
      const { data: referredUsers } = await supabase
        .from('users')
        .select('id')
        .eq('referred_by', user.id);

      const referralCount = referredUsers?.length || 0;

      // If user has subscription, also check affiliate_referrals
      if (subscription) {
        const { data: affiliate } = await supabase
          .from('affiliates')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (affiliate) {
          const { data: affiliateReferrals } = await supabase
            .from('affiliate_referrals')
            .select('id, is_converted')
            .eq('affiliate_id', affiliate.id);

          const convertedCount = affiliateReferrals?.filter(r => r.is_converted).length || 0;
          
          setReferralStats({
            referralCount: referralCount,
            unblurCreditsEarned: unblurCredits,
            totalReferred: convertedCount,
          });
        } else {
          setReferralStats({
            referralCount: referralCount,
            unblurCreditsEarned: unblurCredits,
            totalReferred: referralCount,
          });
        }
      } else {
        setReferralStats({
          referralCount: referralCount,
          unblurCreditsEarned: unblurCredits,
          totalReferred: referralCount,
        });
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: (1 - contentOpacity.value) * 20 }],
  }));

  const handleCopyCode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // In a real app, this would copy to clipboard
    Alert.alert('Copied!', `Referral code ${referralCode} copied to clipboard`);
  };

  const handleShareReferral = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `Join BlackPill with my referral code ${referralCode} and get free scans! Download now: [app-link]`,
        title: 'Join BlackPill',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleRedeemReferralCode = async () => {
    if (!inputReferralCode.trim()) {
      Alert.alert('Enter Code', 'Please enter a referral code');
      return;
    }

    setRedeeming(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const response = await apiPost(
        '/api/referrals/redeem',
        { referral_code: inputReferralCode.trim().toUpperCase() },
        session?.access_token
      ) as { success: boolean; credits_earned: number };

      if (response.success) {
        Alert.alert(
          'Success!',
          `You've earned ${response.credits_earned} unblur credits!`,
          [
            {
              text: 'Great!',
              onPress: () => {
                setInputReferralCode('');
                refreshSubscription();
              },
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to redeem referral code. Please try again.'
      );
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <BackHeader title="Referrals" variant="large" />
      <View style={styles.content}>

      {/* Enter Referral Code Section */}
      <Animated.View style={contentAnimatedStyle}>
        <GlassCard variant="elevated" style={styles.codeInputCard}>
          <View style={styles.codeInputHeader}>
            <View style={styles.codeInputIcon}>
              <Gift size={24} color={DarkTheme.colors.primary} />
            </View>
            <View style={styles.codeInputHeaderText}>
              <Text style={styles.codeInputTitle}>Have a Referral Code?</Text>
              <Text style={styles.codeInputSubtitle}>Redeem it for unblur credits</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <TextInput
              style={styles.referralInput}
              placeholder="Enter referral code"
              placeholderTextColor={DarkTheme.colors.textDisabled}
              value={inputReferralCode}
              onChangeText={setInputReferralCode}
              editable={!redeeming}
              maxLength={20}
            />
            <PrimaryButton
              title={redeeming ? 'Redeeming...' : 'Redeem'}
              onPress={handleRedeemReferralCode}
              disabled={redeeming || !inputReferralCode.trim()}
              size="sm"
            />
          </View>
        </GlassCard>
      </Animated.View>

      {/* Referral Code Section */}
      <Animated.View style={contentAnimatedStyle}>
        <GlassCard variant="gold" style={styles.referralCard}>
          <View style={styles.referralHeader}>
            <Text style={styles.referralTitle}>Your Referral Code</Text>
            <Text style={styles.referralSubtitle}>
              {hasActiveSubscription 
                ? 'Share with friends to earn 20% commission on their subscriptions'
                : 'Share with friends to earn unblur credits'}
            </Text>
          </View>

          <View style={styles.codeContainer}>
            {loading ? (
              <ActivityIndicator size="small" color={DarkTheme.colors.primary} />
            ) : (
              <Text style={styles.referralCode}>{referralCode || 'Loading...'}</Text>
            )}
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyCode}
            >
              <Copy size={18} color={DarkTheme.colors.background} />
              <Text style={styles.copyButtonText}>Copy</Text>
            </TouchableOpacity>
          </View>

          <PrimaryButton
            title="Share Referral Link"
            onPress={handleShareReferral}
            icon={<Share2 size={16} color={DarkTheme.colors.background} />}
            style={styles.shareButton}
          />
        </GlassCard>
      </Animated.View>

      {/* Referral Stats */}
      <Animated.View style={[styles.statsContainer, contentAnimatedStyle]}>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: `${DarkTheme.colors.primary}20` }]}>
              <Users size={24} color={DarkTheme.colors.primary} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{referralStats.referralCount}</Text>
              <Text style={styles.statLabel}>Friends Referred</Text>
            </View>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: `${DarkTheme.colors.warning}20` }]}>
              <TrendingUp size={24} color={DarkTheme.colors.warning} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{unblurCredits}</Text>
              <Text style={styles.statLabel}>Current Credits</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* How It Works */}
      <Animated.View style={[styles.howItWorksContainer, contentAnimatedStyle]}>
        <Text style={styles.sectionTitle}>How It Works</Text>

        <View style={styles.stepContainer}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Share Your Code</Text>
            <Text style={styles.stepDescription}>
              Send your referral code to friends or use the share button
            </Text>
          </View>
        </View>

        <View style={styles.stepContainer}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>They Sign Up</Text>
            <Text style={styles.stepDescription}>
              Your friends download BlackPill and use your referral code
            </Text>
          </View>
        </View>

        <View style={styles.stepContainer}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>
              {hasActiveSubscription ? 'Earn Commission' : 'Earn Credits'}
            </Text>
            <Text style={styles.stepDescription}>
              {hasActiveSubscription
                ? 'You earn 20% commission on their subscription payments (initial purchase and renewals). They get 1 unblur credit when they redeem your code.'
                : 'You both get 1 unblur credit when they redeem your code. Upgrade to Pro or Elite to earn 20% commission instead!'}
            </Text>
          </View>
        </View>
      </Animated.View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
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
    paddingHorizontal: DarkTheme.spacing.lg,
    paddingTop: 16,
  },
  codeInputCard: {
    marginBottom: DarkTheme.spacing.lg,
  },
  codeInputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.md,
  },
  codeInputIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${DarkTheme.colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DarkTheme.spacing.md,
  },
  codeInputHeaderText: {
    flex: 1,
  },
  codeInputTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: 2,
  },
  codeInputSubtitle: {
    fontSize: 12,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  inputGroup: {
    flexDirection: 'row',
    gap: DarkTheme.spacing.sm,
    alignItems: 'center',
  },
  referralInput: {
    flex: 1,
    backgroundColor: `${DarkTheme.colors.background}40`,
    borderRadius: DarkTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: `${DarkTheme.colors.border}40`,
    paddingHorizontal: DarkTheme.spacing.md,
    paddingVertical: DarkTheme.spacing.sm,
    fontSize: 14,
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  referralCard: {
    marginBottom: DarkTheme.spacing.lg,
  },
  referralHeader: {
    marginBottom: DarkTheme.spacing.md,
  },
  referralTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: 4,
  },
  referralSubtitle: {
    fontSize: 13,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${DarkTheme.colors.background}40`,
    borderRadius: DarkTheme.borderRadius.lg,
    paddingHorizontal: DarkTheme.spacing.md,
    paddingVertical: DarkTheme.spacing.md,
    marginBottom: DarkTheme.spacing.md,
  },
  referralCode: {
    fontSize: 20,
    fontWeight: '700',
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
    letterSpacing: 2,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DarkTheme.colors.primary,
    paddingHorizontal: DarkTheme.spacing.sm,
    paddingVertical: 6,
    borderRadius: DarkTheme.borderRadius.md,
    gap: 4,
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: DarkTheme.colors.background,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  shareButton: {
    marginTop: DarkTheme.spacing.sm,
  },
  statsContainer: {
    marginBottom: DarkTheme.spacing.lg,
  },
  statRow: {
    gap: DarkTheme.spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DarkTheme.colors.surface,
    borderRadius: DarkTheme.borderRadius.lg,
    padding: DarkTheme.spacing.md,
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DarkTheme.spacing.md,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  statLabel: {
    fontSize: 12,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginTop: 2,
  },
  howItWorksContainer: {
    marginBottom: DarkTheme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.md,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: DarkTheme.spacing.md,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DarkTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DarkTheme.spacing.md,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: DarkTheme.colors.background,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 13,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 100,
  },
});

export default ReferralsScreen;

