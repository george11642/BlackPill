'use client';

import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const linkStyle: React.CSSProperties = {
    color: '#6B6D7F',
    textDecoration: 'none',
    fontSize: '0.75rem',
    transition: 'color 0.2s',
    display: 'block',
    padding: '0.125rem 0',
  };

  return (
    <footer 
      style={{
        backgroundColor: '#0F0F1E',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      }}
      role="contentinfo"
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
        {/* Main Grid */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1.5rem',
            marginBottom: '1rem',
          }}
          className="footer-grid"
        >
          {/* Brand Section */}
          <div>
            <Link 
              href="/" 
              style={{
                display: 'inline-block',
                fontSize: '1rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #FF0080 0%, #00D9FF 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                textDecoration: 'none',
                marginBottom: '0.5rem',
              }}
            >
              SheMax
            </Link>
            <p style={{ color: '#6B6D7F', fontSize: '0.7rem', lineHeight: 1.5, marginBottom: '0.75rem', maxWidth: '180px' }}>
              AI-powered beauty analysis with honest feedback.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <a
                href="https://apps.apple.com/app/shemax"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img 
                  src="/badges/app-store-badge.svg" 
                  alt="App Store" 
                  style={{ height: '24px' }}
                />
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.shemax.app"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img 
                  src="/badges/google-play-badge.png" 
                  alt="Google Play" 
                  style={{ height: '24px' }}
                />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Product
            </h3>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <Link href="/#features" style={linkStyle} onMouseEnter={(e) => e.currentTarget.style.color = '#00D9FF'} onMouseLeave={(e) => e.currentTarget.style.color = '#6B6D7F'}>
                Features
              </Link>
              <Link href="/pricing" style={linkStyle} onMouseEnter={(e) => e.currentTarget.style.color = '#00D9FF'} onMouseLeave={(e) => e.currentTarget.style.color = '#6B6D7F'}>
                Pricing
              </Link>
              <Link href="/#how-it-works" style={linkStyle} onMouseEnter={(e) => e.currentTarget.style.color = '#00D9FF'} onMouseLeave={(e) => e.currentTarget.style.color = '#6B6D7F'}>
                How It Works
              </Link>
              <Link href="/affiliate-program" style={linkStyle} onMouseEnter={(e) => e.currentTarget.style.color = '#00D9FF'} onMouseLeave={(e) => e.currentTarget.style.color = '#6B6D7F'}>
                Affiliates
              </Link>
            </nav>
          </div>

          {/* Legal Links */}
          <div>
            <h3 style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Legal
            </h3>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <Link href="/privacy" style={linkStyle} onMouseEnter={(e) => e.currentTarget.style.color = '#00D9FF'} onMouseLeave={(e) => e.currentTarget.style.color = '#6B6D7F'}>
                Privacy Policy
              </Link>
              <Link href="/terms" style={linkStyle} onMouseEnter={(e) => e.currentTarget.style.color = '#00D9FF'} onMouseLeave={(e) => e.currentTarget.style.color = '#6B6D7F'}>
                Terms of Service
              </Link>
            </nav>
          </div>

          {/* Support Links */}
          <div>
            <h3 style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Support
            </h3>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <Link href="/#faq" style={linkStyle} onMouseEnter={(e) => e.currentTarget.style.color = '#00D9FF'} onMouseLeave={(e) => e.currentTarget.style.color = '#6B6D7F'}>
                FAQ
              </Link>
              <a href="mailto:support@shemax.app" style={linkStyle} onMouseEnter={(e) => e.currentTarget.style.color = '#00D9FF'} onMouseLeave={(e) => e.currentTarget.style.color = '#6B6D7F'}>
                Contact
              </a>
              <a href="https://twitter.com/shemaxapp" target="_blank" rel="noopener noreferrer" style={linkStyle} onMouseEnter={(e) => e.currentTarget.style.color = '#00D9FF'} onMouseLeave={(e) => e.currentTarget.style.color = '#6B6D7F'}>
                Twitter
              </a>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{ 
          paddingTop: '1rem', 
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}>
          <p style={{ color: '#6B6D7F', fontSize: '0.7rem', margin: 0 }}>
            © {currentYear}{' '}
            <span style={{ 
              fontWeight: 600,
              background: 'linear-gradient(135deg, #FF0080 0%, #00D9FF 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}>
              SheMax
            </span>
            . All rights reserved.
          </p>
          <p style={{ color: '#4A4C5A', fontSize: '0.65rem', margin: 0, fontStyle: 'italic' }}>
            Results are for entertainment purposes. Not medical advice.
          </p>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 480px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
};
