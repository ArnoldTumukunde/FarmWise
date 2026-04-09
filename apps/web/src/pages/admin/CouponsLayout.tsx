import { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api';
import { toast } from 'sonner';
import {
  Plus,
  Ticket,
  Loader2,
  X,
  Trash2,
  Ban,
  Copy,
} from 'lucide-react';

const formatUGX = (amount: number) =>
  new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(amount);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' });

/* ── Skeleton ─────────────────────────────────────────── */

function SkeletonRow() {
  return (
    <tr className="border-b border-[#2E7D32]/5 animate-pulse">
      <td className="px-6 py-4"><div className="h-4 w-24 bg-[#2E7D32]/10 rounded" /></td>
      <td className="px-6 py-4"><div className="h-4 w-16 bg-[#2E7D32]/10 rounded" /></td>
      <td className="px-6 py-4"><div className="h-4 w-20 bg-[#2E7D32]/10 rounded" /></td>
      <td className="px-6 py-4"><div className="h-4 w-24 bg-[#2E7D32]/10 rounded" /></td>
      <td className="px-6 py-4"><div className="h-4 w-12 bg-[#2E7D32]/10 rounded" /></td>
      <td className="px-6 py-4"><div className="h-4 w-24 bg-[#2E7D32]/10 rounded" /></td>
      <td className="px-6 py-4"><div className="h-8 w-20 bg-[#2E7D32]/10 rounded" /></td>
    </tr>
  );
}

/* ── Generate code helper ─────────────────────────────── */

const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'FW-';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

/* ── Main component ───────────────────────────────────── */

export function CouponsLayout() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [formCode, setFormCode] = useState('');
  const [formDiscountType, setFormDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [formDiscount, setFormDiscount] = useState('');
  const [formAppliesTo, setFormAppliesTo] = useState<'all' | 'category' | 'course'>('all');
  const [formTargetId, setFormTargetId] = useState('');
  const [formUsageLimit, setFormUsageLimit] = useState('');
  const [formExpiry, setFormExpiry] = useState('');
  const [saving, setSaving] = useState(false);

  const loadCoupons = () => {
    setLoading(true);
    fetchApi('/admin/coupons')
      .then((data) => setCoupons(data.coupons || data || []))
      .catch((e) => toast.error(e.message || 'Failed to load coupons'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  /* ── Modal ──────────────────────────────────────────── */

  const openCreate = () => {
    setFormCode(generateCode());
    setFormDiscountType('percentage');
    setFormDiscount('');
    setFormAppliesTo('all');
    setFormTargetId('');
    setFormUsageLimit('');
    setFormExpiry('');
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleCreate = async () => {
    if (!formCode.trim() || !formDiscount) {
      toast.error('Code and discount are required');
      return;
    }
    setSaving(true);
    try {
      await fetchApi('/admin/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: formCode.trim().toUpperCase(),
          discountType: formDiscountType,
          discountValue: Number(formDiscount),
          appliesTo: formAppliesTo,
          ...(formAppliesTo !== 'all' && formTargetId ? { targetId: formTargetId } : {}),
          ...(formUsageLimit ? { usageLimit: Number(formUsageLimit) } : {}),
          ...(formExpiry ? { expiresAt: new Date(formExpiry).toISOString() } : {}),
        }),
      });
      toast.success('Coupon created');
      closeModal();
      loadCoupons();
    } catch (e: any) {
      toast.error(e.message || 'Failed to create coupon');
    } finally {
      setSaving(false);
    }
  };

  /* ── Actions ────────────────────────────────────────── */

  const disableCoupon = async (id: string) => {
    setActionLoading(`dis-${id}`);
    try {
      await fetchApi(`/admin/coupons/${id}`, { method: 'PATCH', body: JSON.stringify({ isActive: false }) });
      toast.success('Coupon disabled');
      loadCoupons();
    } catch (e: any) {
      toast.error(e.message || 'Failed to disable coupon');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteCoupon = async (id: string, code: string) => {
    if (!window.confirm(`Delete coupon "${code}"?`)) return;
    setActionLoading(`del-${id}`);
    try {
      await fetchApi(`/admin/coupons/${id}`, { method: 'DELETE' });
      toast.success('Coupon deleted');
      loadCoupons();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete coupon');
    } finally {
      setActionLoading(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2B1B]">Coupon Management</h1>
          <p className="text-sm text-[#5A6E5A] mt-1">Create and manage platform-wide discount coupons</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-[#2E7D32] text-white hover:bg-[#2E7D32]/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
        >
          <Plus size={16} />
          Create Coupon
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#2E7D32]/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-[#FAFAF5] border-b border-[#2E7D32]/10">
                <th className="px-6 py-3 text-xs font-semibold text-[#5A6E5A] uppercase tracking-wide">Code</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#5A6E5A] uppercase tracking-wide">Discount</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#5A6E5A] uppercase tracking-wide">Type</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#5A6E5A] uppercase tracking-wide">Expiry</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#5A6E5A] uppercase tracking-wide">Uses Left</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#5A6E5A] uppercase tracking-wide">Created</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#5A6E5A] uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
              ) : coupons.length > 0 ? (
                coupons.map((coupon) => {
                  const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
                  const isDisabled = coupon.isDisabled || coupon.isActive === false;
                  return (
                    <tr key={coupon.id} className={`border-b border-[#2E7D32]/5 hover:bg-[#FAFAF5]/50 transition-colors ${isDisabled || isExpired ? 'opacity-60' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-[#1B2B1B]">{coupon.code}</span>
                          <button
                            onClick={() => copyCode(coupon.code)}
                            className="p-1 rounded text-[#5A6E5A] hover:text-[#2E7D32] transition-colors"
                            title="Copy code"
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-[#1B2B1B]">
                        {coupon.discountType === 'percentage'
                          ? `${coupon.discountValue}%`
                          : formatUGX(Number(coupon.discountValue))}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full ring-1 ring-inset bg-blue-50 text-blue-700 ring-blue-600/20">
                          {coupon.discountType === 'percentage' ? 'Percentage' : 'Fixed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#5A6E5A]">
                        {coupon.expiresAt ? (
                          <span className={isExpired ? 'text-red-500' : ''}>
                            {formatDate(coupon.expiresAt)}
                            {isExpired && <span className="ml-1 text-xs">(expired)</span>}
                          </span>
                        ) : (
                          'No expiry'
                        )}
                      </td>
                      <td className="px-6 py-4 text-[#1B2B1B]">
                        {coupon.usageLimit != null
                          ? `${Math.max(0, (coupon.usageLimit || 0) - (coupon.usageCount || 0))} / ${coupon.usageLimit}`
                          : 'Unlimited'}
                      </td>
                      <td className="px-6 py-4 text-[#5A6E5A]">{formatDate(coupon.createdAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {!isDisabled && (
                            <button
                              onClick={() => disableCoupon(coupon.id)}
                              disabled={!!actionLoading}
                              className="inline-flex items-center justify-center p-2 rounded-lg text-amber-600 hover:bg-amber-50 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1"
                              title="Disable"
                            >
                              {actionLoading === `dis-${coupon.id}` ? (
                                <Loader2 size={15} className="animate-spin" />
                              ) : (
                                <Ban size={15} />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => deleteCoupon(coupon.id, coupon.code)}
                            disabled={!!actionLoading}
                            className="inline-flex items-center justify-center p-2 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1"
                            title="Delete"
                          >
                            {actionLoading === `del-${coupon.id}` ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              <Trash2 size={15} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-[#2E7D32]/5 flex items-center justify-center mx-auto mb-3">
                      <Ticket size={20} className="text-[#5A6E5A]" />
                    </div>
                    <p className="text-[#1B2B1B] font-semibold mb-1">No coupons yet</p>
                    <p className="text-sm text-[#5A6E5A]">Create your first coupon to offer discounts.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create Modal ───────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-xl border border-[#2E7D32]/10 shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[#1B2B1B]">Create Coupon</h3>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-[#5A6E5A] hover:bg-[#2E7D32]/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-[#1B2B1B] mb-1.5">Coupon Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2.5 text-sm rounded-lg border border-[#2E7D32]/20 bg-white text-[#1B2B1B] font-mono focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setFormCode(generateCode())}
                    className="px-3 py-2.5 text-sm font-medium rounded-lg border border-[#2E7D32]/20 text-[#1B2B1B] hover:bg-[#FAFAF5] transition-colors"
                  >
                    Generate
                  </button>
                </div>
              </div>

              {/* Applies to */}
              <div>
                <label className="block text-sm font-medium text-[#1B2B1B] mb-1.5">Applies To</label>
                <select
                  value={formAppliesTo}
                  onChange={(e) => setFormAppliesTo(e.target.value as any)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#2E7D32]/20 bg-white text-[#1B2B1B] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent transition-colors"
                >
                  <option value="all">All Courses</option>
                  <option value="category">Specific Category</option>
                  <option value="course">Specific Course</option>
                </select>
              </div>

              {formAppliesTo !== 'all' && (
                <div>
                  <label className="block text-sm font-medium text-[#1B2B1B] mb-1.5">
                    {formAppliesTo === 'category' ? 'Category' : 'Course'} ID
                  </label>
                  <input
                    type="text"
                    value={formTargetId}
                    onChange={(e) => setFormTargetId(e.target.value)}
                    placeholder={`Enter ${formAppliesTo} ID`}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#2E7D32]/20 bg-white text-[#1B2B1B] placeholder:text-[#5A6E5A]/60 focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent transition-colors"
                  />
                </div>
              )}

              {/* Discount type + value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#1B2B1B] mb-1.5">Discount Type</label>
                  <select
                    value={formDiscountType}
                    onChange={(e) => setFormDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#2E7D32]/20 bg-white text-[#1B2B1B] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent transition-colors"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed (UGX)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1B2B1B] mb-1.5">Value</label>
                  <input
                    type="number"
                    value={formDiscount}
                    onChange={(e) => setFormDiscount(e.target.value)}
                    placeholder={formDiscountType === 'percentage' ? '10' : '5000'}
                    min="0"
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#2E7D32]/20 bg-white text-[#1B2B1B] placeholder:text-[#5A6E5A]/60 focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              {/* Usage limit */}
              <div>
                <label className="block text-sm font-medium text-[#1B2B1B] mb-1.5">Usage Limit (optional)</label>
                <input
                  type="number"
                  value={formUsageLimit}
                  onChange={(e) => setFormUsageLimit(e.target.value)}
                  placeholder="Unlimited"
                  min="1"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#2E7D32]/20 bg-white text-[#1B2B1B] placeholder:text-[#5A6E5A]/60 focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent transition-colors"
                />
              </div>

              {/* Expiry */}
              <div>
                <label className="block text-sm font-medium text-[#1B2B1B] mb-1.5">Expiry Date (optional)</label>
                <input
                  type="date"
                  value={formExpiry}
                  onChange={(e) => setFormExpiry(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#2E7D32]/20 bg-white text-[#1B2B1B] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-[#2E7D32]/20 text-[#1B2B1B] hover:bg-[#FAFAF5] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-[#2E7D32] text-white hover:bg-[#2E7D32]/90 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                Create Coupon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
