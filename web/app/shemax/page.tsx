'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Navigation } from './components/Navigation';
import { Section } from './components/Section';
import { Card } from './components/Card';
import { Button } from './components/Button';
import { StatCounter } from './components/StatCounter';
import { PricingCard } from './components/PricingCard';
import { FAQ } from './components/FAQ';
import { Footer } from './components/Footer';

export default function HomePage() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const handleSubscribe = async (tier: string) => {
    setCheckoutLoading(tier);

    try {
      const response = await fetch('/api/subscriptions/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier: tier,
          interval: billingInterval,
          source: 'web',
        }),
      });

      const data = await response.json();

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        alert(data.message || 'Failed to create checkout session');
        setCheckoutLoading(null);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to create checkout session. Please try again.');
      setCheckoutLoading(null);
    }
  };

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    name: 'SheMax',
    description: 'AI-powered beauty analysis with honest feedback and actionable glow-up tips.',
    url: 'https://shemax.app',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'iOS, Android',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    sameAs: [
      'https://twitter.com/shemaxapp',
      'https://instagram.com/shemaxapp',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'support@shemax.app',
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
        { text: 'Basic beauty score', included: true },
        { text: 'Limited improvement tips', included: true },
        { text: 'Photo auto-deletes after 90 days', included: true },
      ],
      cta: 'Download App',
      highlight: false,
    },
    {
      tier: 'Pro',
      price: '$12.99',
      interval: '/month',
      yearlyPrice: '$119.99/year',
      scans: '20 scans/month',
      features: [
        { text: 'Full 6-dimension breakdown', included: true },
        { text: 'Advanced AI tips', included: true },
        { text: 'Priority analysis (<10 seconds)', included: true },
        { text: 'Comparison mode', included: true },
        { text: 'Weekly progress reports', included: true },
      ],
      cta: 'Subscribe',
      highlight: true,
    },
    {
      tier: 'Elite',
      price: '$19.99',
      interval: '/month',
      yearlyPrice: '$219.99/year',
      scans: 'Unlimited scans',
      features: [
        { text: 'All Pro features', included: true },
        { text: 'Unlimited analysis', included: true },
        { text: 'Advanced analytics', included: true },
        { text: 'Leaderboard badge', included: true },
        { text: 'Priority support', included: true },
      ],
      cta: 'Subscribe',
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
      answer: 'You get 1 lifetime scan with a score and improvement tips. Share with friends via referral code and both of you get bonus scans.',
    },
    {
      question: 'How does the referral system work?',
      answer: 'Get your unique referral code and share it with friends. When they accept, you both get 5 free scans. Build your streak and climb the referral leaderboard.',
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      <Navigation />

      {/* Hero Section */}
      <Section className="hero-gradient">
        <div className="grid grid-2 gap-xl items-center">
          <div>
            <h1 className="text-6xl font-bold mb-md">Glow Up Your Best Self. Unlock Your Beauty.</h1>
            <p className="text-xl text-secondary mb-lg">
              AI-powered beauty analysis with actionable glow-up tips. Get your score, detailed breakdown, and personalized guidance.
            </p>
            <div className="flex gap-md mb-lg flex-wrap">
              <a 
                href="https://apps.apple.com/app/shemax" 
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
                href="https://play.google.com/store/apps/details?id=com.shemax.app" 
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
            <div className="mt-md">
              <Link href="/shemax/dashboard">
                <Button variant="secondary" size="lg">
                  Try Web App
                </Button>
              </Link>
            </div>
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
            <span className="badge badge-success text-xs">Save 20%</span>
          </button>
        </div>

        <div className="grid grid-3 gap-lg">
          {pricingTiers.map((tier, index) => {
            const displayPrice = getPrice(tier);
            const isLoading = checkoutLoading === tier.tier.toLowerCase();
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
                      href="https://apps.apple.com/app/shemax"
                    >
                      {tier.cta}
                    </Button>
                  ) : (
                    <Button
                      className={tier.highlight ? 'btn-primary w-full' : 'btn-secondary w-full'}
                      size="lg"
                      onClick={() => handleSubscribe(tier.tier.toLowerCase())}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Loading...' : `Subscribe to ${tier.tier}`}
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
        subtitle="Earn 10-25% commission promoting SheMax to your audience"
        id="creators-teaser"
        background="secondary"
      >
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-lg text-secondary mb-lg">
            Join our affiliate program and earn commissions from every user you bring. Get marketing assets, tracking dashboard, and weekly payouts.
          </p>
          <Link href="/shemax/creators">
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
        subtitle="Download SheMax today and discover your true potential"
        background="secondary"
      >
        <div className="flex gap-md justify-center flex-wrap">
          <a 
            href="https://apps.apple.com/app/shemax" 
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
            href="https://play.google.com/store/apps/details?id=com.shemax.app" 
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
