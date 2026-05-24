import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, FileText } from 'lucide-react';
import Header from '../components/layout/Header';
import Spinner from '../components/ui/Spinner';
import api from '../lib/api';
import toast from 'react-hot-toast';

async function fetchTerms() {
  const res = await api.get('/config/terms');
  return res.data?.data;
}

async function fetchPrivacy() {
  const res = await api.get('/config/privacy');
  return res.data?.data;
}

export default function Legal() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('terms');

  const { data: terms, isLoading: termsLoading } = useQuery({ queryKey: ['terms'], queryFn: fetchTerms });
  const { data: privacy, isLoading: privacyLoading } = useQuery({ queryKey: ['privacy'], queryFn: fetchPrivacy });

  const [termsContent, setTermsContent] = useState('');
  const [termsVersion, setTermsVersion] = useState('');
  const [privacyContent, setPrivacyContent] = useState('');
  const [privacyVersion, setPrivacyVersion] = useState('');

  useEffect(() => {
    if (terms) { setTermsContent(terms.content || ''); setTermsVersion(terms.version || ''); }
  }, [terms]);

  useEffect(() => {
    if (privacy) { setPrivacyContent(privacy.content || ''); setPrivacyVersion(privacy.version || ''); }
  }, [privacy]);

  const termsMutation = useMutation({
    mutationFn: () => api.put('/config/terms', { content: termsContent, version: termsVersion }),
    onSuccess: () => { toast.success('Terms updated'); qc.invalidateQueries(['terms']); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const privacyMutation = useMutation({
    mutationFn: () => api.put('/config/privacy', { content: privacyContent, version: privacyVersion }),
    onSuccess: () => { toast.success('Privacy policy updated'); qc.invalidateQueries(['privacy']); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const isLoading = tab === 'terms' ? termsLoading : privacyLoading;

  return (
    <div>
      <Header title="Legal Content" subtitle="Manage Terms & Conditions and Privacy Policy" />
      <div className="p-6 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {[
            { key: 'terms', label: '📄 Terms & Conditions' },
            { key: 'privacy', label: '🔒 Privacy Policy' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : (
          <div className="card p-6 space-y-4 max-w-4xl">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="label">Version</label>
                <input
                  className="input w-32"
                  value={tab === 'terms' ? termsVersion : privacyVersion}
                  onChange={(e) => tab === 'terms' ? setTermsVersion(e.target.value) : setPrivacyVersion(e.target.value)}
                  placeholder="1.0"
                />
              </div>
              <div className="text-xs text-gray-400 flex items-center gap-1 mt-5">
                <FileText size={14} />
                Supports Markdown formatting
              </div>
            </div>

            <div>
              <label className="label">Content (Markdown)</label>
              <textarea
                className="input font-mono text-xs"
                rows={24}
                value={tab === 'terms' ? termsContent : privacyContent}
                onChange={(e) => tab === 'terms' ? setTermsContent(e.target.value) : setPrivacyContent(e.target.value)}
                placeholder="# Title&#10;&#10;Content here..."
              />
            </div>

            <button
              onClick={() => tab === 'terms' ? termsMutation.mutate() : privacyMutation.mutate()}
              disabled={termsMutation.isPending || privacyMutation.isPending}
              className="btn-primary"
            >
              <Save size={16} />
              {termsMutation.isPending || privacyMutation.isPending ? 'Saving…' : `Save ${tab === 'terms' ? 'Terms' : 'Privacy Policy'}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
