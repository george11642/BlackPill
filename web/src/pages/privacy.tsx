import React from 'react';
import { Navigation } from '@/components/Navigation';
import { Section } from '@/components/Section';
import { Footer } from '@/components/Footer';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#0F0F1E] text-white">
      <Navigation />

      <Section title="Privacy Policy" subtitle="Last updated: October 2025">
        <div className="max-w-3xl mx-auto prose prose-invert text-secondary space-y-lg">
          <div>
            <h2 className="text-2xl font-bold text-white mb-md">1. Introduction</h2>
            <p>
              BlackPill ("we," "us," "our," or "Company") is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, disclose, and otherwise process
              personal information in connection with our website and services.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-md">2. Information We Collect</h2>
            <p className="mb-sm">We collect information you provide directly:</p>
            <ul className="list-disc list-inside space-y-sm">
              <li>Account information (name, email, profile)</li>
              <li>Application information (audience size, platform links)</li>
              <li>Payment and banking information</li>
              <li>Communications with us</li>
              <li>Analytics and performance data</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-md">3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc list-inside space-y-sm mt-sm">
              <li>Provide and improve our services</li>
              <li>Process applications and manage your account</li>
              <li>Calculate and process commissions</li>
              <li>Communicate with you</li>
              <li>Comply with legal obligations</li>
              <li>Protect against fraud and abuse</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-md">4. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your
              information against unauthorized access, alteration, disclosure, or destruction.
              However, no method of transmission over the internet is 100% secure.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-md">5. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to enhance your experience, understand usage
              patterns, and deliver targeted content. You can control cookie settings through your
              browser.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-md">6. Third-Party Services</h2>
            <p>
              We use third-party services including Stripe (payments), Google Analytics, and AWS
              (hosting). These providers have their own privacy policies governing their use of
              information.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-md">7. Your Rights</h2>
            <p>Depending on your location, you may have rights to:</p>
            <ul className="list-disc list-inside space-y-sm mt-sm">
              <li>Access your personal information</li>
              <li>Request corrections or updates</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of certain processing</li>
              <li>Data portability</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-md">8. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our practices, contact us at:
              <br />
              Email: privacy@black-pill.app
              <br />
              Address: BlackPill, Inc.
            </p>
          </div>

          <div className="mt-lg pt-lg border-t border-[rgba(255,255,255,0.1)]">
            <p className="text-sm text-tertiary">
              This Privacy Policy is subject to change. We'll notify you of significant changes via
              email or by updating the "Last updated" date above.
            </p>
          </div>
        </div>
      </Section>

      <Footer />
    </div>
  );
}
