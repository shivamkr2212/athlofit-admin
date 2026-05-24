import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, Package, Filter } from 'lucide-react';
import Header from '../components/layout/Header';
import Spinner from '../components/ui/Spinner';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_COLORS = {
  PENDING:   'bg-yellow-100 text-yellow-700',
  PAID:      'bg-blue-100 text-blue-700',
  SHIPPED:   'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-600',
};

const STATUS_FLOW = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED'];

async function fetchOrders({ page, limit, status }) {
  const params = { page, limit };
  if (status) params.status = status;
  const res = await api.get('/admin/shop/orders', { params });
  return res.data?.data;
}

export default function Orders() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, statusFilter],
    queryFn: () => fetchOrders({ page, limit: 20, status: statusFilter }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/admin/shop/orders/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('Order status updated');
      qc.invalidateQueries(['orders']);
      setSelectedOrder(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update'),
  });

  const orders = data?.orders || [];
  const pagination = data?.pagination;

  return (
    <div>
      <Header title="Orders" subtitle={`${pagination?.total || 0} total orders`} />
      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="card p-4 flex gap-3 items-center">
          <Filter size={16} className="text-gray-400" />
          <span className="text-sm text-gray-600 font-medium">Status:</span>
          {['', 'PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : orders.length === 0 ? (
            <EmptyState icon={Package} title="No orders found" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="table-th">Order ID</th>
                    <th className="table-th">Customer</th>
                    <th className="table-th">Items</th>
                    <th className="table-th">Total Coins</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Date</th>
                    <th className="table-th">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((o) => (
                    <tr key={o._id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-td font-mono text-xs font-medium text-gray-700">
                        #{o._id.slice(-8).toUpperCase()}
                      </td>
                      <td className="table-td">
                        <div>
                          <p className="font-medium text-gray-900">{o.user?.name || '—'}</p>
                          <p className="text-xs text-gray-400">{o.user?.email || '—'}</p>
                        </div>
                      </td>
                      <td className="table-td text-gray-600">{o.items?.length || 0} item(s)</td>
                      <td className="table-td font-semibold text-yellow-600">{o.totalCoins?.toLocaleString()}</td>
                      <td className="table-td">
                        <span className={`badge ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600'}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="table-td text-xs text-gray-500">
                        {o.createdAt ? format(new Date(o.createdAt), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="table-td">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {pagination && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}
              </p>
              <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      <Modal open={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Order Details" size="lg">
        {selectedOrder && (
          <OrderDetailView
            order={selectedOrder}
            onUpdateStatus={(status) => updateStatusMutation.mutate({ id: selectedOrder._id, status })}
            loading={updateStatusMutation.isPending}
          />
        )}
      </Modal>
    </div>
  );
}

function OrderDetailView({ order, onUpdateStatus, loading }) {
  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">Order ID</p>
          <p className="font-mono font-bold text-gray-900">#{order._id.slice(-8).toUpperCase()}</p>
        </div>
        <span className={`badge text-sm px-3 py-1 ${STATUS_COLORS[order.status]}`}>{order.status}</span>
      </div>

      {/* Customer */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Customer</h4>
        <p className="text-sm text-gray-800">{order.user?.name || '—'}</p>
        <p className="text-xs text-gray-500">{order.user?.email || '—'}</p>
      </div>

      {/* Items */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Items</h4>
        <div className="space-y-2">
          {order.items?.map((item, i) => (
            <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <div>
                <p className="text-sm font-medium text-gray-800">{item.name}</p>
                <p className="text-xs text-gray-400">Qty: {item.quantity} × {item.coinPrice} coins</p>
              </div>
              <p className="text-sm font-bold text-yellow-600">{(item.coinPrice * item.quantity).toLocaleString()} coins</p>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="bg-yellow-50 rounded-xl p-4 flex justify-between items-center">
        <span className="font-semibold text-gray-700">Total</span>
        <span className="text-xl font-bold text-yellow-600">{order.totalCoins?.toLocaleString()} coins</span>
      </div>

      {/* Shipping */}
      {order.shippingAddress && (
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-1">Shipping Address</h4>
          <p className="text-sm text-gray-600">
            {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
          </p>
        </div>
      )}

      {/* Status Update */}
      {nextStatus && order.status !== 'CANCELLED' && (
        <button
          onClick={() => onUpdateStatus(nextStatus)}
          disabled={loading}
          className="btn-primary w-full justify-center"
        >
          {loading ? 'Updating…' : `Mark as ${nextStatus}`}
        </button>
      )}
    </div>
  );
}
