'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/client';
import { QRCodeSVG } from 'qrcode.react';
import { Navigation } from '@/components/layout/Navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Copy, Share2, ExternalLink, DollarSign, Users, TrendingUp, ArrowRight } from 'lucide-react';

type Affiliate = {
  id: string;
  referral_code: string;
  tier: string;
  commission_rate: number;
  is_active: boolean;
};

type Stats = {
  total_referrals: number;
  active_referrals: number;
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

export default function AffiliatePage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [monthlyEarnings, setMonthlyEarnings] = useState<MonthlyEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [referralUrl, setReferralUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Check subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('tier', 'basic')
        .in('status', ['active', 'trialing'])
        .single();

      if (!subscription) {
        setLoading(false);
        return;
      }

      setHasSubscription(true);

      // Load affiliate record or create if needed
      let { data: affiliateData } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!affiliateData) {
        // Generate new referral code
        const codeResponse = await fetch('/api/affiliates/generate-code');
        const { code } = await codeResponse.json();

        const { data: newAffiliate } = await supabase
          .from('affiliates')
          .insert({
            user_id: user.id,
            referral_code: code,
            tier: 'base',
            commission_rate: 20.0,
            is_active: true,
          })
          .select()
          .single();

        affiliateData = newAffiliate;
      }

      if (affiliateData) {
        setAffiliate(affiliateData);

        // Generate referral URL
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://shemax.app';
        setReferralUrl(`${appUrl}?ref=${affiliateData.referral_code}`);

        // Load referral stats
        const { data: referrals } = await supabase
          .from('affiliate_referrals')
          .select('id, is_converted, is_fraudulent, conversion_timestamp')
          .eq('affiliate_id', affiliateData.id);

        const totalReferrals = referrals?.length || 0;
        const activeReferrals =
          referrals?.filter((r) => r.is_converted && !r.is_fraudulent).length || 0;

        // Load commissions
        const { data: commissions } = await supabase
          .from('commissions')
          .select('amount, status, created_at, period_start')
          .eq('affiliate_id', affiliateData.id);

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

        setStats({
          total_referrals: totalReferrals,
          active_referrals: activeReferrals,
          total_earnings: totalEarnings,
          pending_earnings: pendingEarnings,
          paid_earnings: paidEarnings,
        });

        setMonthlyEarnings(monthly);
      }
    } catch (error) {
      console.error('Error loading affiliate data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!hasSubscription) {
    return (
      <ProtectedRoute>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/20 dark:from-gray-900 dark:to-gray-800 pt-24 px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Affiliate Program
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You need an active subscription to become an affiliate. Subscribe now to start earning!
              </p>
              <Link href="/pricing">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  View Subscription Plans
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!affiliate || !stats) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-gray-600 dark:text-gray-400">Loading affiliate data...</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/20 dark:from-gray-900 dark:to-gray-800 pt-24 px-4 pb-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Affiliate Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Earn commissions by referring friends to SheMax
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Referrals
                </h3>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.total_referrals}
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Referrals
                </h3>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.active_referrals}
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Commission Tier
                </h3>
                <DollarSign className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {getTierLabel(affiliate.tier)}
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Earnings
                </h3>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${stats.total_earnings.toFixed(2)}
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Earnings Summary */}
              <Card className="p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Earnings Summary
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Paid</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      ${stats.paid_earnings.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      ${stats.pending_earnings.toFixed(2)}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Monthly Breakdown */}
              {monthlyEarnings.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                    Monthly Breakdown
                  </h2>
                  <div className="space-y-2">
                    {monthlyEarnings.map((month, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{month.month}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Total: ${month.earnings.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-green-600 dark:text-green-400">
                            Paid: ${month.paid.toFixed(2)}
                          </p>
                          {month.pending > 0 && (
                            <p className="text-xs text-yellow-600 dark:text-yellow-400">
                              Pending: ${month.pending.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Sidebar - Referral Tools */}
            <div className="space-y-6">
              {/* Referral Code */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Your Referral Code
                </h3>
                <div className="mb-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                    <p className="text-center font-mono text-xl font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                      {affiliate.referral_code}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => copyToClipboard(affiliate.referral_code)}
                  variant="secondary"
                  size="sm"
                  className="w-full"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copied ? 'Copied!' : 'Copy Code'}
                </Button>
              </Card>

              {/* Referral Link */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Your Referral Link
                </h3>
                <div className="mb-4">
                  <input
                    type="text"
                    value={referralUrl}
                    readOnly
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100"
                  />
                </div>
                <Button
                  onClick={() => copyToClipboard(referralUrl)}
                  variant="secondary"
                  size="sm"
                  className="w-full"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
              </Card>

              {/* QR Code */}
              {referralUrl && (
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                    QR Code
                  </h3>
                  <div className="flex justify-center p-4 bg-white rounded">
                    <QRCodeSVG value={referralUrl} size={200} />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-2">
                    Share this QR code with friends
                  </p>
                </Card>
              )}

              {/* How It Works */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                  How It Works
                </h3>
                <ol className="text-xs space-y-2 text-gray-600 dark:text-gray-400">
                  <li>
                    <span className="font-bold text-gray-900 dark:text-gray-100">1.</span> Share
                    your link
                  </li>
                  <li>
                    <span className="font-bold text-gray-900 dark:text-gray-100">2.</span> Friend
                    subscribes
                  </li>
                  <li>
                    <span className="font-bold text-gray-900 dark:text-gray-100">3.</span> You
                    earn {affiliate.commission_rate}%
                  </li>
                  <li>
                    <span className="font-bold text-gray-900 dark:text-gray-100">4.</span> Each
                    month recurring
                  </li>
                </ol>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

