import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Section } from '@/components/Section';
import { PricingCard } from '@/components/PricingCard';
import { Button } from '@/components/Button';
import { Footer } from '@/components/Footer';

export default function Pricing() {
  const [referrals, setReferrals] = useState(100);
  const [avgOrderValue, setAvgOrderValue] = useState(50);

  const pricingTiers = [
    {
      tier: 'Bronze',
      commission: 10,
      requirement: 'Free to join',
      isPopular: false,
      features: [
        { text: 'Real-time Analytics', included: true },
        { text: 'Custom Affiliate Link', included: true },
        { text: 'Basic Support', included: true },
        { text: 'Marketing Assets', included: false },
        { text: 'Priority Support', included: false },
        { text: 'Dedicated Manager', included: false },
      ],
    },
    {
      tier: 'Silver',
      commission: 15,
      requirement: '100+ referrals',
      isPopular: false,
      features: [
        { text: 'Real-time Analytics', included: true },
        { text: 'Custom Affiliate Link', included: true },
        { text: 'Email Support', included: true },
        { text: 'Marketing Assets Pack', included: true },
        { text: 'Priority Support', included: false },
        { text: 'Dedicated Manager', included: false },
      ],
    },
    {
      tier: 'Gold',
      commission: 20,
      requirement: '500+ referrals',
      isPopular: true,
      features: [
        { text: 'Real-time Analytics', included: true },
        { text: 'Custom Affiliate Link', included: true },
        { text: 'Priority Support', included: true },
        { text: 'Premium Marketing Assets', included: true },
        { text: '24/7 Support', included: true },
        { text: 'Quarterly Strategy Session', included: false },
      ],
    },
    {
      tier: 'Platinum',
      commission: 25,
      requirement: '1000+ referrals',
      isPopular: false,
      features: [
        { text: 'Real-time Analytics', included: true },
        { text: 'Custom Affiliate Link', included: true },
        { text: 'VIP Support', included: true },
        { text: 'Exclusive Marketing Assets', included: true },
        { text: '24/7 VIP Support', included: true },
        { text: 'Dedicated Account Manager', included: true },
      ],
    },
  ];

  const calculateEarnings = (tier: number) => {
    return (referrals * avgOrderValue * tier) / 100;
  };

  return (
    <div className="min-h-screen bg-[#0F0F1E] text-white">
      <Navigation />

      {/* HERO */}
      <Section title="Simple, Transparent Pricing" subtitle="Earn what you're worth">
        <p className="text-center text-lg text-secondary max-w-2xl mx-auto">
          Your commission rate grows with your success. Start with 10% and unlock up to 25% as you
          build your audience. No hidden fees, no caps.
        </p>
      </Section>

      {/* PRICING CARDS */}
      <Section background="secondary">
        <div className="grid grid-4 gap-lg">
          {pricingTiers.map((tier, index) => (
            <PricingCard key={index} {...tier} />
          ))}
        </div>
      </Section>

      {/* EARNINGS CALCULATOR */}
      <Section title="Earnings Calculator" subtitle="See how much you could earn">
        <div className="max-w-2xl mx-auto card">
          <div className="space-y-lg">
            <div>
              <label className="block text-sm font-semibold mb-sm">
                Expected Monthly Referrals: {referrals}
              </label>
              <input
                type="range"
                min="10"
                max="10000"
                value={referrals}
                onChange={(e) => setReferrals(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-secondary mt-sm">
                <span>10</span>
                <span>10,000</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-sm">
                Average Order Value: ${avgOrderValue}
              </label>
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                value={avgOrderValue}
                onChange={(e) => setAvgOrderValue(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-secondary mt-sm">
                <span>$10</span>
                <span>$500</span>
              </div>
            </div>

            <div className="border-t border-[rgba(255,255,255,0.1)] pt-lg">
              <h3 className="mb-md">Monthly Earnings by Tier:</h3>
              <div className="grid grid-2 gap-md">
                {pricingTiers.map((tier, index) => (
                  <div key={index} className="p-md bg-[#0F0F1E] rounded-lg">
                    <p className="text-sm text-secondary mb-sm">{tier.tier} ({tier.commission}%)</p>
                    <p className="text-2xl font-bold text-gradient">
                      ${calculateEarnings(tier.commission).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section title="Pricing FAQ" background="secondary">
        <div className="max-w-2xl mx-auto space-y-md">
          <div className="card">
            <h4>How often do I get paid?</h4>
            <p className="text-secondary mt-sm">
              Commissions are paid monthly on the 15th via PayPal or bank transfer. No minimum
              payout threshold.
            </p>
          </div>

          <div className="card">
            <h4>Can I upgrade my tier?</h4>
            <p className="text-secondary mt-sm">
              Yes! Tiers unlock automatically based on your referral count. Higher tiers give you
              better commission rates and exclusive perks.
            </p>
          </div>

          <div className="card">
            <h4>What if I don't hit my tier target?</h4>
            <p className="text-secondary mt-sm">
              No penalties. You keep earning at your current tier rate. Your tier is based on your
              highest achievement—it never goes down.
            </p>
          </div>

          <div className="card">
            <h4>Is there a maximum commission?</h4>
            <p className="text-secondary mt-sm">
              No caps! Earn unlimited commissions at your tier rate. The more you sell, the more you
              earn.
            </p>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section>
        <div className="text-center">
          <h2 className="mb-md">Ready to Start Earning?</h2>
          <Button href="/apply" variant="primary" size="lg">
            Apply Now
          </Button>
        </div>
      </Section>

      <Footer />
    </div>
  );
}
