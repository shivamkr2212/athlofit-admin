import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { Settings, Save } from 'lucide-react';
import Header from '../components/layout/Header';
import Spinner from '../components/ui/Spinner';
import ImageUploader from '../components/ui/ImageUploader';
import api from '../lib/api';
import toast from 'react-hot-toast';

async function fetchConfig() {
  const res = await api.get('/config/app');
  return res.data?.data?.config;
}

export default function AppConfig() {
  const qc = useQueryClient();
  const { data: config, isLoading } = useQuery({ queryKey: ['app-config'], queryFn: fetchConfig });

  const { register, handleSubmit, reset, control } = useForm();

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
        'coin_config.steps.rate_per_100_steps':                  config.coin_config?.steps?.rate_per_100_steps,
        'coin_config.rewards.daily_step_goal_reached.enabled':    config.coin_config?.rewards?.daily_step_goal_reached?.enabled,
        'coin_config.rewards.daily_step_goal_reached.coin_value': config.coin_config?.rewards?.daily_step_goal_reached?.coin_value,
        'streak.freezeEarnEvery':     config.streak?.freezeEarnEvery,
        'streak.maxFreezes':          config.streak?.maxFreezes,
        'streak.freezeGraceHours':    config.streak?.freezeGraceHours,
        'streak.lifeEarnIntervalDays': config.streak?.lifeEarnIntervalDays,
        'streak.maxLives':            config.streak?.maxLives,
        'streak.restoreCostCoins':    config.streak?.restoreCostCoins,
        'streak.restoreWindowHours':  config.streak?.restoreWindowHours,
        'features.shopEnabled':            config.features?.shopEnabled,
        'features.ordersEnabled':          config.features?.ordersEnabled,
        'features.healthAnalyticsEnabled': config.features?.healthAnalyticsEnabled,
        'features.referralEnabled':        config.features?.referralEnabled,
        'features.leaderboardEnabled':     config.features?.leaderboardEnabled,
        'maintenance.enabled': config.maintenance?.enabled,
        'maintenance.message': config.maintenance?.message,
        'support.email':   config.support?.email,
        'support.website': config.support?.website,
        'support.phone':   config.support?.phone,
        'support.address': config.support?.address,
        'appLinks.playStore': config.appLinks?.playStore,
        'appLinks.appStore':  config.appLinks?.appStore,
        'appLinks.universal': config.appLinks?.universal,
        'appLinks.showBadges': config.appLinks?.showBadges,
        'social.instagram': config.social?.instagram,
        'social.twitter':   config.social?.twitter,
        'social.facebook':  config.social?.facebook,
        'social.youtube':   config.social?.youtube,
        'social.linkedin':  config.social?.linkedin,
        'website.siteName':               config.website?.siteName,
        'website.defaultMetaTitle':       config.website?.defaultMetaTitle,
        'website.defaultMetaDescription': config.website?.defaultMetaDescription,
        'website.ogImage':                config.website?.ogImage,
        'website.logoUrl':                config.website?.logoUrl,
        'website.razorpayEnabled':        config.website?.razorpayEnabled,
      });
    }
  }, [config, reset]);

  const updateMutation = useMutation({
    mutationFn: (data) => {
      // Coerce numeric fields that the backend validates strictly.
      const numericKeys = [
        'coin_config.steps.rate_per_100_steps',
        'coin_config.rewards.daily_step_goal_reached.coin_value',
        'streak.freezeEarnEvery', 'streak.maxFreezes', 'streak.freezeGraceHours',
        'streak.lifeEarnIntervalDays', 'streak.maxLives', 'streak.restoreCostCoins',
        'streak.restoreWindowHours',
      ];
      for (const k of numericKeys) {
        if (data[k] !== undefined && data[k] !== '' && data[k] !== null) {
          data[k] = Number(data[k]);
        }
      }
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

          {/* Step Coin Control */}
          <Section title="🪙👟 Step → Coin Control">
            <p className="text-xs text-gray-500 -mt-1">
              Controls how many coins users earn from steps. All values are stored in the database (admin-controlled, not .env).
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Coins per 100 steps (passive)"
                name="coin_config.steps.rate_per_100_steps"
                type="number"
                register={register}
              />
              <Field
                label="Daily Step-Goal Reward (coins)"
                name="coin_config.rewards.daily_step_goal_reached.coin_value"
                type="number"
                register={register}
              />
            </div>
            <Toggle
              label="Daily step-goal reward enabled"
              name="coin_config.rewards.daily_step_goal_reached.enabled"
              register={register}
            />
            <p className="text-xs text-gray-400">
              Example: 0.5 coins / 100 steps → 10,000 steps = 50 passive coins. The daily step-goal
              reward is a one-time bonus when the user hits their goal.
            </p>
          </Section>

          {/* Streak Protection */}
          <Section title="🔥 Streak Protection System">
            <p className="text-xs text-gray-500 -mt-1">
              Configure freezes (24hr grace), weekly lives (auto-repair), and paid restore.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Freeze earned every N streak days" name="streak.freezeEarnEvery" type="number" register={register} />
              <Field label="Max stored freezes" name="streak.maxFreezes" type="number" register={register} />
              <Field label="Freeze grace period (hours)" name="streak.freezeGraceHours" type="number" register={register} />
              <Field label="Life earned every N days" name="streak.lifeEarnIntervalDays" type="number" register={register} />
              <Field label="Max stored lives" name="streak.maxLives" type="number" register={register} />
              <Field label="Restore cost (coins)" name="streak.restoreCostCoins" type="number" register={register} />
              <Field label="Restore window (hours)" name="streak.restoreWindowHours" type="number" register={register} />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Freeze = 1 free miss forgiven. Life = auto-repairs a break. Restore = user pays coins.
            </p>
          </Section>

          {/* Notification Templates */}
          <Section title="🔔 Notification Messages">
            <p className="text-xs text-gray-500 -mt-1">
              Customize push notification text. Use {'{{'}variables{'}}'}:  orderId, coins, goal, name, streak, badge
            </p>
            <div className="space-y-3">
              {[
                ['notifications.orderConfirmed.title', 'Order Confirmed — Title', '🛍️ Order Confirmed!'],
                ['notifications.orderConfirmed.message', 'Order Confirmed — Message', 'Your order #{{orderId}} has been placed successfully.'],
                ['notifications.orderCancelled.title', 'Order Cancelled — Title', '❌ Order Cancelled'],
                ['notifications.orderCancelled.message', 'Order Cancelled — Message', 'Order #{{orderId}} cancelled. {{coins}} coins refunded.'],
                ['notifications.stepGoalReached.title', 'Step Goal — Title', '🎯 Daily Step Goal Reached!'],
                ['notifications.stepGoalReached.message', 'Step Goal — Message', 'You hit your {{goal}} step goal and earned {{coins}} coins!'],
                ['notifications.streakBroken.title', 'Streak Broken — Title', '💪 Start fresh!'],
                ['notifications.streakBroken.message', 'Streak Broken — Message', 'Your streak ended, but every step counts.'],
                ['notifications.challengeComplete.title', 'Challenge — Title', '🎉 Challenge Complete!'],
                ['notifications.challengeComplete.message', 'Challenge — Message', 'You completed "{{name}}" and earned {{coins}} coins!'],
              ].map(([name, label, placeholder]) => (
                <div key={name}>
                  <label className="label text-xs">{label}</label>
                  <input className="input text-sm" placeholder={placeholder} {...register(name)} />
                </div>
              ))}
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
              <Field label="Support Phone" name="support.phone" register={register} />
              <Field label="Support Address" name="support.address" register={register} />
            </div>
          </Section>

          {/* App Download Links */}
          <Section title="📲 App Download Links (Website)">
            <div className="grid grid-cols-1 gap-4">
              <Field label="Google Play URL" name="appLinks.playStore" register={register} />
              <Field label="App Store URL" name="appLinks.appStore" register={register} />
              <Field label="Universal / Deep Link (optional)" name="appLinks.universal" register={register} />
            </div>
            <Toggle label="Show download badges on website" name="appLinks.showBadges" register={register} />
          </Section>

          {/* Social Links */}
          <Section title="🌐 Social Media Links">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Instagram" name="social.instagram" register={register} />
              <Field label="Twitter / X" name="social.twitter" register={register} />
              <Field label="Facebook" name="social.facebook" register={register} />
              <Field label="YouTube" name="social.youtube" register={register} />
              <Field label="LinkedIn" name="social.linkedin" register={register} />
            </div>
          </Section>

          {/* Website SEO + Payments */}
          <Section title="🔍 Website SEO & Payments">
            <div className="grid grid-cols-1 gap-4">
              <Field label="Site Name" name="website.siteName" register={register} />
              <Field label="Default Meta Title" name="website.defaultMetaTitle" register={register} />
              <Field label="Default Meta Description" name="website.defaultMetaDescription" register={register} />
              <Field label="Default OG Image URL" name="website.ogImage" register={register} />
            </div>
            <div className="mt-4">
              <Controller
                control={control}
                name="website.logoUrl"
                render={({ field }) => (
                  <ImageUploader
                    label="Site Logo (shown in navbar & footer)"
                    folder="misc"
                    value={field.value || ''}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            <Toggle label="Enable Razorpay checkout on website" name="website.razorpayEnabled" register={register} />
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
