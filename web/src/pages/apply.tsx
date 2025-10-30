import React, { useState } from 'react';
import { SEO } from '@/components/SEO';
import { Navigation } from '@/components/Navigation';
import { Section } from '@/components/Section';
import { Button } from '@/components/Button';
import { Footer } from '@/components/Footer';

export default function Apply() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    platform: '',
    followers: '',
    niche: '',
    website: '',
    whyJoin: '',
    agreeToTerms: false,
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, send to backend
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      window.location.href = '/success';
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0F0F1E] text-white">
        <Navigation />
        <Section>
          <div className="text-center">
            <div className="text-6xl mb-md">✅</div>
            <h1 className="mb-md">Application Submitted!</h1>
            <p className="text-secondary">Redirecting to success page...</p>
          </div>
        </Section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F1E] text-white">
      <SEO
        title="Apply to Creator Program"
        description="Apply to become a BlackPill creator and earn commissions. Get approved in 24-48 hours and start earning immediately."
        keywords="apply, creator program, affiliate application, join"
        canonical="https://black-pill.app/apply"
      />

      <Navigation />

      <Section title="Become a Creator" subtitle="Join BlackPill's affiliate program">
        <div className="max-w-2xl mx-auto">
          {/* Tier Info Banner */}
          <div className="card mb-lg bg-gradient-to-r from-[#1A1A2E] to-[#2A2A3E] border border-[rgba(255,255,255,0.1)]">
            <div className="flex items-start gap-md">
              <div className="text-3xl">🎯</div>
              <div>
                <h3 className="font-semibold mb-sm">Start with Bronze Tier</h3>
                <p className="text-sm text-secondary">
                  All new creators start at Bronze tier (10% commission). Higher tiers (Silver 15%, Gold 20%, Platinum 25%) unlock automatically as you reach referral milestones (100+, 500+, 1000+ referrals).
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-lg">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold mb-sm">Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full bg-[#2A2A3E] border border-[rgba(255,255,255,0.1)] rounded-lg px-md py-sm text-white"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold mb-sm">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-[#2A2A3E] border border-[rgba(255,255,255,0.1)] rounded-lg px-md py-sm text-white"
              />
            </div>

            {/* Platform */}
            <div>
              <label className="block text-sm font-semibold mb-sm">Primary Platform *</label>
              <select
                name="platform"
                value={formData.platform}
                onChange={handleChange}
                required
                className="w-full bg-[#2A2A3E] border border-[rgba(255,255,255,0.1)] rounded-lg px-md py-sm text-white"
              >
                <option value="">Select a platform...</option>
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
                <option value="YouTube">YouTube</option>
                <option value="Twitter">Twitter</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Newsletter">Newsletter</option>
                <option value="Blog">Blog</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Followers */}
            <div>
              <label className="block text-sm font-semibold mb-sm">Approximate Followers *</label>
              <select
                name="followers"
                value={formData.followers}
                onChange={handleChange}
                required
                className="w-full bg-[#2A2A3E] border border-[rgba(255,255,255,0.1)] rounded-lg px-md py-sm text-white"
              >
                <option value="">Select range...</option>
                <option value="1K-10K">1K - 10K</option>
                <option value="10K-50K">10K - 50K</option>
                <option value="50K-100K">50K - 100K</option>
                <option value="100K-500K">100K - 500K</option>
                <option value="500K+">500K+</option>
              </select>
            </div>

            {/* Niche */}
            <div>
              <label className="block text-sm font-semibold mb-sm">Your Niche *</label>
              <input
                type="text"
                name="niche"
                value={formData.niche}
                onChange={handleChange}
                placeholder="e.g., Tech, Fitness, Beauty, Business"
                required
                className="w-full bg-[#2A2A3E] border border-[rgba(255,255,255,0.1)] rounded-lg px-md py-sm text-white"
              />
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-semibold mb-sm">Website/Link (optional)</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full bg-[#2A2A3E] border border-[rgba(255,255,255,0.1)] rounded-lg px-md py-sm text-white"
              />
            </div>

            {/* Why Join */}
            <div>
              <label className="block text-sm font-semibold mb-sm">Why do you want to join? *</label>
              <textarea
                name="whyJoin"
                value={formData.whyJoin}
                onChange={handleChange}
                rows={4}
                required
                className="w-full bg-[#2A2A3E] border border-[rgba(255,255,255,0.1)] rounded-lg px-md py-sm text-white resize-none"
                placeholder="Tell us about your audience and why you'd be great to promote BlackPill..."
              />
            </div>

            {/* Terms */}
            <div className="flex gap-sm items-start">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                required
                className="mt-sm"
              />
              <label className="text-sm">
                I agree to the{' '}
                <a href="/terms" className="text-[#00D9FF] hover:text-[#FF0080]">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-[#00D9FF] hover:text-[#FF0080]">
                  Privacy Policy
                </a>
                *
              </label>
            </div>

            {/* Submit */}
            <Button type="submit" variant="primary" size="lg" className="w-full">
              Submit Application
            </Button>
          </form>
          </div>
        </div>
      </Section>

      <Footer />
    </div>
  );
}
