import React from 'react';
import { Navigation } from '@/components/Navigation';
import { Section } from '@/components/Section';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Footer } from '@/components/Footer';

export default function Success() {
  return (
    <div className="min-h-screen bg-[#0F0F1E] text-white">
      <Navigation />

      <Section>
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-6xl mb-md">🎉</div>
          <h1 className="mb-md">Welcome to BlackPill!</h1>
          <p className="text-lg text-secondary mb-lg">
            Your application has been submitted. Our team will review it within 24-48 hours and
            send you an approval email.
          </p>
        </div>
      </Section>

      <Section background="secondary" title="What Happens Next">
        <div className="grid grid-3 gap-lg">
          <Card icon="📧" title="Step 1: Check Your Email" description="We'll send confirmation and next steps within 24 hours." />
          <Card icon="✅" title="Step 2: Get Approved" description="Our team reviews applications and sends approval details." />
          <Card
            icon="🚀"
            title="Step 3: Start Earning"
            description="Get your affiliate link and start promoting immediately."
          />
        </div>
      </Section>

      <Section title="Getting Started Checklist">
        <div className="max-w-2xl mx-auto space-y-md">
          <div className="card">
            <div className="flex gap-md items-start">
              <span className="text-2xl">📝</span>
              <div>
                <h4>Set Up Your Dashboard</h4>
                <p className="text-secondary text-sm">
                  Once approved, log in to your dashboard to customize your profile and preferences.
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex gap-md items-start">
              <span className="text-2xl">🔗</span>
              <div>
                <h4>Get Your Affiliate Link</h4>
                <p className="text-secondary text-sm">
                  Create your unique affiliate link and share it with your audience.
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex gap-md items-start">
              <span className="text-2xl">🎨</span>
              <div>
                <h4>Download Marketing Assets</h4>
                <p className="text-secondary text-sm">
                  Access pre-made graphics, share cards, and content to make promotion easier.
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex gap-md items-start">
              <span className="text-2xl">📊</span>
              <div>
                <h4>Track Your Performance</h4>
                <p className="text-secondary text-sm">
                  Monitor clicks, conversions, and earnings in your real-time analytics dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section background="secondary">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="mb-md">Questions?</h2>
          <p className="text-secondary mb-lg">
            Check out our documentation or reach out to support@black-pill.app
          </p>
          <div className="flex gap-md justify-center flex-wrap">
            <Button href="https://docs.black-pill.app" variant="primary" size="lg">
              View Documentation
            </Button>
            <Button href="mailto:support@black-pill.app" variant="secondary" size="lg">
              Contact Support
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
