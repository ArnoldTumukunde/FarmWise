import { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api';
import { toast } from 'sonner';
import {
  Plus, Pencil, Loader2, FolderTree, X, Trash2,
  ChevronDown, ChevronRight, CornerDownRight,
} from 'lucide-react';

/* ── Types ──────────────────────────────────────────── */

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconName: string | null;
  imageUrl: string | null;
  parentId: string | null;
  _count?: { courses: number };
  children?: { id: string; name: string; slug: string }[];
}

/* ── Skeleton ─────────────────────────────────────────── */

function SkeletonRow() {
  return (
    <tr className="border-b border-[#2E7D32]/5 animate-pulse">
      <td className="px-6 py-4"><div className="h-4 w-40 bg-[#2E7D32]/10 rounded" /></td>
      <td className="px-6 py-4"><div className="h-4 w-28 bg-[#2E7D32]/10 rounded" /></td>
      <td className="px-6 py-4"><div className="h-4 w-12 bg-[#2E7D32]/10 rounded" /></td>
      <td className="px-6 py-4"><div className="h-4 w-8 bg-[#2E7D32]/10 rounded" /></td>
      <td className="px-6 py-4"><div className="h-8 w-24 bg-[#2E7D32]/10 rounded" /></td>
    </tr>
  );
}

/* ── Slug helper ──────────────────────────────────────── */

const toSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

/* ── Main component ───────────────────────────────────── */

export function CategoriesLayout() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formParentId, setFormParentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadCategories = () => {
    setLoading(true);
    fetchApi('/admin/categories')
      .then((data) => {
        const cats = data.categories || data || [];
        setCategories(cats);
        // Auto-expand parents that have children
        const parentIds = new Set<string>();
        for (const c of cats) {
          if (c.children && c.children.length > 0) parentIds.add(c.id);
        }
        setExpanded(parentIds);
      })
      .catch((e) => toast.error(e.message || 'Failed to load categories'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadCategories(); }, []);

  // Separate parents (no parentId) and build subcategory lookup
  const parents = categories.filter(c => !c.parentId);
  const childMap = new Map<string, Category[]>();
  for (const c of categories) {
    if (c.parentId) {
      const existing = childMap.get(c.parentId) || [];
      existing.push(c);
      childMap.set(c.parentId, existing);
    }
  }

  /* ── Modal helpers ──────────────────────────────────── */

  const openCreate = (parentId: string | null = null) => {
    setEditingId(null);
    setFormName('');
    setFormSlug('');
    setFormDescription('');
    setFormImageUrl('');
    setFormParentId(parentId);
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingId(cat.id);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormDescription(cat.description || '');
    setFormImageUrl(cat.imageUrl || '');
    setFormParentId(cat.parentId);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const handleNameChange = (value: string) => {
    setFormName(value);
    if (!editingId) setFormSlug(toSlug(value));
  };

  const handleSave = async () => {
    if (!formName.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const body: any = {
        name: formName.trim(),
        slug: formSlug.trim() || toSlug(formName),
        description: formDescription.trim() || undefined,
        imageUrl: formImageUrl.trim() || undefined,
        parentId: formParentId || undefined,
      };
      if (editingId) {
        await fetchApi(`/admin/categories/${editingId}`, { method: 'PATCH', body: JSON.stringify(body) });
        toast.success('Category updated');
      } else {
        await fetchApi('/admin/categories', { method: 'POST', body: JSON.stringify(body) });
        toast.success('Category created');
      }
      closeModal();
      loadCategories();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (cat: Category) => {
    const children = childMap.get(cat.id);
    const hasChildren = children && children.length > 0;
    const msg = hasChildren
      ? `Delete "${cat.name}" and all its subcategories? This cannot be undone.`
      : `Delete "${cat.name}"? This cannot be undone.`;
    if (!window.confirm(msg)) return;
    setActionLoading(`del-${cat.id}`);
    try {
      // If parent, delete children first
      if (hasChildren) {
        for (const child of children!) {
          await fetchApi(`/admin/categories/${child.id}`, { method: 'DELETE' });
        }
      }
      await fetchApi(`/admin/categories/${cat.id}`, { method: 'DELETE' });
      toast.success('Category deleted');
      loadCategories();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  /* ── Render ────────────────────────────────────────── */

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2B1B]">Category Management</h1>
          <p className="text-sm text-[#5A6E5A] mt-1">
            {parents.length} categories, {categories.length - parents.length} subcategories
          </p>
        </div>
        <button
          onClick={() => openCreate(null)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-[#2E7D32] text-white hover:bg-[#2E7D32]/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
        >
          <Plus size={16} />
          Add Category
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#2E7D32]/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-[#FAFAF5] border-b border-[#2E7D32]/10">
                <th className="px-6 py-3 text-xs font-semibold text-[#5A6E5A] uppercase tracking-wide">Name</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#5A6E5A] uppercase tracking-wide">Image</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#5A6E5A] uppercase tracking-wide">Slug</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#5A6E5A] uppercase tracking-wide">Courses</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#5A6E5A] uppercase tracking-wide">Subcategories</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#5A6E5A] uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : parents.length > 0 ? (
                parents.map((cat) => {
                  const children = childMap.get(cat.id) || [];
                  const isExpanded = expanded.has(cat.id);
                  return (
                    <ParentRow
                      key={cat.id}
                      cat={cat}
                      children={children}
                      isExpanded={isExpanded}
                      onToggle={() => toggleExpand(cat.id)}
                      onEdit={openEdit}
                      onDelete={deleteCategory}
                      onAddSub={() => openCreate(cat.id)}
                      actionLoading={actionLoading}
                    />
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-[#2E7D32]/5 flex items-center justify-center mx-auto mb-3">
                      <FolderTree size={20} className="text-[#5A6E5A]" />
                    </div>
                    <p className="text-[#1B2B1B] font-semibold mb-1">No categories yet</p>
                    <p className="text-sm text-[#5A6E5A]">Create your first category to organize courses.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal ──────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-xl border border-[#2E7D32]/10 shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[#1B2B1B]">
                {editingId ? 'Edit' : formParentId ? 'Add Subcategory' : 'Add Category'}
              </h3>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-[#5A6E5A] hover:bg-[#2E7D32]/5 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Parent selector */}
              <div>
                <label className="block text-sm font-medium text-[#1B2B1B] mb-1.5">Parent Category</label>
                <select
                  value={formParentId || ''}
                  onChange={(e) => setFormParentId(e.target.value || null)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#2E7D32]/20 bg-white text-[#1B2B1B] focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                >
                  <option value="">None (top-level category)</option>
                  {parents
                    .filter(p => p.id !== editingId) // Can't be parent of itself
                    .map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))
                  }
                </select>
                {formParentId && (
                  <p className="text-xs text-[#5A6E5A] mt-1">
                    This will be a subcategory of {parents.find(p => p.id === formParentId)?.name}
                  </p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-[#1B2B1B] mb-1.5">Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder={formParentId ? 'e.g. Maize & Cereals' : 'e.g. Crop Farming'}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#2E7D32]/20 bg-white text-[#1B2B1B] placeholder:text-[#5A6E5A]/60 focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-[#1B2B1B] mb-1.5">Slug</label>
                <input
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="auto-generated"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#2E7D32]/20 bg-white text-[#1B2B1B] font-mono placeholder:text-[#5A6E5A]/60 focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-[#1B2B1B] mb-1.5">Description (optional)</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  placeholder="Brief description of this category"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#2E7D32]/20 bg-white text-[#1B2B1B] placeholder:text-[#5A6E5A]/60 focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>

              {/* Image URL — only for top-level categories (shown on homepage carousel) */}
              {!formParentId && (
                <div>
                  <label className="block text-sm font-medium text-[#1B2B1B] mb-1.5">Homepage Image URL</label>
                  <input
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#2E7D32]/20 bg-white text-[#1B2B1B] placeholder:text-[#5A6E5A]/60 focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  />
                  <p className="text-xs text-[#5A6E5A] mt-1">Image shown in the homepage category carousel</p>
                  {formImageUrl && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-[#2E7D32]/10 h-24 bg-gray-50">
                      <img
                        src={formImageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-[#2E7D32]/20 text-[#1B2B1B] hover:bg-[#FAFAF5] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-[#2E7D32] text-white hover:bg-[#2E7D32]/90 disabled:opacity-50 transition-colors"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Parent row + children rows ────────────────────────── */

function ParentRow({
  cat, children, isExpanded, onToggle, onEdit, onDelete, onAddSub, actionLoading,
}: {
  cat: Category;
  children: Category[];
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
  onAddSub: () => void;
  actionLoading: string | null;
}) {
  return (
    <>
      {/* Parent row */}
      <tr className="border-b border-[#2E7D32]/5 hover:bg-[#FAFAF5]/50 transition-colors">
        <td className="px-6 py-3.5">
          <div className="flex items-center gap-2">
            {children.length > 0 ? (
              <button
                onClick={onToggle}
                className="p-0.5 rounded text-[#5A6E5A] hover:text-[#2E7D32] transition-colors"
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            ) : (
              <span className="w-5" />
            )}
            <span className="font-medium text-[#1B2B1B]">{cat.name}</span>
          </div>
        </td>
        <td className="px-6 py-3.5">
          {cat.imageUrl ? (
            <div className="w-12 h-8 rounded overflow-hidden bg-gray-100">
              <img src={cat.imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <span className="text-xs text-[#5A6E5A]/40">No image</span>
          )}
        </td>
        <td className="px-6 py-3.5 text-[#5A6E5A] font-mono text-xs">{cat.slug}</td>
        <td className="px-6 py-3.5 text-[#1B2B1B]">{cat._count?.courses ?? 0}</td>
        <td className="px-6 py-3.5">
          <span className="text-xs text-[#5A6E5A]">{children.length} subcategories</span>
        </td>
        <td className="px-6 py-3.5">
          <div className="flex items-center gap-1">
            <button
              onClick={onAddSub}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#2E7D32] hover:bg-[#2E7D32]/5 transition-colors"
              title="Add subcategory"
            >
              <Plus size={14} />
              Sub
            </button>
            <button
              onClick={() => onEdit(cat)}
              className="p-2 rounded-lg text-[#5A6E5A] hover:bg-[#2E7D32]/5 hover:text-[#2E7D32] transition-colors"
              title="Edit"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={() => onDelete(cat)}
              disabled={actionLoading === `del-${cat.id}`}
              className="p-2 rounded-lg text-red-500/60 hover:bg-red-50 disabled:opacity-50 transition-colors"
              title="Delete"
            >
              {actionLoading === `del-${cat.id}` ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
            </button>
          </div>
        </td>
      </tr>

      {/* Children rows */}
      {isExpanded && children.map((child) => (
        <tr key={child.id} className="border-b border-[#2E7D32]/5 bg-[#FAFAF5]/30 hover:bg-[#FAFAF5]/60 transition-colors">
          <td className="px-6 py-2.5">
            <div className="flex items-center gap-2 pl-7">
              <CornerDownRight size={14} className="text-[#5A6E5A]/40 flex-shrink-0" />
              <span className="text-[#1B2B1B]">{child.name}</span>
            </div>
          </td>
          <td className="px-6 py-2.5" />
          <td className="px-6 py-2.5 text-[#5A6E5A] font-mono text-xs">{child.slug}</td>
          <td className="px-6 py-2.5 text-[#1B2B1B]">{child._count?.courses ?? 0}</td>
          <td className="px-6 py-2.5">
            <span className="text-[10px] text-[#5A6E5A]/60 uppercase">subcategory</span>
          </td>
          <td className="px-6 py-2.5">
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit(child)}
                className="p-2 rounded-lg text-[#5A6E5A] hover:bg-[#2E7D32]/5 hover:text-[#2E7D32] transition-colors"
                title="Edit"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => onDelete(child)}
                disabled={actionLoading === `del-${child.id}`}
                className="p-2 rounded-lg text-red-500/60 hover:bg-red-50 disabled:opacity-50 transition-colors"
                title="Delete"
              >
                {actionLoading === `del-${child.id}` ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}
