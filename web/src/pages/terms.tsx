import React from 'react';
import { Navigation } from '@/components/Navigation';
import { Section } from '@/components/Section';
import { Footer } from '@/components/Footer';

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#0F0F1E] text-white">
      <Navigation />

      <Section title="Terms of Service" subtitle="Last updated: October 2025">
        <div className="max-w-3xl mx-auto prose prose-invert text-secondary space-y-lg">
          <div>
            <h2 className="text-2xl font-bold text-white mb-md">1. Acceptance of Terms</h2>
            <p>
              By accessing and using BlackPill's services, you agree to be bound by these Terms of
              Service. If you do not agree to any part of these terms, you may not use our services.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-md">2. Creator Program Eligibility</h2>
            <p>To participate in our creator program, you must:</p>
            <ul className="list-disc list-inside space-y-sm mt-sm">
              <li>Be at least 18 years old</li>
              <li>Have an engaged audience on at least one platform</li>
              <li>Provide accurate application information</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Agree to our content and promotion guidelines</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-md">3. Commission Structure</h2>
            <p>
              Commission rates are determined by creator tier and are subject to change with 30 days
              notice. Commissions are only earned on valid referrals that result in completed
              transactions.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-md">4. Prohibited Activities</h2>
            <p>Creators must not:</p>
            <ul className="list-disc list-inside space-y-sm mt-sm">
              <li>Use misleading or deceptive marketing practices</li>
              <li>Bid on branded keywords without permission</li>
              <li>Spam, harass, or engage in abusive behavior</li>
              <li>Violate intellectual property rights</li>
              <li>Promote illegal activities or products</li>
              <li>Engage in fraud or chargebacks</li>
              <li>Share affiliate links in unauthorized channels</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-md">5. Payment Terms</h2>
            <p>
              Commissions are calculated monthly and paid on the 15th of each month via PayPal or
              bank transfer. There is no minimum payout threshold. Payments may be delayed if your
              account has unresolved disputes.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-md">6. Account Termination</h2>
            <p>
              We reserve the right to terminate your creator account at any time for violation of
              these terms or our policies. Upon termination, you forfeit any unpaid commissions
              unless otherwise legally required.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-md">7. Intellectual Property</h2>
            <p>
              All marketing materials, graphics, and content provided by BlackPill remain our
              property. You may use them only as authorized for promoting our services.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-md">8. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, BlackPill shall not be liable for indirect,
              incidental, or consequential damages arising from use of our services.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-md">9. Dispute Resolution</h2>
            <p>
              Any disputes shall be resolved through binding arbitration in accordance with applicable
              law. You waive your right to class action litigation.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-md">10. Changes to Terms</h2>
            <p>
              We may update these terms at any time. Continued use of our services constitutes
              acceptance of updated terms. We'll notify you of material changes.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-md">11. Contact</h2>
            <p>
              For questions about these terms, contact us at:
              <br />
              Email: legal@black-pill.app
              <br />
              Address: BlackPill, Inc.
            </p>
          </div>

          <div className="mt-lg pt-lg border-t border-[rgba(255,255,255,0.1)]">
            <p className="text-sm text-tertiary">
              By using BlackPill's services, you acknowledge that you have read and understood these
              Terms of Service.
            </p>
          </div>
        </div>
      </Section>

      <Footer />
    </div>
  );
}
