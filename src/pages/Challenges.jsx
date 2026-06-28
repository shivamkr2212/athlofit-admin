import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Dumbbell, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import Header from '../components/layout/Header';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import api from '../lib/api';
import toast from 'react-hot-toast';

const CRITERIA_TYPES = [
  'STEPS', 'CALORIES', 'ACTIVE_MINUTES', 'DISTANCE',
  'HYDRATION', 'MEALS_LOGGED', 'NUTRITION_CALORIES',
  'NUTRITION_PROTEIN', 'NUTRITION_DAYS', 'SPECIFIC_FOOD',
];

async function fetchChallenges() {
  const res = await api.get('/challenges/admin/all');
  return res.data?.data || [];
}

export default function Challenges() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editChallenge, setEditChallenge] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [typeFilter, setTypeFilter] = useState('');

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['challenges'],
    queryFn: fetchChallenges,
  });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editChallenge
        ? api.put(`/challenges/${editChallenge._id}`, data)
        : api.post('/challenges', data),
    onSuccess: () => {
      toast.success(editChallenge ? 'Challenge updated' : 'Challenge created');
      qc.invalidateQueries(['challenges']);
      setModalOpen(false);
      setEditChallenge(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/challenges/${id}`),
    onSuccess: () => {
      toast.success('Challenge deactivated');
      qc.invalidateQueries(['challenges']);
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const seedMutation = useMutation({
    mutationFn: () => api.post('/challenges/seed'),
    onSuccess: (res) => {
      toast.success(`Seeded ${res.data?.data?.length || 0} challenges`);
      qc.invalidateQueries(['challenges']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Seed failed'),
  });

  const filtered = typeFilter ? challenges.filter((c) => c.type === typeFilter) : challenges;

  return (
    <div>
      <Header title="Challenges" subtitle={`${challenges.length} challenges`} />
      <div className="p-6 space-y-4">
        {/* Toolbar */}
        <div className="card p-4 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-2">
            {['', 'daily', 'weekly'].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  typeFilter === t ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t ? t.charAt(0).toUpperCase() + t.slice(1) : 'All'}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="btn-secondary"
            >
              <RefreshCw size={15} className={seedMutation.isPending ? 'animate-spin' : ''} />
              Seed Defaults
            </button>
            <button onClick={() => { setEditChallenge(null); setModalOpen(true); }} className="btn-primary">
              <Plus size={16} /> Add Challenge
            </button>
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={Dumbbell}
              title="No challenges yet"
              action={
                <div className="flex gap-2">
                  <button onClick={() => seedMutation.mutate()} className="btn-secondary"><RefreshCw size={15} />Seed Defaults</button>
                  <button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={15} />Add Challenge</button>
                </div>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <div key={c._id} className="card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{c.emoji}</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{c.title}</p>
                      <div className="flex gap-1 mt-0.5">
                        <span className={`badge text-xs ${c.type === 'daily' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {c.type}
                        </span>
                        <span className="badge bg-gray-100 text-gray-600 text-xs">{c.category}</span>
                      </div>
                    </div>
                  </div>
                  {!c.isActive && <span className="badge bg-red-100 text-red-600 text-xs">Inactive</span>}
                </div>
                <p className="text-xs text-gray-500 mb-3">{c.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>Target: <strong>{c.targetValue?.toLocaleString()}</strong> {c.criteriaType}</span>
                  <span className="font-bold text-yellow-600">🪙 {c.coinReward}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditChallenge(c); setModalOpen(true); }} className="btn-secondary flex-1 justify-center py-1.5 text-xs">
                    <Edit2 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => api.patch(`/challenges/${c._id}/toggle`).then(() => { toast.success(c.isActive ? 'Deactivated' : 'Activated'); qc.invalidateQueries(['challenges']); })}
                    className={`flex-1 justify-center py-1.5 text-xs ${c.isActive ? 'btn-secondary' : 'btn-primary'}`}
                  >
                    {c.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditChallenge(null); }} title={editChallenge ? 'Edit Challenge' : 'Add Challenge'} size="lg">
        <ChallengeForm
          challenge={editChallenge}
          onSubmit={(d) => saveMutation.mutate(d)}
          loading={saveMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
        loading={deleteMutation.isPending}
        title="Deactivate Challenge"
        message={`Deactivate "${deleteTarget?.title}"?`}
        confirmLabel="Deactivate"
      />
    </div>
  );
}

function ChallengeForm({ challenge, onSubmit, loading }) {
  const { register, handleSubmit, watch } = useForm({
    defaultValues: challenge || { type: 'daily', category: 'fitness', criteriaType: 'STEPS', isActive: true, order: 0 },
  });
  const criteriaType = watch('criteriaType');

  const submit = (data) => {
    onSubmit({
      ...data,
      targetValue: Number(data.targetValue),
      coinReward: Number(data.coinReward),
      order: Number(data.order || 0),
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Title *</label>
          <input className="input" {...register('title', { required: true })} />
        </div>
        <div className="col-span-2">
          <label className="label">Description *</label>
          <textarea className="input" rows={2} {...register('description', { required: true })} />
        </div>
        <div>
          <label className="label">Emoji</label>
          <input className="input text-2xl" placeholder="🏃" {...register('emoji')} />
        </div>
        <div>
          <label className="label">Color (hex)</label>
          <input className="input" placeholder="#3b82f6" {...register('color')} />
        </div>
        <div>
          <label className="label">Type *</label>
          <select className="input" {...register('type', { required: true })}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
        <div>
          <label className="label">Category *</label>
          <select className="input" {...register('category', { required: true })}>
            <option value="fitness">Fitness</option>
            <option value="nutrition">Nutrition</option>
            <option value="hydration">Hydration</option>
            <option value="wellness">Wellness</option>
          </select>
        </div>
        <div>
          <label className="label">Criteria Type *</label>
          <select className="input" {...register('criteriaType', { required: true })}>
            {CRITERIA_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        {criteriaType === 'SPECIFIC_FOOD' && (
          <div>
            <label className="label">Target Food</label>
            <input className="input" placeholder="e.g. egg" {...register('targetFood')} />
          </div>
        )}
        <div>
          <label className="label">Target Value *</label>
          <input type="number" className="input" {...register('targetValue', { required: true, min: 1 })} />
        </div>
        <div>
          <label className="label">Coin Reward *</label>
          <input type="number" className="input" {...register('coinReward', { required: true, min: 0 })} />
        </div>
        <div>
          <label className="label">Order</label>
          <input type="number" className="input" {...register('order')} />
        </div>
        <div className="flex items-center gap-2 pt-5">
          <input type="checkbox" id="challengeActive" {...register('isActive')} className="rounded" />
          <label htmlFor="challengeActive" className="text-sm text-gray-700">Active</label>
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? 'Saving…' : challenge ? 'Update Challenge' : 'Create Challenge'}
      </button>
    </form>
  );
}
