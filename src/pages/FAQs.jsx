import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import Header from '../components/layout/Header';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import api from '../lib/api';
import toast from 'react-hot-toast';

async function fetchFaqs() {
  const res = await api.get('/config/faqs');
  return res.data?.data || [];
}

export default function FAQs() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editFaq, setEditFaq] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const { data: faqs = [], isLoading } = useQuery({ queryKey: ['faqs'], queryFn: fetchFaqs });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editFaq ? api.put(`/config/admin/faqs/${editFaq._id}`, data) : api.post('/config/admin/faqs', data),
    onSuccess: () => {
      toast.success(editFaq ? 'FAQ updated' : 'FAQ created');
      qc.invalidateQueries(['faqs']);
      setModalOpen(false);
      setEditFaq(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/config/admin/faqs/${id}`),
    onSuccess: () => {
      toast.success('FAQ deleted');
      qc.invalidateQueries(['faqs']);
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  // Group by category
  const grouped = faqs.reduce((acc, faq) => {
    const cat = faq.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(faq);
    return acc;
  }, {});

  return (
    <div>
      <Header title="FAQs" subtitle={`${faqs.length} questions`} />
      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          <button onClick={() => { setEditFaq(null); setModalOpen(true); }} className="btn-primary">
            <Plus size={16} /> Add FAQ
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : faqs.length === 0 ? (
          <div className="card"><EmptyState icon={HelpCircle} title="No FAQs yet" /></div>
        ) : (
          Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="card overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-700">{category}</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {items.map((faq) => (
                  <div key={faq._id}>
                    <div
                      className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => setExpanded(expanded === faq._id ? null : faq._id)}
                    >
                      <p className="text-sm font-medium text-gray-800 flex-1 pr-4">{faq.question}</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditFaq(faq); setModalOpen(true); }}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(faq); }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                        {expanded === faq._id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                      </div>
                    </div>
                    {expanded === faq._id && (
                      <div className="px-5 pb-4">
                        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditFaq(null); }} title={editFaq ? 'Edit FAQ' : 'Add FAQ'} size="lg">
        <FaqForm faq={editFaq} onSubmit={(d) => saveMutation.mutate(d)} loading={saveMutation.isPending} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
        loading={deleteMutation.isPending}
        title="Delete FAQ"
        message="Delete this FAQ?"
      />
    </div>
  );
}

function FaqForm({ faq, onSubmit, loading }) {
  const { register, handleSubmit } = useForm({
    defaultValues: faq || { isActive: true, order: 0 },
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Category *</label>
        <input className="input" placeholder="Getting Started" {...register('category', { required: true })} />
      </div>
      <div>
        <label className="label">Question *</label>
        <input className="input" {...register('question', { required: true })} />
      </div>
      <div>
        <label className="label">Answer *</label>
        <textarea className="input" rows={5} {...register('answer', { required: true })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Order</label>
          <input type="number" className="input" {...register('order')} />
        </div>
        <div className="flex items-center gap-2 pt-5">
          <input type="checkbox" id="faqActive" {...register('isActive')} className="rounded" />
          <label htmlFor="faqActive" className="text-sm">Active</label>
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? 'Saving…' : faq ? 'Update FAQ' : 'Create FAQ'}
      </button>
    </form>
  );
}
