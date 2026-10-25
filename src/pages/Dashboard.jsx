import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users, ShoppingBag, Package, Coins, TrendingUp, Activity,
  Trophy, Zap, UserCheck, AlertCircle, ArrowUpRight, Footprints, Loader2,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import Header from '../components/layout/Header';
import StatCard from '../components/ui/StatCard';
import Spinner from '../components/ui/Spinner';
import api from '../lib/api';
import { dashboardService } from '../services/dashboard.service';

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

const MILESTONE_WINDOWS = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
];

// Tint per threshold — darker as the milestone gets harder, so the three read
// as one scale rather than three unrelated numbers.
const MILESTONE_STYLES = {
  10000: 'bg-blue-50 text-blue-700 border-blue-100',
  15000: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  20000: 'bg-violet-50 text-violet-700 border-violet-100',
};

/**
 * Shown instead of a chart when there is nothing to draw.
 *
 * An empty Recharts canvas renders as clean axes with no line, which looks
 * like a working chart reporting zero. These two states need telling apart:
 * "the endpoint is missing" and "nobody signed up this week" lead somewhere
 * completely different.
 */
function ChartEmpty({ error }) {
  return (
    <div className="h-[220px] flex items-center justify-center text-center px-4">
      <p className="text-xs text-gray-400 max-w-xs">
        {error
          ? 'Could not load this chart. If the backend predates this feature, GET /admin/dashboard/charts does not exist yet.'
          : 'No data in this period yet.'}
      </p>
    </div>
  );
}

/** The users behind one milestone tile, revealed on click. */
function MilestoneUserList({ threshold, window: win }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['step-milestone-users', threshold, win],
    queryFn: async () => (await dashboardService.getStepMilestoneUsers(threshold, win))?.data,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400 py-3">
        <Loader2 size={13} className="animate-spin" /> Loading users…
      </div>
    );
  }
  if (isError) {
    return (
      <p className="text-xs text-gray-500 py-3">
        Could not load the user list. If the backend predates this feature, the endpoint
        <code className="mx-1 text-gray-400">/admin/dashboard/step-milestones/users</code>
        does not exist yet.
      </p>
    );
  }

  const users = data?.users || [];
  if (!users.length) {
    return <p className="text-xs text-gray-400 py-3">No user crossed {threshold.toLocaleString()} steps in this window.</p>;
  }

  return (
    <div className="mt-3 border border-gray-100 rounded-xl overflow-hidden">
      <div className="max-h-64 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-gray-500">User</th>
              {/* The day that cleared the bar, which is the figure the
                  threshold was actually tested against. */}
              <th className="text-right px-3 py-2 font-medium text-gray-500">Best day</th>
              <th className="text-right px-3 py-2 font-medium text-gray-500">Total steps</th>
              <th className="text-right px-3 py-2 font-medium text-gray-500">Days</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-3 py-2">
                  <span className="text-gray-800">{u.name || '—'}</span>
                  <span className="block text-[11px] text-gray-400">{u.email}</span>
                </td>
                <td className="px-3 py-2 text-right">
                  <span className="font-semibold text-gray-900">{u.bestDay?.toLocaleString()}</span>
                  {u.bestDayOn && <span className="block text-[11px] text-gray-400">{u.bestDayOn}</span>}
                </td>
                <td className="px-3 py-2 text-right text-gray-700">{u.totalSteps?.toLocaleString()}</td>
                <td className="px-3 py-2 text-right text-gray-500">{u.daysActive}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data?.truncated && (
        <p className="text-[11px] text-gray-400 px-3 py-1.5 bg-gray-50">
          Showing the first {users.length} — there are more.
        </p>
      )}
    </div>
  );
}

// ─── Step milestones ─────────────────────────────────────────────────────────
//
// Counts users whose BEST SINGLE DAY in the window crossed each threshold.
// Not the window's total: 10,000 steps spread over 30 days is 333 a day, which
// is the opposite of what a "10k+ steps" milestone is asking. That also means
// the windows are not a rate — 7d is always >= today, because a longer window
// holds more chances to have had one good day. The subtitle says so, since the
// natural reading of three rising numbers is a trend.
//
// Each tile opens the list of users behind it: a count cannot be acted on
// without knowing which accounts it is, and whether their figures look like
// walking.
function StepMilestonesCard() {
  const [win, setWin] = useState('today');
  // Which tile is expanded. Null means none; clicking the open one closes it.
  const [openTile, setOpenTile] = useState(null);

  const { data, isLoading, isError, error: milestoneError } = useQuery({
    queryKey: ['step-milestones', win],
    queryFn: async () => (await dashboardService.getStepMilestones(win))?.data,
    retry: false,
    keepPreviousData: true,
  });

  const milestones = data?.milestones || [];
  const activeUsers = data?.activeUsers ?? 0;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
        <div className="flex items-center gap-2">
          <Footprints size={16} className="text-gray-400" />
          <h3 className="font-semibold text-gray-900">Step Milestones</h3>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {MILESTONE_WINDOWS.map((w) => (
            <button
              key={w.key}
              onClick={() => setWin(w.key)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                win === w.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-4">
        Users whose best single day crossed each mark
        {data?.from && data?.to && win !== 'today' ? ` · ${data.from} → ${data.to}` : ''}
      </p>

      {isError ? (
        <div className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
          <AlertCircle size={15} className="text-gray-400 mt-0.5 shrink-0" />
          <p className="text-xs text-gray-600">
            {milestoneError?.response?.status === 404
              ? 'The backend does not have GET /admin/dashboard/step-milestones yet — it is running a build from before this shipped.'
              : 'Could not load step milestones.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {(isLoading && !milestones.length
              ? [{ steps: 10000 }, { steps: 15000 }, { steps: 20000 }]
              : milestones
            ).map((m) => {
              const open = openTile === m.steps;
              const clickable = (m.users ?? 0) > 0;
              return (
                <button
                  key={m.steps}
                  type="button"
                  disabled={!clickable}
                  onClick={() => setOpenTile(open ? null : m.steps)}
                  className={`border rounded-xl p-3 text-center transition-all ${
                    MILESTONE_STYLES[m.steps] || 'bg-gray-50 text-gray-700 border-gray-100'
                  } ${
                    clickable
                      ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5'
                      : 'cursor-default opacity-70'
                  } ${open ? 'ring-2 ring-current' : ''}`}
                >
                  <p className="text-xs font-medium opacity-70">
                    {(m.steps / 1000).toLocaleString()}k+ steps
                  </p>
                  <p className="text-2xl font-bold mt-0.5">
                    {isLoading && m.users === undefined ? '—' : (m.users ?? 0).toLocaleString()}
                  </p>
                  {/* Share of the people who actually walked, not of all
                      registered users — most of whom did not sync at all. */}
                  <p className="text-[11px] opacity-60 mt-0.5">
                    {activeUsers > 0 && m.users !== undefined
                      ? `${Math.round((m.users / activeUsers) * 100)}% of active`
                      : ' '}
                  </p>
                  {clickable && (
                    <p className="text-[10px] opacity-50 mt-1">
                      {open ? 'hide users' : 'click to see users'}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {openTile != null && <MilestoneUserList threshold={openTile} window={win} />}
          <p className="text-[11px] text-gray-400 mt-3">
            {activeUsers.toLocaleString()} user{activeUsers === 1 ? '' : 's'} logged steps in this
            window. Longer windows always count more users — each extra day is another chance to
            have had one big day, so these are not comparable as a rate.
          </p>
        </>
      )}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
  });

  // Real aggregates. These three were hardcoded sample data — "Mon 12, Tue 19",
  // Jan through Jun, Android 65 / iOS 30 — which read as data for as long as
  // they were on the page and never moved. A chart that looks real and is not
  // is worse than no chart.
  const { data: charts, isError: chartsError } = useQuery({
    queryKey: ['dashboard-charts'],
    queryFn: async () => (await dashboardService.getCharts())?.data,
    retry: false,
  });

  const signupData = charts?.signups || [];
  const orderData = charts?.orders || [];
  // Slices with nobody in them are dropped: a legend entry reading "iOS 0"
  // takes up as much room as a real one and says less than its absence.
  const platformData = (charts?.platforms || []).filter((p) => p.value > 0);

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
            to="/users"
          />
          <StatCard
            title="Total Orders"
            value={isLoading ? '—' : data?.totalOrders?.toLocaleString()}
            subtitle="All time orders"
            icon={Package}
            color="green"
            to="/orders"
          />
          <StatCard
            title="Top Coins Balance"
            value={isLoading ? '—' : leaderboard[0]?.coinsBalance?.toLocaleString() || '—'}
            subtitle="Leaderboard #1"
            icon={Trophy}
            color="yellow"
            to="/gamification"
          />
          <StatCard
            title="Active Streaks"
            value={isLoading ? '—' : leaderboard.filter(u => u.streakDays > 0).length}
            subtitle="Users with active streaks"
            icon={Zap}
            color="purple"
            to="/gamification"
          />
        </div>

        {/* Step milestones */}
        <StepMilestonesCard />

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <button onClick={() => navigate('/users')} className="flex items-center gap-1 font-semibold text-gray-900 mb-4 hover:text-primary-600 transition-colors group">
              User Signups (Last 7 Days)
              <ArrowUpRight size={14} className="text-gray-300 group-hover:text-primary-600" />
            </button>
            {chartsError || !signupData.length ? <ChartEmpty error={chartsError} /> : (
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
            )}
          </div>

          <div className="card p-5">
            <button onClick={() => navigate('/orders')} className="flex items-center gap-1 font-semibold text-gray-900 mb-4 hover:text-primary-600 transition-colors group">
              Orders (Last 6 Months)
              <ArrowUpRight size={14} className="text-gray-300 group-hover:text-primary-600" />
            </button>
            {chartsError || !orderData.length ? <ChartEmpty error={chartsError} /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={orderData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Platform Distribution */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Platform Distribution</h3>
            {chartsError || !platformData.length ? <ChartEmpty error={chartsError} /> : (
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
            )}
          </div>

          {/* Leaderboard */}
          <div className="card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">🏆 Top Users by Coins</h3>
              <button onClick={() => navigate('/gamification')} className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors">
                View all <ArrowUpRight size={13} />
              </button>
            </div>
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
