import { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api';
import { toast } from 'sonner';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Save, ArrowLeft, ExternalLink,
} from 'lucide-react';

interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
  isPublished: boolean;
  metaTitle: string | null;
  metaDesc: string | null;
  createdAt: string;
  updatedAt: string;
}

type View = 'list' | 'edit';

export function PagesLayout() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('list');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Edit form state
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    slug: '', title: '', content: '', isPublished: false, metaTitle: '', metaDesc: '',
  });

  const loadPages = () => {
    fetchApi('/admin/pages')
      .then((data) => setPages(data.pages || []))
      .catch(() => toast.error('Failed to load pages'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadPages(); }, []);

  const openNew = () => {
    setEditId(null);
    setForm({ slug: '', title: '', content: '', isPublished: false, metaTitle: '', metaDesc: '' });
    setView('edit');
  };

  const openEdit = (page: Page) => {
    setEditId(page.id);
    setForm({
      slug: page.slug,
      title: page.title,
      content: page.content,
      isPublished: page.isPublished,
      metaTitle: page.metaTitle || '',
      metaDesc: page.metaDesc || '',
    });
    setView('edit');
  };

  const handleSave = async () => {
    if (!form.slug || !form.title) {
      toast.error('Slug and title are required');
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await fetchApi(`/admin/pages/${editId}`, {
          method: 'PATCH',
          body: JSON.stringify(form),
        });
        toast.success('Page updated');
      } else {
        await fetchApi('/admin/pages', {
          method: 'POST',
          body: JSON.stringify(form),
        });
        toast.success('Page created');
      }
      setView('list');
      loadPages();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this page permanently?')) return;
    setDeleting(id);
    try {
      await fetchApi(`/admin/pages/${id}`, { method: 'DELETE' });
      toast.success('Page deleted');
      setPages(prev => prev.filter(p => p.id !== id));
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const togglePublish = async (page: Page) => {
    try {
      await fetchApi(`/admin/pages/${page.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isPublished: !page.isPublished }),
      });
      setPages(prev => prev.map(p => p.id === page.id ? { ...p, isPublished: !p.isPublished } : p));
      toast.success(page.isPublished ? 'Unpublished' : 'Published');
    } catch (e: any) {
      toast.error(e.message || 'Failed to update');
    }
  };

  // ─── LIST VIEW ──────────────────────────────────────────────

  if (view === 'list') {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1B2B1B]">Static Pages</h1>
            <p className="text-sm text-[#5A6E5A] mt-1">Manage FAQ, About, Terms, Privacy, and custom pages</p>
          </div>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-[#2E7D32] text-white hover:bg-[#2E7D32]/90 transition-colors"
          >
            <Plus size={16} />
            New Page
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6 animate-pulse space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 bg-[#2E7D32]/5 rounded-lg" />
            ))}
          </div>
        ) : pages.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-12 text-center">
            <p className="text-[#5A6E5A]">No pages yet. Create your first page.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#2E7D32]/10 divide-y divide-[#2E7D32]/10">
            {pages.map((page) => (
              <div key={page.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[#1B2B1B] truncate">{page.title}</p>
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                      page.isPublished ? 'bg-[#2E7D32]/10 text-[#2E7D32]' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {page.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-xs text-[#5A6E5A]/60 mt-0.5">/{page.slug}</p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => togglePublish(page)}
                    className="p-2 rounded-lg text-[#5A6E5A] hover:bg-[#2E7D32]/5 transition-colors"
                    title={page.isPublished ? 'Unpublish' : 'Publish'}
                  >
                    {page.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={() => openEdit(page)}
                    className="p-2 rounded-lg text-[#5A6E5A] hover:bg-[#2E7D32]/5 transition-colors"
                    title="Edit"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(page.id)}
                    disabled={deleting === page.id}
                    className="p-2 rounded-lg text-red-500/60 hover:bg-red-50 transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {deleting === page.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── EDIT VIEW ──────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setView('list')}
          className="p-2 rounded-lg text-[#5A6E5A] hover:bg-[#2E7D32]/5 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#1B2B1B]">
            {editId ? 'Edit Page' : 'New Page'}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1B2B1B] mb-1.5">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={e => {
                  setForm(prev => ({
                    ...prev,
                    title: e.target.value,
                    ...(editId ? {} : { slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }),
                  }));
                }}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#2E7D32]/20 bg-white text-[#1B2B1B] focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                placeholder="Page title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1B2B1B] mb-1.5">Content (HTML)</label>
              <textarea
                value={form.content}
                onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                rows={20}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#2E7D32]/20 bg-white text-[#1B2B1B] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] font-mono"
                placeholder="<h2>About FarmWise</h2><p>...</p>"
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1B2B1B] mb-1.5">URL Slug</label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-[#5A6E5A]">/page/</span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))}
                  className="flex-1 px-2 py-2 text-sm rounded-lg border border-[#2E7D32]/20 bg-white"
                  placeholder="about-us"
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <p className="text-sm font-medium text-[#1B2B1B]">Published</p>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, isPublished: !prev.isPublished }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  form.isPublished ? 'bg-[#2E7D32]' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  form.isPublished ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <hr className="border-[#2E7D32]/10" />

            <div>
              <label className="block text-sm font-medium text-[#1B2B1B] mb-1.5">Meta Title</label>
              <input
                type="text"
                value={form.metaTitle}
                onChange={e => setForm(prev => ({ ...prev, metaTitle: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#2E7D32]/20 bg-white"
                placeholder="SEO title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1B2B1B] mb-1.5">Meta Description</label>
              <textarea
                value={form.metaDesc}
                onChange={e => setForm(prev => ({ ...prev, metaDesc: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#2E7D32]/20 bg-white"
                placeholder="SEO description"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-[#2E7D32] text-white hover:bg-[#2E7D32]/90 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {editId ? 'Update Page' : 'Create Page'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
