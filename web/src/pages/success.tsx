import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Navigation } from '@/components/Navigation';
import { Section } from '@/components/Section';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';

export default function Success() {
  const router = useRouter();
  const { session_id, source } = router.query;
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  const isAppSource = source === 'app';

  useEffect(() => {
    // If this is from the app, redirect to deep link
    if (isAppSource && session_id) {
      setIsRedirecting(true);
      
      // Redirect to app deep link
      const deepLink = `blackpill://subscribe/success?session_id=${session_id}`;
      
      // Try to open deep link
      window.location.href = deepLink;
      
      // Fallback: show message if deep link doesn't work
      setTimeout(() => {
        setIsRedirecting(false);
      }, 2000);
    }
  }, [isAppSource, session_id]);

  // For app users, show redirecting message
  if (isAppSource) {
    return (
      <>
        <SEO 
          title="Subscription Successful" 
          description="Your subscription is active. Redirecting back to the app..."
        />
        <Navigation />
        <Section>
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-6xl mb-md">🎉</div>
            <h1 className="mb-md">Subscription Successful!</h1>
            {isRedirecting ? (
              <p className="text-lg text-secondary mb-lg">
                Redirecting you back to the app...
              </p>
            ) : (
              <>
                <p className="text-lg text-secondary mb-lg">
                  Your subscription is active! If you weren't redirected automatically, 
                  please return to the app.
                </p>
                <Button
                  onClick={() => {
                    window.location.href = `blackpill://subscribe/success?session_id=${session_id}`;
                  }}
                  className="btn-primary"
                  size="lg"
                >
                  Return to App
                </Button>
              </>
            )}
          </div>
        </Section>
        <Footer />
      </>
    );
  }

  // For web users, show download instructions
  return (
    <>
      <SEO 
        title="Subscription Successful - Download BlackPill" 
        description="Your subscription is active. Download the BlackPill app to start using all premium features."
      />
      <Navigation />

      <Section>
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-6xl mb-md">🎉</div>
          <h1 className="mb-md">Welcome to BlackPill!</h1>
          <p className="text-lg text-secondary mb-lg">
            Your subscription is active. Download the app to start using all premium features.
          </p>
        </div>
      </Section>

      <Section background="secondary" title="Download the App">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-lg text-secondary mb-lg">
            Get the BlackPill app on your device to start analyzing photos with AI-powered insights.
          </p>
          <div className="flex gap-md justify-center flex-wrap mb-lg">
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
        </div>
      </Section>

      <Section title="What Happens Next">
        <div className="grid grid-3 gap-lg">
          <Card 
            icon="📱" 
            title="Step 1: Download & Sign In" 
            description="Download the app and sign in with the email you used for checkout." 
          />
          <Card 
            icon="✨" 
            title="Step 2: Start Analyzing" 
            description="Take your first photo and get instant AI-powered attractiveness analysis." 
          />
          <Card
            icon="🚀"
            title="Step 3: Unlock Premium Features"
            description="Enjoy unlimited scans, priority analysis, and all premium features."
          />
        </div>
      </Section>

      <Section background="secondary" title="Getting Started">
        <div className="max-w-2xl mx-auto space-y-md">
          <div className="card">
            <div className="flex gap-md items-start">
              <span className="text-2xl">📧</span>
              <div>
                <h4>Check Your Email</h4>
                <p className="text-secondary text-sm">
                  We've sent a confirmation email with your subscription details and receipt.
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex gap-md items-start">
              <span className="text-2xl">🔐</span>
              <div>
                <h4>Sign In to the App</h4>
                <p className="text-secondary text-sm">
                  Use the same email address you used for checkout to sign in to the app.
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex gap-md items-start">
              <span className="text-2xl">💳</span>
              <div>
                <h4>Manage Your Subscription</h4>
                <p className="text-secondary text-sm">
                  You can manage or cancel your subscription anytime from your account settings in the app.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="mb-md">Questions?</h2>
          <p className="text-secondary mb-lg">
            Check out our documentation or reach out to support@black-pill.app
          </p>
          <div className="flex gap-md justify-center flex-wrap">
            <Button href="/" variant="primary" size="lg">
              Back to Home
            </Button>
            <Button href="mailto:support@black-pill.app" variant="secondary" size="lg">
              Contact Support
            </Button>
          </div>
        </div>
      </Section>

      <Footer />
    </>
  );
}
