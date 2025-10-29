import React from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Section } from '@/components/Section';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { StatCounter } from '@/components/StatCounter';
import { PricingCard } from '@/components/PricingCard';
import { FAQ } from '@/components/FAQ';
import { Footer } from '@/components/Footer';

export default function Home() {
  const faqItems = [
    {
      question: 'How do I get approved to become a creator?',
      answer: 'Apply through our creator program with your social media profiles and audience information. Our team reviews applications within 24-48 hours. We look for engaged audiences and genuine interest in promoting quality products.',
    },
    {
      question: 'When do I get paid my commissions?',
      answer: 'Commissions are calculated monthly and paid out on the 15th of each month via PayPal or bank transfer. You can see your pending payouts and payment history in your dashboard anytime.',
    },
    {
      question: 'What can I promote?',
      answer: 'You can promote any products or services within our network. We provide marketing materials, share cards, and content assets to make promotion easier. Check our brand guidelines for approved promotional content.',
    },
    {
      question: 'How do commissions work?',
      answer: 'Your commission percentage depends on your tier (Bronze 10%, Silver 15%, Gold 20%, Platinum 25%). You earn commission on every successful referral from your unique link, with no caps or limits.',
    },
    {
      question: 'How do I track my performance?',
      answer: 'Your dashboard shows real-time analytics including clicks, conversions, conversion rate, and revenue. You can filter by date range and export data for your records.',
    },
    {
      question: 'Is there a minimum payout threshold?',
      answer: 'No minimum threshold! You can cash out as soon as you earn your first commission. However, payments are processed monthly, so you\'ll need to wait until the next payout date.',
    },
  ];

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
      requirement: '100+ referrals to unlock',
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
      requirement: '500+ referrals to unlock',
      isPopular: true,
      features: [
        { text: 'Real-time Analytics', included: true },
        { text: 'Custom Affiliate Link', included: true },
        { text: 'Priority Email Support', included: true },
        { text: 'Premium Marketing Assets', included: true },
        { text: '24/7 Priority Support', included: true },
        { text: 'Quarterly Strategy Session', included: false },
      ],
    },
    {
      tier: 'Platinum',
      commission: 25,
      requirement: '1000+ referrals to unlock',
      isPopular: false,
      features: [
        { text: 'Real-time Analytics', included: true },
        { text: 'Custom Affiliate Link', included: true },
        { text: 'VIP Email Support', included: true },
        { text: 'Exclusive Marketing Assets', included: true },
        { text: '24/7 VIP Support', included: true },
        { text: 'Dedicated Account Manager', included: true },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#0F0F1E] text-white">
      <Navigation />

      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(255,0,128,0.2) 0%, transparent 70%)',
        }}></div>
        
        <div className="section-inner relative z-10 text-center">
          {/* Statistics Banner */}
          <div className="mb-lg flex justify-center gap-lg flex-wrap">
            <div className="text-sm font-semibold">
              <span className="text-[#00FF41]">10,000+</span> Active Creators
            </div>
            <div className="text-sm font-semibold">
              <span className="text-[#FF0080]">$5M+</span> Paid Out
            </div>
            <div className="text-sm font-semibold">
              <span className="text-[#00D9FF]">25%</span> Avg Commission
            </div>
          </div>

          <h1 className="mb-md fade-in-up" style={{ animation: 'fadeInUp 0.8s ease-out' }}>
            Turn Your Audience Into
            <br />
            <span className="text-gradient">Passive Income</span>
          </h1>

          <p className="text-xl text-secondary mb-lg max-w-2xl mx-auto">
            Join BlackPill's creator program and earn generous commissions by promoting products to your engaged audience. Simple tracking, timely payouts, and total transparency.
          </p>

          <div className="flex gap-md justify-center flex-wrap mb-lg">
            <Button href="/apply" variant="primary" size="lg">
              Start Earning Now →
            </Button>
            <Button href="#how-it-works" variant="secondary" size="lg">
              See How It Works
            </Button>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <Section
        title="How It Works"
        subtitle="Three simple steps to start earning"
        id="how-it-works"
        background="secondary"
      >
        <div className="grid grid-3 gap-lg">
          <div className="card hover:false relative text-center">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-[#FF0080] flex items-center justify-center font-bold">
              1
            </div>
            <div className="card-icon text-5xl">📝</div>
            <h3 className="card-title">Apply & Get Approved</h3>
            <p className="card-description">
              Apply through our simple form, share your audience info, and get approved within 24-48 hours.
            </p>
          </div>

          <div className="card hover:false relative text-center">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-[#00D9FF] flex items-center justify-center font-bold">
              2
            </div>
            <div className="card-icon text-5xl">🔗</div>
            <h3 className="card-title">Share Your Link</h3>
            <p className="card-description">
              Get your unique affiliate link and marketing assets. Share on social media, email, or your website.
            </p>
          </div>

          <div className="card hover:false relative text-center">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-[#00FF41] flex items-center justify-center font-bold">
              3
            </div>
            <div className="card-icon text-5xl">💰</div>
            <h3 className="card-title">Earn & Get Paid</h3>
            <p className="card-description">
              Earn commissions on every sale. Track everything in your dashboard. Get paid monthly, no minimum.
            </p>
          </div>
        </div>
      </Section>

      {/* FEATURES */}
      <Section title="Powerful Features" subtitle="Everything you need to succeed">
        <div className="grid grid-3 gap-lg">
          <Card
            icon="📊"
            title="Real-time Analytics"
            description="Track clicks, conversions, and revenue instantly. See exactly how your audience performs."
          />
          <Card
            icon="💰"
            title="Earn Commissions"
            description="10-25% commissions depending on your tier. Unlock higher rates as you grow."
          />
          <Card
            icon="🔗"
            title="Custom Links"
            description="Generate unlimited affiliate links. Track performance for each link separately."
          />
          <Card
            icon="⭐"
            title="Performance Tiers"
            description="Bronze, Silver, Gold, Platinum. Earn higher commissions as you grow your referrals."
          />
          <Card
            icon="🎨"
            title="Marketing Assets"
            description="Access pre-made share cards, images, and copy. Make promotion easy and professional."
          />
          <Card
            icon="👥"
            title="Creator Community"
            description="Join 10,000+ creators. Network, share strategies, and learn from top performers."
          />
        </div>
      </Section>

      {/* PRICING / TIERS */}
      <Section
        title="Creator Tiers"
        subtitle="Earn more as you grow. Unlock higher rates automatically."
        background="secondary"
      >
        <div className="grid grid-4 gap-lg">
          {pricingTiers.map((tier, index) => (
            <PricingCard key={index} {...tier} />
          ))}
        </div>
      </Section>

      {/* SOCIAL PROOF */}
      <Section title="Trusted by Creators Worldwide" subtitle="Real results from real creators">
        <div className="grid grid-4 gap-lg">
          <StatCounter value={10000} label="Active Creators" />
          <StatCounter value={5000000} label="Total Earnings Paid" prefix="$" />
          <StatCounter value={95} label="Creator Satisfaction" suffix="%" />
          <StatCounter value={150000} label="Avg Referrals/Month" />
        </div>
      </Section>

      {/* PARTNERSHIP SECTION */}
      <Section background="secondary">
        <div className="grid grid-2 gap-xl items-center">
          <div>
            <h2 className="mb-md">Join Our Creator Program</h2>
            <p className="mb-md text-lg">
              We're building a community of creators who turn their audience into income. Whether you have 1,000 or 1,000,000 followers, there's a place for you.
            </p>
            <ul className="space-y-md mb-lg">
              <li className="flex gap-sm items-start">
                <span className="text-[#00FF41] font-bold">✓</span>
                <span>No minimum requirements to join as Bronze tier</span>
              </li>
              <li className="flex gap-sm items-start">
                <span className="text-[#00FF41] font-bold">✓</span>
                <span>Unlock higher tiers automatically based on performance</span>
              </li>
              <li className="flex gap-sm items-start">
                <span className="text-[#00FF41] font-bold">✓</span>
                <span>Get paid monthly with no minimum payout threshold</span>
              </li>
              <li className="flex gap-sm items-start">
                <span className="text-[#00FF41] font-bold">✓</span>
                <span>Access exclusive marketing materials and support</span>
              </li>
            </ul>
            <Button href="/apply" variant="primary" size="lg">
              Apply to Creator Program
            </Button>
          </div>
          <div className="card">
            <div className="text-center">
              <div className="text-6xl mb-md">🚀</div>
              <h3>Success Stories</h3>
              <p className="text-secondary mt-md">
                Top creator earned <span className="text-[#00FF41] font-bold">$15,000</span> in their first month. You could be next.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section title="Frequently Asked Questions" subtitle="Have questions? We have answers." id="faq">
        <div className="max-w-2xl mx-auto">
          <FAQ items={faqItems} />
        </div>
      </Section>

      {/* FINAL CTA */}
      <Section background="secondary">
        <div className="text-center">
          <h2 className="mb-md">Ready to Maximize Your Earnings?</h2>
          <p className="text-lg text-secondary mb-lg max-w-xl mx-auto">
            Join 10,000+ creators who are turning their audience into passive income. Apply now and start earning today.
          </p>
          <div className="flex gap-md justify-center flex-wrap">
            <Button href="/apply" variant="primary" size="lg">
              Apply Now
            </Button>
            <Button href="/pricing" variant="secondary" size="lg">
              View Pricing
            </Button>
            <Button href="/dashboard" variant="ghost" size="lg">
              Go to Dashboard
            </Button>
          </div>
        </div>
      </Section>

      <Footer />
    </div>
  );
}
