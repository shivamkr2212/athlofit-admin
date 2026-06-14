import { useState, useEffect, lazy, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Save, Trash2, Edit, Eye, EyeOff, ArrowLeft, FileText } from 'lucide-react';
import Header from '../components/layout/Header';
import Spinner from '../components/ui/Spinner';
import ImageUploader from '../components/ui/ImageUploader';
import { blogService } from '../services/blog.service';
import toast from 'react-hot-toast';
import '@uiw/react-md-editor/markdown-editor.css';

// Lazy-load the markdown editor to keep it out of the main bundle.
const MDEditor = lazy(() => import('@uiw/react-md-editor'));

const EMPTY = {
  title: '', excerpt: '', content: '', coverImage: '', category: 'General',
  tags: '', author: 'Athlofit Team', metaTitle: '', metaDescription: '', isPublished: false,
};

export default function Blogs() {
  const qc = useQueryClient();
  const [view, setView] = useState('list'); // 'list' | 'edit'
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-blogs'],
    queryFn: () => blogService.list({ limit: 100 }),
  });

  const blogs = data?.data?.blogs || [];

  const { data: editData } = useQuery({
    queryKey: ['admin-blog', editId],
    queryFn: () => blogService.get(editId),
    enabled: !!editId,
  });

  useEffect(() => {
    if (editData?.data) {
      const b = editData.data;
      setForm({
        title: b.title || '',
        excerpt: b.excerpt || '',
        content: b.content || '',
        coverImage: b.coverImage || '',
        category: b.category || 'General',
        tags: (b.tags || []).join(', '),
        author: b.author || 'Athlofit Team',
        metaTitle: b.metaTitle || '',
        metaDescription: b.metaDescription || '',
        isPublished: !!b.isPublished,
      });
    }
  }, [editData]);

  const saveMutation = useMutation({
    mutationFn: (payload) => {
      const body = { ...payload, tags: payload.tags.split(',').map((t) => t.trim()).filter(Boolean) };
      return editId ? blogService.update(editId, body) : blogService.create(body);
    },
    onSuccess: () => {
      toast.success(editId ? 'Blog updated' : 'Blog created');
      qc.invalidateQueries(['admin-blogs']);
      backToList();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => blogService.remove(id),
    onSuccess: () => {
      toast.success('Blog deleted');
      qc.invalidateQueries(['admin-blogs']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const backToList = () => {
    setView('list');
    setEditId(null);
    setForm(EMPTY);
  };

  const startCreate = () => {
    setForm(EMPTY);
    setEditId(null);
    setView('edit');
  };

  const startEdit = (id) => {
    setEditId(id);
    setView('edit');
  };

  if (view === 'edit') {
    return (
      <div>
        <Header title={editId ? 'Edit Blog Post' : 'New Blog Post'} subtitle="Create rich content for the website" />
        <div className="p-6 max-w-4xl">
          <button onClick={backToList} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4">
            <ArrowLeft size={16} /> Back to all posts
          </button>

          <div className="card p-6 space-y-4">
            <div>
              <label className="label">Title *</label>
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="10 Benefits of Walking 10,000 Steps" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Category</label>
                <input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Fitness" />
              </div>
              <div>
                <label className="label">Author</label>
                <input className="input" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
              </div>
            </div>

            <div>
              <ImageUploader
                label="Cover Image"
                folder="blogs"
                value={form.coverImage}
                onChange={(url) => setForm({ ...form, coverImage: url })}
              />
            </div>

            <div>
              <label className="label">Tags (comma-separated)</label>
              <input className="input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="walking, cardio, health" />
            </div>

            <div>
              <label className="label">Excerpt (short summary)</label>
              <textarea className="input" rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
            </div>

            <div data-color-mode="light">
              <label className="label flex items-center gap-1"><FileText size={13} /> Content (Rich Text / Markdown)</label>
              <Suspense fallback={<div className="flex justify-center py-8"><Spinner size="lg" /></div>}>
                <MDEditor
                  value={form.content}
                  onChange={(val) => setForm({ ...form, content: val || '' })}
                  height={420}
                  preview="live"
                  textareaProps={{ placeholder: 'Write your article… use the toolbar for headings, bold, lists, links, images, and more.' }}
                />
              </Suspense>
              <p className="text-xs text-gray-400 mt-1">
                Tip: To embed an image, upload it in the cover field or any product to get a URL, then use the image button in the toolbar.
              </p>
            </div>

            <div className="border-t pt-4 space-y-4">
              <p className="text-sm font-semibold text-gray-700">SEO (optional overrides)</p>
              <div>
                <label className="label">Meta Title</label>
                <input className="input" value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} />
              </div>
              <div>
                <label className="label">Meta Description</label>
                <textarea className="input" rows={2} value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input type="checkbox" id="isPublished" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="w-4 h-4 rounded accent-primary-600" />
              <label htmlFor="isPublished" className="text-sm text-gray-700">Published (visible on website)</label>
            </div>

            <button
              onClick={() => saveMutation.mutate(form)}
              disabled={saveMutation.isPending || !form.title || !form.content}
              className="btn-primary"
            >
              <Save size={16} /> {saveMutation.isPending ? 'Saving…' : 'Save Post'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Blog" subtitle="Manage blog posts shown on the website" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-500">{blogs.length} posts</p>
          <button onClick={startCreate} className="btn-primary">
            <Plus size={16} /> New Post
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : blogs.length === 0 ? (
          <div className="card p-12 text-center text-gray-500">
            No blog posts yet. Create your first one!
          </div>
        ) : (
          <div className="card divide-y">
            {blogs.map((b) => (
              <div key={b._id} className="flex items-center gap-4 p-4">
                <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  {b.coverImage && <img src={b.coverImage} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">{b.title}</h3>
                    {b.isPublished ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Eye size={11} /> Live</span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex items-center gap-1"><EyeOff size={11} /> Draft</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{b.category} · {b.readTime} min read · {b.views || 0} views</p>
                </div>
                <button onClick={() => startEdit(b._id)} className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg">
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => { if (confirm(`Delete "${b.title}"?`)) deleteMutation.mutate(b._id); }}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
