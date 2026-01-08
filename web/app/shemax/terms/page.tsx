'use client';

import React from 'react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { Section } from '../components/Section';

export default function TermsPage() {
  return (
    <>
      <Navigation />
      
      <Section title="Terms of Service" subtitle="Last Updated: November 29, 2025">
        <div className="prose max-w-4xl mx-auto text-secondary">
          <h3>1. Acceptance of Terms</h3>
          <p>
            By accessing or using the SheMax application and website, you agree to be bound by these Terms of Service. 
            If you do not agree to these terms, please do not use our services.
          </p>

          <h3>2. Description of Service</h3>
          <p>
            SheMax provides AI-powered beauty analysis and self-improvement tips. 
            The results provided are for entertainment and informational purposes only and should not be considered as medical or psychological advice.
          </p>

          <h3>3. User Conduct</h3>
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 mb-4">
            <li>Use the service for any illegal purpose</li>
            <li>Harass, abuse, or harm another person</li>
            <li>Upload photos of others without their consent</li>
            <li>Attempt to reverse engineer the application</li>
          </ul>

          <h3>4. Subscription and Payments</h3>
          <p>
            Certain features of the service may require a subscription. You agree to pay all fees associated with your chosen subscription plan. 
            Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period.
          </p>

          <h3>5. Disclaimer of Warranties</h3>
          <p>
            The service is provided "as is" and "as available" without warranties of any kind, either express or implied. 
            We do not guarantee the accuracy or reliability of any analysis results.
          </p>

          <h3>6. Limitation of Liability</h3>
          <p>
            In no event shall SheMax be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of the service.
          </p>

          <h3>7. Changes to Terms</h3>
          <p>
            We reserve the right to modify these terms at any time. We will notify users of any material changes. 
            Your continued use of the service constitutes acceptance of the modified terms.
          </p>

          <h3>8. Contact</h3>
          <p>
            Questions about the Terms of Service should be sent to support@shemax.app.
          </p>
        </div>
      </Section>

      <Footer />
    </>
  );
}

