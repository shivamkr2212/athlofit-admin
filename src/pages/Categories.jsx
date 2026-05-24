import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import { useForm } from 'react-hook-form';
import Header from '../components/layout/Header';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import api from '../lib/api';
import toast from 'react-hot-toast';

async function fetchCategories() {
  const res = await api.get('/shop/categories');
  return res.data?.data || [];
}

export default function Categories() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editCat
        ? api.put(`/admin/shop/categories/${editCat._id}`, data)
        : api.post('/admin/shop/categories', data),
    onSuccess: () => {
      toast.success(editCat ? 'Category updated' : 'Category created');
      qc.invalidateQueries(['categories']);
      setModalOpen(false);
      setEditCat(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/shop/categories/${id}`),
    onSuccess: () => {
      toast.success('Category deleted');
      qc.invalidateQueries(['categories']);
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  return (
    <div>
      <Header title="Categories" subtitle="Manage product categories" />
      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          <button onClick={() => { setEditCat(null); setModalOpen(true); }} className="btn-primary">
            <Plus size={16} /> Add Category
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : categories.length === 0 ? (
          <div className="card"><EmptyState icon={Tag} title="No categories yet" action={<button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={16} />Add Category</button>} /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((c) => (
              <div key={c._id} className="card p-5 flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ backgroundColor: c.color ? `${c.color}20` : '#f3f4f6' }}
                >
                  {c.icon || '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-400 truncate">{c.description || c.slug}</p>
                  {!c.isActive && <span className="badge bg-red-100 text-red-600 mt-1">Inactive</span>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditCat(c); setModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditCat(null); }} title={editCat ? 'Edit Category' : 'Add Category'}>
        <CategoryForm
          category={editCat}
          onSubmit={(data) => saveMutation.mutate(data)}
          loading={saveMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
        loading={deleteMutation.isPending}
        title="Delete Category"
        message={`Delete "${deleteTarget?.name}"?`}
      />
    </div>
  );
}

function CategoryForm({ category, onSubmit, loading }) {
  const { register, handleSubmit } = useForm({
    defaultValues: category || { isActive: true },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Name *</label>
        <input className="input" {...register('name', { required: true })} />
      </div>
      <div>
        <label className="label">Slug *</label>
        <input className="input" placeholder="e.g. protein-supplements" {...register('slug', { required: true })} />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input" rows={2} {...register('description')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Icon (emoji)</label>
          <input className="input text-2xl" placeholder="💊" {...register('icon')} />
        </div>
        <div>
          <label className="label">Color (hex)</label>
          <input className="input" placeholder="#3b82f6" {...register('color')} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="catActive" {...register('isActive')} className="rounded" />
        <label htmlFor="catActive" className="text-sm text-gray-700">Active</label>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? 'Saving…' : category ? 'Update' : 'Create'}
      </button>
    </form>
  );
}
