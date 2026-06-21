import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Eye, Trash2, Shield, User, CheckCircle, XCircle, Filter,
  Footprints, Flame, Droplets, Trophy, Award, Coins, Package, Activity, Target,
} from 'lucide-react';
import Header from '../components/layout/Header';
import Spinner from '../components/ui/Spinner';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import api from '../lib/api';
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
                      <td className="table-td"><StatusBadge verified={u.emailVerified} /></td>
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
    { key: 'gamification', label: 'Coins & Badges', icon: Trophy },
    { key: 'achievements', label: 'Achievements', icon: Award },
    { key: 'orders', label: 'Orders', icon: Package },
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
      {tab === 'gamification' && <GamificationTab gamification={gamification} />}
      {tab === 'achievements' && <AchievementsTab achievements={achievements} />}
      {tab === 'orders' && <OrdersTab orders={orders} />}
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
          <SummaryCard icon={Coins} label="Step Coins Earned" value={summary.totalStepCoins?.toLocaleString()} sub={`${summary.ratePer100Steps}/100 steps`} />
          <SummaryCard icon={Target} label="Goals Met" value={`${summary.goalsMet}/${summary.daysTracked}`} sub="days hit goal" />
          <SummaryCard icon={Flame} label="Calories" value={Math.round(summary.totalCalories || 0).toLocaleString()} sub="lifetime kcal" />
          <SummaryCard icon={Activity} label="Distance" value={`${(summary.totalDistance || 0).toFixed(1)} km`} sub="lifetime" />
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
                <th className="text-right px-3 py-2 font-medium text-gray-500 text-xs">Coins</th>
                <th className="text-right px-3 py-2 font-medium text-gray-500 text-xs">Kcal</th>
                <th className="text-right px-3 py-2 font-medium text-gray-500 text-xs">Water</th>
                <th className="text-center px-3 py-2 font-medium text-gray-500 text-xs">Goal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {days.map((d) => (
                <tr key={d._id || d.date} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-700">{d.date}</td>
                  <td className="px-3 py-2 text-right font-medium text-gray-900">{d.steps?.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-yellow-600 font-medium">🪙 {d.stepCoins}</td>
                  <td className="px-3 py-2 text-right text-gray-600">{Math.round(d.calories || 0)}</td>
                  <td className="px-3 py-2 text-right text-gray-600">{d.hydration || 0}ml</td>
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
