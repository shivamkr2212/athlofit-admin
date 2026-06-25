import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Search, Star, Package, X, Layers } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import Header from '../components/layout/Header';
import Spinner from '../components/ui/Spinner';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import ImageUploader from '../components/ui/ImageUploader';
import api from '../lib/api';
import toast from 'react-hot-toast';

async function fetchProducts({ page, search, category }) {
  const params = { page, limit: 20 };
  if (search) params.search = search;
  if (category) params.category = category;
  const res = await api.get('/shop/products', { params });
  return res.data?.data;
}

async function fetchCategories() {
  const res = await api.get('/shop/categories');
  return res.data?.data || [];
}

export default function Products() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search, categoryFilter],
    queryFn: () => fetchProducts({ page, search, category: categoryFilter }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const saveMutation = useMutation({
    mutationFn: (formData) =>
      editProduct
        ? api.put(`/admin/shop/products/${editProduct._id}`, formData)
        : api.post('/admin/shop/products', formData),
    onSuccess: () => {
      toast.success(editProduct ? 'Product updated' : 'Product created');
      qc.invalidateQueries(['products']);
      setModalOpen(false);
      setEditProduct(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/shop/products/${id}`),
    onSuccess: () => {
      toast.success('Product deleted');
      qc.invalidateQueries(['products']);
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const openCreate = () => { setEditProduct(null); setModalOpen(true); };
  const openEdit = (p) => { setEditProduct(p); setModalOpen(true); };

  const products = data?.products || [];
  const pagination = data?.pagination;

  return (
    <div>
      <Header title="Products" subtitle={`${pagination?.total || 0} products`} />
      <div className="p-6 space-y-4">
        {/* Toolbar */}
        <div className="card p-4 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-3 flex-1 min-w-0">
            <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="flex gap-2 flex-1 min-w-48">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="input pl-9" placeholder="Search products…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
              </div>
              <button type="submit" className="btn-secondary">Search</button>
            </form>
            <select className="input w-40" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c._id} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
          <button onClick={openCreate} className="btn-primary shrink-0">
            <Plus size={16} /> Add Product
          </button>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : products.length === 0 ? (
          <div className="card"><EmptyState icon={Package} title="No products found" action={<button onClick={openCreate} className="btn-primary"><Plus size={16} />Add Product</button>} /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((p) => (
              <div key={p._id} className="card overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-square bg-gray-100 relative">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={40} className="text-gray-300" />
                    </div>
                  )}
                  {p.isFeatured && (
                    <span className="absolute top-2 left-2 badge bg-yellow-400 text-yellow-900">Featured</span>
                  )}
                  {!p.isActive && (
                    <span className="absolute top-2 right-2 badge bg-red-100 text-red-600">Inactive</span>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.category?.name}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-gray-600">{p.rating?.toFixed(1)} ({p.reviewCount})</span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="font-bold text-gray-900">₹{p.discountedPrice ?? p.price}</p>
                      {p.discountedPrice && <p className="text-xs text-gray-400 line-through">₹{p.price}</p>}
                    </div>
                    <p className="text-xs text-gray-500">Stock: {p.stock}</p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => openEdit(p)} className="btn-secondary flex-1 justify-center py-1.5 text-xs">
                      <Edit2 size={13} /> Edit
                    </button>
                    <button onClick={() => setDeleteTarget(p)} className="btn-danger flex-1 justify-center py-1.5 text-xs">
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination && (
          <div className="flex justify-center">
            <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditProduct(null); }} title={editProduct ? 'Edit Product' : 'Add Product'} size="lg">
        <ProductForm
          product={editProduct}
          categories={categories}
          onSubmit={(data) => saveMutation.mutate(data)}
          loading={saveMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
        loading={deleteMutation.isPending}
        title="Delete Product"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
      />
    </div>
  );
}

function ProductForm({ product, categories, onSubmit, loading }) {
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: product ? {
      name: product.name,
      description: product.description,
      price: product.price,
      discountedPrice: product.discountedPrice || '',
      stock: product.stock,
      category: product.category?._id || product.category,
      tags: product.tags?.join(', ') || '',
      isFeatured: product.isFeatured,
      isActive: product.isActive,
      images: product.images || [],
      coinReward: product.coinReward || 0,
      variants: product.variants || [],
    } : { isActive: true, isFeatured: false, stock: 0, coinReward: 0, images: [], variants: [] },
  });

  const submit = (data) => {
    const variants = (data.variants || [])
      .map((v) => ({
        size: v.size || '',
        color: v.color || '',
        stock: Number(v.stock) || 0,
        sku: v.sku || '',
        priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
      }))
      .filter((v) => v.size || v.color || v.stock || v.sku);

    const payload = {
      ...data,
      price: Number(data.price),
      discountedPrice: data.discountedPrice ? Number(data.discountedPrice) : null,
      stock: Number(data.stock),
      coinReward: Number(data.coinReward),
      tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      images: Array.isArray(data.images) ? data.images : [],
      variants,
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Product Name *</label>
          <input className="input" {...register('name', { required: true })} />
        </div>
        <div className="col-span-2">
          <label className="label">Description *</label>
          <textarea className="input" rows={3} {...register('description', { required: true })} />
        </div>
        <div>
          <label className="label">Price (₹) *</label>
          <input type="number" step="0.01" className="input" {...register('price', { required: true, min: 0 })} />
        </div>
        <div>
          <label className="label">Discounted Price (₹)</label>
          <input type="number" step="0.01" className="input" {...register('discountedPrice')} />
        </div>
        <div>
          <label className="label">Stock *</label>
          <input type="number" className="input" {...register('stock', { required: true, min: 0 })} />
        </div>
        <div>
          <label className="label">Coin Reward</label>
          <input type="number" className="input" {...register('coinReward', { min: 0 })} />
        </div>
        <div className="col-span-2">
          <label className="label">Category *</label>
          <select className="input" {...register('category', { required: true })}>
            <option value="">Select category</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <Controller
            control={control}
            name="images"
            render={({ field }) => (
              <ImageUploader
                label="Product Images"
                folder="products"
                multiple
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>
        <div className="col-span-2">
          <label className="label">Tags (comma separated)</label>
          <input className="input" placeholder="protein, supplement, fitness" {...register('tags')} />
        </div>
        <div className="col-span-2">
          <Controller
            control={control}
            name="variants"
            render={({ field }) => (
              <VariantsEditor value={field.value || []} onChange={field.onChange} />
            )}
          />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="isFeatured" {...register('isFeatured')} className="rounded" />
          <label htmlFor="isFeatured" className="text-sm text-gray-700">Featured product</label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="isActive" {...register('isActive')} className="rounded" />
          <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
          {loading ? 'Saving…' : product ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
}

const SIZE_OPTIONS = ['', 'S', 'M', 'L', 'XL', 'XXL'];
const COLOR_PRESETS = ['black', 'white', 'red', 'green', 'yellow'];

function VariantsEditor({ value, onChange }) {
  const variants = Array.isArray(value) ? value : [];

  const addRow = () => onChange([...variants, { size: '', color: '', stock: 0, sku: '', priceOverride: '' }]);
  const updateRow = (idx, field, val) =>
    onChange(variants.map((v, i) => (i === idx ? { ...v, [field]: val } : v)));
  const removeRow = (idx) => onChange(variants.filter((_, i) => i !== idx));

  const totalStock = variants.reduce((s, v) => s + (Number(v.stock) || 0), 0);

  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <label className="label mb-0 flex items-center gap-1.5"><Layers size={14} /> Variants (size / colour)</label>
        {variants.length > 0 && <span className="text-xs text-gray-400">Total stock: {totalStock}</span>}
      </div>
      <p className="text-xs text-gray-400 mb-3">
        Add variants if this product comes in sizes/colours. Stock is tracked per variant and the
        product&apos;s total stock is the sum. Leave empty for a simple product (uses the Stock field above).
      </p>

      {variants.length > 0 && (
        <div className="space-y-2 mb-3">
          <div className="grid grid-cols-[90px_1fr_80px_1fr_90px_32px] gap-2 text-[11px] text-gray-400 font-medium px-1">
            <span>Size</span><span>Colour</span><span>Stock</span><span>SKU</span><span>₹ Override</span><span />
          </div>
          {variants.map((v, idx) => (
            <div key={idx} className="grid grid-cols-[90px_1fr_80px_1fr_90px_32px] gap-2 items-center">
              <select className="input py-1.5 text-sm" value={v.size || ''} onChange={(e) => updateRow(idx, 'size', e.target.value)}>
                {SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s || '—'}</option>)}
              </select>
              <input
                className="input py-1.5 text-sm"
                list={`colors-${idx}`}
                placeholder="colour or custom"
                value={v.color || ''}
                onChange={(e) => updateRow(idx, 'color', e.target.value)}
              />
              <datalist id={`colors-${idx}`}>
                {COLOR_PRESETS.map((c) => <option key={c} value={c} />)}
              </datalist>
              <input type="number" min="0" className="input py-1.5 text-sm" value={v.stock ?? 0} onChange={(e) => updateRow(idx, 'stock', e.target.value)} />
              <input className="input py-1.5 text-sm" placeholder="optional" value={v.sku || ''} onChange={(e) => updateRow(idx, 'sku', e.target.value)} />
              <input type="number" min="0" className="input py-1.5 text-sm" placeholder="—" value={v.priceOverride ?? ''} onChange={(e) => updateRow(idx, 'priceOverride', e.target.value)} />
              <button type="button" onClick={() => removeRow(idx)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={addRow} className="btn-secondary text-xs py-1.5">
        <Plus size={14} /> Add Variant
      </button>
    </div>
  );
}
