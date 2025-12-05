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
          <p>We collect information you provide directly to us, including:</p>
          <ul className="list-disc pl-5 mb-4">
            <li><strong>Face photos</strong> you upload for AI analysis (selfies or portraits you choose to provide)</li>
            <li><strong>Facial feature analysis outputs</strong> (AI-generated scores, descriptions, tips for categories like symmetry, jawline, skin, eyes, hair)</li>
            <li>Account information (email address, username)</li>
            <li>Usage data (app interactions, device information, and preferences)</li>
          </ul>

          <h3>3. How We Use Your Information</h3>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-5 mb-4">
            <li>Provide, maintain, and improve the analysis and coaching features</li>
            <li>Generate AI-based facial feature scores, descriptions, and self-improvement tips</li>
            <li>Let you track progress over time and compare historical analyses</li>
            <li>Send you technical notices, security alerts, and support messages</li>
            <li>Respond to your requests and provide customer support</li>
          </ul>

          <h3>4. Face Data Policy</h3>
          <p>
            We treat face photos and AI analysis outputs as sensitive data. We do <strong>not</strong> create biometric templates, facial recognition profiles, or facial landmark coordinates, and we do <strong>not</strong> use your photos to train facial recognition models.
          </p>
          <p>
            <strong>Processing:</strong> Photos you provide are sent to OpenAI&apos;s Vision API (GPT-4o/4o-mini) for on-demand analysis. Analysis outputs (scores, text descriptions, tips) are stored in our database.
          </p>
          <p>
            <strong>Storage:</strong> Photos are stored privately in Supabase object storage with time-limited signed URL access; analysis results are stored in Supabase PostgreSQL as JSON. Data is encrypted in transit and at rest. Row Level Security ensures only your account can access your data.
          </p>
          <p>
            <strong>Retention:</strong> Photos are automatically deleted after <strong>90 days</strong> from upload. Analysis results persist while your account remains active. You may delete photos or analyses at any time, and deleting your account permanently removes all associated photos and analyses.
          </p>
          <p>
            <strong>Sharing:</strong> We share photos only with OpenAI for analysis. We do not sell or share face data with advertisers, data brokers, or social media platforms. OpenAI states API data is not used to train its models. We do not disclose face data to third parties except as required by law or with your explicit consent.
          </p>
          <p>
            <strong>Permissions & Control:</strong> You can delete uploaded photos and analysis records from within the app. Account deletion removes all face data and analysis results. If you opt out of providing photos, you can still access non-photo features where available.
          </p>

          <h3>5. Data Security</h3>
          <p>
            We implement technical and organizational measures, including HTTPS/TLS in transit, encryption at rest, access controls, and least-privilege permissions. No method of transmission or storage is 100% secure; please use strong authentication and keep your device secure.
          </p>

          <h3>6. Children</h3>
          <p>
            The service is not directed to children under the age required by applicable law (including COPPA/child privacy thresholds). We do not knowingly collect face data from children. If you believe a child has provided face data, contact us to delete it.
          </p>

          <h3>7. International Transfers</h3>
          <p>
            Your data may be processed on servers outside your country. Where required, we use appropriate safeguards for cross-border transfers.
          </p>

          <h3>8. Your Rights</h3>
          <p>
            Depending on your region, you may have rights to access, correct, delete, or port your data, or to object to or restrict certain processing. Contact us to exercise these rights.
          </p>

          <h3>9. Contact Us</h3>
          <p>
            If you have questions about this Privacy Policy or our face data practices, contact us at <a href="mailto:support@black-pill.app">support@black-pill.app</a>.
          </p>
        </div>
      </Section>

      <Footer />
    </>
  );
}

