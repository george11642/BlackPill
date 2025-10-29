import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0F0F1E] text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-[#FF0080] to-[#00D9FF] bg-clip-text text-transparent">
            BlackPill
          </div>
          <div className="flex gap-4">
            <Link href="/dashboard">
              <button className="bg-[#2A2A3E] hover:bg-[#3A3A4E] border border-white/10 rounded-lg px-6 py-2 transition">
                Dashboard
              </button>
            </Link>
            <Link href="/dashboard">
              <button className="bg-gradient-to-r from-[#FF0080] to-[#00D9FF] hover:opacity-90 rounded-lg px-6 py-2 font-semibold transition">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6">
            Creator Dashboard
          </h1>
          <p className="text-xl text-[#B8BACC] mb-8 max-w-2xl mx-auto">
            Track your affiliate performance, manage your commissions, and grow your earnings with our powerful creator platform.
          </p>
          <Link href="/dashboard">
            <button className="bg-gradient-to-r from-[#FF0080] to-[#00D9FF] hover:opacity-90 px-8 py-4 rounded-lg font-semibold text-lg transition">
              Access Your Dashboard →
            </button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <FeatureCard
            icon="📊"
            title="Real-time Analytics"
            description="Track clicks, conversions, and revenue in real-time with our comprehensive dashboard."
          />
          <FeatureCard
            icon="💰"
            title="Earn Commissions"
            description="Grow your earnings with competitive commission rates and performance-based tier benefits."
          />
          <FeatureCard
            icon="🔗"
            title="Custom Links"
            description="Generate and manage your unique affiliate links with just one click."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#1A1A2E] border-t border-white/10 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to maximize your earnings?</h2>
          <p className="text-[#B8BACC] mb-8">
            Join our creator program and start earning today.
          </p>
          <Link href="/dashboard">
            <button className="bg-gradient-to-r from-[#FF0080] to-[#00D9FF] hover:opacity-90 px-8 py-3 rounded-lg font-semibold transition">
              Go to Dashboard
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-[#B8BACC]">
          <p>&copy; 2025 Black Pill. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-[#1A1A2E] border border-white/10 rounded-xl p-8 hover:border-white/20 transition">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-[#B8BACC]">{description}</p>
    </div>
  );
}
