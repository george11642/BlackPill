import React, { useState } from 'react';
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

export default function Home() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    name: 'BlackPill',
    description: 'AI-powered attractiveness analysis with honest feedback and actionable self-improvement tips.',
    url: 'https://black-pill.app',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'iOS, Android',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    sameAs: [
      'https://twitter.com/blackpillapp',
      'https://instagram.com/blackpillapp',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'support@black-pill.app',
    },
  };

  const appFeatures = [
    {
      icon: '✨',
      title: 'AI-Powered Analysis',
      description: 'Advanced AI analyzes symmetry, jawline, eyes, lips, skin, and bone structure.',
    },
    {
      icon: '💡',
      title: 'Personalized Tips',
      description: '3-5 actionable improvement tips with timeframes for results.',
    },
    {
      icon: '👥',
      title: 'Referral System',
      description: 'Share with friends, both get 5 free scans plus streak bonuses.',
    },
    {
      icon: '📈',
      title: 'Progress Tracking',
      description: 'See your improvement over time with historical comparisons.',
    },
    {
      icon: '🏆',
      title: 'Leaderboard',
      description: 'Compete weekly and rise the ranks with other users.',
    },
    {
      icon: '🔒',
      title: 'Privacy First',
      description: 'Your photos auto-delete after 90 days, encrypted storage.',
    },
  ];

  const pricingTiers = [
    {
      tier: 'Free',
      price: '$0',
      interval: 'lifetime',
      scans: '1 scan',
      features: [
        { text: 'Basic attractiveness score', included: true },
        { text: 'Limited improvement tips', included: true },
        { text: 'Photo auto-deletes after 90 days', included: true },
      ],
      cta: 'Download App',
      highlight: false,
    },
    {
      tier: 'Basic',
      price: '$4.99',
      interval: '/month',
      yearlyPrice: '$54.99/year',
      scans: '5 scans/month',
      features: [
        { text: 'Full 6-dimension breakdown', included: true },
        { text: 'Advanced AI tips', included: true },
        { text: 'Ad-free experience', included: true },
        { text: 'Referral bonuses', included: true },
      ],
      cta: 'Download App',
      highlight: false,
    },
    {
      tier: 'Pro',
      price: '$9.99',
      interval: '/month',
      yearlyPrice: '$109.89/year',
      scans: '20 scans/month',
      features: [
        { text: 'All Basic features', included: true },
        { text: 'Priority analysis (<10 seconds)', included: true },
        { text: 'Comparison mode', included: true },
        { text: 'Weekly progress reports', included: true },
      ],
      cta: 'Download App',
      highlight: true,
    },
    {
      tier: 'Unlimited',
      price: '$19.99',
      interval: '/month',
      yearlyPrice: '$209.89/year',
      scans: 'Unlimited scans',
      features: [
        { text: 'All Pro features', included: true },
        { text: 'Unlimited analysis', included: true },
        { text: 'Advanced analytics', included: true },
        { text: 'Leaderboard badge', included: true },
        { text: 'Priority support', included: true },
      ],
      cta: 'Download App',
      highlight: false,
    },
  ];

  const getPrice = (tier: typeof pricingTiers[number]) => {
    if (tier.tier === 'Free') return { price: '$0', interval: 'lifetime' };
    if (billingInterval === 'monthly') {
      return { price: tier.price, interval: tier.interval };
    }
    const yearlyPrice = tier.yearlyPrice?.split('/')[0] || tier.price;
    return { price: yearlyPrice, interval: '/year' };
  };

  const faqItems = [
    {
      question: 'How accurate is the AI analysis?',
      answer: 'Our analysis is based on established facial symmetry and aesthetics principles combined with advanced AI. Results are honest and constructive, focusing on actionable improvements rather than judgment.',
    },
    {
      question: 'What happens to my photos?',
      answer: 'Photos are stored encrypted and auto-delete after 90 days. You can manually delete any photo anytime. We never use your photos for facial recognition training or share them without your consent.',
    },
    {
      question: 'Can I delete my data?',
      answer: 'Yes, you have complete control. Delete individual photos anytime or delete your entire account and all associated data through settings.',
    },
    {
      question: 'What\'s included in the free tier?',
      answer: 'You get 1 lifetime scan with basic score and limited improvement tips. Share with friends via referral code and both of you get 5 bonus scans.',
    },
    {
      question: 'How does the referral system work?',
      answer: 'Get your unique referral code and share it with friends. When they accept, you both get 5 free scans. Build your streak and climb the referral leaderboard.',
    },
  ];

  return (
    <>
      <SEO
        title="BlackPill - Get Honest Feedback. Build Real Confidence."
        description="Get honest AI-powered attractiveness analysis with actionable self-improvement tips. Download now on iOS and Android."
        keywords="attractiveness analysis, AI face rating, self improvement, facial assessment, confidence builder"
        structuredData={structuredData}
      />

      <Navigation />

      {/* Hero Section */}
      <Section className="hero-gradient">
        <div className="grid grid-2 gap-xl items-center">
          <div>
            <h1 className="text-6xl font-bold mb-md">Get Honest Feedback. Build Real Confidence.</h1>
            <p className="text-xl text-secondary mb-lg">
              AI-powered attractiveness analysis with actionable self-improvement tips. Get your score, detailed breakdown, and personalized guidance.
            </p>
            <div className="flex gap-md mb-lg flex-wrap">
              <a 
                href="https://apps.apple.com/app/blackpill" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:opacity-80 transition"
              >
                <img 
                  src="/badges/app-store-badge.svg" 
                  alt="Download on the App Store" 
                  className="h-[60px]"
                />
              </a>
              <a 
                href="https://play.google.com/store/apps/details?id=com.blackpill.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:opacity-80 transition"
              >
                <img 
                  src="/badges/google-play-badge.png" 
                  alt="Get it on Google Play" 
                  className="h-[60px]"
                />
              </a>
            </div>
            <p className="text-sm text-tertiary">Available now on iOS and Android • 200K+ downloads</p>
          </div>
          <div className="phone-mockup-placeholder bg-gradient-to-br from-pink to-cyan rounded-2xl p-lg flex items-center justify-center min-h-96">
            <div className="text-center text-white">
              <div className="text-6xl font-bold text-pink mb-md">8.2</div>
              <p className="text-lg">Your Score</p>
              <div className="mt-md text-sm space-y-sm">
                <div>✨ Symmetry: 8.5</div>
                <div>🎯 Jawline: 7.9</div>
                <div>👁️ Eyes: 8.1</div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* How It Works */}
      <Section
        title="How It Works"
        subtitle="3 simple steps to get started"
        id="how-it-works"
        background="secondary"
      >
        <div className="grid grid-3 gap-lg">
          <Card icon="📸" title="Upload Your Photo" description="Take a selfie or upload from your gallery. We analyze in seconds." />
          <Card icon="⚡" title="AI Analysis" description="Get your score and 6-dimension breakdown instantly with actionable insights." />
          <Card icon="📈" title="Improve Yourself" description="Follow personalized tips and track your progress over time." />
        </div>
      </Section>

      {/* Features */}
      <Section
        title="Powerful Features"
        subtitle="Everything you need for honest self-assessment"
        id="features"
      >
        <div className="grid grid-3 gap-lg">
          {appFeatures.map((feature, index) => (
            <Card
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </Section>

      {/* Pricing */}
      <Section
        title="Simple Pricing"
        subtitle="Choose the plan that fits your needs"
        id="pricing"
        background="secondary"
      >
        {/* Pricing Toggle */}
        <div className="flex justify-center items-center gap-md mb-lg">
          <button 
            onClick={() => setBillingInterval('monthly')}
            className={`px-lg py-md rounded-lg font-semibold transition ${
              billingInterval === 'monthly' 
                ? 'bg-gradient text-white' 
                : 'bg-[#1A1A2E] text-secondary hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button 
            onClick={() => setBillingInterval('annual')}
            className={`px-lg py-md rounded-lg font-semibold transition flex items-center gap-sm ${
              billingInterval === 'annual' 
                ? 'bg-gradient text-white' 
                : 'bg-[#1A1A2E] text-secondary hover:text-white'
            }`}
          >
            Annual 
            <span className="badge badge-success text-xs">Save 10%</span>
          </button>
        </div>

        <div className="grid grid-4 gap-lg">
          {pricingTiers.map((tier, index) => {
            const displayPrice = getPrice(tier);
            return (
              <div
                key={index}
                className={`card relative ${tier.highlight ? 'ring-2 ring-[#FF0080] scale-105' : ''}`}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="badge badge-success">Most Popular</span>
                  </div>
                )}
                <div className="mb-md">
                  <h3 className="text-2xl font-bold mb-sm">{tier.tier}</h3>
                  <div className="mb-md">
                    <span className="text-4xl font-bold text-gradient">{displayPrice.price}</span>
                    <span className="text-secondary ml-sm">{displayPrice.interval}</span>
                  </div>
                  <p className="text-sm text-secondary mt-md">{tier.scans}</p>
                </div>

                <div className="mb-lg">
                  {tier.tier === 'Free' ? (
                    <Button
                      className="btn-secondary w-full"
                      size="lg"
                      href="https://apps.apple.com/app/blackpill"
                    >
                      {tier.cta}
                    </Button>
                  ) : (
                    <Button
                      className={tier.highlight ? 'btn-primary w-full' : 'btn-secondary w-full'}
                      size="lg"
                      href={`/subscribe?tier=${tier.tier.toLowerCase()}&interval=${billingInterval}&source=web`}
                    >
                      Subscribe to {tier.tier}
                    </Button>
                  )}
                </div>

                <div className="border-t border-[rgba(255,255,255,0.1)] pt-md">
                  <p className="text-sm font-semibold mb-md">Includes:</p>
                  <ul className="space-y-sm">
                    {tier.features.map((feature, fidx) => (
                      <li key={fidx} className="text-sm flex items-center gap-sm text-[#00FF41]">
                        <span>✓</span>
                        {feature.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Social Proof */}
      <Section
        title="Trusted by Thousands"
        subtitle="Real users, real results"
        id="social-proof"
      >
        <div className="grid grid-4 gap-lg text-center">
          <div>
            <StatCounter value={200000} label="Downloads" />
          </div>
          <div>
            <StatCounter value={50000} label="Monthly Analyses" />
          </div>
          <div>
            <div className="text-5xl font-bold text-green">4.8★</div>
            <p className="text-secondary mt-md">Average Rating</p>
          </div>
          <div>
            <div className="text-5xl font-bold text-yellow">95%</div>
            <p className="text-secondary mt-md">Recommend to Friends</p>
          </div>
        </div>
      </Section>

      {/* Creator Program Teaser */}
      <Section
        title="Are You a Content Creator?"
        subtitle="Earn 10-25% commission promoting BlackPill to your audience"
        id="creators-teaser"
        background="secondary"
      >
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-lg text-secondary mb-lg">
            Join our affiliate program and earn commissions from every user you bring. Get marketing assets, tracking dashboard, and weekly payouts.
          </p>
          <Link href="/creators">
            <Button className="btn-primary" size="lg">
              Learn More About Our Creator Program
            </Button>
          </Link>
        </div>
      </Section>

      {/* FAQ */}
      <Section
        title="Frequently Asked Questions"
        subtitle="Everything you need to know"
        id="faq"
      >
        <div className="max-w-2xl mx-auto">
          <FAQ items={faqItems} />
        </div>
      </Section>

      {/* Final CTA */}
      <Section
        title="Ready to Get Started?"
        subtitle="Download BlackPill today and discover your true potential"
        background="secondary"
      >
        <div className="flex gap-md justify-center flex-wrap">
          <a 
            href="https://apps.apple.com/app/blackpill" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:opacity-80 transition"
          >
            <img 
              src="/badges/app-store-badge.svg" 
              alt="Download on the App Store" 
              className="h-[60px]"
            />
          </a>
          <a 
            href="https://play.google.com/store/apps/details?id=com.blackpill.app" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:opacity-80 transition"
          >
            <img 
              src="/badges/google-play-badge.png" 
              alt="Get it on Google Play" 
              className="h-[60px]"
            />
          </a>
        </div>
      </Section>

      <Footer />
    </>
  );
}
