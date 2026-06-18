import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, FileText } from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';
import TurndownService from 'turndown';
import Header from '../components/layout/Header';
import Spinner from '../components/ui/Spinner';
import { configService } from '../services/config.service';
import toast from 'react-hot-toast';

// Converts pasted rich-text/HTML (e.g. from a PDF or Word) into Markdown.
const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
});

// All legal document types (must match backend LegalContent enum).
const LEGAL_TYPES = [
  { key: 'terms', label: '📄 Terms & Conditions' },
  { key: 'privacy', label: '🔒 Privacy Policy' },
  { key: 'coin-earning', label: '🪙 Coin Earning & Rewards' },
  { key: 'coin-redemption', label: '🎁 Coin Redemption' },
  { key: 'community-guidelines', label: '👥 Community Guidelines' },
  { key: 'data-deletion', label: '🗑️ Data Deletion' },
  { key: 'medical-disclaimer', label: '⚕️ Medical Disclaimer' },
  { key: 'refund', label: '💳 Refund Policy' },
];

export default function Legal() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('terms');
  const [content, setContent] = useState('');
  const [version, setVersion] = useState('');
  const [title, setTitle] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ['legal', tab],
    queryFn: () => configService.getLegal(tab),
  });

  const doc = data?.data;

  useEffect(() => {
    if (doc) {
      setContent(doc.content || '');
      setVersion(doc.version || '1.0');
      setTitle(doc.title || '');
      setIsPublished(doc.isPublished !== false);
    }
  }, [doc]);

  const mutation = useMutation({
    mutationFn: () => configService.updateLegal(tab, { content, version, title, isPublished }),
    onSuccess: () => {
      toast.success('Document saved');
      qc.invalidateQueries(['legal', tab]);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  // Intercept paste: if the clipboard holds rich text/HTML (from a PDF, Word, web
  // page, etc.) convert it to Markdown so formatting like headings, bold and lists
  // is preserved instead of being flattened into a plain paragraph.
  const handlePaste = (e) => {
    const html = e.clipboardData?.getData('text/html');
    if (!html) return; // plain-text paste — let the editor handle it normally

    e.preventDefault();
    const markdown = turndown.turndown(html).trim();

    const textarea = e.target;
    const start = textarea.selectionStart ?? content.length;
    const end = textarea.selectionEnd ?? content.length;
    const next = content.slice(0, start) + markdown + content.slice(end);
    setContent(next);
  };

  return (
    <div>
      <Header title="Legal & Policies" subtitle="Manage all legal documents shown on the website" />
      <div className="p-6 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl flex-wrap">
          {LEGAL_TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Title</label>
                <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Document title" />
              </div>
              <div>
                <label className="label">Version</label>
                <input className="input w-32" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input type="checkbox" id="legalPublished" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="w-4 h-4 rounded accent-primary-600" />
                <label htmlFor="legalPublished" className="text-sm text-gray-700">Published (visible on website)</label>
              </div>
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <FileText size={14} /> Supports Markdown formatting
              </div>
            </div>

            <div>
              <label className="label">Content (Markdown)</label>
              <div data-color-mode="light">
                <MDEditor
                  value={content}
                  onChange={(val) => setContent(val || '')}
                  height={500}
                  preview="live"
                  textareaProps={{
                    placeholder: '# Title\n\nContent here…',
                    onPaste: handlePaste,
                  }}
                />
              </div>
            </div>

            <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !content} className="btn-primary">
              <Save size={16} /> {mutation.isPending ? 'Saving…' : 'Save Document'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
