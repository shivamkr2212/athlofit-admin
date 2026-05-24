import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Eye, Trash2, Shield, User, CheckCircle, XCircle, Filter } from 'lucide-react';
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
  const [profileRes, gamRes, ordersRes] = await Promise.allSettled([
    api.get(`/admin/users/${id}`),
    api.get(`/admin/users/${id}/gamification`),
    api.get(`/admin/users/${id}/orders`),
  ]);
  return {
    profile: profileRes.status === 'fulfilled' ? profileRes.value.data?.data : null,
    gamification: gamRes.status === 'fulfilled' ? gamRes.value.data?.data : null,
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
      <Modal open={!!selectedUser} onClose={() => setSelectedUser(null)} title="User Details" size="lg">
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
  const { profile, gamification, orders } = detail;
  const u = profile || user;

  return (
    <div className="space-y-5">
      {/* Profile */}
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

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          ['Phone', u.phone || '—'],
          ['Gender', u.gender || '—'],
          ['Age', u.age ? `${u.age} yrs` : '—'],
          ['Height', u.height ? `${u.height} cm` : '—'],
          ['Weight', u.weight ? `${u.weight} kg` : '—'],
          ['Blood Type', u.bloodType || '—'],
          ['Step Goal', u.dailyStepGoal?.toLocaleString() || '10,000'],
          ['Provider', u.provider || 'email'],
          ['Profile Complete', u.isProfileCompleted ? 'Yes' : 'No'],
          ['Joined', u.createdAt ? format(new Date(u.createdAt), 'MMM d, yyyy') : '—'],
        ].map(([k, v]) => (
          <div key={k} className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400">{k}</p>
            <p className="text-sm font-medium text-gray-800 mt-0.5">{v}</p>
          </div>
        ))}
      </div>

      {/* Gamification */}
      {gamification && (
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Gamification</h4>
          <div className="grid grid-cols-3 gap-3">
            {[
              ['Coins', gamification.coinsBalance?.toLocaleString()],
              ['Streak', `${gamification.streakDays} days`],
              ['Best Streak', `${gamification.bestStreakDays} days`],
            ].map(([k, v]) => (
              <div key={k} className="bg-yellow-50 rounded-lg p-3 text-center">
                <p className="text-xs text-yellow-600">{k}</p>
                <p className="text-lg font-bold text-yellow-700">{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      {orders?.orders?.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Recent Orders</h4>
          <div className="space-y-2">
            {orders.orders.slice(0, 3).map((o) => (
              <div key={o._id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">#{o._id.slice(-6).toUpperCase()}</p>
                  <p className="text-xs text-gray-400">{o.items?.length} item(s) · {o.totalCoins} coins</p>
                </div>
                <span className={`badge ${
                  o.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                  o.status === 'CANCELLED' ? 'bg-red-100 text-red-600' :
                  'bg-blue-100 text-blue-700'
                }`}>{o.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
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
