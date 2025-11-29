'use client';

import React from 'react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { Section } from '../components/Section';

export default function PrivacyPage() {
  return (
    <>
      <Navigation />
      
      <Section title="Privacy Policy" subtitle="Last Updated: November 29, 2025">
        <div className="prose max-w-4xl mx-auto text-secondary">
          <h3>1. Introduction</h3>
          <p>
            Welcome to BlackPill ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website.
          </p>

          <h3>2. Information We Collect</h3>
          <p>We collect information that you provide directly to us, including:</p>
          <ul className="list-disc pl-5 mb-4">
            <li>Photos you upload for analysis</li>
            <li>Account information (email address, username)</li>
            <li>Usage data and preferences</li>
          </ul>

          <h3>3. How We Use Your Information</h3>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-5 mb-4">
            <li>Provide, maintain, and improve our services</li>
            <li>Process your photo analysis</li>
            <li>Send you technical notices and support messages</li>
            <li>Respond to your comments and questions</li>
          </ul>

          <h3>4. Face Data Policy</h3>
          <p>
            We take the privacy of your biometric data seriously. Photos uploaded for analysis are processed securely and are automatically deleted from our servers after 90 days. 
            We do not use your photos for facial recognition training or share them with third parties without your explicit consent.
          </p>

          <h3>5. Data Security</h3>
          <p>
            We implement appropriate technical and organizational security measures to protect your personal information. 
            However, please be aware that no method of transmission over the internet is 100% secure.
          </p>

          <h3>6. Contact Us</h3>
          <p>
            If you have any questions about this Privacy Policy, please contact us at support@black-pill.app.
          </p>
        </div>
      </Section>

      <Footer />
    </>
  );
}

