import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [performance, setPerformance] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setIsLoading(true);
      setError(null);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        router.push('/');
        return;
      }

      // Use production API URL directly
      const apiUrl = 'https://api.black-pill.app';

      // Fetch dashboard stats
      const statsRes = await fetch(`${apiUrl}/api/creators/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!statsRes.ok) {
        if (statsRes.status === 401) {
          localStorage.removeItem('token');
          router.push('/');
          return;
        }
        throw new Error('Failed to fetch dashboard data');
      }

      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch performance data
      const perfRes = await fetch(`${apiUrl}/api/creators/performance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!perfRes.ok) {
        throw new Error('Failed to fetch performance data');
      }

      const perfData = await perfRes.json();
      setPerformance(perfData.daily_data || []);

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F0F1E] flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0F0F1E] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Dashboard</h1>
          <p className="text-[#B8BACC] mb-6">{error}</p>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              router.push('/');
            }}
            className="bg-gradient-to-r from-[#FF0080] to-[#00D9FF] hover:opacity-90 px-8 py-3 rounded-lg font-semibold transition"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-[#0F0F1E] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Data Available</h1>
          <p className="text-[#B8BACC]">Please ensure your creator account is approved.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F1E] text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Creator Dashboard</h1>
          <p className="text-[#B8BACC]">Track your affiliate performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Clicks"
            value={stats?.stats?.total_clicks || 0}
            icon="👆"
          />
          <StatCard
            title="Conversions"
            value={stats?.stats?.total_conversions || 0}
            icon="✅"
          />
          <StatCard
            title="Conversion Rate"
            value={`${stats?.stats?.conversion_rate || 0}%`}
            icon="📈"
          />
          <StatCard
            title="Revenue (Month)"
            value={`$${stats?.stats?.revenue_this_month || 0}`}
            icon="💰"
          />
        </div>

        {/* Affiliate Link */}
        <div className="bg-[#1A1A2E] border border-white/10 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Affiliate Link</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={stats?.affiliate_link || ''}
              readOnly
              className="flex-1 bg-[#2A2A3E] border border-white/10 rounded-lg px-4 py-3 font-mono"
            />
            <button
              onClick={() => navigator.clipboard.writeText(stats?.affiliate_link)}
              className="bg-gradient-to-r from-[#FF0080] to-[#00D9FF] px-6 py-3 rounded-lg font-semibold hover:opacity-90"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-[#1A1A2E] border border-white/10 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Performance (Last 30 Days)</h2>
          {performance && performance.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3E" />
                <XAxis dataKey="date" stroke="#6B6D7F" />
                <YAxis stroke="#6B6D7F" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A2E',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="clicks"
                  stroke="#00D9FF"
                  strokeWidth={2}
                  dot={{ fill: '#00D9FF' }}
                />
                <Line
                  type="monotone"
                  dataKey="conversions"
                  stroke="#FF0080"
                  strokeWidth={2}
                  dot={{ fill: '#FF0080' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-[#B8BACC]">No performance data yet</p>
          )}
        </div>

        {/* Commission Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#1A1A2E] border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Commission Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[#B8BACC]">Tier</span>
                <span className="font-semibold uppercase">{stats?.tier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#B8BACC]">Commission Rate</span>
                <span className="font-semibold text-[#00FF41]">
                  {((stats?.commission_rate || 0) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#B8BACC]">Pending Payout</span>
                <span className="font-semibold text-[#FF0080]">
                  ${stats?.stats?.payout_pending || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#B8BACC]">Next Payout</span>
                <span className="font-semibold">{stats?.stats?.next_payout_date}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#1A1A2E] border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full bg-[#2A2A3E] hover:bg-[#3A3A4E] border border-white/10 rounded-lg px-4 py-3 text-left transition">
                🎟️ Create Coupon Code
              </button>
              <button className="w-full bg-[#2A2A3E] hover:bg-[#3A3A4E] border border-white/10 rounded-lg px-4 py-3 text-left transition">
                📥 Download Marketing Assets
              </button>
              <button className="w-full bg-[#2A2A3E] hover:bg-[#3A3A4E] border border-white/10 rounded-lg px-4 py-3 text-left transition">
                📊 Export Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: string }) {
  return (
    <div className="bg-[#1A1A2E] border border-white/10 rounded-xl p-6">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-3xl font-bold mb-1 bg-gradient-to-r from-[#FF0080] to-[#00D9FF] bg-clip-text text-transparent">
        {value}
      </div>
      <div className="text-[#B8BACC] text-sm">{title}</div>
    </div>
  );
}

