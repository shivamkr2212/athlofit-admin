import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Settings, Save } from 'lucide-react';
import Header from '../components/layout/Header';
import Spinner from '../components/ui/Spinner';
import api from '../lib/api';
import toast from 'react-hot-toast';

async function fetchConfig() {
  const res = await api.get('/config/app');
  return res.data?.data?.config;
}

export default function AppConfig() {
  const qc = useQueryClient();
  const { data: config, isLoading } = useQuery({ queryKey: ['app-config'], queryFn: fetchConfig });

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (config) {
      reset({
        'coin.conversionRate':  config.coin?.conversionRate,
        'coin.dailyEarnLimit':  config.coin?.dailyEarnLimit,
        'coin.maxDailyRewards': config.coin?.maxDailyRewards,
        'coin.coinsPerStepKm':  config.coin?.coinsPerStepKm,
        'coin.referrerBonus':   config.coin?.referrerBonus,
        'coin.refereeBonus':    config.coin?.refereeBonus,
        'coin.purchaseEnabled': config.coin?.purchaseEnabled,
        'steps.defaultDailyGoal': config.steps?.defaultDailyGoal,
        'steps.maxDailyGoal':     config.steps?.maxDailyGoal,
        'rewards.stepGoalCoins':      config.rewards?.stepGoalCoins,
        'rewards.hydrationGoalCoins': config.rewards?.hydrationGoalCoins,
        'rewards.hydrationGoalMl':    config.rewards?.hydrationGoalMl,
        'features.shopEnabled':            config.features?.shopEnabled,
        'features.ordersEnabled':          config.features?.ordersEnabled,
        'features.healthAnalyticsEnabled': config.features?.healthAnalyticsEnabled,
        'features.referralEnabled':        config.features?.referralEnabled,
        'features.leaderboardEnabled':     config.features?.leaderboardEnabled,
        'maintenance.enabled': config.maintenance?.enabled,
        'maintenance.message': config.maintenance?.message,
        'support.email':   config.support?.email,
        'support.website': config.support?.website,
      });
    }
  }, [config, reset]);

  const updateMutation = useMutation({
    mutationFn: (data) => {
      // Convert flat keys to nested object
      const nested = {};
      for (const [key, value] of Object.entries(data)) {
        const parts = key.split('.');
        let obj = nested;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!obj[parts[i]]) obj[parts[i]] = {};
          obj = obj[parts[i]];
        }
        obj[parts[parts.length - 1]] = value;
      }
      return api.patch('/config/app', nested);
    },
    onSuccess: () => {
      toast.success('Config updated');
      qc.invalidateQueries(['app-config']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  if (isLoading) return (
    <div>
      <Header title="App Config" />
      <div className="flex justify-center py-16"><Spinner size="lg" /></div>
    </div>
  );

  return (
    <div>
      <Header title="App Configuration" subtitle="Manage runtime settings for the mobile app" />
      <div className="p-6">
        <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="max-w-3xl space-y-6">

          {/* Coins */}
          <Section title="🪙 Coin Settings">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Conversion Rate (coins/₹1)" name="coin.conversionRate" type="number" register={register} />
              <Field label="Daily Earn Limit (passive)" name="coin.dailyEarnLimit" type="number" register={register} />
              <Field label="Max Daily Rewards" name="coin.maxDailyRewards" type="number" register={register} />
              <Field label="Coins Per Step KM" name="coin.coinsPerStepKm" type="number" register={register} />
              <Field label="Referrer Bonus (coins)" name="coin.referrerBonus" type="number" register={register} />
              <Field label="Referee Bonus (coins)" name="coin.refereeBonus" type="number" register={register} />
            </div>
            <Toggle label="Purchase Enabled" name="coin.purchaseEnabled" register={register} />
          </Section>

          {/* Steps */}
          <Section title="👟 Step Settings">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Default Daily Goal" name="steps.defaultDailyGoal" type="number" register={register} />
              <Field label="Max Daily Goal" name="steps.maxDailyGoal" type="number" register={register} />
            </div>
          </Section>

          {/* Rewards */}
          <Section title="🎁 Reward Settings">
            <div className="grid grid-cols-3 gap-4">
              <Field label="Step Goal Coins" name="rewards.stepGoalCoins" type="number" register={register} />
              <Field label="Hydration Goal Coins" name="rewards.hydrationGoalCoins" type="number" register={register} />
              <Field label="Hydration Goal (ml)" name="rewards.hydrationGoalMl" type="number" register={register} />
            </div>
          </Section>

          {/* Features */}
          <Section title="🚀 Feature Flags">
            <div className="grid grid-cols-2 gap-3">
              <Toggle label="Shop Enabled" name="features.shopEnabled" register={register} />
              <Toggle label="Orders Enabled" name="features.ordersEnabled" register={register} />
              <Toggle label="Health Analytics Enabled" name="features.healthAnalyticsEnabled" register={register} />
              <Toggle label="Referral Enabled" name="features.referralEnabled" register={register} />
              <Toggle label="Leaderboard Enabled" name="features.leaderboardEnabled" register={register} />
            </div>
          </Section>

          {/* Maintenance */}
          <Section title="🔧 Maintenance Mode">
            <Toggle label="Maintenance Mode Active" name="maintenance.enabled" register={register} />
            <div className="mt-3">
              <label className="label">Maintenance Message</label>
              <textarea className="input" rows={2} {...register('maintenance.message')} />
            </div>
          </Section>

          {/* Support */}
          <Section title="📞 Support Info">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Support Email" name="support.email" type="email" register={register} />
              <Field label="Support Website" name="support.website" register={register} />
            </div>
          </Section>

          <button type="submit" disabled={updateMutation.isPending} className="btn-primary px-8 py-2.5">
            <Save size={16} />
            {updateMutation.isPending ? 'Saving…' : 'Save Configuration'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="card p-6 space-y-4">
      <h3 className="font-semibold text-gray-900 text-base">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, name, type = 'text', register }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input type={type} step={type === 'number' ? 'any' : undefined} className="input" {...register(name)} />
    </div>
  );
}

function Toggle({ label, name, register }) {
  return (
    <div className="flex items-center gap-3">
      <input type="checkbox" id={name} {...register(name)} className="w-4 h-4 rounded accent-primary-600" />
      <label htmlFor={name} className="text-sm text-gray-700">{label}</label>
    </div>
  );
}
