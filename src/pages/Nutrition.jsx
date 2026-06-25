import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Plus, Trash2, Salad, Target, Filter } from 'lucide-react';
import Header from '../components/layout/Header';
import Spinner from '../components/ui/Spinner';
import api from '../lib/api';
import toast from 'react-hot-toast';

async function fetchConfig() {
  const res = await api.get('/config/app');
  return res.data?.data?.config;
}

// The three editable lists in AppConfig.nutrition. `idKey` is the unique field name.
const LISTS = [
  {
    key: 'dietPreferences',
    title: 'Diet Preferences',
    icon: Salad,
    idKey: 'value',
    fields: ['value', 'label', 'emoji'],
    hint: 'e.g. value: veg · label: Vegetarian · emoji: 🥦',
  },
  {
    key: 'dietaryGoals',
    title: 'Dietary Goals',
    icon: Target,
    idKey: 'value',
    fields: ['value', 'label', 'emoji'],
    hint: 'e.g. value: weight_loss · label: Weight Loss · emoji: 🔥',
  },
  {
    key: 'catalogFilters',
    title: 'Catalog Filters',
    icon: Filter,
    idKey: 'id',
    fields: ['id', 'label', 'emoji'],
    hint: 'e.g. id: vegan · label: Vegan · emoji: 🌱',
  },
];

export default function Nutrition() {
  const qc = useQueryClient();
  const { data: config, isLoading } = useQuery({ queryKey: ['app-config'], queryFn: fetchConfig });
  const [lists, setLists] = useState({ dietPreferences: [], dietaryGoals: [], catalogFilters: [] });

  useEffect(() => {
    if (config?.nutrition) {
      setLists({
        dietPreferences: config.nutrition.dietPreferences || [],
        dietaryGoals: config.nutrition.dietaryGoals || [],
        catalogFilters: config.nutrition.catalogFilters || [],
      });
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: (listKey) => api.patch('/config/app', { nutrition: { [listKey]: lists[listKey] } }),
    onSuccess: () => {
      toast.success('Saved');
      qc.invalidateQueries(['app-config']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const addItem = (cfg) => {
    const blank = cfg.fields.reduce((acc, f) => ({ ...acc, [f]: '' }), {});
    setLists((prev) => ({ ...prev, [cfg.key]: [...prev[cfg.key], blank] }));
  };

  const updateItem = (listKey, idx, field, value) => {
    setLists((prev) => ({
      ...prev,
      [listKey]: prev[listKey].map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    }));
  };

  const removeItem = (listKey, idx) => {
    setLists((prev) => ({ ...prev, [listKey]: prev[listKey].filter((_, i) => i !== idx) }));
  };

  if (isLoading) return (
    <div>
      <Header title="Nutrition & Goals" />
      <div className="flex justify-center py-16"><Spinner size="lg" /></div>
    </div>
  );

  return (
    <div>
      <Header title="Nutrition & Goals" subtitle="Manage diet preferences, goals, and catalog filters (admin-controlled)" />
      <div className="p-6 space-y-6 max-w-3xl">
        {LISTS.map((cfg) => {
          const Icon = cfg.icon;
          const items = lists[cfg.key] || [];
          return (
            <div key={cfg.key} className="card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                  <Icon size={18} className="text-primary-600" /> {cfg.title}
                </h3>
                <span className="text-xs text-gray-400">{items.length} items</span>
              </div>
              <p className="text-xs text-gray-400">{cfg.hint}</p>

              <div className="space-y-2">
                {items.length === 0 && <p className="text-sm text-gray-400">No items. Add one below.</p>}
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {cfg.fields.map((f) => (
                      <input
                        key={f}
                        className={`input ${f === 'emoji' ? 'w-20 text-center' : 'flex-1'}`}
                        placeholder={f}
                        value={item[f] ?? ''}
                        onChange={(e) => updateItem(cfg.key, idx, f, e.target.value)}
                      />
                    ))}
                    <button
                      onClick={() => removeItem(cfg.key, idx)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg shrink-0"
                      title="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => addItem(cfg)} className="btn-secondary">
                  <Plus size={15} /> Add Item
                </button>
                <button
                  onClick={() => {
                    // Validate unique id/value before saving
                    const ids = items.map((i) => (i[cfg.idKey] || '').trim());
                    if (ids.some((v) => !v)) { toast.error(`Each item needs a "${cfg.idKey}" and label`); return; }
                    if (new Set(ids).size !== ids.length) { toast.error(`Duplicate "${cfg.idKey}" values`); return; }
                    saveMutation.mutate(cfg.key);
                  }}
                  disabled={saveMutation.isPending}
                  className="btn-primary"
                >
                  <Save size={15} /> Save {cfg.title}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
