import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Ticket, CheckCircle, XCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import Header from '../components/layout/Header';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

async function fetchCoupons() {
  const res = await api.get('/admin/shop/coupons');
  return res.data?.data || [];
}

export default function Coupons() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['coupons'],
    queryFn: fetchCoupons,
  });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editCoupon
        ? api.put(`/admin/shop/coupons/${editCoupon._id}`, data)
        : api.post('/admin/shop/coupons', data),
    onSuccess: () => {
      toast.success(editCoupon ? 'Coupon updated' : 'Coupon created');
      qc.invalidateQueries(['coupons']);
      setModalOpen(false);
      setEditCoupon(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/shop/coupons/${id}`),
    onSuccess: () => {
      toast.success('Coupon deleted');
      qc.invalidateQueries(['coupons']);
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  return (
    <div>
      <Header title="Coupons" subtitle={`${coupons.length} coupons`} />
      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          <button onClick={() => { setEditCoupon(null); setModalOpen(true); }} className="btn-primary">
            <Plus size={16} /> Create Coupon
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : coupons.length === 0 ? (
          <div className="card"><EmptyState icon={Ticket} title="No coupons yet" /></div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="table-th">Code</th>
                    <th className="table-th">Type</th>
                    <th className="table-th">Discount</th>
                    <th className="table-th">Usage</th>
                    <th className="table-th">Valid Until</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {coupons.map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50">
                      <td className="table-td">
                        <span className="font-mono font-bold text-primary-700 bg-primary-50 px-2 py-1 rounded">{c.code}</span>
                      </td>
                      <td className="table-td text-xs capitalize">{c.discountType?.replace('_', ' ')}</td>
                      <td className="table-td font-semibold">
                        {c.discountType === 'percentage' ? `${c.discountValue}%` : `${c.discountValue} coins`}
                        {c.maxDiscountCoins && <span className="text-xs text-gray-400 ml-1">(max {c.maxDiscountCoins})</span>}
                      </td>
                      <td className="table-td text-sm">
                        {c.usageCount} / {c.usageLimit ?? '∞'}
                      </td>
                      <td className="table-td text-xs text-gray-500">
                        {c.validUntil ? format(new Date(c.validUntil), 'MMM d, yyyy') : 'No expiry'}
                      </td>
                      <td className="table-td">
                        {c.isActive ? (
                          <span className="badge bg-green-100 text-green-700"><CheckCircle size={10} className="mr-1" />Active</span>
                        ) : (
                          <span className="badge bg-red-100 text-red-600"><XCircle size={10} className="mr-1" />Inactive</span>
                        )}
                      </td>
                      <td className="table-td">
                        <div className="flex gap-2">
                          <button onClick={() => { setEditCoupon(c); setModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600">
                            <Edit2 size={15} />
                          </button>
                          <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditCoupon(null); }} title={editCoupon ? 'Edit Coupon' : 'Create Coupon'} size="lg">
        <CouponForm coupon={editCoupon} onSubmit={(d) => saveMutation.mutate(d)} loading={saveMutation.isPending} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
        loading={deleteMutation.isPending}
        title="Delete Coupon"
        message={`Delete coupon "${deleteTarget?.code}"?`}
      />
    </div>
  );
}

function CouponForm({ coupon, onSubmit, loading }) {
  const { register, handleSubmit, watch } = useForm({
    defaultValues: coupon ? {
      ...coupon,
      validFrom: coupon.validFrom ? coupon.validFrom.slice(0, 10) : '',
      validUntil: coupon.validUntil ? coupon.validUntil.slice(0, 10) : '',
    } : { isActive: true, discountType: 'percentage', perUserLimit: 1, minCartCoins: 0 },
  });

  const discountType = watch('discountType');

  const submit = (data) => {
    const payload = {
      ...data,
      discountValue: Number(data.discountValue),
      maxDiscountCoins: data.maxDiscountCoins ? Number(data.maxDiscountCoins) : null,
      minCartCoins: Number(data.minCartCoins || 0),
      usageLimit: data.usageLimit ? Number(data.usageLimit) : null,
      perUserLimit: Number(data.perUserLimit || 1),
      validFrom: data.validFrom || undefined,
      validUntil: data.validUntil || null,
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Code *</label>
          <input className="input uppercase" placeholder="SAVE20" {...register('code', { required: true })} />
        </div>
        <div>
          <label className="label">Discount Type *</label>
          <select className="input" {...register('discountType', { required: true })}>
            <option value="percentage">Percentage</option>
            <option value="flat_coins">Flat Coins</option>
          </select>
        </div>
        <div>
          <label className="label">{discountType === 'percentage' ? 'Discount %' : 'Coins Off'} *</label>
          <input type="number" className="input" {...register('discountValue', { required: true, min: 0 })} />
        </div>
        {discountType === 'percentage' && (
          <div>
            <label className="label">Max Discount (coins)</label>
            <input type="number" className="input" placeholder="Optional cap" {...register('maxDiscountCoins')} />
          </div>
        )}
        <div>
          <label className="label">Min Cart (coins)</label>
          <input type="number" className="input" {...register('minCartCoins')} />
        </div>
        <div>
          <label className="label">Usage Limit</label>
          <input type="number" className="input" placeholder="Leave blank for unlimited" {...register('usageLimit')} />
        </div>
        <div>
          <label className="label">Per User Limit</label>
          <input type="number" className="input" {...register('perUserLimit')} />
        </div>
        <div>
          <label className="label">Valid From</label>
          <input type="date" className="input" {...register('validFrom')} />
        </div>
        <div>
          <label className="label">Valid Until</label>
          <input type="date" className="input" {...register('validUntil')} />
        </div>
        <div className="col-span-2">
          <label className="label">Description</label>
          <input className="input" {...register('description')} />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="couponActive" {...register('isActive')} className="rounded" />
          <label htmlFor="couponActive" className="text-sm text-gray-700">Active</label>
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? 'Saving…' : coupon ? 'Update Coupon' : 'Create Coupon'}
      </button>
    </form>
  );
}
