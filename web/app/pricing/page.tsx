'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navigation } from '../components/Navigation';
import { Section } from '../components/Section';
import { Button } from '../components/Button';
import { Footer } from '../components/Footer';
import { trackAffiliateReferralClick } from '@/lib/utils/affiliate-referral-tracking';

interface SubscriptionTier {
  tier: 'free' | 'pro' | 'elite';
  name: string;
  monthlyPrice: string;
  annualPrice: string;
  monthlyScans: string;
  annualScans: string;
  features: string[];
  highlight?: boolean;
}

const tiers: SubscriptionTier[] = [
  {
    tier: 'free',
    name: 'Free',
    monthlyPrice: '$0',
    annualPrice: '$0',
    monthlyScans: '1 scan',
    annualScans: '1 scan',
    features: [
      'Basic attractiveness score',
      'Limited improvement tips',
      'Photo auto-deletes after 90 days',
    ],
  },
  {
    tier: 'pro',
    name: 'Pro',
    monthlyPrice: '$12.99',
    annualPrice: '$119.99',
    monthlyScans: '20 scans/month',
    annualScans: '20 scans/month',
    features: [
      'All Free features',
      'Priority analysis (<10 seconds)',
      'Comparison mode',
      'Weekly progress reports',
    ],
    highlight: true,
  },
  {
    tier: 'elite',
    name: 'Elite',
    monthlyPrice: '$19.99',
    annualPrice: '$219.99',
    monthlyScans: 'Unlimited scans',
    annualScans: 'Unlimited scans',
    features: [
      'All Pro features',
      'Unlimited analysis',
      'Advanced analytics',
      'Leaderboard badge',
      'Priority support',
    ],
  },
];

function PricingContent() {
  const searchParams = useSearchParams();
  const source = searchParams.get('source');
  const user_id = searchParams.get('user_id');
  const email = searchParams.get('email');
  const tierParam = searchParams.get('tier');
  const intervalParam = searchParams.get('interval');
  const ref = searchParams.get('ref'); // Affiliate referral code
  
  const [selectedTier, setSelectedTier] = useState<'pro' | 'elite'>('pro');
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
  const [emailValue, setEmailValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isAppSource = source === 'app';

  useEffect(() => {
    if (isAppSource && email) {
      setEmailValue(email);
    }
    
    if (tierParam && ['pro', 'elite'].includes(tierParam)) {
      setSelectedTier(tierParam as 'pro' | 'elite');
    }
    
    if (intervalParam && ['monthly', 'annual'].includes(intervalParam)) {
      setBillingInterval(intervalParam as 'monthly' | 'annual');
    }

    // Track affiliate referral click if ref parameter is present
    if (ref) {
      trackAffiliateReferralClick(ref).catch(err => {
        console.error('Failed to track affiliate referral:', err);
      });
    }
  }, [isAppSource, email, tierParam, intervalParam, ref]);

  const handleSubscribe = async (tierToSubscribe: 'pro' | 'elite') => {
    setIsLoading(true);
    setError(null);

    try {
      // For app source, use the provided email. For web, let Stripe collect it.
      const checkoutEmail = isAppSource ? (emailValue || email as string) : undefined;
      
      const response = await fetch('/api/subscriptions/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier: tierToSubscribe,
          interval: billingInterval,
          ...(checkoutEmail && { email: checkoutEmail }),
          source: isAppSource ? 'app' : 'web',
          user_id: isAppSource ? (user_id as string) : undefined,
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create checkout session');
        } else {
          const errorText = await response.text();
          throw new Error('Server error - please check backend configuration');
        }
      }

      const data = await response.json();
      
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error('No checkout URL received from server');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const getPrice = (tier: SubscriptionTier) => {
    if (tier.tier === 'free') return { price: '$0', interval: 'lifetime' };
    if (billingInterval === 'monthly') {
      return { price: tier.monthlyPrice, interval: '/month' };
    }
    return { price: tier.annualPrice, interval: '/year' };
  };

  return (
    <>
      <Navigation />

      <Section>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-lg">
            <h1 className="text-4xl font-bold mb-md">
              {isAppSource ? 'Complete Your Subscription' : 'Choose Your Plan'}
            </h1>
            <p className="text-lg text-secondary">
              {isAppSource
                ? 'Your payment information is secure and will be processed by Stripe.'
                : 'Select the plan that best fits your needs'}
            </p>
          </div>

          {error && (
            <div className="card bg-red-900/20 border-red-500 mb-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Billing Interval Toggle */}
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

          {/* Pricing Cards */}
          <div className="grid grid-3 gap-lg mb-lg">
            {tiers.map((tierOption) => {
              const isSelected = selectedTier === tierOption.tier;
              const displayPrice = getPrice(tierOption);
              
              return (
                <div
                  key={tierOption.tier}
                  className={`card cursor-pointer transition ${
                    isSelected ? 'ring-2 ring-[#FF0080] scale-105' : ''
                  } ${tierOption.highlight ? 'relative' : ''}`}
                  onClick={() => {
                    if (tierOption.tier !== 'free') {
                      setSelectedTier(tierOption.tier as 'pro' | 'elite');
                    }
                  }}
                >
                  {tierOption.highlight && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="badge badge-success">Most Popular</span>
                    </div>
                  )}
                  <div className="mb-md">
                    <h3 className="text-2xl font-bold mb-sm">{tierOption.name}</h3>
                    <div className="mb-md">
                      <span className="text-4xl font-bold text-gradient">{displayPrice.price}</span>
                      <span className="text-secondary ml-sm">{displayPrice.interval}</span>
                    </div>
                    <p className="text-sm text-secondary mt-md">
                      {billingInterval === 'monthly' ? tierOption.monthlyScans : tierOption.annualScans}
                    </p>
                  </div>

                  <div className="mb-lg">
                    {tierOption.tier === 'free' ? (
                      <div className="space-y-sm">
                        <a 
                          href="https://apps.apple.com/app/blackpill" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block w-full"
                        >
                          <Button className="btn-secondary w-full" size="lg">
                            Download App
                          </Button>
                        </a>
                        <a 
                          href="https://play.google.com/store/apps/details?id=com.blackpill.app" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block w-full"
                        >
                          <Button className="btn-secondary w-full" size="lg">
                            Get on Google Play
                          </Button>
                        </a>
                      </div>
                    ) : (
                      <Button
                        onClick={() => {
                          handleSubscribe(tierOption.tier as 'pro' | 'elite');
                        }}
                        disabled={isLoading}
                        className={tierOption.highlight ? 'btn-primary w-full' : 'btn-secondary w-full'}
                        size="lg"
                      >
                        {isLoading ? 'Processing...' : `Subscribe to ${tierOption.name}`}
                      </Button>
                    )}
                  </div>

                  <div className="border-t border-[rgba(255,255,255,0.1)] pt-md">
                    <p className="text-sm font-semibold mb-md">Includes:</p>
                    <ul className="space-y-sm">
                      {tierOption.features.map((feature, idx) => (
                        <li key={idx} className="text-sm flex items-center gap-sm text-[#00FF41]">
                          <span>✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Additional Info */}
          <div className="text-center">
            <p className="text-sm text-secondary mb-md">
              7-day money-back guarantee. Cancel anytime.
            </p>
            
            {isAppSource && (
              <p className="text-xs text-tertiary">
                You'll be redirected back to the app after payment
              </p>
            )}
          </div>
        </div>
      </Section>

      <Footer />
    </>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <>
        <Navigation />
        <Section>
          <div className="max-w-6xl mx-auto text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </Section>
        <Footer />
      </>
    }>
      <PricingContent />
    </Suspense>
  );
}

