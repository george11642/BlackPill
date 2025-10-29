import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[rgba(255,255,255,0.1)] py-lg bg-[#0F0F1E]">
      <div className="section-inner">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-lg mb-lg">
          <div>
            <h4 className="mb-md">Download App</h4>
            <ul className="space-y-sm">
              <li>
                <a 
                  href="https://apps.apple.com/app/blackpill" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block hover:opacity-80 transition"
                >
                  <img 
                    src="/badges/app-store-badge.svg" 
                    alt="Download on the App Store" 
                    className="h-[40px]"
                  />
                </a>
              </li>
              <li>
                <a 
                  href="https://play.google.com/store/apps/details?id=com.blackpill.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block hover:opacity-80 transition"
                >
                  <img 
                    src="/badges/google-play-badge.png" 
                    alt="Get it on Google Play" 
                    className="h-[40px]"
                  />
                </a>
              </li>
              <li>
                <a href="/#pricing" className="text-secondary hover:text-cyan transition">
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-md">Product</h4>
            <ul className="space-y-sm">
              <li>
                <Link href="/" className="text-secondary hover:text-cyan transition">
                  Landing Page
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="text-secondary hover:text-cyan transition">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/#features" className="text-secondary hover:text-cyan transition">
                  Features
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-md">Creator Program</h4>
            <ul className="space-y-sm">
              <li>
                <Link href="/creators" className="text-secondary hover:text-cyan transition">
                  For Creators
                </Link>
              </li>
              <li>
                <Link href="/apply" className="text-secondary hover:text-cyan transition">
                  Apply Now
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-secondary hover:text-cyan transition">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-md">Legal</h4>
            <ul className="space-y-sm">
              <li>
                <Link href="/privacy" className="text-secondary hover:text-cyan transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-secondary hover:text-cyan transition">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-md">Support</h4>
            <ul className="space-y-sm">
              <li>
                <a href="/#faq" className="text-secondary hover:text-cyan transition">
                  FAQ
                </a>
              </li>
              <li>
                <a href="mailto:support@black-pill.app" className="text-secondary hover:text-cyan transition">
                  Contact Support
                </a>
              </li>
              <li>
                <a href="https://twitter.com/blackpillapp" target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-cyan transition">
                  Twitter
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.1)] pt-lg text-center">
          <p className="text-secondary text-sm">
            © {currentYear} BlackPill. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
