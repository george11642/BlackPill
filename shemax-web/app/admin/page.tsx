'use client';

import { AdminProtectedRoute } from '@/components/auth/AdminProtectedRoute';
import Link from 'next/link';

export default function AdminPage() {
  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4">
            <h1 className="text-xl font-bold mb-1 text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400">Manage affiliates, payouts, and subscriptions</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <Link
              href="/admin/subscriptions"
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-4 hover:shadow-lg dark:hover:shadow-gray-900 transition border border-gray-200 dark:border-gray-700 flex flex-col"
            >
              <div className="flex items-start gap-2 mb-2">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight flex-1 min-w-0">Grant Subscriptions</h2>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Grant free subscriptions and affiliate status to users</p>
            </Link>
          </div>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}
