import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Trophy, Star } from 'lucide-react';
import { useForm } from 'react-hook-form';
import Header from '../components/layout/Header';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import api from '../lib/api';
import toast from 'react-hot-toast';

async function fetchBadges() {
  const res = await api.get('/gamification/admin/badges');
  return res.data?.data || [];
}

async function fetchLeaderboard() {
  const res = await api.get('/gamification/leaderboard');
  return res.data?.data || [];
}

async function fetchAchievements() {
  const res = await api.get('/gamification/achievements');
  return res.data?.data || [];
}

export default function Gamification() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('badges');
  const [badgeModal, setBadgeModal] = useState(false);
  const [editBadge, setEditBadge] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [achievementModal, setAchievementModal] = useState(false);

  const { data: badges = [], isLoading: badgesLoading } = useQuery({ queryKey: ['badges'], queryFn: fetchBadges });
  const { data: leaderboard = [], isLoading: lbLoading } = useQuery({ queryKey: ['leaderboard'], queryFn: fetchLeaderboard });
  const { data: achievements = [], isLoading: achLoading } = useQuery({ queryKey: ['achievements'], queryFn: fetchAchievements });

  const saveBadgeMutation = useMutation({
    mutationFn: (data) =>
      editBadge ? api.put(`/gamification/admin/badges/${editBadge._id}`, data) : api.post('/gamification/admin/badges', data),
    onSuccess: () => {
      toast.success(editBadge ? 'Badge updated' : 'Badge created');
      qc.invalidateQueries(['badges']);
      setBadgeModal(false);
      setEditBadge(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const deleteBadgeMutation = useMutation({
    mutationFn: (id) => api.delete(`/gamification/admin/badges/${id}`),
    onSuccess: () => {
      toast.success('Badge deactivated');
      qc.invalidateQueries(['badges']);
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const saveAchievementMutation = useMutation({
    mutationFn: (data) => api.post('/gamification/admin/achievements', data),
    onSuccess: () => {
      toast.success('Achievement created');
      qc.invalidateQueries(['achievements']);
      setAchievementModal(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const TABS = [
    { key: 'badges', label: '🏅 Badges' },
    { key: 'achievements', label: '🏆 Achievements' },
    { key: 'leaderboard', label: '📊 Leaderboard' },
  ];

  return (
    <div>
      <Header title="Gamification" subtitle="Manage badges, achievements & leaderboard" />
      <div className="p-6 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Badges Tab */}
        {tab === 'badges' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => { setEditBadge(null); setBadgeModal(true); }} className="btn-primary">
                <Plus size={16} /> Add Badge
              </button>
            </div>
            {badgesLoading ? (
              <div className="flex justify-center py-16"><Spinner size="lg" /></div>
            ) : badges.length === 0 ? (
              <div className="card"><EmptyState icon={Trophy} title="No badges yet" /></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {badges.map((b) => (
                  <div key={b._id} className="card p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{b.emoji}</span>
                        <div>
                          <p className="font-semibold text-gray-900">{b.title}</p>
                          <p className="text-xs text-gray-400">{b.threshold} day streak</p>
                        </div>
                      </div>
                      {!b.isActive && <span className="badge bg-red-100 text-red-600 text-xs">Inactive</span>}
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{b.rule}</p>
                    <div className="flex items-center justify-between text-xs mb-3">
                      <span className="text-gray-500">Reward: <strong className="text-yellow-600">{b.coinReward} coins</strong></span>
                      <span className="text-gray-400">Order: {b.order}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditBadge(b); setBadgeModal(true); }} className="btn-secondary flex-1 justify-center py-1.5 text-xs">
                        <Edit2 size={13} /> Edit
                      </button>
                      <button onClick={() => setDeleteTarget(b)} className="btn-danger flex-1 justify-center py-1.5 text-xs">
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Achievements Tab */}
        {tab === 'achievements' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => setAchievementModal(true)} className="btn-primary">
                <Plus size={16} /> Add Achievement
              </button>
            </div>
            {achLoading ? (
              <div className="flex justify-center py-16"><Spinner size="lg" /></div>
            ) : achievements.length === 0 ? (
              <div className="card"><EmptyState icon={Star} title="No achievements yet" /></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((a) => (
                  <div key={a._id} className="card p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{a.icon || '🏆'}</span>
                      <div>
                        <p className="font-semibold text-gray-900">{a.title}</p>
                        <p className="text-xs text-gray-400">{a.criteriaType}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{a.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span>Target: <strong>{a.targetValue?.toLocaleString()}</strong></span>
                      <span className="font-bold text-yellow-600">🪙 {a.reward}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Leaderboard Tab */}
        {tab === 'leaderboard' && (
          <div className="card overflow-hidden">
            {lbLoading ? (
              <div className="flex justify-center py-16"><Spinner size="lg" /></div>
            ) : leaderboard.length === 0 ? (
              <EmptyState icon={Trophy} title="No leaderboard data" />
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="table-th">Rank</th>
                    <th className="table-th">User</th>
                    <th className="table-th">Coins</th>
                    <th className="table-th">Streak</th>
                    <th className="table-th">Best Streak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leaderboard.map((u, i) => (
                    <tr key={u._id || i} className="hover:bg-gray-50">
                      <td className="table-td">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          i === 0 ? 'bg-yellow-100 text-yellow-700' :
                          i === 1 ? 'bg-gray-200 text-gray-700' :
                          i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-500'
                        }`}>{i + 1}</span>
                      </td>
                      <td className="table-td">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700">
                            {u.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{u.name}</p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-td font-bold text-yellow-600">{u.coinsBalance?.toLocaleString()}</td>
                      <td className="table-td">{u.streakDays} days</td>
                      <td className="table-td">{u.bestStreakDays} days</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Badge Modal */}
      <Modal open={badgeModal} onClose={() => { setBadgeModal(false); setEditBadge(null); }} title={editBadge ? 'Edit Badge' : 'Add Badge'}>
        <BadgeForm badge={editBadge} onSubmit={(d) => saveBadgeMutation.mutate(d)} loading={saveBadgeMutation.isPending} />
      </Modal>

      {/* Achievement Modal */}
      <Modal open={achievementModal} onClose={() => setAchievementModal(false)} title="Add Achievement">
        <AchievementForm onSubmit={(d) => saveAchievementMutation.mutate(d)} loading={saveAchievementMutation.isPending} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteBadgeMutation.mutate(deleteTarget._id)}
        loading={deleteBadgeMutation.isPending}
        title="Deactivate Badge"
        message={`Deactivate badge "${deleteTarget?.title}"?`}
        confirmLabel="Deactivate"
      />
    </div>
  );
}

function BadgeForm({ badge, onSubmit, loading }) {
  const { register, handleSubmit } = useForm({
    defaultValues: badge || { isActive: true, order: 0, coinReward: 0 },
  });
  const submit = (data) => onSubmit({ ...data, threshold: Number(data.threshold), coinReward: Number(data.coinReward), order: Number(data.order) });
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Key *</label><input className="input" placeholder="starter" {...register('key', { required: true })} /></div>
        <div><label className="label">Title *</label><input className="input" {...register('title', { required: true })} /></div>
        <div><label className="label">Emoji</label><input className="input text-2xl" placeholder="🏅" {...register('emoji')} /></div>
        <div><label className="label">Color</label><input className="input" placeholder="#3b82f6" {...register('color')} /></div>
        <div><label className="label">Streak Threshold *</label><input type="number" className="input" {...register('threshold', { required: true, min: 1 })} /></div>
        <div><label className="label">Coin Reward</label><input type="number" className="input" {...register('coinReward')} /></div>
        <div><label className="label">Order</label><input type="number" className="input" {...register('order')} /></div>
        <div className="flex items-center gap-2 pt-5"><input type="checkbox" id="badgeActive" {...register('isActive')} className="rounded" /><label htmlFor="badgeActive" className="text-sm">Active</label></div>
        <div className="col-span-2"><label className="label">Rule Description</label><input className="input" placeholder="Maintain a 7-day streak" {...register('rule')} /></div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">{loading ? 'Saving…' : badge ? 'Update' : 'Create'}</button>
    </form>
  );
}

function AchievementForm({ onSubmit, loading }) {
  const { register, handleSubmit } = useForm();
  const submit = (data) => onSubmit({ ...data, targetValue: Number(data.targetValue), reward: Number(data.reward) });
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Key *</label><input className="input" {...register('key', { required: true })} /></div>
        <div><label className="label">Title *</label><input className="input" {...register('title', { required: true })} /></div>
        <div className="col-span-2"><label className="label">Description</label><textarea className="input" rows={2} {...register('description')} /></div>
        <div>
          <label className="label">Criteria Type *</label>
          <select className="input" {...register('criteriaType', { required: true })}>
            <option value="STEPS_TOTAL">STEPS_TOTAL</option>
            <option value="STEPS_DAILY">STEPS_DAILY</option>
            <option value="WATER_TOTAL">WATER_TOTAL</option>
            <option value="ORDERS_COUNT">ORDERS_COUNT</option>
          </select>
        </div>
        <div><label className="label">Target Value *</label><input type="number" className="input" {...register('targetValue', { required: true })} /></div>
        <div><label className="label">Reward (coins) *</label><input type="number" className="input" {...register('reward', { required: true })} /></div>
        <div><label className="label">Icon (emoji)</label><input className="input text-2xl" placeholder="🏆" {...register('icon')} /></div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">{loading ? 'Saving…' : 'Create Achievement'}</button>
    </form>
  );
}
