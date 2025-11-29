'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        setIsAuthenticated(!!token);
      }
    };
    
    checkAuth();
  }, [pathname]);

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: 'rgba(15, 15, 30, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
      }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' }}>
          {/* Logo */}
          <Link 
            href="/" 
            style={{ 
              fontSize: '1.25rem', 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #FF0080 0%, #00D9FF 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              textDecoration: 'none',
            }}
            aria-label="BlackPill Home"
          >
            BlackPill
          </Link>

          {/* Desktop Navigation */}
          <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Link 
              href="/#features" 
              style={{ 
                color: '#B8BACC', 
                textDecoration: 'none', 
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#B8BACC'}
            >
              Features
            </Link>
            <Link 
              href="/pricing" 
              style={{ 
                color: '#B8BACC', 
                textDecoration: 'none', 
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#B8BACC'}
            >
              Pricing
            </Link>
            <Link 
              href="/#how-it-works" 
              style={{ 
                color: '#B8BACC', 
                textDecoration: 'none', 
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#B8BACC'}
            >
              How It Works
            </Link>
            <Link 
              href="/affiliate-program" 
              style={{ 
                color: '#B8BACC', 
                textDecoration: 'none', 
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#B8BACC'}
            >
              Affiliates
            </Link>
            <Link 
              href="/support" 
              style={{ 
                color: '#B8BACC', 
                textDecoration: 'none', 
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#B8BACC'}
            >
              Support
            </Link>
            <Link 
              href="/dashboard"
              style={{
                background: 'linear-gradient(135deg, #FF0080 0%, #00D9FF 100%)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s',
                boxShadow: '0 0 15px rgba(255, 0, 128, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 25px rgba(255, 0, 128, 0.5)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 0, 128, 0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {isAuthenticated ? 'Dashboard' : 'Get Started'}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-btn"
            style={{
              display: 'none',
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.5rem',
            }}
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            {isOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div 
            className="mobile-menu"
            style={{
              display: 'none',
              paddingBottom: '1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '1rem' }}>
              <Link 
                href="/#features" 
                style={{ color: '#B8BACC', textDecoration: 'none', padding: '0.5rem 0' }}
                onClick={() => setIsOpen(false)}
              >
                Features
              </Link>
              <Link 
                href="/pricing" 
                style={{ color: '#B8BACC', textDecoration: 'none', padding: '0.5rem 0' }}
                onClick={() => setIsOpen(false)}
              >
                Pricing
              </Link>
              <Link 
                href="/#how-it-works" 
                style={{ color: '#B8BACC', textDecoration: 'none', padding: '0.5rem 0' }}
                onClick={() => setIsOpen(false)}
              >
                How It Works
              </Link>
              <Link 
                href="/affiliate-program" 
                style={{ color: '#B8BACC', textDecoration: 'none', padding: '0.5rem 0' }}
                onClick={() => setIsOpen(false)}
              >
                Affiliates
              </Link>
              <Link 
                href="/support" 
                style={{ color: '#B8BACC', textDecoration: 'none', padding: '0.5rem 0' }}
                onClick={() => setIsOpen(false)}
              >
                Support
              </Link>
              <Link 
                href="/dashboard"
                style={{
                  background: 'linear-gradient(135deg, #FF0080 0%, #00D9FF 100%)',
                  color: 'white',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  textAlign: 'center',
                  marginTop: '0.5rem',
                }}
                onClick={() => setIsOpen(false)}
              >
                {isAuthenticated ? 'Dashboard' : 'Get Started'}
              </Link>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
          .mobile-menu {
            display: block !important;
          }
        }
      `}</style>
    </nav>
  );
};
