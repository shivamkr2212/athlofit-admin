import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Bell, Send } from 'lucide-react';
import Header from '../components/layout/Header';
import Spinner from '../components/ui/Spinner';
import api from '../lib/api';
import toast from 'react-hot-toast';

async function fetchScreens() {
  const res = await api.get('/notification/screens');
  return res.data?.data || [];
}

const TARGETS = [
  { value: 'all', label: 'All Users', desc: 'Everyone with a valid FCM token' },
  { value: 'ios', label: 'iOS Only', desc: 'iOS devices only' },
  { value: 'android', label: 'Android Only', desc: 'Android devices only' },
  { value: 'user', label: 'Single User', desc: 'Requires userId' },
  { value: 'streak', label: 'By Streak', desc: 'Users with streak >= streakMin' },
  { value: 'coins', label: 'By Coins', desc: 'Users with coins >= coinsMin' },
  { value: 'gender', label: 'By Gender', desc: 'M / F / O' },
  { value: 'provider', label: 'By Provider', desc: 'email / google / apple' },
  { value: 'profileComplete', label: 'Profile Complete', desc: 'Users who completed profile' },
  { value: 'newUsers', label: 'New Users', desc: 'Registered within last N days' },
];

const NOTIFICATION_TYPES = ['GOAL', 'HYDRATION', 'PRODUCT', 'CHALLENGE', 'COIN', 'SECURITY', 'HEART', 'SYSTEM'];

export default function Notifications() {
  const { data: screens = [], isLoading: screensLoading } = useQuery({
    queryKey: ['notification-screens'],
    queryFn: fetchScreens,
  });

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    defaultValues: {
      target: 'all',
      type: 'GOAL',
      priority: 'high',
      channelId: 'athlofit_push',
      sound: 'default',
      badge: 1,
    },
  });

  const target = watch('target');

  const sendMutation = useMutation({
    mutationFn: (data) => api.post('/notification/send', data),
    onSuccess: (res) => {
      const d = res.data?.data;
      toast.success(`Sent to ${d?.successCount || 0} devices (${d?.failureCount || 0} failed)`);
      reset({ target: 'all', type: 'GOAL', priority: 'high', channelId: 'athlofit_push', sound: 'default', badge: 1 });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to send'),
  });

  const submit = (data) => {
    const payload = { ...data };
    // Clean up unused target fields
    if (data.target !== 'user') delete payload.userId;
    if (data.target !== 'streak') { delete payload.streakMin; delete payload.streakMax; }
    if (data.target !== 'coins') delete payload.coinsMin;
    if (data.target !== 'gender') delete payload.gender;
    if (data.target !== 'provider') delete payload.provider;
    if (data.target !== 'newUsers') delete payload.registeredWithinDays;
    if (data.streakMin) payload.streakMin = Number(data.streakMin);
    if (data.streakMax) payload.streakMax = Number(data.streakMax);
    if (data.coinsMin) payload.coinsMin = Number(data.coinsMin);
    if (data.registeredWithinDays) payload.registeredWithinDays = Number(data.registeredWithinDays);
    if (data.badge) payload.badge = Number(data.badge);
    sendMutation.mutate(payload);
  };

  return (
    <div>
      <Header title="Push Notifications" subtitle="Send targeted push notifications to users" />
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit(submit)} className="space-y-6">
            {/* Message Content */}
            <div className="card p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Bell size={18} className="text-primary-600" /> Message Content
              </h3>
              <div>
                <label className="label">Title *</label>
                <input className="input" placeholder="🎯 Daily Goal Reached!" {...register('title', { required: 'Title is required' })} />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <label className="label">Body *</label>
                <textarea className="input" rows={3} placeholder="You've hit your step goal today! Keep it up 💪" {...register('body', { required: 'Body is required' })} />
                {errors.body && <p className="text-xs text-red-500 mt-1">{errors.body.message}</p>}
              </div>
              <div>
                <label className="label">Image URL (optional)</label>
                <input className="input" placeholder="https://..." {...register('imageUrl')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Notification Type</label>
                  <select className="input" {...register('type')}>
                    {NOTIFICATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Deep Link Screen</label>
                  {screensLoading ? (
                    <div className="input flex items-center gap-2 text-gray-400"><Spinner size="sm" /> Loading…</div>
                  ) : (
                    <select className="input" {...register('screen')}>
                      <option value="">None</option>
                      {screens.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Targeting */}
            <div className="card p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">🎯 Targeting</h3>
              <div>
                <label className="label">Target Audience *</label>
                <div className="grid grid-cols-2 gap-2">
                  {TARGETS.map((t) => (
                    <label
                      key={t.value}
                      className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        target === t.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input type="radio" value={t.value} {...register('target')} className="mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t.label}</p>
                        <p className="text-xs text-gray-400">{t.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Conditional target fields */}
              {target === 'user' && (
                <div>
                  <label className="label">User ID *</label>
                  <input className="input font-mono" placeholder="MongoDB ObjectId" {...register('userId', { required: target === 'user' })} />
                </div>
              )}
              {target === 'streak' && (
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label">Min Streak Days *</label><input type="number" className="input" {...register('streakMin', { required: target === 'streak' })} /></div>
                  <div><label className="label">Max Streak Days</label><input type="number" className="input" {...register('streakMax')} /></div>
                </div>
              )}
              {target === 'coins' && (
                <div><label className="label">Min Coins Balance *</label><input type="number" className="input" {...register('coinsMin', { required: target === 'coins' })} /></div>
              )}
              {target === 'gender' && (
                <div>
                  <label className="label">Gender *</label>
                  <select className="input" {...register('gender', { required: target === 'gender' })}>
                    <option value="">Select</option>
                    <option value="M">Male (M)</option>
                    <option value="F">Female (F)</option>
                    <option value="O">Other (O)</option>
                  </select>
                </div>
              )}
              {target === 'provider' && (
                <div>
                  <label className="label">Provider *</label>
                  <select className="input" {...register('provider', { required: target === 'provider' })}>
                    <option value="">Select</option>
                    <option value="email">Email</option>
                    <option value="google">Google</option>
                    <option value="apple">Apple</option>
                  </select>
                </div>
              )}
              {target === 'newUsers' && (
                <div><label className="label">Registered Within (days)</label><input type="number" className="input" defaultValue={7} {...register('registeredWithinDays')} /></div>
              )}
            </div>

            {/* Advanced */}
            <div className="card p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">⚙️ Advanced Options</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Priority</label>
                  <select className="input" {...register('priority')}>
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                  </select>
                </div>
                <div>
                  <label className="label">Sound</label>
                  <input className="input" {...register('sound')} />
                </div>
                <div>
                  <label className="label">Badge Count</label>
                  <input type="number" className="input" {...register('badge')} />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={sendMutation.isPending}
              className="btn-primary w-full justify-center py-3 text-base"
            >
              {sendMutation.isPending ? (
                <><Spinner size="sm" /> Sending…</>
              ) : (
                <><Send size={18} /> Send Notification</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
