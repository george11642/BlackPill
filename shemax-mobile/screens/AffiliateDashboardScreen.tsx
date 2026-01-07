import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Share,
  Alert,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { useAuth } from '../lib/auth/context';
import { supabase } from '../lib/supabase/client';
import { BackHeader } from '../components/BackHeader';
import { LightTheme, DarkTheme } from '../lib/theme';
import {
  Users,
  DollarSign,
  TrendingUp,
  Copy,
  Share2,
  QrCode,
  CheckCircle,
  Clock,
  ExternalLink,
} from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';

type AffiliateData = {
  referral_code: string;
  total_referrals: number;
  active_referrals: number;
  tier: 'base' | 'tier_2' | 'tier_3';
  commission_rate: number;
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
};

type MonthlyEarning = {
  month: string;
  earnings: number;
  paid: number;
  pending: number;
};

export default function AffiliateDashboardScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : LightTheme;
  const isDark = colorScheme === 'dark';
  const [loading, setLoading] = useState(true);
  const [affiliateData, setAffiliateData] = useState<AffiliateData | null>(null);
  const [monthlyEarnings, setMonthlyEarnings] = useState<MonthlyEarning[]>([]);
  const [referralUrl, setReferralUrl] = useState('');
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  useEffect(() => {
    if (user) {
      checkSubscription();
      loadAffiliateData();
    }
  }, [user]);

  const checkSubscription = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .single();

      setHasActiveSubscription(!!data);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const loadAffiliateData = async () => {
    if (!user) return;

    try {
      // Check subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .single();

      if (!subscription) {
        setLoading(false);
        return;
      }

      // Get user's referral code from users table (source of truth)
      const { data: userData } = await supabase
        .from('users')
        .select('referral_code')
        .eq('id', user.id)
        .single();

      if (!userData?.referral_code) {
        setLoading(false);
        return;
      }

      // Load or create affiliate (should already exist due to auto-creation trigger)
      let { data: affiliate } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!affiliate) {
        // Create affiliate with user's referral code
        const { data: newAffiliate } = await supabase
          .from('affiliates')
          .insert({
            user_id: user.id,
            referral_code: userData.referral_code.toUpperCase(),
            tier: 'base',
            commission_rate: 20,
            is_active: true,
          })
          .select()
          .single();

        affiliate = newAffiliate;
      }

      if (!affiliate) {
        setLoading(false);
        return;
      }

      // Ensure affiliate referral_code matches user's referral_code
      if (affiliate.referral_code !== userData.referral_code.toUpperCase()) {
        await supabase
          .from('affiliates')
          .update({ referral_code: userData.referral_code.toUpperCase() })
          .eq('id', affiliate.id);
        
        affiliate.referral_code = userData.referral_code.toUpperCase();
      }

      // Load referral stats
      const { data: referralData } = await supabase
        .from('affiliate_referrals')
        .select('id, is_converted, is_fraudulent')
        .eq('affiliate_id', affiliate.id);

      const totalReferrals = referralData?.length || 0;
      const activeReferrals =
        referralData?.filter((r) => r.is_converted && !r.is_fraudulent).length || 0;

      // Load commissions
      const { data: commissions } = await supabase
        .from('commissions')
        .select('amount, status, created_at, period_start')
        .eq('affiliate_id', affiliate.id);

      const totalEarnings =
        commissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
      const paidEarnings =
        commissions
          ?.filter((c) => c.status === 'paid')
          .reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
      const pendingEarnings = totalEarnings - paidEarnings;

      // Calculate monthly breakdown
      const monthlyMap: Record<string, { earnings: number; paid: number; pending: number }> = {};
      commissions?.forEach((c) => {
        if (!c.period_start) return;
        const month = new Date(c.period_start).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
        });
        if (!monthlyMap[month]) {
          monthlyMap[month] = { earnings: 0, paid: 0, pending: 0 };
        }
        monthlyMap[month].earnings += c.amount || 0;
        if (c.status === 'paid') {
          monthlyMap[month].paid += c.amount || 0;
        } else {
          monthlyMap[month].pending += c.amount || 0;
        }
      });

      const monthly = Object.entries(monthlyMap)
        .map(([month, data]) => ({
          month,
          ...data,
        }))
        .sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime())
        .slice(0, 6);

      setAffiliateData({
        referral_code: affiliate.referral_code,
        total_referrals: totalReferrals,
        active_referrals: activeReferrals,
        tier: affiliate.tier,
        commission_rate: affiliate.commission_rate,
        total_earnings: totalEarnings,
        pending_earnings: pendingEarnings,
        paid_earnings: paidEarnings,
      });

      setMonthlyEarnings(monthly);

      // Generate referral URL
      const appUrl = process.env.EXPO_PUBLIC_APP_URL || 'https://www.shemax.app';
      setReferralUrl(`${appUrl}?ref=${affiliate.referral_code}`);
    } catch (error) {
      console.error('Error loading affiliate data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = async () => {
    await Share.share({
      message: `Check out SheMax! Use my referral link: ${referralUrl}`,
      url: referralUrl,
    });
  };

  const copyReferralCode = async () => {
    if (!affiliateData) return;

    if (Platform.OS === 'web') {
      navigator.clipboard.writeText(affiliateData.referral_code);
      Alert.alert('Copied!', 'Referral code copied to clipboard');
    } else {
      await Share.share({
        message: `My SheMax referral code: ${affiliateData.referral_code}`,
      });
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'tier_3':
        return 'Tier 3 (30%)';
      case 'tier_2':
        return 'Tier 2 (25%)';
      default:
        return 'Base (20%)';
    }
  };

  const styles = useMemo(() => {
    return StyleSheet.create({
      container: {
        flex: 1,
      },
      centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
      content: {
        padding: 20,
        paddingBottom: 40,
        paddingTop: 20,
      },
      card: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...(Platform.OS === 'web'
          ? { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' }
          : {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 5,
            }),
      },
      sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 16,
      },
      statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
      },
      statItem: {
        alignItems: 'center',
        flex: 1,
      },
      statValue: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 8,
        marginBottom: 4,
      },
      statLabel: {
        fontSize: 11,
        textAlign: 'center',
      },
      earningItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      },
      earningLabel: {
        fontSize: 13,
      },
      earningValue: {
        fontSize: 16,
        fontWeight: '700',
      },
      monthlyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      },
      monthLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 4,
      },
      referralCodeSection: {
        marginBottom: 20,
      },
      referralLabel: {
        fontSize: 13,
        marginBottom: 8,
        fontWeight: '600',
      },
      referralCodeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      },
      referralCode: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 2,
        padding: 12,
        borderRadius: 12,
        textAlign: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      button: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 12,
      },
      qrSection: {
        alignItems: 'center',
        marginBottom: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
      },
      qrContainer: {
        padding: 16,
        borderRadius: 12,
        marginVertical: 12,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      emptyText: {
        textAlign: 'center',
        fontSize: 14,
        padding: 40,
      },
    });
  }, [theme]);

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <BackHeader title="Affiliate Dashboard" variant="large" />
        <View style={[styles.content, { paddingTop: 0 }]}>
          <View style={styles.card}>
            <Text
              style={[
                styles.emptyText,
                { color: theme.colors.textSecondary, textAlign: 'center' },
              ]}
            >
              You need an active subscription to become an affiliate.
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  if (!affiliateData) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          Loading affiliate data...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <BackHeader title="Affiliate Dashboard" variant="large" />
      <View style={[styles.content, { paddingTop: 0 }]}>

        {/* Overview Section */}
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Users size={24} color={theme.colors.primary} />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {affiliateData.total_referrals}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Total Referrals
              </Text>
            </View>
            <View style={styles.statItem}>
              <TrendingUp size={24} color={theme.colors.success} />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {affiliateData.active_referrals}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Active Referrals
              </Text>
            </View>
            <View style={styles.statItem}>
              <DollarSign size={24} color={theme.colors.accent} />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {getTierLabel(affiliateData.tier)}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Tier</Text>
            </View>
          </View>
        </View>

        {/* Earnings Section */}
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Earnings</Text>
          <View style={styles.earningItem}>
            <Text style={[styles.earningLabel, { color: theme.colors.textSecondary }]}>
              Total
            </Text>
            <Text style={[styles.earningValue, { color: theme.colors.text }]}>
              ${affiliateData.total_earnings.toFixed(2)}
            </Text>
          </View>
          <View style={styles.earningItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={14} color={theme.colors.success} />
              <Text style={[styles.earningLabel, { color: theme.colors.textSecondary }]}>
                Paid
              </Text>
            </View>
            <Text style={[styles.earningValue, { color: theme.colors.success }]}>
              ${affiliateData.paid_earnings.toFixed(2)}
            </Text>
          </View>
          <View style={styles.earningItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Clock size={14} color={theme.colors.accent} />
              <Text style={[styles.earningLabel, { color: theme.colors.textSecondary }]}>
                Pending
              </Text>
            </View>
            <Text style={[styles.earningValue, { color: theme.colors.accent }]}>
              ${affiliateData.pending_earnings.toFixed(2)}
            </Text>
          </View>

          {/* Monthly Breakdown */}
          {monthlyEarnings.length > 0 && (
            <View style={{ marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Monthly Breakdown
              </Text>
              {monthlyEarnings.map((month, index) => (
                <View key={index} style={styles.monthlyItem}>
                  <View>
                    <Text style={[styles.monthLabel, { color: theme.colors.text }]}>
                      {month.month}
                    </Text>
                    <Text style={[styles.earningLabel, { color: theme.colors.textSecondary }]}>
                      Total: ${month.earnings.toFixed(2)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.earningLabel, { color: theme.colors.success }]}>
                      Paid: ${month.paid.toFixed(2)}
                    </Text>
                    {month.pending > 0 && (
                      <Text style={[styles.earningLabel, { color: theme.colors.accent }]}>
                        Pending: ${month.pending.toFixed(2)}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Referral Tools */}
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Referral Tools</Text>

          {/* Your Referral Code */}
          <View style={styles.referralCodeSection}>
            <Text style={[styles.referralLabel, { color: theme.colors.text }]}>
              Your Referral Code
            </Text>
            <View style={styles.referralCodeContainer}>
              <View
                style={[
                  styles.referralCode,
                  { backgroundColor: theme.colors.background },
                ]}
              >
                <Text
                  style={[
                    { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
                  ]}
                >
                  {affiliateData.referral_code}
                </Text>
              </View>
              <TouchableOpacity
                onPress={copyReferralCode}
                style={[
                  styles.button,
                  { backgroundColor: theme.colors.primary, marginTop: 0 },
                ]}
              >
                <Copy size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Referral Link */}
          <View style={styles.referralCodeSection}>
            <Text style={[styles.referralLabel, { color: theme.colors.text }]}>
              Referral Link
            </Text>
            <View style={styles.referralCodeContainer}>
              <View
                style={[
                  styles.referralCode,
                  { backgroundColor: theme.colors.background },
                ]}
              >
                <Text
                  style={[
                    { color: theme.colors.textSecondary, fontSize: 11 },
                  ]}
                  numberOfLines={1}
                >
                  {referralUrl}
                </Text>
              </View>
              <TouchableOpacity
                onPress={copyReferralLink}
                style={[
                  styles.button,
                  { backgroundColor: theme.colors.primary, marginTop: 0 },
                ]}
              >
                <Share2 size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* QR Code */}
          {referralUrl && (
            <View style={styles.qrSection}>
              <Text style={[styles.referralLabel, { color: theme.colors.text }]}>QR Code</Text>
              <View style={styles.qrContainer}>
                <QRCode
                  value={referralUrl}
                  size={120}
                  backgroundColor={theme.colors.background}
                  color={theme.colors.text}
                />
              </View>
              <Text style={[styles.earningLabel, { color: theme.colors.textSecondary }]}>
                Share this QR code with friends
              </Text>
            </View>
          )}

          {/* How It Works */}
          <View style={{ marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>How It Works</Text>
            <Text style={[styles.earningLabel, { color: theme.colors.textSecondary }]}>
              Share your referral link with friends. When they subscribe, you'll earn{' '}
              {affiliateData.commission_rate}% commission on their subscription payments.
            </Text>
          </View>
        </View>

        {/* Payout Status */}
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Payout Status</Text>
          <Text style={[styles.earningLabel, { color: theme.colors.textSecondary, marginBottom: 12 }]}>
            Payouts are processed manually by our team. You'll receive a notification when your
            payout is processed.
          </Text>
          {affiliateData.pending_earnings > 0 && (
            <View
              style={[
                styles.card,
                {
                  marginTop: 0,
                  marginBottom: 0,
                  backgroundColor: theme.colors.warningLight || theme.colors.card,
                  borderColor: theme.colors.warning || theme.colors.border,
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Clock size={16} color={theme.colors.warning || theme.colors.text} />
                <Text
                  style={[
                    styles.earningLabel,
                    { color: theme.colors.text, flex: 1, marginBottom: 0 },
                  ]}
                >
                  You have ${affiliateData.pending_earnings.toFixed(2)} pending payout
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

