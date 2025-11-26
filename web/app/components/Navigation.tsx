'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from './Button';

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
    <nav className="border-b border-[rgba(255,255,255,0.1)] sticky top-0 z-50 bg-[#0F0F1E]/95 backdrop-blur">
      <div className="section-inner py-md">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-gradient">
            BlackPill
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-md items-center">
            <Link href="/pricing" className="text-secondary hover:text-white transition">
              Pricing
            </Link>
            <Link href="/#how-it-works" className="text-secondary hover:text-white transition">
              How It Works
            </Link>
            <Link href="/creators" className="text-secondary hover:text-white transition">
              For Creators
            </Link>
            <Link href="/#faq" className="text-secondary hover:text-white transition">
              FAQ
            </Link>
            <Link href="/app" className="text-secondary hover:text-white transition">
              Try Web App
            </Link>
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button variant="primary" size="sm">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => {
                  window.location.href = '/creators?action=signin';
                }}
              >
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-2xl"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden mt-md pt-md border-t border-[rgba(255,255,255,0.1)] space-y-md">
            <Link href="/pricing" className="block text-secondary hover:text-white transition">
              Pricing
            </Link>
            <Link href="/#how-it-works" className="block text-secondary hover:text-white transition">
              How It Works
            </Link>
            <Link href="/creators" className="block text-secondary hover:text-white transition">
              For Creators
            </Link>
            <Link href="/#faq" className="block text-secondary hover:text-white transition">
              FAQ
            </Link>
            <Link href="/app" className="block text-secondary hover:text-white transition">
              Try Web App
            </Link>
            {isAuthenticated ? (
              <Link href="/dashboard" className="block">
                <Button variant="primary" size="sm" className="w-full">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Button 
                variant="primary" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  window.location.href = '/creators?action=signin';
                }}
              >
                Sign In
              </Button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

