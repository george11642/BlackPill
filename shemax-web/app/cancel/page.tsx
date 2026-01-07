'use client';

import React from 'react';
import Link from 'next/link';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';

export default function CancelPage() {
  return (
    <>
      <Navigation />
      
      <div 
        style={{
          minHeight: 'calc(100vh - 56px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(255, 0, 128, 0.1) 0%, transparent 50%), #0F0F1E',
        }}
      >
        <div 
          style={{
            textAlign: 'center',
            maxWidth: '500px',
          }}
        >
          <div 
            style={{
              fontSize: '4rem',
              marginBottom: '1.5rem',
            }}
          >
            😔
          </div>
          
          <h1 
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: '#fff',
              marginBottom: '1rem',
            }}
          >
            Checkout Cancelled
          </h1>
          
          <p 
            style={{
              color: '#B8BACC',
              fontSize: '1rem',
              lineHeight: 1.6,
              marginBottom: '2rem',
            }}
          >
            No worries! Your payment was not processed. If you have any questions or need help choosing a plan, feel free to reach out to us.
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link 
              href="/#pricing"
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #FF0080 0%, #00D9FF 100%)',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '0.5rem',
                fontWeight: 600,
                fontSize: '0.875rem',
                boxShadow: '0 0 20px rgba(255, 0, 128, 0.3)',
                transition: 'all 0.2s',
              }}
            >
              View Plans
            </Link>
            
            <Link 
              href="/"
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#B8BACC',
                textDecoration: 'none',
                borderRadius: '0.5rem',
                fontWeight: 600,
                fontSize: '0.875rem',
                transition: 'all 0.2s',
              }}
            >
              Back to Home
            </Link>
          </div>
          
          <p 
            style={{
              color: '#6B6D7F',
              fontSize: '0.75rem',
              marginTop: '2rem',
            }}
          >
            Need help?{' '}
            <a 
              href="mailto:support@shemax.app"
              style={{ color: '#00D9FF', textDecoration: 'none' }}
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
      
      <Footer />
    </>
  );
}


