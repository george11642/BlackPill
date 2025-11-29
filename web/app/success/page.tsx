'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const source = searchParams.get('source');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate verification delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [sessionId]);

  return (
    <div 
      style={{
        minHeight: 'calc(100vh - 56px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'radial-gradient(ellipse at 50% 50%, rgba(0, 255, 65, 0.1) 0%, transparent 50%), #0F0F1E',
      }}
    >
      <div 
        style={{
          textAlign: 'center',
          maxWidth: '500px',
        }}
      >
        {loading ? (
          <>
            <div 
              style={{
                width: '60px',
                height: '60px',
                border: '3px solid rgba(255, 255, 255, 0.1)',
                borderTopColor: '#00FF41',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1.5rem',
              }}
            />
            <p style={{ color: '#B8BACC' }}>Verifying your payment...</p>
            <style jsx>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </>
        ) : (
          <>
            <div 
              style={{
                fontSize: '4rem',
                marginBottom: '1.5rem',
              }}
            >
              🎉
            </div>
            
            <h1 
              style={{
                fontSize: '2rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: '1rem',
              }}
            >
              Welcome to BlackPill!
            </h1>
            
            <p 
              style={{
                color: '#B8BACC',
                fontSize: '1rem',
                lineHeight: 1.6,
                marginBottom: '1.5rem',
              }}
            >
              Your subscription is now active. You&apos;re ready to start your self-improvement journey with unlimited AI-powered analysis.
            </p>
            
            <div 
              style={{
                backgroundColor: '#1A1A2E',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                marginBottom: '2rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <h3 style={{ color: '#00FF41', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem' }}>
                ✓ What&apos;s Next?
              </h3>
              <ul style={{ textAlign: 'left', color: '#B8BACC', fontSize: '0.875rem', lineHeight: 1.8 }}>
                <li>• Download the app to get started</li>
                <li>• Sign in with your email to access your subscription</li>
                <li>• Take your first photo and get your analysis</li>
                <li>• Check your email for receipt and account details</li>
              </ul>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <a 
                href="https://apps.apple.com/app/blackpill"
                target="_blank"
                rel="noopener noreferrer"
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
                }}
              >
                Download for iOS
              </a>
              
              <a 
                href="https://play.google.com/store/apps/details?id=com.blackpill.app"
                target="_blank"
                rel="noopener noreferrer"
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
                }}
              >
                Download for Android
              </a>
            </div>
            
            <Link 
              href="/"
              style={{
                color: '#6B6D7F',
                fontSize: '0.75rem',
                textDecoration: 'none',
              }}
            >
              ← Back to Home
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <>
      <Navigation />
      <Suspense fallback={
        <div style={{
          minHeight: 'calc(100vh - 56px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0F0F1E',
        }}>
          <p style={{ color: '#B8BACC' }}>Loading...</p>
        </div>
      }>
        <SuccessContent />
      </Suspense>
      <Footer />
    </>
  );
}

