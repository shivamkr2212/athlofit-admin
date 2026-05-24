import { useQuery } from '@tanstack/react-query';
import {
  Users, ShoppingBag, Package, Coins, TrendingUp, Activity,
  Trophy, Zap, UserCheck, AlertCircle,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import Header from '../components/layout/Header';
import StatCard from '../components/ui/StatCard';
import Spinner from '../components/ui/Spinner';
import api from '../lib/api';

// Fetch aggregated stats from admin endpoints
async function fetchDashboardData() {
  const [usersRes, ordersRes, leaderboardRes] = await Promise.allSettled([
    api.get('/admin/users?page=1&limit=1'),
    api.get('/admin/shop/orders?page=1&limit=1'),
    api.get('/gamification/leaderboard'),
  ]);

  const totalUsers = usersRes.status === 'fulfilled' ? usersRes.value.data?.data?.pagination?.total || 0 : 0;
  const totalOrders = ordersRes.status === 'fulfilled' ? ordersRes.value.data?.data?.pagination?.total || 0 : 0;
  const leaderboard = leaderboardRes.status === 'fulfilled' ? leaderboardRes.value.data?.data || [] : [];

  return { totalUsers, totalOrders, leaderboard };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
  });

  // Mock chart data (replace with real aggregation endpoints if added)
  const signupData = [
    { day: 'Mon', users: 12 }, { day: 'Tue', users: 19 }, { day: 'Wed', users: 8 },
    { day: 'Thu', users: 25 }, { day: 'Fri', users: 31 }, { day: 'Sat', users: 18 },
    { day: 'Sun', users: 22 },
  ];

  const orderData = [
    { month: 'Jan', orders: 45 }, { month: 'Feb', orders: 62 }, { month: 'Mar', orders: 78 },
    { month: 'Apr', orders: 55 }, { month: 'May', orders: 90 }, { month: 'Jun', orders: 110 },
  ];

  const platformData = [
    { name: 'Android', value: 65 },
    { name: 'iOS', value: 30 },
    { name: 'Other', value: 5 },
  ];

  const leaderboard = data?.leaderboard?.slice(0, 5) || [];

  return (
    <div>
      <Header title="Dashboard" subtitle="Welcome back! Here's what's happening." />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={isLoading ? '—' : data?.totalUsers?.toLocaleString()}
            subtitle="Registered accounts"
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Total Orders"
            value={isLoading ? '—' : data?.totalOrders?.toLocaleString()}
            subtitle="All time orders"
            icon={Package}
            color="green"
          />
          <StatCard
            title="Top Coins Balance"
            value={isLoading ? '—' : leaderboard[0]?.coinsBalance?.toLocaleString() || '—'}
            subtitle="Leaderboard #1"
            icon={Trophy}
            color="yellow"
          />
          <StatCard
            title="Active Streaks"
            value={isLoading ? '—' : leaderboard.filter(u => u.streakDays > 0).length}
            subtitle="Users with active streaks"
            icon={Zap}
            color="purple"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">User Signups (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={signupData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Orders (Last 6 Months)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={orderData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Platform Distribution */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Platform Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={platformData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {platformData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Leaderboard */}
          <div className="card p-5 lg:col-span-2">
            <h3 className="font-semibold text-gray-900 mb-4">🏆 Top Users by Coins</h3>
            {isLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : leaderboard.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((u, i) => (
                  <div key={u._id || i} className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-yellow-100 text-yellow-700' :
                      i === 1 ? 'bg-gray-100 text-gray-600' :
                      i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-500'
                    }`}>{i + 1}</span>
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700 shrink-0">
                      {u.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{u.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">{u.streakDays || 0} day streak</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-yellow-600">{u.coinsBalance?.toLocaleString() || 0}</p>
                      <p className="text-xs text-gray-400">coins</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
