import React from 'react';
import Link from 'next/link';
import { SEO } from '@/components/SEO';
import { Navigation } from '@/components/Navigation';
import { Section } from '@/components/Section';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { StatCounter } from '@/components/StatCounter';
import { PricingCard } from '@/components/PricingCard';
import { FAQ } from '@/components/FAQ';
import { Footer } from '@/components/Footer';

export default function Creators() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BlackPill Creator Program',
    url: 'https://black-pill.app/creators',
    description: 'Join BlackPill\'s creator affiliate program and earn 10-25% commissions by promoting the app.',
    sameAs: [
      'https://twitter.com/blackpillapp',
      'https://instagram.com/blackpillapp',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Creator Support',
      email: 'creators@black-pill.app',
    },
  };

  const creatorFeatures = [
    {
      icon: '📊',
      title: 'Real-time Analytics',
      description: 'Track clicks, conversions, and revenue instantly. See exactly how your audience performs.',
    },
    {
      icon: '💰',
      title: 'Generous Commissions',
      description: '10-25% commissions depending on your tier. Higher rates unlock as you grow.',
    },
    {
      icon: '🔗',
      title: 'Custom Links',
      description: 'Generate unlimited affiliate links. Track performance for each campaign separately.',
    },
    {
      icon: '⭐',
      title: 'Performance Tiers',
      description: 'Bronze, Silver, Gold, Platinum. Earn higher commissions as you grow your referrals.',
    },
    {
      icon: '🎨',
      title: 'Marketing Assets',
      description: 'Access pre-made share cards, images, and copy. Make promotion easy and professional.',
    },
    {
      icon: '👥',
      title: 'Creator Community',
      description: 'Join 10,000+ creators. Network, share strategies, and learn from top performers.',
    },
  ];

  const creatorTiers = [
    {
      tier: 'Bronze',
      commission: 10,
      requirement: 'Free to join',
      features: [
        { text: 'Real-time Analytics', included: true },
        { text: 'Custom Affiliate Link', included: true },
        { text: 'Basic Support', included: true },
      ],
      cta: 'Apply Now',
      highlight: false,
    },
    {
      tier: 'Silver',
      commission: 15,
      requirement: '100+ referrals',
      features: [
        { text: 'All Bronze features', included: true },
        { text: 'Premium Marketing Assets', included: true },
        { text: 'Email Support', included: true },
      ],
      cta: 'Apply Now',
      highlight: false,
    },
    {
      tier: 'Gold',
      commission: 20,
      requirement: '500+ referrals',
      features: [
        { text: 'All Silver features', included: true },
        { text: '24/7 Priority Support', included: true },
        { text: 'Quarterly Strategy Session', included: true },
      ],
      cta: 'Apply Now',
      highlight: true,
    },
    {
      tier: 'Platinum',
      commission: 25,
      requirement: '1000+ referrals',
      features: [
        { text: 'All Gold features', included: true },
        { text: 'Dedicated Account Manager', included: true },
        { text: 'VIP Support', included: true },
      ],
      cta: 'Apply Now',
      highlight: false,
    },
  ];

  const creatorFaqItems = [
    {
      question: 'How do I get approved to become a creator?',
      answer: 'Apply through our creator application form with your social media profiles and audience information. Our team reviews applications within 24-48 hours. We look for engaged audiences and genuine interest in promoting BlackPill to your community.',
    },
    {
      question: 'When do I get paid my commissions?',
      answer: 'Commissions are calculated monthly and paid out on the 15th of each month via PayPal or bank transfer. You can see your pending payouts and payment history in your creator dashboard anytime.',
    },
    {
      question: 'What commissions can I earn?',
      answer: 'Your commission percentage depends on your tier (Bronze 10%, Silver 15%, Gold 20%, Platinum 25%). You earn commission on every successful app download and subscription from your unique link, with no caps or limits.',
    },
    {
      question: 'How do I track my performance?',
      answer: 'Your creator dashboard shows real-time analytics including clicks, conversions, conversion rate, and revenue. You can filter by date range and export data for your records.',
    },
    {
      question: 'Is there a minimum payout threshold?',
      answer: 'No minimum threshold! You can cash out as soon as you earn your first commission. However, payments are processed monthly, so payouts occur on the 15th of each month.',
    },
    {
      question: 'What marketing materials are available?',
      answer: 'We provide share cards, banner ads, social media assets, and copy templates. You also get access to our exclusive creator community where top performers share their strategies.',
    },
  ];

  return (
    <>
      <SEO
        title="Creator Affiliate Program"
        description="Join BlackPill's creator program and earn 10-25% commissions by promoting our app to your audience. Get marketing assets, tracking dashboard, and weekly support."
        keywords="affiliate program, creator program, passive income, commissions, affiliate marketing"
        canonical="https://black-pill.app/creators"
        structuredData={structuredData}
      />

      <Navigation />

      {/* Hero Section */}
      <Section className="hero-gradient">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-md">Turn Your Audience Into Income</h1>
          <p className="text-xl text-secondary mb-lg max-w-2xl mx-auto">
            Join BlackPill's creator program and earn 10-25% commission by promoting the app to your engaged audience. Simple tracking, timely payouts, total transparency.
          </p>
          <div className="flex gap-md justify-center flex-wrap mb-lg">
            <Link href="/apply">
              <Button className="btn-primary" size="lg">
                Apply Now →
              </Button>
            </Link>
            <Button href="#how-it-works" className="btn-secondary" size="lg">
              See How It Works
            </Button>
          </div>

          {/* Statistics Banner */}
          <div className="flex justify-center gap-lg flex-wrap mt-lg">
            <div className="text-sm font-semibold">
              <span className="text-green">10,000+</span> Active Creators
            </div>
            <div className="text-sm font-semibold">
              <span className="text-pink">$5M+</span> Paid Out
            </div>
            <div className="text-sm font-semibold">
              <span className="text-cyan">25%</span> Max Commission
            </div>
          </div>
        </div>
      </Section>

      {/* How It Works for Creators */}
      <Section
        title="How It Works"
        subtitle="Three simple steps to start earning"
        id="how-it-works"
        background="secondary"
      >
        <div className="grid grid-3 gap-lg">
          <Card icon="📝" title="Apply & Get Approved" description="Apply with your social media info. Get approved within 24-48 hours. Start with Bronze tier (10% commission)." />
          <Card icon="🔗" title="Share Your Link" description="Get your unique affiliate link and marketing assets. Share on social, email, or your website." />
          <Card icon="💰" title="Earn & Get Paid" description="Earn commissions on every conversion. Track everything in your dashboard. Get paid monthly." />
        </div>
      </Section>

      {/* Features */}
      <Section
        title="Powerful Creator Tools"
        subtitle="Everything you need to succeed"
        id="features"
      >
        <div className="grid grid-3 gap-lg">
          {creatorFeatures.map((feature, index) => (
            <Card
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </Section>

      {/* Creator Tiers */}
      <Section
        title="Creator Tiers"
        subtitle="Earn more as you grow. Unlock higher rates automatically."
        id="tiers"
        background="secondary"
      >
        <div className="grid grid-4 gap-lg">
          {creatorTiers.map((tier, index) => (
            <PricingCard
              key={index}
              tier={tier.tier}
              commission={tier.commission}
              requirement={tier.requirement}
              features={tier.features}
              isPopular={tier.highlight}
              ctaText={tier.cta}
            />
          ))}
        </div>
      </Section>

      {/* Social Proof */}
      <Section title="Trusted by Creators Worldwide" subtitle="Real results from real creators">
        <div className="grid grid-4 gap-lg text-center">
          <div>
            <StatCounter value={10000} label="Active Creators" />
          </div>
          <div>
            <div className="text-5xl font-bold text-green">$5M+</div>
            <p className="text-secondary mt-md">Total Paid Out</p>
          </div>
          <div>
            <div className="text-5xl font-bold text-cyan">95%</div>
            <p className="text-secondary mt-md">Creator Satisfaction</p>
          </div>
          <div>
            <StatCounter value={150000} label="Avg Monthly Referrals" />
          </div>
        </div>
      </Section>

      {/* Success Stories */}
      <Section background="secondary" id="success-stories">
        <div className="grid grid-2 gap-xl items-center">
          <div>
            <h2 className="text-4xl font-bold mb-md">Join Our Creator Community</h2>
            <p className="mb-md text-lg">
              We're building a community of creators who turn their audience into passive income. Whether you have 1,000 or 1,000,000 followers, there's a place for you.
            </p>
            <ul className="space-y-md mb-lg">
              <li className="flex gap-sm items-start">
                <span className="text-green font-bold">✓</span>
                <span>No minimum follower requirements to join</span>
              </li>
              <li className="flex gap-sm items-start">
                <span className="text-green font-bold">✓</span>
                <span>Unlock higher tiers automatically based on performance</span>
              </li>
              <li className="flex gap-sm items-start">
                <span className="text-green font-bold">✓</span>
                <span>Get paid monthly with no minimum payout threshold</span>
              </li>
              <li className="flex gap-sm items-start">
                <span className="text-green font-bold">✓</span>
                <span>Access exclusive marketing materials and dedicated support</span>
              </li>
            </ul>
            <Link href="/apply">
              <Button className="btn-primary" size="lg">
                Apply to Creator Program
              </Button>
            </Link>
          </div>
          <div className="card">
            <div className="text-center">
              <div className="text-6xl mb-md">🚀</div>
              <h3 className="text-2xl font-bold mb-md">Success Story</h3>
              <p className="text-secondary mb-md">
                Top creator earned <span className="text-green font-bold">$15,000</span> in their first month by sharing BlackPill with their fitness audience.
              </p>
              <p className="text-sm text-tertiary">You could be next.</p>
            </div>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section
        title="Frequently Asked Questions"
        subtitle="Have questions? We have answers."
        id="faq"
      >
        <div className="max-w-2xl mx-auto">
          <FAQ items={creatorFaqItems} />
        </div>
      </Section>

      {/* Final CTA */}
      <Section background="secondary">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-md">Ready to Maximize Your Earnings?</h2>
          <p className="text-lg text-secondary mb-lg max-w-xl mx-auto">
            Join 10,000+ creators who are turning their audience into passive income. Apply now and start earning today.
          </p>
          <div className="flex gap-md justify-center flex-wrap">
            <Link href="/apply">
              <Button className="btn-primary" size="lg">
                Apply Now
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button className="btn-secondary" size="lg">
                Creator Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </Section>

      <Footer />
    </>
  );
}
