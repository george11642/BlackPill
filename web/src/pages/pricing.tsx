import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Navigation } from '@/components/Navigation';
import { Section } from '@/components/Section';
import { Button } from '@/components/Button';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';

interface SubscriptionTier {
  tier: 'free' | 'basic' | 'pro' | 'unlimited';
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
    highlight: true,
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

export default function Pricing() {
  const router = useRouter();
  const { source, user_id, email, tier, interval } = router.query;
  
  const [selectedTier, setSelectedTier] = useState<'basic' | 'pro' | 'unlimited'>('pro');
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
  const [emailValue, setEmailValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isAppSource = source === 'app';

  // Pre-fill data from URL parameters (both app and web flows)
  React.useEffect(() => {
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

  const handleSubscribe = async (tierToSubscribe: 'basic' | 'pro' | 'unlimited') => {
    setIsLoading(true);
    setError(null);

    try {
      // Use provided email or a placeholder for quick checkout
      // Stripe will ask for email during checkout if not provided
      const checkoutEmail = emailValue || (email as string) || `checkout-${Date.now()}@temp.black-pill.app`;
      
      console.log('Creating checkout session:', {
        tier: tierToSubscribe,
        interval: billingInterval,
        email: checkoutEmail,
        source: isAppSource ? 'app' : 'web',
      });
      
      // Call Next.js API proxy route which forwards to backend
      const response = await fetch('/api/subscriptions/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier: tierToSubscribe,
          interval: billingInterval,
          email: checkoutEmail,
          source: isAppSource ? 'app' : 'web',
          user_id: isAppSource ? (user_id as string) : undefined,
        }),
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create checkout session');
        } else {
          const errorText = await response.text();
          console.error('Non-JSON error response:', errorText);
          throw new Error('Server error - please check backend configuration');
        }
      }

      const data = await response.json();
      
      // Redirect to Stripe checkout
      if (data.checkout_url) {
        // Track analytics before redirect
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'checkout_started', {
            tier: tierToSubscribe,
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
          tier: tierToSubscribe,
        });
      }
    }
  };

  const getPrice = (tier: SubscriptionTier) => {
    if (tier.tier === 'free') return { price: '$0', interval: 'lifetime' };
    if (billingInterval === 'monthly') {
      return { price: tier.monthlyPrice, interval: '/month' };
    }
    return { price: tier.annualPrice, interval: '/year' };
  };

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'BlackPill Subscription Plans',
    description: 'AI-powered attractiveness analysis with honest feedback and actionable self-improvement tips.',
    offers: tiers.filter(t => t.tier !== 'free').map(tier => ({
      '@type': 'Offer',
      name: tier.name,
      price: tier.monthlyPrice.replace('$', ''),
      priceCurrency: 'USD',
      priceSpecification: {
        '@type': 'PriceSpecification',
        price: tier.monthlyPrice.replace('$', ''),
        priceCurrency: 'USD',
        billingDuration: 'P1M',
      },
    })),
  };

  return (
    <>
      <SEO
        title="Pricing - BlackPill"
        description="Choose your subscription plan and unlock unlimited AI-powered attractiveness analysis. Free, Basic, Pro, and Unlimited tiers available."
        keywords="pricing, subscription, attractiveness analysis, AI face rating, self improvement"
        structuredData={structuredData}
      />
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
              <span className="badge badge-success text-xs">Save 10%</span>
            </button>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-4 gap-lg mb-lg">
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
                      setSelectedTier(tierOption.tier as 'basic' | 'pro' | 'unlimited');
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
                          handleSubscribe(tierOption.tier as 'basic' | 'pro' | 'unlimited');
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