'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Users, TrendingUp, DollarSign, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Navigation } from '@/components/layout/Navigation';

export default function AffiliateProgramPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-x-hidden">
      {/* Enhanced Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-300/20 via-cyan-300/20 to-teal-300/20 dark:from-blue-500/10 dark:via-cyan-500/10 dark:to-teal-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-300/20 via-pink-300/20 to-rose-300/20 dark:from-purple-500/10 dark:via-pink-500/10 dark:to-rose-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Navigation Header */}
      <Navigation />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-2 sm:pt-10 sm:pb-4 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Card className="p-2 sm:p-3 mb-2">
            <h1 className="text-lg sm:text-xl font-display font-bold text-gray-900 dark:text-gray-100 mb-1.5">
              SheMax Affiliate Program
            </h1>
            <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mb-2">
              Earn recurring commissions by referring others to SheMax. All active subscribers
              automatically become affiliates!
            </p>

            <h2 className="text-sm sm:text-base font-display font-bold text-gray-900 dark:text-gray-100 mb-2">
              How It Works
            </h2>
            <ol className="list-decimal list-inside space-y-1 mb-3 text-xs text-gray-700 dark:text-gray-300">
              <li>Subscribe to SheMax (Basic, Pro, or Elite tier)</li>
              <li>You automatically become an affiliate with a unique referral code</li>
              <li>Share your referral link with friends, family, or on social media</li>
              <li>Earn commissions when someone subscribes using your link</li>
              <li>Commissions are paid on recurring subscription payments</li>
            </ol>

            <h2 className="text-sm sm:text-base font-display font-bold text-gray-900 dark:text-gray-100 mb-2">
              Commission Tiers
            </h2>
            <div className="space-y-1 mb-3">
              <Card className="p-2 border-l-4 border-blue-500 dark:border-blue-400">
                <h3 className="font-display font-bold text-sm text-gray-900 dark:text-gray-100 mb-0.5">
                  Base Tier: 20%
                </h3>
                <p className="text-[10px] text-gray-600 dark:text-gray-400">
                  0-9 active referrals
                </p>
              </Card>
              <Card className="p-2 border-l-4 border-cyan-500 dark:border-cyan-400">
                <h3 className="font-display font-bold text-sm text-gray-900 dark:text-gray-100 mb-0.5">
                  Tier 2: 25%
                </h3>
                <p className="text-[10px] text-gray-600 dark:text-gray-400">
                  10-49 active referrals
                </p>
              </Card>
              <Card className="p-2 border-l-4 border-teal-500 dark:border-teal-400">
                <h3 className="font-display font-bold text-sm text-gray-900 dark:text-gray-100 mb-0.5">
                  Tier 3: 30%
                </h3>
                <p className="text-[10px] text-gray-600 dark:text-gray-400">
                  50+ active referrals
                </p>
              </Card>
            </div>

            <h2 className="text-sm sm:text-base font-display font-bold text-gray-900 dark:text-gray-100 mb-2">
              Example Earnings
            </h2>
            <Card className="p-2.5 mb-3 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30">
              <p className="text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 mb-1">
                If you refer 10 people who subscribe to Pro ($12.99/month) at 20% commission:
              </p>
              <p className="text-lg font-display font-bold text-blue-600 dark:text-blue-400">
                $25.98/month recurring
              </p>
              <p className="text-[9px] sm:text-[10px] text-gray-600 dark:text-gray-400 mt-1">
                Plus you'll earn more as you reach higher tiers!
              </p>
            </Card>

            <h2 className="text-sm sm:text-base font-display font-bold text-gray-900 dark:text-gray-100 mb-2">
              Payout Schedule
            </h2>
            <p className="text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 mb-3">
              Payouts are processed manually by our team. Once you have earned commissions, you can
              request a payout through your affiliate dashboard. Payouts are typically processed
              within 7-14 business days via PayPal, ACH, or other methods.
            </p>

            <h2 className="text-sm sm:text-base font-display font-bold text-gray-900 dark:text-gray-100 mb-2">
              Requirements
            </h2>
            <ul className="list-disc list-inside space-y-1 text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 mb-3">
              <li>Active SheMax subscription (Basic, Pro, or Elite)</li>
              <li>Comply with our terms of service</li>
              <li>No fraudulent or spam referrals</li>
              <li>Referrals must be legitimate users</li>
            </ul>

            <Card className="p-2.5 mb-3 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border-2 border-blue-200 dark:border-blue-700">
              <h3 className="font-display font-bold text-sm text-gray-900 dark:text-gray-100 mb-1">
                Ready to Start Earning?
              </h3>
              <p className="text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 mb-2">
                Subscribe to SheMax and you'll automatically get access to your affiliate
                dashboard with your unique referral link and tracking tools.
              </p>
              <Button
                href="/shemax/pricing"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] px-2 py-1"
              >
                Subscribe Now
                <ArrowRight className="w-2.5 h-2.5 ml-1" />
              </Button>
            </Card>

            <h2 className="text-sm sm:text-base font-display font-bold text-gray-900 dark:text-gray-100 mb-2">
              Questions?
            </h2>
            <p className="text-[10px] sm:text-xs text-gray-700 dark:text-gray-300">
              If you have questions about the affiliate program, please contact our support team.
            </p>
          </Card>
        </motion.div>
      </div>
    </main>
  );
}

