import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, MessageSquare } from 'lucide-react';
import Header from '../components/layout/Header';
import Spinner from '../components/ui/Spinner';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_COLORS = {
  open:        'bg-red-100 text-red-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved:    'bg-green-100 text-green-700',
  closed:      'bg-gray-100 text-gray-600',
};

async function fetchTickets({ page, status }) {
  const params = { page, limit: 20 };
  if (status) params.status = status;
  const res = await api.get('/config/admin/support-tickets', { params });
  return res.data?.data;
}

export default function Support() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', page, statusFilter],
    queryFn: () => fetchTickets({ page, status: statusFilter }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }) => api.patch(`/config/admin/support-tickets/${id}`, body),
    onSuccess: () => {
      toast.success('Ticket updated');
      qc.invalidateQueries(['tickets']);
      setSelectedTicket(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const tickets = data?.tickets || [];
  const pagination = data?.pagination;

  return (
    <div>
      <Header title="Support Tickets" subtitle={`${pagination?.total || 0} tickets`} />
      <div className="p-6 space-y-4">
        {/* Status Filter */}
        <div className="card p-4 flex gap-2 flex-wrap">
          {['', 'open', 'in_progress', 'resolved', 'closed'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s ? s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'All'}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : tickets.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No tickets found" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="table-th">User</th>
                    <th className="table-th">Subject</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Date</th>
                    <th className="table-th">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tickets.map((t) => (
                    <tr key={t._id} className="hover:bg-gray-50">
                      <td className="table-td">
                        <p className="font-medium text-gray-900">{t.name}</p>
                        <p className="text-xs text-gray-400">{t.email}</p>
                      </td>
                      <td className="table-td max-w-xs">
                        <p className="truncate text-gray-800">{t.subject}</p>
                      </td>
                      <td className="table-td">
                        <span className={`badge ${STATUS_COLORS[t.status] || 'bg-gray-100 text-gray-600'}`}>
                          {t.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="table-td text-xs text-gray-500">
                        {t.createdAt ? format(new Date(t.createdAt), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="table-td">
                        <button
                          onClick={() => setSelectedTicket(t)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"
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
                {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}
              </p>
              <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>

      {/* Ticket Detail Modal */}
      <Modal open={!!selectedTicket} onClose={() => setSelectedTicket(null)} title="Support Ticket" size="lg">
        {selectedTicket && (
          <TicketDetailView
            ticket={selectedTicket}
            onUpdate={(data) => updateMutation.mutate({ id: selectedTicket._id, ...data })}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>
    </div>
  );
}

function TicketDetailView({ ticket, onUpdate, loading }) {
  const [status, setStatus] = useState(ticket.status);
  const [adminNotes, setAdminNotes] = useState(ticket.adminNotes || '');

  return (
    <div className="space-y-5">
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-semibold text-gray-900">{ticket.name}</p>
            <p className="text-sm text-gray-500">{ticket.email}</p>
          </div>
          <span className={`badge ${STATUS_COLORS[ticket.status]}`}>{ticket.status?.replace('_', ' ')}</span>
        </div>
        <p className="text-xs text-gray-400">{ticket.createdAt ? format(new Date(ticket.createdAt), 'MMM d, yyyy HH:mm') : ''}</p>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 mb-1">Subject</p>
        <p className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3">{ticket.subject}</p>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 mb-1">Message</p>
        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{ticket.message}</p>
      </div>

      <div>
        <label className="label">Update Status</label>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div>
        <label className="label">Admin Notes</label>
        <textarea
          className="input"
          rows={3}
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Internal notes about this ticket…"
        />
      </div>

      <button
        onClick={() => onUpdate({ status, adminNotes })}
        disabled={loading}
        className="btn-primary w-full justify-center"
      >
        {loading ? 'Saving…' : 'Update Ticket'}
      </button>
    </div>
  );
}
