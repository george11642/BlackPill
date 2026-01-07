'use client';

import { useState } from 'react';
import { AdminProtectedRoute } from '@/components/auth/AdminProtectedRoute';
import { useAuth } from '@/lib/auth/context';
import Link from 'next/link';

export default function AdminSubscriptionsPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [makeAffiliate, setMakeAffiliate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [referralLink, setReferralLink] = useState<string | null>(null);

  const handleGrantSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !user) return;

    setLoading(true);
    setMessage(null);
    setReferralLink(null);

    try {
      const response = await fetch('/api/admin/grant-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          makeAffiliate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to grant subscription');
      }

      setMessage({
        type: 'success',
        text: `Success! Subscription granted${makeAffiliate ? ' and affiliate created' : ''} for ${email}`,
      });
      
      // Set referral link if provided
      if (data.referralLink) {
        setReferralLink(data.referralLink);
      }
      
      setEmail('');
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to grant subscription',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReferralLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      // Show temporary feedback
      const originalText = message?.text;
      setMessage({
        type: 'success',
        text: 'Referral link copied to clipboard!',
      });
      setTimeout(() => {
        if (originalText) {
          setMessage({
            type: 'success',
            text: originalText,
          });
        }
      }, 2000);
    }
  };

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-2 px-3 sm:px-4">
        <div className="max-w-xl mx-auto">
          <div className="mb-2">
            <Link href="/admin" className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 mb-0.5 inline-block">
              ← Back
            </Link>
            <h1 className="text-base font-bold text-gray-900 dark:text-gray-100">Grant Free Subscription</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              Grant a free lifetime subscription and optionally make the user an affiliate
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <form onSubmit={handleGrantSubscription} className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                  User Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  placeholder="user@example.com"
                  required
                />
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  The user must have an account with this email address
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="makeAffiliate"
                  checked={makeAffiliate}
                  onChange={(e) => setMakeAffiliate(e.target.checked)}
                  className="w-3 h-3 text-blue-600 dark:text-blue-400 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                <label htmlFor="makeAffiliate" className="ml-1.5 text-xs text-gray-700 dark:text-gray-300">
                  Also make this user an affiliate
                </label>
              </div>

              {message && (
                <div
                  className={`p-1.5 rounded-md text-xs ${
                    message.type === 'success'
                      ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                      : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                  }`}
                >
                  {message.text}
                </div>
              )}

              {referralLink && (
                <div className="p-2 bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-teal-900 dark:text-teal-200">
                      Referral Link:
                    </label>
                    <button
                      type="button"
                      onClick={handleCopyReferralLink}
                      className="px-2 py-0.5 text-xs bg-teal-600 dark:bg-teal-500 text-white rounded hover:bg-teal-700 dark:hover:bg-teal-600 transition-colors font-medium"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={referralLink}
                      readOnly
                      className="flex-1 px-1.5 py-1 text-xs border border-teal-300 dark:border-teal-700 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    <svg
                      className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                  </div>
                  <p className="mt-1 text-xs text-teal-700 dark:text-teal-300">
                    Share this link to track referrals.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full px-2 py-1 text-xs bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
              >
                {loading ? 'Processing...' : 'Grant Subscription'}
              </button>
            </form>

            <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md">
              <h3 className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-1">What this does:</h3>
              <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-0 list-disc list-inside">
                <li>Grants a free lifetime subscription (Pro tier)</li>
                <li>Sets subscription status to active</li>
                {makeAffiliate && (
                  <li>Creates an affiliate account with a referral code</li>
                )}
                <li>User can immediately access all premium features</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}
