import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { Plus, Edit2, Trash2, Search, Upload, FileSpreadsheet, Eye, EyeOff } from 'lucide-react';
import Header from '../components/layout/Header';
import Spinner from '../components/ui/Spinner';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import ImageUploader from '../components/ui/ImageUploader';
import api from '../lib/api';
import toast from 'react-hot-toast';

async function fetchFoods({ page, search, dietType, category }) {
  const params = { page, limit: 50 };
  if (search) params.search = search;
  if (dietType) params.dietType = dietType;
  if (category) params.category = category;
  const res = await api.get('/admin/foods', { params });
  return res.data?.data;
}

const DIET_TYPES = ['', 'veg', 'non-veg', 'vegan'];
const CATEGORIES = ['', 'breakfast', 'lunch', 'dinner', 'snacks'];

export default function Foods() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [dietFilter, setDietFilter] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editFood, setEditFood] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-foods', page, search, dietFilter, catFilter],
    queryFn: () => fetchFoods({ page, search, dietType: dietFilter, category: catFilter }),
  });

  const foods = data?.foods || [];
  const pagination = data?.pagination;

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editFood ? api.put(`/admin/foods/${editFood._id}`, payload) : api.post('/admin/foods', payload),
    onSuccess: () => {
      toast.success(editFood ? 'Food updated' : 'Food created');
      qc.invalidateQueries(['admin-foods']);
      setModalOpen(false);
      setEditFood(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/foods/${id}`),
    onSuccess: () => { toast.success('Food deleted'); qc.invalidateQueries(['admin-foods']); setDeleteTarget(null); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => api.patch(`/admin/foods/${id}/toggle`),
    onSuccess: () => { toast.success('Toggled'); qc.invalidateQueries(['admin-foods']); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  return (
    <div>
      <Header title="Food Catalog" subtitle={`${pagination?.total || 0} food items`} />
      <div className="p-6 space-y-4">
        {/* Toolbar */}
        <div className="card p-4 flex flex-wrap gap-3 items-center">
          <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="flex gap-2 flex-1 min-w-48">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="input pl-9" placeholder="Search food…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
            </div>
            <button type="submit" className="btn-secondary">Search</button>
          </form>
          <select className="input w-28" value={dietFilter} onChange={(e) => { setDietFilter(e.target.value); setPage(1); }}>
            <option value="">All Diet</option>
            {DIET_TYPES.filter(Boolean).map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="input w-32" value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}>
            <option value="">All Meals</option>
            {CATEGORIES.filter(Boolean).map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
          <button onClick={() => setUploadModalOpen(true)} className="btn-secondary shrink-0">
            <Upload size={15} /> Bulk Upload
          </button>
          <button onClick={() => { setEditFood(null); setModalOpen(true); }} className="btn-primary shrink-0">
            <Plus size={16} /> Add Food
          </button>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : foods.length === 0 ? (
            <EmptyState icon={FileSpreadsheet} title="No food items" description="Upload a CSV or add items manually." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="table-th">Name</th>
                    <th className="table-th">Cal</th>
                    <th className="table-th">P</th>
                    <th className="table-th">C</th>
                    <th className="table-th">F</th>
                    <th className="table-th">Serving</th>
                    <th className="table-th">Diet</th>
                    <th className="table-th">Meal</th>
                    <th className="table-th">Active</th>
                    <th className="table-th">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {foods.map((f) => (
                    <tr key={f._id} className={`hover:bg-gray-50 ${!f.isActive ? 'opacity-50' : ''}`}>
                      <td className="table-td font-medium text-gray-900 max-w-[200px] truncate">{f.name}</td>
                      <td className="table-td">{f.calories}</td>
                      <td className="table-td">{f.protein}g</td>
                      <td className="table-td">{f.carbs}g</td>
                      <td className="table-td">{f.fat}g</td>
                      <td className="table-td">{f.servingSize}{f.servingUnit}</td>
                      <td className="table-td"><span className="badge bg-gray-100 text-gray-600 text-xs">{f.dietType}</span></td>
                      <td className="table-td capitalize text-xs text-gray-500">{f.category}</td>
                      <td className="table-td">
                        <button onClick={() => toggleMutation.mutate(f._id)} className="p-1">
                          {f.isActive ? <Eye size={14} className="text-green-600" /> : <EyeOff size={14} className="text-gray-400" />}
                        </button>
                      </td>
                      <td className="table-td">
                        <div className="flex gap-1">
                          <button onClick={() => { setEditFood(f); setModalOpen(true); }} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded"><Edit2 size={14} /></button>
                          <button onClick={() => setDeleteTarget(f)} className="p-1.5 hover:bg-red-50 text-red-500 rounded"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {pagination?.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex justify-center">
              <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditFood(null); }} title={editFood ? 'Edit Food' : 'Add Food'} size="lg">
        <FoodForm food={editFood} onSubmit={(d) => saveMutation.mutate(d)} loading={saveMutation.isPending} />
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal open={uploadModalOpen} onClose={() => setUploadModalOpen(false)} title="Bulk Upload Foods (CSV)" size="md">
        <BulkUploadForm onDone={() => { setUploadModalOpen(false); qc.invalidateQueries(['admin-foods']); }} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
        loading={deleteMutation.isPending}
        title="Delete Food"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
      />
    </div>
  );
}

function FoodForm({ food, onSubmit, loading }) {
  const { register, handleSubmit, control } = useForm({
    defaultValues: food ? {
      name: food.name, description: food.description || '', calories: food.calories,
      protein: food.protein, carbs: food.carbs, fat: food.fat, fiber: food.fiber || '',
      sugar: food.sugar || '', servingSize: food.servingSize, servingUnit: food.servingUnit,
      dietType: food.dietType, category: food.category, imageUrl: food.imageUrl || '',
    } : { servingSize: 100, servingUnit: 'g' },
  });

  const submit = (data) => {
    onSubmit({
      ...data,
      calories: Number(data.calories),
      protein: Number(data.protein),
      carbs: Number(data.carbs),
      fat: Number(data.fat),
      fiber: data.fiber ? Number(data.fiber) : null,
      sugar: data.sugar ? Number(data.sugar) : null,
      servingSize: Number(data.servingSize),
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div>
        <label className="label">Name *</label>
        <input className="input" {...register('name', { required: true })} placeholder="e.g. Paneer Tikka" />
      </div>
      <div className="grid grid-cols-4 gap-3">
        <div><label className="label">Calories *</label><input type="number" className="input" {...register('calories', { required: true })} /></div>
        <div><label className="label">Protein (g) *</label><input type="number" step="0.1" className="input" {...register('protein', { required: true })} /></div>
        <div><label className="label">Carbs (g) *</label><input type="number" step="0.1" className="input" {...register('carbs', { required: true })} /></div>
        <div><label className="label">Fat (g) *</label><input type="number" step="0.1" className="input" {...register('fat', { required: true })} /></div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <div><label className="label">Fiber (g)</label><input type="number" step="0.1" className="input" {...register('fiber')} /></div>
        <div><label className="label">Sugar (g)</label><input type="number" step="0.1" className="input" {...register('sugar')} /></div>
        <div><label className="label">Serving Size *</label><input type="number" className="input" {...register('servingSize', { required: true })} /></div>
        <div>
          <label className="label">Unit *</label>
          <select className="input" {...register('servingUnit', { required: true })}>
            <option value="g">g</option>
            <option value="ml">ml</option>
            <option value="serving">serving</option>
            <option value="piece">piece</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Diet Type *</label>
          <select className="input" {...register('dietType', { required: true })}>
            <option value="">Select</option>
            <option value="veg">Veg</option>
            <option value="non-veg">Non-Veg</option>
            <option value="vegan">Vegan</option>
          </select>
        </div>
        <div>
          <label className="label">Meal Category *</label>
          <select className="input" {...register('category', { required: true })}>
            <option value="">Select</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snacks">Snacks</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Description (optional)</label>
        <input className="input" {...register('description')} />
      </div>
      <div>
        <Controller
          control={control}
          name="imageUrl"
          render={({ field }) => (
            <ImageUploader
              label="Food Image (optional)"
              folder="misc"
              value={field.value || ''}
              onChange={field.onChange}
            />
          )}
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? 'Saving…' : food ? 'Update Food' : 'Create Food'}
      </button>
    </form>
  );
}

function BulkUploadForm({ onDone }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpload = async () => {
    if (!file) { toast.error('Select a file first'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/admin/foods/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data?.data);
      toast.success('Upload complete');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-green-50 rounded-lg p-3"><p className="text-2xl font-bold text-green-700">{result.created}</p><p className="text-xs text-green-600">Created</p></div>
          <div className="bg-blue-50 rounded-lg p-3"><p className="text-2xl font-bold text-blue-700">{result.updated}</p><p className="text-xs text-blue-600">Updated</p></div>
          <div className="bg-yellow-50 rounded-lg p-3"><p className="text-2xl font-bold text-yellow-700">{result.skipped}</p><p className="text-xs text-yellow-600">Skipped</p></div>
        </div>
        {result.errors?.length > 0 && (
          <div className="bg-red-50 rounded-lg p-3 max-h-40 overflow-y-auto">
            <p className="text-xs font-semibold text-red-700 mb-1">Errors (first 20):</p>
            {result.errors.map((e, i) => <p key={i} className="text-xs text-red-600">{e}</p>)}
          </div>
        )}
        <button onClick={onDone} className="btn-primary w-full justify-center">Done</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-2">
        <p className="font-semibold text-gray-800">Supported formats: CSV, XLSX, XLS</p>
        <p className="text-xs text-gray-500">Required columns (first row must be headers):</p>
        <code className="block text-xs bg-white p-2 rounded border border-gray-200 overflow-x-auto">
          name, calories, protein, carbs, fat, dietType, category
        </code>
        <p className="text-xs text-gray-500">Optional: fiber (or fibre), sugar, servingSize, servingUnit, description, imageUrl</p>
        <p className="text-xs text-gray-500">• dietType: <code>veg</code> | <code>non-veg</code> | <code>vegan</code></p>
        <p className="text-xs text-gray-500">• category: <code>breakfast</code> | <code>lunch</code> | <code>dinner</code> | <code>snacks</code></p>
        <p className="text-xs text-gray-500">• Duplicate names are updated (upsert), not duplicated.</p>
        <p className="text-xs text-gray-500">• Excel files use the first sheet only.</p>
      </div>
      <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
        <FileSpreadsheet size={32} className="mx-auto text-gray-300 mb-2" />
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => setFile(e.target.files[0])}
          className="text-sm text-gray-500"
        />
      </div>
      {file && <p className="text-sm text-gray-600">📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
      <button onClick={handleUpload} disabled={loading || !file} className="btn-primary w-full justify-center">
        <Upload size={15} /> {loading ? 'Uploading…' : 'Upload & Import'}
      </button>
    </div>
  );
}
