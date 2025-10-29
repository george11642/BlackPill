import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Navigation } from '@/components/Navigation';
import { Section } from '@/components/Section';
import { Button } from '@/components/Button';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';

interface SubscriptionTier {
  tier: 'basic' | 'pro' | 'unlimited';
  name: string;
  monthlyPrice: string;
  annualPrice: string;
  monthlyScans: string;
  annualScans: string;
  features: string[];
}

const tiers: SubscriptionTier[] = [
  {
    tier: 'basic',
    name: 'Basic',
    monthlyPrice: '$4.99',
    annualPrice: '$54.99',
    monthlyScans: '5 scans/month',
    annualScans: '5 scans/month',
    features: [
      'Full 6-dimension breakdown',
      'Advanced AI tips',
      'Ad-free experience',
      'Referral bonuses',
    ],
  },
  {
    tier: 'pro',
    name: 'Pro',
    monthlyPrice: '$9.99',
    annualPrice: '$109.89',
    monthlyScans: '20 scans/month',
    annualScans: '20 scans/month',
    features: [
      'All Basic features',
      'Priority analysis (<10 seconds)',
      'Comparison mode',
      'Weekly progress reports',
    ],
  },
  {
    tier: 'unlimited',
    name: 'Unlimited',
    monthlyPrice: '$19.99',
    annualPrice: '$219.89',
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

export default function Subscribe() {
  const router = useRouter();
  const { source, user_id, email, tier, interval } = router.query;
  
  const [selectedTier, setSelectedTier] = useState<'basic' | 'pro' | 'unlimited'>('pro');
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
  const [emailValue, setEmailValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isAppSource = source === 'app';

  // Pre-fill data from URL parameters (both app and web flows)
  useEffect(() => {
    // Handle email (app flow only)
    if (isAppSource && email) {
      setEmailValue(email as string);
    }
    
    // Handle tier (both app and web flows)
    if (tier && ['basic', 'pro', 'unlimited'].includes(tier as string)) {
      setSelectedTier(tier as 'basic' | 'pro' | 'unlimited');
    }
    
    // Handle interval (both app and web flows)
    if (interval && ['monthly', 'annual'].includes(interval as string)) {
      setBillingInterval(interval as 'monthly' | 'annual');
    }
  }, [isAppSource, email, tier, interval]);

  const handleSubscribe = async () => {
    if (!emailValue && !isAppSource) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call Next.js API proxy route which forwards to backend
      const response = await fetch('/api/subscriptions/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier: selectedTier,
          interval: billingInterval,
          email: emailValue || (email as string), // Use pre-filled email if from app
          source: isAppSource ? 'app' : 'web',
          user_id: isAppSource ? (user_id as string) : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create checkout session');
      }

      const data = await response.json();
      
      // Redirect to Stripe checkout
      if (data.checkout_url) {
        // Track analytics before redirect
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'checkout_started', {
            tier: selectedTier,
            interval: billingInterval,
            source: isAppSource ? 'app' : 'web',
          });
        }
        
        window.location.href = data.checkout_url;
      } else {
        throw new Error('No checkout URL received from server');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      const errorMessage = err.message || 'An error occurred. Please try again.';
      setError(errorMessage);
      setIsLoading(false);
      
      // Track error analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'checkout_error', {
          error: errorMessage,
          tier: selectedTier,
        });
      }
    }
  };

  const selectedTierData = tiers.find(t => t.tier === selectedTier) || tiers[1];

  return (
    <>
      <SEO
        title="Subscribe to BlackPill"
        description="Choose your subscription plan and unlock unlimited AI-powered attractiveness analysis."
      />
      <Navigation />

      <Section>
        <div className="max-w-4xl mx-auto">
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

          {/* Email Input (only for web users) */}
          {!isAppSource && (
            <div className="card mb-lg">
              <label htmlFor="email" className="block text-sm font-semibold mb-sm">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={emailValue}
                onChange={(e) => setEmailValue(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-md py-sm bg-[#1A1A2E] border border-[rgba(255,255,255,0.1)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF0080]"
                required
              />
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
              <span className="badge badge-success text-xs">Save 10%</span>
            </button>
          </div>

          {/* Tier Selection */}
          <div className="grid grid-3 gap-lg mb-lg">
            {tiers.map((tierOption) => {
              const isSelected = selectedTier === tierOption.tier;
              const isPopular = tierOption.tier === 'pro';
              
              return (
                <div
                  key={tierOption.tier}
                  className={`card cursor-pointer transition ${
                    isSelected ? 'ring-2 ring-[#FF0080] scale-105' : ''
                  } ${isPopular ? 'relative' : ''}`}
                  onClick={() => setSelectedTier(tierOption.tier)}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="badge badge-success">Most Popular</span>
                    </div>
                  )}
                  <div className="mb-md">
                    <h3 className="text-2xl font-bold mb-sm">{tierOption.name}</h3>
                    <div className="mb-md">
                      <span className="text-4xl font-bold text-gradient">
                        {billingInterval === 'monthly'
                          ? tierOption.monthlyPrice
                          : tierOption.annualPrice}
                      </span>
                      <span className="text-secondary ml-sm">
                        /{billingInterval === 'monthly' ? 'month' : 'year'}
                      </span>
                    </div>
                    <p className="text-sm text-secondary mt-md">
                      {billingInterval === 'monthly'
                        ? tierOption.monthlyScans
                        : tierOption.annualScans}
                    </p>
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

          {/* Subscribe Button */}
          <div className="text-center">
            <Button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="btn-primary"
              size="lg"
            >
              {isLoading ? 'Processing...' : `Subscribe to ${selectedTierData.name}`}
            </Button>
            
            <p className="text-sm text-secondary mt-md">
              7-day money-back guarantee. Cancel anytime.
            </p>
            
            {isAppSource && (
              <p className="text-xs text-tertiary mt-sm">
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

