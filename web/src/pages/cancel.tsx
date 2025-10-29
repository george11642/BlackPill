import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Section } from '@/components/Section';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Footer } from '@/components/Footer';

export default function Cancel() {
  const [action, setAction] = useState<'none' | 'pause' | 'downgrade' | 'cancel'>('none');
  const [feedback, setFeedback] = useState('');

  const handleAction = (type: typeof action) => {
    setAction(type);
  };

  return (
    <div className="min-h-screen bg-[#0F0F1E] text-white">
      <Navigation />

      <Section>
        <div className="text-center max-w-2xl mx-auto mb-lg">
          <h1 className="mb-md">We'll Miss You!</h1>
          <p className="text-secondary text-lg">
            Before you go, let's see if there's something we can do to help.
          </p>
        </div>
      </Section>

      {action === 'none' && (
        <Section background="secondary">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-lg text-center">What would you like to do?</h2>
            <div className="grid grid-2 gap-lg">
              <Card
                title="Pause Account"
                description="Take a break without losing your tier, links, or stats. Pause for up to 6 months."
                hover={false}
              >
                <Button
                  onClick={() => handleAction('pause')}
                  variant="primary"
                  size="lg"
                  className="w-full mt-md"
                >
                  Pause Account
                </Button>
              </Card>

              <Card
                title="Downgrade Tier"
                description="Keep earning but reduce your tier to Bronze for a fresh start with lower commitment."
                hover={false}
              >
                <Button
                  onClick={() => handleAction('downgrade')}
                  variant="primary"
                  size="lg"
                  className="w-full mt-md"
                >
                  Downgrade
                </Button>
              </Card>

              <Card title="Take a Survey" description="Help us improve by sharing your feedback." hover={false}>
                <Button
                  onClick={() => handleAction('cancel')}
                  variant="secondary"
                  size="lg"
                  className="w-full mt-md"
                >
                  Give Feedback
                </Button>
              </Card>

              <Card
                title="Cancel Account"
                description="Close your account and remove all data (this cannot be undone)."
                hover={false}
              >
                <Button
                  onClick={() => handleAction('cancel')}
                  variant="ghost"
                  size="lg"
                  className="w-full mt-md"
                >
                  Cancel Account
                </Button>
              </Card>
            </div>
          </div>
        </Section>
      )}

      {(action === 'pause' || action === 'downgrade' || action === 'cancel') && (
        <Section background="secondary">
          <div className="max-w-2xl mx-auto card">
            <div className="mb-lg">
              <h2 className="text-2xl font-bold mb-md">
                {action === 'pause' && 'Pause Your Account'}
                {action === 'downgrade' && 'Downgrade to Bronze'}
                {action === 'cancel' && 'We\'d Love Your Feedback'}
              </h2>

              {action === 'pause' && (
                <div className="space-y-md">
                  <p className="text-secondary">
                    Your account will be paused for 3 months. You can reactivate at any time. Your
                    tier, links, and stats will be preserved.
                  </p>
                  <div className="flex gap-sm items-start">
                    <span className="text-[#00FF41]">✓</span>
                    <span>Keep your current tier</span>
                  </div>
                  <div className="flex gap-sm items-start">
                    <span className="text-[#00FF41]">✓</span>
                    <span>Preserve your affiliate links</span>
                  </div>
                  <div className="flex gap-sm items-start">
                    <span className="text-[#00FF41]">✓</span>
                    <span>Resume earning anytime</span>
                  </div>
                </div>
              )}

              {action === 'downgrade' && (
                <div className="space-y-md">
                  <p className="text-secondary">
                    You'll move to Bronze tier (10% commission). Your higher tier will be waiting
                    if you unlock it again.
                  </p>
                  <div className="bg-[#0F0F1E] p-md rounded-lg">
                    <p className="text-sm text-secondary mb-sm">This is a good option if:</p>
                    <ul className="text-sm space-y-sm">
                      <li>• You want to keep earning but have less focus</li>
                      <li>• You're testing a new platform or audience</li>
                      <li>• You need a fresh start</li>
                    </ul>
                  </div>
                </div>
              )}

              {action === 'cancel' && (
                <div className="space-y-md">
                  <p className="text-secondary mb-md">
                    We'd really appreciate knowing why you're leaving. Your feedback helps us improve.
                  </p>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Tell us what could have been better..."
                    rows={5}
                    className="w-full bg-[#2A2A3E] border border-[rgba(255,255,255,0.1)] rounded-lg px-md py-sm text-white resize-none"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-md">
              <Button onClick={() => setAction('none')} variant="secondary" size="lg" className="flex-1">
                Back
              </Button>
              <Button href="/dashboard" variant="primary" size="lg" className="flex-1">
                Confirm
              </Button>
            </div>
          </div>
        </Section>
      )}

      <Section>
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="mb-md">Still Need Help?</h2>
          <p className="text-secondary mb-lg">
            Our support team is here to answer any questions or discuss your needs.
          </p>
          <Button href="mailto:support@black-pill.app" variant="primary" size="lg">
            Contact Support
          </Button>
        </div>
      </Section>

      <Footer />
    </div>
  );
}
