import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[rgba(255,255,255,0.1)] py-lg bg-[#0F0F1E]">
      <div className="section-inner">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-lg mb-lg">
          <div>
            <h4 className="mb-md">Product</h4>
            <ul className="space-y-sm">
              <li>
                <Link href="/" className="text-secondary hover:text-accent-blue">
                  Landing Page
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-secondary hover:text-accent-blue">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-secondary hover:text-accent-blue">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-md">Company</h4>
            <ul className="space-y-sm">
              <li>
                <Link href="/apply" className="text-secondary hover:text-accent-blue">
                  Become Creator
                </Link>
              </li>
              <li>
                <a href="mailto:support@black-pill.app" className="text-secondary hover:text-accent-blue">
                  Support
                </a>
              </li>
              <li>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-accent-blue">
                  Twitter
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-md">Legal</h4>
            <ul className="space-y-sm">
              <li>
                <Link href="/privacy" className="text-secondary hover:text-accent-blue">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-secondary hover:text-accent-blue">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-md">Resources</h4>
            <ul className="space-y-sm">
              <li>
                <a href="#faq" className="text-secondary hover:text-accent-blue">
                  FAQ
                </a>
              </li>
              <li>
                <a href="https://docs.black-pill.app" target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-accent-blue">
                  Documentation
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
