import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Eye, Trash2, Shield, User, CheckCircle, XCircle, Filter,
  Footprints, Flame, Droplets, Trophy, Award, Coins, Package, Activity, Target,
  BarChart3, Sparkles, Calendar, TrendingUp, RefreshCw, Loader2, ShoppingCart,
  Settings, Plus, Minus, Save, Zap, Ban, ShieldCheck, Smartphone, Monitor,
  LogOut, History, AlertTriangle,
} from 'lucide-react';
import Header from '../components/layout/Header';
import Spinner from '../components/ui/Spinner';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import api from '../lib/api';
import { usersService } from '../services/users.service';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

async function fetchUsers({ page, limit, search, role }) {
  const params = { page, limit };
  if (search) params.search = search;
  if (role) params.role = role;
  const res = await api.get('/admin/users', { params });
  return res.data?.data;
}

async function fetchUserDetail(id) {
  const [profileRes, gamRes, healthRes, achRes, ordersRes] = await Promise.allSettled([
    api.get(`/admin/users/${id}`),
    api.get(`/admin/users/${id}/gamification`),
    api.get(`/admin/users/${id}/health`),
    api.get(`/admin/users/${id}/achievements`),
    api.get(`/admin/users/${id}/orders`),
  ]);
  return {
    profile: profileRes.status === 'fulfilled' ? profileRes.value.data?.data : null,
    gamification: gamRes.status === 'fulfilled' ? gamRes.value.data?.data : null,
    health: healthRes.status === 'fulfilled' ? healthRes.value.data?.data : null,
    achievements: achRes.status === 'fulfilled' ? achRes.value.data?.data : null,
    orders: ordersRes.status === 'fulfilled' ? ordersRes.value.data?.data : null,
  };
}

export default function Users() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search, roleFilter],
    queryFn: () => fetchUsers({ page, limit: 20, search, role: roleFilter }),
  });

  const { data: userDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['user-detail', selectedUser?._id],
    queryFn: () => fetchUserDetail(selectedUser._id),
    enabled: !!selectedUser,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      toast.success('User deleted');
      qc.invalidateQueries(['users']);
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => api.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => {
      toast.success('Role updated');
      qc.invalidateQueries(['users']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update role'),
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const users = data?.users || [];
  const pagination = data?.pagination;

  return (
    <div>
      <Header title="Users" subtitle={`${pagination?.total || 0} total users`} />
      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="card p-4 flex flex-wrap gap-3 items-center">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-64">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input pl-9"
                placeholder="Search by name or email…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary">Search</button>
          </form>
          <select
            className="input w-36"
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : users.length === 0 ? (
            <EmptyState icon={User} title="No users found" description="Try adjusting your search filters" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="table-th">User</th>
                    <th className="table-th">Role</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Provider</th>
                    <th className="table-th">Joined</th>
                    <th className="table-th">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-td">
                        <div className="flex items-center gap-3">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700">
                              {u.name?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{u.name}</p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-td"><RoleBadge role={u.role} /></td>
                      <td className="table-td">
                        <div className="flex items-center gap-1">
                          <StatusBadge verified={u.emailVerified} />
                          {u.isBanned && <span className="badge bg-red-100 text-red-700">Banned</span>}
                        </div>
                      </td>
                      <td className="table-td">
                        <span className="capitalize text-xs text-gray-600">{u.provider || 'email'}</span>
                      </td>
                      <td className="table-td text-xs text-gray-500">
                        {u.createdAt ? format(new Date(u.createdAt), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="table-td">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedUser(u)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                            title="View details"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => roleMutation.mutate({ id: u._id, role: u.role === 'admin' ? 'user' : 'admin' })}
                            className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors"
                            title={u.role === 'admin' ? 'Revoke admin' : 'Make admin'}
                          >
                            <Shield size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(u)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                            title="Delete user"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {pagination && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}
              </p>
              <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      <Modal open={!!selectedUser} onClose={() => setSelectedUser(null)} title="User Details" size="xl">
        {detailLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : userDetail ? (
          <UserDetailView user={selectedUser} detail={userDetail} />
        ) : null}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
        loading={deleteMutation.isPending}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}

function UserDetailView({ user, detail }) {
  const { profile, gamification, health, achievements, orders } = detail;
  const u = profile || user;
  const [tab, setTab] = useState('profile');

  const TABS = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'activity', label: 'Steps & Activity', icon: Footprints },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'gamification', label: 'Coins & Badges', icon: Trophy },
    { key: 'ledger', label: 'Coin Ledger', icon: History },
    { key: 'achievements', label: 'Achievements', icon: Award },
    { key: 'orders', label: 'Orders', icon: Package },
    { key: 'ai', label: 'AI Insights', icon: Sparkles },
    { key: 'manage', label: 'Manage', icon: Settings },
    { key: 'security', label: 'Security & Devices', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-5">
      {/* Profile header */}
      <div className="flex items-center gap-4">
        {u.avatarUrl ? (
          <img src={u.avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-700">
            {u.name?.[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <h3 className="text-lg font-bold text-gray-900">{u.name}</h3>
          <p className="text-sm text-gray-500">{u.email}</p>
          <div className="flex gap-2 mt-1">
            <RoleBadge role={u.role} />
            <StatusBadge verified={u.emailVerified} />
          </div>
        </div>
      </div>

      {/* Quick stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <QuickStat icon={Footprints} color="blue" label="Total Steps" value={(health?.summary?.totalSteps || 0).toLocaleString()} />
        <QuickStat icon={Coins} color="yellow" label="Coin Balance" value={(gamification?.coinsBalance || 0).toLocaleString()} />
        <QuickStat icon={Activity} color="green" label="Current Streak" value={`${gamification?.streakDays || 0}d`} />
        <QuickStat icon={Package} color="purple" label="Orders" value={orders?.length || 0} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                tab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === 'profile' && <ProfileTab u={u} />}
      {tab === 'activity' && <ActivityTab health={health} stepGoal={u.dailyStepGoal} />}
      {tab === 'analytics' && <AnalyticsTab userId={u._id} />}
      {tab === 'gamification' && <GamificationTab gamification={gamification} />}
      {tab === 'ledger' && <CoinLedgerTab userId={u._id} />}
      {tab === 'achievements' && <AchievementsTab achievements={achievements} />}
      {tab === 'orders' && <OrdersTab orders={orders} />}
      {tab === 'ai' && <AITab userId={u._id} />}
      {tab === 'manage' && <ManageTab user={u} gamification={gamification} />}
      {tab === 'security' && <SecurityTab user={u} />}
    </div>
  );
}

function QuickStat({ icon: Icon, color, label, value }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${colors[color]}`}>
        <Icon size={16} />
      </div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}

function ProfileTab({ u }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[
        ['Phone', u.phone || '—'],
        ['Gender', u.gender || '—'],
        ['Age', u.age ? `${u.age} yrs` : '—'],
        ['Height', u.height ? `${u.height} cm` : '—'],
        ['Weight', u.weight ? `${u.weight} kg` : '—'],
        ['Blood Type', u.bloodType || '—'],
        ['Daily Step Goal', u.dailyStepGoal?.toLocaleString() || '10,000'],
        ['Provider', u.provider || 'email'],
        ['Phone Verified', u.phoneVerified ? 'Yes' : 'No'],
        ['Profile Complete', u.isProfileCompleted ? 'Yes' : 'No'],
        ['Referral Code', u.referralCode || '—'],
        ['Joined', u.createdAt ? format(new Date(u.createdAt), 'MMM d, yyyy') : '—'],
      ].map(([k, v]) => (
        <div key={k} className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-400">{k}</p>
          <p className="text-sm font-medium text-gray-800 mt-0.5">{v}</p>
        </div>
      ))}
    </div>
  );
}

function ActivityTab({ health, stepGoal }) {
  const days = health?.days || [];
  const summary = health?.summary;

  if (!days.length) {
    return <p className="text-sm text-gray-400 text-center py-8">No activity data recorded yet.</p>;
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <SummaryCard icon={Footprints} label="Lifetime Steps" value={summary.totalSteps?.toLocaleString()} sub={`${summary.daysTracked} days tracked`} />
          <SummaryCard icon={Coins} label="Coins from Steps" value={(summary.totalStepCoins || 0).toLocaleString()} sub="real ledger total" />
          <SummaryCard icon={TrendingUp} label="Total Coins Earned" value={(summary.totalCoinsEarned || 0).toLocaleString()} sub="all sources" />
          <SummaryCard icon={Target} label="Goals Met" value={`${summary.goalsMet}/${summary.daysTracked}`} sub="days hit goal" />
          <SummaryCard icon={Flame} label="Calories" value={Math.round(summary.totalCalories || 0).toLocaleString()} sub="lifetime kcal" />
          <SummaryCard icon={Droplets} label="Hydration" value={`${(summary.totalHydration || 0).toLocaleString()} ml`} sub="lifetime" />
        </div>
      )}

      {/* Daily breakdown table */}
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-gray-500 text-xs">Date</th>
                <th className="text-right px-3 py-2 font-medium text-gray-500 text-xs">Steps</th>
                <th className="text-right px-3 py-2 font-medium text-gray-500 text-xs">Step Coins</th>
                <th className="text-right px-3 py-2 font-medium text-gray-500 text-xs">Total Coins</th>
                <th className="text-right px-3 py-2 font-medium text-gray-500 text-xs">Kcal</th>
                <th className="text-center px-3 py-2 font-medium text-gray-500 text-xs">Goal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {days.map((d) => (
                <tr key={d._id || d.date} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-700">{d.date}</td>
                  <td className="px-3 py-2 text-right font-medium text-gray-900">{d.steps?.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-yellow-600 font-medium">🪙 {d.stepCoins ?? 0}</td>
                  <td className="px-3 py-2 text-right text-yellow-700 font-semibold">🪙 {d.coinsEarned ?? 0}</td>
                  <td className="px-3 py-2 text-right text-gray-600">{Math.round(d.calories || 0)}</td>
                  <td className="px-3 py-2 text-center">
                    {d.goalMet ? <CheckCircle size={14} className="text-green-500 inline" /> : <XCircle size={14} className="text-gray-300 inline" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-gray-400">Step goal: {stepGoal?.toLocaleString() || '10,000'} steps/day · showing last {days.length} days</p>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={14} className="text-gray-400" />
        <p className="text-xs text-gray-400">{label}</p>
      </div>
      <p className="text-base font-bold text-gray-900">{value}</p>
      {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
    </div>
  );
}

function GamificationTab({ gamification }) {
  if (!gamification) {
    return <p className="text-sm text-gray-400 text-center py-8">No gamification record.</p>;
  }
  const badges = gamification.badges || [];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ['Coins', gamification.coinsBalance?.toLocaleString() || 0],
          ['Earned Today', gamification.coinsEarnedToday?.toLocaleString() || 0],
          ['Streak', `${gamification.streakDays || 0} days`],
          ['Best Streak', `${gamification.bestStreakDays || 0} days`],
        ].map(([k, v]) => (
          <div key={k} className="bg-yellow-50 rounded-lg p-3 text-center">
            <p className="text-xs text-yellow-600">{k}</p>
            <p className="text-lg font-bold text-yellow-700">{v}</p>
          </div>
        ))}
      </div>

      <div>
        <h4 className="font-semibold text-gray-700 mb-2 text-sm">Badges</h4>
        {badges.length === 0 ? (
          <p className="text-sm text-gray-400">No badges defined.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {badges.map((b) => (
              <div key={b.key} className={`flex items-center gap-2 rounded-lg p-2.5 border ${b.unlocked ? 'bg-white border-yellow-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                <span className="text-xl">{b.emoji || '🏅'}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{b.title || b.key}</p>
                  <p className="text-[11px] text-gray-400">{b.unlocked ? 'Unlocked' : `${b.threshold ?? '?'}-day streak`}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Coin Ledger: every single coin transaction (earn / spend / refund / deduct) ──
const SOURCE_LABELS = {
  PASSIVE_STEPS: 'Auto Step Coins',
  DAILY_STEP_GOAL: 'Daily Step Goal',
  DAILY_STEP_GOAL_AUTO: 'Daily Step Goal (auto)',
  HYDRATION_GOAL: 'Hydration Goal',
  HYDRATION_GOAL_REVERTED: 'Hydration Reverted',
  STREAK_BADGE: 'Streak Badge',
  ACHIEVEMENT: 'Achievement',
  CHALLENGE: 'Challenge',
  CHALLENGE_REVERTED: 'Challenge Reverted',
  REFERRAL_BONUS: 'Referral Bonus',
  SHOP_PURCHASE: 'Shop Purchase',
  SHOP_REFUND: 'Shop Refund',
  MANUAL: 'Manual / Admin',
};

function CoinLedgerTab({ userId }) {
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');
  const limit = 25;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['user-coin-ledger', userId, page, type],
    queryFn: async () => {
      const params = { page, limit };
      if (type) params.type = type;
      const res = await api.get(`/admin/users/${userId}/coins`, { params });
      return res.data?.data;
    },
    keepPreviousData: true,
  });

  const txns = data?.transactions || [];
  const pg = data?.pagination;
  const summary = data?.summary;

  const isCredit = (t) => t.type === 'EARNED' || t.type === 'REFUND';

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-xs text-green-600">Total Earned</p>
          <p className="text-lg font-bold text-green-700">🪙 {(summary?.totalEarned ?? 0).toLocaleString()}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <p className="text-xs text-red-600">Total Spent / Deducted</p>
          <p className="text-lg font-bold text-red-700">🪙 {(summary?.totalSpent ?? 0).toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Transactions</p>
          <p className="text-lg font-bold text-gray-700">{pg?.total ?? 0}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <select
          className="input py-1.5 text-sm w-auto"
          value={type}
          onChange={(e) => { setType(e.target.value); setPage(1); }}
        >
          <option value="">All types</option>
          <option value="EARNED">Earned</option>
          <option value="SPENT">Spent</option>
          <option value="REFUND">Refund</option>
          <option value="DEDUCTED">Deducted</option>
        </select>
        {isFetching && <Loader2 size={14} className="animate-spin text-gray-400" />}
      </div>

      {isLoading ? (
        <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
      ) : txns.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No coin transactions recorded.</p>
      ) : (
        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Description</th>
                <th className="px-3 py-2 text-left">Source</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {txns.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap text-gray-500 text-xs">
                    {format(new Date(t.createdAt), 'dd MMM yyyy, HH:mm')}
                  </td>
                  <td className="px-3 py-2 text-gray-800">{t.description}</td>
                  <td className="px-3 py-2">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px]">
                      {SOURCE_LABELS[t.source] || t.source}
                    </span>
                  </td>
                  <td className={`px-3 py-2 text-right font-semibold whitespace-nowrap ${isCredit(t) ? 'text-green-600' : 'text-red-600'}`}>
                    {isCredit(t) ? '+' : '−'}{t.amount.toLocaleString()} 🪙
                  </td>
                  <td className="px-3 py-2 text-right text-gray-500 whitespace-nowrap">{(t.balanceAfter ?? 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pg && pg.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="text-xs text-gray-500">Page {pg.page} of {pg.totalPages}</span>
          <button
            className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40"
            disabled={!pg.hasMore}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function AchievementsTab({ achievements }) {
  if (!achievements?.length) {
    return <p className="text-sm text-gray-400 text-center py-8">No achievements defined.</p>;
  }
  return (
    <div className="space-y-2">
      {achievements.map((a) => (
        <div key={a._id} className="border border-gray-100 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Award size={16} className={a.achieved ? 'text-yellow-500' : 'text-gray-300'} />
              <div>
                <p className="text-sm font-medium text-gray-900">{a.title}</p>
                <p className="text-xs text-gray-400">{a.description}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold text-yellow-600">+{a.reward} 🪙</p>
              {a.claimed ? (
                <span className="badge bg-green-100 text-green-700 text-[10px]">Claimed</span>
              ) : a.achieved ? (
                <span className="badge bg-blue-100 text-blue-700 text-[10px]">Unclaimed</span>
              ) : (
                <span className="badge bg-gray-100 text-gray-500 text-[10px]">Locked</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${a.achieved ? 'bg-green-500' : 'bg-primary-500'}`} style={{ width: `${a.progress}%` }} />
            </div>
            <span className="text-[11px] text-gray-400 shrink-0">{a.current?.toLocaleString()}/{a.targetValue?.toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function AnalyticsTab({ userId }) {
  const [period, setPeriod] = useState('daily');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['user-analytics', userId, period, period === 'custom' ? from : '', period === 'custom' ? to : ''],
    queryFn: () => usersService.getUserAnalytics(userId, {
      period,
      ...(period === 'custom' && from ? { from } : {}),
      ...(period === 'custom' && to ? { to } : {}),
    }),
    enabled: !!userId && (period !== 'custom' || (!!from && !!to)),
  });

  const result = data?.data;
  const series = result?.series || [];
  const totals = result?.totals;
  const coinBySource = result?.coinBySource || {};
  const maxSteps = Math.max(1, ...series.map((s) => s.steps));

  const PERIODS = [
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'custom', label: 'Custom' },
  ];

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                period === p.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {period === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input py-1.5 text-xs w-auto" />
            <span className="text-gray-400 text-xs">to</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input py-1.5 text-xs w-auto" />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : isError ? (
        <p className="text-sm text-red-500 text-center py-8">Failed to load analytics.</p>
      ) : !series.length ? (
        <p className="text-sm text-gray-400 text-center py-8">No data for this period.</p>
      ) : (
        <>
          {/* Totals */}
          {totals && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <SummaryCard icon={Footprints} label="Total Steps" value={totals.steps?.toLocaleString()} sub={`avg ${totals.avgStepsPerDay?.toLocaleString()}/day`} />
              <SummaryCard icon={Coins} label="Coins Earned" value={totals.coinsEarned?.toLocaleString()} sub={`${totals.coinsSpent} spent`} />
              <SummaryCard icon={TrendingUp} label="Net Coins" value={totals.netCoins?.toLocaleString()} sub="earned − spent" />
              <SummaryCard icon={Target} label="Goals Met" value={`${totals.goalsMet}/${totals.daysTracked}`} sub="days" />
            </div>
          )}

          {/* Steps bar chart */}
          <div className="border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Steps per {result.range.granularity.replace('ly', '')}</p>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {series.map((s) => (
                <div key={s.period} className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400 w-20 shrink-0 truncate">{s.period}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${Math.max(4, (s.steps / maxSteps) * 100)}%` }}
                    >
                      <span className="text-[10px] text-white font-medium">{s.steps.toLocaleString()}</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-yellow-600 font-medium w-14 text-right shrink-0">🪙 {s.coinsEarned}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Coins by source */}
          {Object.keys(coinBySource).length > 0 && (
            <div className="border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Coins Earned by Source</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(coinBySource).map(([src, amt]) => (
                  <span key={src} className="text-xs bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-lg font-medium">
                    {src.replace(/_/g, ' ')}: 🪙 {Math.round(amt)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AITab({ userId }) {
  const [analysis, setAnalysis] = useState(null);
  const [recs, setRecs] = useState(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingR, setLoadingR] = useState(false);

  const runAnalysis = async () => {
    setLoadingA(true);
    try {
      const res = await usersService.getAIAnalysis(userId);
      setAnalysis(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed');
    } finally {
      setLoadingA(false);
    }
  };

  const runRecs = async () => {
    setLoadingR(true);
    try {
      const res = await usersService.getAIRecommendations(userId);
      setRecs(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Recommendation failed');
    } finally {
      setLoadingR(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Performance analysis */}
      <div className="border border-gray-100 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-purple-500" />
            <h4 className="font-semibold text-gray-800 text-sm">Performance Analysis</h4>
          </div>
          <button onClick={runAnalysis} disabled={loadingA} className="btn-secondary text-xs py-1.5">
            {loadingA ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            {analysis ? 'Regenerate' : 'Analyze'}
          </button>
        </div>

        {!analysis && !loadingA && (
          <p className="text-sm text-gray-400">Click Analyze to generate AI insights on this user&apos;s performance, streaks, and achievements.</p>
        )}
        {loadingA && <div className="flex justify-center py-6"><Spinner /></div>}
        {analysis && (
          <div className="space-y-3">
            {!analysis.aiPowered && (
              <span className="badge bg-amber-100 text-amber-700 text-[10px]">Rule-based (AI key not configured)</span>
            )}
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{analysis.summary}</p>
            {analysis.insights?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Insights</p>
                <ul className="space-y-1.5">
                  {analysis.insights.map((it, i) => (
                    <li key={i} className="text-sm text-gray-600 flex gap-2"><TrendingUp size={14} className="text-blue-500 mt-0.5 shrink-0" />{it}</li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.suggestions?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Suggested Actions</p>
                <ul className="space-y-1.5">
                  {analysis.suggestions.map((it, i) => (
                    <li key={i} className="text-sm text-gray-600 flex gap-2"><Sparkles size={14} className="text-purple-500 mt-0.5 shrink-0" />{it}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ecommerce recommendations */}
      <div className="border border-gray-100 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShoppingCart size={16} className="text-green-500" />
            <h4 className="font-semibold text-gray-800 text-sm">Product Recommendations</h4>
          </div>
          <button onClick={runRecs} disabled={loadingR} className="btn-secondary text-xs py-1.5">
            {loadingR ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            {recs ? 'Regenerate' : 'Suggest'}
          </button>
        </div>

        {!recs && !loadingR && (
          <p className="text-sm text-gray-400">Click Suggest to get AI-powered product recommendations based on this user&apos;s coins, activity, and purchase history.</p>
        )}
        {loadingR && <div className="flex justify-center py-6"><Spinner /></div>}
        {recs && (
          <div className="space-y-3">
            {!recs.aiPowered && (
              <span className="badge bg-amber-100 text-amber-700 text-[10px]">Rule-based (AI key not configured)</span>
            )}
            {recs.summary && <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{recs.summary}</p>}
            {recs.recommendations?.length > 0 && (
              <div className="space-y-2">
                {recs.recommendations.map((r, i) => (
                  <div key={r.productId || i} className="flex items-start gap-2 bg-green-50/60 border border-green-100 rounded-lg p-3">
                    <Package size={15} className="text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{r.name}</p>
                      <p className="text-xs text-gray-500">{r.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {recs.suggestions?.length > 0 && (
              <ul className="space-y-1.5">
                {recs.suggestions.map((it, i) => (
                  <li key={i} className="text-sm text-gray-600 flex gap-2"><Sparkles size={14} className="text-green-500 mt-0.5 shrink-0" />{it}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ManageTab({ user, gamification }) {
  const qc = useQueryClient();
  const [name, setName] = useState(user.name || '');
  const [stepGoal, setStepGoal] = useState(user.dailyStepGoal || 10000);
  const [emailVerified, setEmailVerified] = useState(!!user.emailVerified);
  const [phoneVerified, setPhoneVerified] = useState(!!user.phoneVerified);
  const [coinAmount, setCoinAmount] = useState('');
  const [coinReason, setCoinReason] = useState('');

  const invalidate = () => {
    qc.invalidateQueries(['users']);
    qc.invalidateQueries(['user-detail', user._id]);
  };

  const saveAccount = useMutation({
    mutationFn: () => usersService.updateAccount(user._id, {
      name, dailyStepGoal: Number(stepGoal), emailVerified, phoneVerified,
    }),
    onSuccess: () => { toast.success('Account updated'); invalidate(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const adjustCoins = useMutation({
    mutationFn: (amount) => usersService.adjustCoins(user._id, amount, coinReason),
    onSuccess: (res) => {
      toast.success(`Balance is now ${res.data?.coinsBalance?.toLocaleString()} coins`);
      setCoinAmount(''); setCoinReason('');
      invalidate();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const resetStreak = useMutation({
    mutationFn: () => usersService.resetStreak(user._id),
    onSuccess: () => { toast.success('Streak reset to 0'); invalidate(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const applyCoins = (sign) => {
    const amt = Number(coinAmount);
    if (!amt || amt <= 0) { toast.error('Enter a positive amount'); return; }
    adjustCoins.mutate(sign * amt);
  };

  return (
    <div className="space-y-5">
      {/* Ban / unban */}
      <BanControl user={user} onChange={invalidate} />

      {/* Account fields */}
      <div className="border border-gray-100 rounded-xl p-4 space-y-4">
        <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><Settings size={15} /> Account Settings</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Daily Step Goal</label>
            <input type="number" className="input" value={stepGoal} onChange={(e) => setStepGoal(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={emailVerified} onChange={(e) => setEmailVerified(e.target.checked)} className="w-4 h-4 rounded accent-primary-600" />
            Email Verified
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={phoneVerified} onChange={(e) => setPhoneVerified(e.target.checked)} className="w-4 h-4 rounded accent-primary-600" />
            Phone Verified
          </label>
        </div>
        <button onClick={() => saveAccount.mutate()} disabled={saveAccount.isPending} className="btn-primary">
          <Save size={15} /> {saveAccount.isPending ? 'Saving…' : 'Save Account'}
        </button>
      </div>

      {/* Coin adjustment */}
      <div className="border border-gray-100 rounded-xl p-4 space-y-3">
        <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><Coins size={15} className="text-yellow-500" /> Adjust Coins</h4>
        <p className="text-xs text-gray-400">Current balance: <span className="font-bold text-yellow-600">{(gamification?.coinsBalance || 0).toLocaleString()} 🪙</span></p>
        <div className="grid grid-cols-2 gap-3">
          <input type="number" min="1" className="input" placeholder="Amount" value={coinAmount} onChange={(e) => setCoinAmount(e.target.value)} />
          <input className="input" placeholder="Reason (optional)" value={coinReason} onChange={(e) => setCoinReason(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button onClick={() => applyCoins(1)} disabled={adjustCoins.isPending} className="btn-primary flex-1 justify-center bg-green-600 hover:bg-green-700">
            <Plus size={15} /> Credit
          </button>
          <button onClick={() => applyCoins(-1)} disabled={adjustCoins.isPending} className="btn-danger flex-1 justify-center">
            <Minus size={15} /> Debit
          </button>
        </div>
      </div>

      {/* Streak control */}
      <div className="border border-gray-100 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><Zap size={15} className="text-orange-500" /> Streak</h4>
            <p className="text-xs text-gray-400 mt-0.5">Current: {gamification?.streakDays || 0} days · Best: {gamification?.bestStreakDays || 0} days</p>
          </div>
          <button onClick={() => { if (confirm('Reset this user\'s current streak to 0?')) resetStreak.mutate(); }} disabled={resetStreak.isPending} className="btn-secondary text-xs">
            <RefreshCw size={13} /> Reset Streak
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-xs text-blue-600">Freezes</p>
            <p className="text-lg font-bold text-blue-700">{gamification?.streakFreezes || 0}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-xs text-green-600">Lives</p>
            <p className="text-lg font-bold text-green-700">{gamification?.streakLives || 0}</p>
          </div>
        </div>
        {gamification?.streakBrokenAt && (
          <p className="text-xs text-red-500">⚠️ Streak broken at {format(new Date(gamification.streakBrokenAt), 'MMM d, h:mm a')} (was {gamification.streakBeforeBreak} days)</p>
        )}
      </div>
    </div>
  );
}

function BanControl({ user, onChange }) {
  const qc = useQueryClient();
  const [reason, setReason] = useState('');

  const banM = useMutation({
    mutationFn: () => usersService.ban(user._id, reason),
    onSuccess: () => { toast.success('User banned & logged out'); setReason(''); qc.invalidateQueries(['users']); onChange?.(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });
  const unbanM = useMutation({
    mutationFn: () => usersService.unban(user._id, reason),
    onSuccess: () => { toast.success('User unbanned'); setReason(''); qc.invalidateQueries(['users']); onChange?.(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  if (user.isBanned) {
    return (
      <div className="border border-red-200 bg-red-50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Ban size={16} className="text-red-600" />
          <h4 className="font-semibold text-red-700 text-sm">Account Banned</h4>
        </div>
        <p className="text-sm text-red-600 mb-1">Reason: {user.banInfo?.reason || '—'}</p>
        {user.banInfo?.bannedAt && (
          <p className="text-xs text-red-400 mb-3">Banned on {format(new Date(user.banInfo.bannedAt), 'MMM d, yyyy h:mm a')}</p>
        )}
        <input className="input mb-2" placeholder="Reason for unbanning (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
        <button onClick={() => unbanM.mutate()} disabled={unbanM.isPending} className="btn-primary bg-green-600 hover:bg-green-700">
          <ShieldCheck size={15} /> {unbanM.isPending ? 'Unbanning…' : 'Unban User'}
        </button>
      </div>
    );
  }

  return (
    <div className="border border-gray-100 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={16} className="text-red-500" />
        <h4 className="font-semibold text-gray-800 text-sm">Ban / Suspend Account</h4>
      </div>
      <p className="text-xs text-gray-400 mb-3">Banning logs the user out of all devices and blocks access. Provide a reason for the audit log.</p>
      <input className="input mb-2" placeholder="Reason for ban (e.g. step manipulation)" value={reason} onChange={(e) => setReason(e.target.value)} />
      <button
        onClick={() => { if (!reason.trim()) { toast.error('Please enter a reason'); return; } if (confirm(`Ban ${user.name}?`)) banM.mutate(); }}
        disabled={banM.isPending}
        className="btn-danger"
      >
        <Ban size={15} /> {banM.isPending ? 'Banning…' : 'Ban User'}
      </button>
    </div>
  );
}

function SecurityTab({ user }) {
  const qc = useQueryClient();
  const userId = user._id;

  const { data: sessRes, isLoading: sessLoading } = useQuery({
    queryKey: ['user-sessions', userId],
    queryFn: () => usersService.getSessions(userId),
    enabled: !!userId,
  });
  const { data: logRes, isLoading: logLoading } = useQuery({
    queryKey: ['user-actionlog', userId],
    queryFn: () => usersService.getActionLog(userId),
    enabled: !!userId,
  });

  const sessions = sessRes?.data || [];
  const logs = logRes?.data || [];

  const revokeOne = useMutation({
    mutationFn: (sid) => usersService.revokeSession(userId, sid),
    onSuccess: () => { toast.success('Session revoked'); qc.invalidateQueries(['user-sessions', userId]); qc.invalidateQueries(['user-actionlog', userId]); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });
  const revokeAll = useMutation({
    mutationFn: () => usersService.revokeAllSessions(userId),
    onSuccess: () => { toast.success('Logged out from all devices'); qc.invalidateQueries(['user-sessions', userId]); qc.invalidateQueries(['user-actionlog', userId]); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const ACTION_LABELS = {
    BAN: 'Banned', UNBAN: 'Unbanned', ROLE_CHANGE: 'Role changed',
    COIN_CREDIT: 'Coins credited', COIN_DEBIT: 'Coins debited',
    STREAK_RESET: 'Streak reset', ACCOUNT_EDIT: 'Account edited',
    SESSION_REVOKE: 'Session revoked', SESSION_REVOKE_ALL: 'All sessions revoked',
    DELETE: 'Deleted',
  };

  return (
    <div className="space-y-5">
      {/* Active devices */}
      <div className="border border-gray-100 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><Smartphone size={15} /> Active Devices / Sessions</h4>
          {sessions.length > 0 && (
            <button onClick={() => { if (confirm('Log this user out from ALL devices?')) revokeAll.mutate(); }} disabled={revokeAll.isPending} className="btn-danger text-xs py-1.5">
              <LogOut size={13} /> Logout All
            </button>
          )}
        </div>
        {sessLoading ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-gray-400">No active sessions.</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                {s.device === 'Mobile' ? <Smartphone size={18} className="text-gray-500 shrink-0" /> : <Monitor size={18} className="text-gray-500 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{s.os} · {s.browser}</p>
                  <p className="text-xs text-gray-400">IP {s.ip} · since {format(new Date(s.createdAt), 'MMM d, h:mm a')}</p>
                </div>
                <button onClick={() => revokeOne.mutate(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="Revoke session">
                  <LogOut size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin action history */}
      <div className="border border-gray-100 rounded-xl p-4">
        <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2 mb-3"><History size={15} /> Admin Action History</h4>
        {logLoading ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-gray-400">No admin actions recorded for this user.</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {logs.map((l) => (
              <div key={l._id} className="flex items-start gap-3 border-l-2 border-primary-200 pl-3 py-1">
                <div className="flex-1">
                  <p className="text-sm text-gray-800">
                    <span className="font-medium">{ACTION_LABELS[l.action] || l.action}</span>
                    {l.reason ? <span className="text-gray-500"> — {l.reason}</span> : null}
                  </p>
                  <p className="text-xs text-gray-400">by {l.adminName || 'admin'} · {format(new Date(l.createdAt), 'MMM d, yyyy h:mm a')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrdersTab({ orders }) {
  if (!orders?.length) {
    return <p className="text-sm text-gray-400 text-center py-8">No orders placed yet.</p>;
  }
  return (
    <div className="space-y-2">
      {orders.map((o) => (
        <div key={o._id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
          <div>
            <p className="text-sm font-medium text-gray-800">#{o._id.slice(-6).toUpperCase()}</p>
            <p className="text-xs text-gray-400">
              {o.items?.length} item(s) · {o.paymentMethod === 'COIN_PURCHASE' ? `🪙 ${o.totalCoins}` : `₹${o.totalPrice}`}
              {o.createdAt ? ` · ${format(new Date(o.createdAt), 'MMM d, yyyy')}` : ''}
            </p>
          </div>
          <span className={`badge ${
            o.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
            o.status === 'CANCELLED' ? 'bg-red-100 text-red-600' :
            o.status === 'SHIPPED' ? 'bg-indigo-100 text-indigo-700' :
            'bg-blue-100 text-blue-700'
          }`}>{o.status}</span>
        </div>
      ))}
    </div>
  );
}

function RoleBadge({ role }) {
  return role === 'admin' ? (
    <span className="badge bg-purple-100 text-purple-700"><Shield size={10} className="mr-1" />Admin</span>
  ) : (
    <span className="badge bg-gray-100 text-gray-600">User</span>
  );
}

function StatusBadge({ verified }) {
  return verified ? (
    <span className="badge bg-green-100 text-green-700"><CheckCircle size={10} className="mr-1" />Verified</span>
  ) : (
    <span className="badge bg-red-100 text-red-600"><XCircle size={10} className="mr-1" />Unverified</span>
  );
}
