import { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api';
import { toast } from 'sonner';
import {
  RefreshCcw,
  CheckCircle,
  XCircle,
  Loader2,
  ReceiptText,
} from 'lucide-react';

const formatUGX = (amount: number) =>
  new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(amount);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' });

type StatusFilter = '' | 'PENDING' | 'APPROVED' | 'REJECTED';

const tabs: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
];

const statusBadge: Record<string, { cls: string; label: string }> = {
  PENDING: { cls: 'bg-amber-50 text-amber-700 ring-amber-600/20', label: 'Pending' },
  APPROVED: { cls: 'bg-green-50 text-green-700 ring-green-600/20', label: 'Approved' },
  AUTO_APPROVED: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', label: 'Approved (Auto)' },
  REJECTED: { cls: 'bg-red-50 text-red-700 ring-red-600/20', label: 'Rejected' },
};

/* ── Skeleton ─────────────────────────────────────────── */

function SkeletonRow() {
  return (
    <tr className="border-b border-[#2E7D32]/5 animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-6 py-4"><div className="h-4 w-20 bg-[#2E7D32]/10 rounded" /></td>
      ))}
    </tr>
  );
}

/* ── Main component ───────────────────────────────────── */

export function RefundsLayout() {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadRefunds = (status: StatusFilter) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    fetchApi(`/admin/refunds${params.toString() ? `?${params}` : ''}`)
      .then((data) => setRefunds(data.refunds || data || []))
      .catch((e) => toast.error(e.message || 'Failed to load refunds'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRefunds(statusFilter);
  }, [statusFilter]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActionLoading(`${action}-${id}`);
    try {
      await fetchApi(`/admin/refunds/${id}/${action}`, { method: 'POST' });
      toast.success(action === 'approve' ? 'Refund approved' : 'Refund rejected');
      loadRefunds(statusFilter);
    } catch (e: any) {
      toast.error(e.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = refunds;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1B2B1B]">Refund Management</h1>
        <p className="text-sm text-[#5A6E5A] mt-1">Review and manage refund requests from farmers</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-[#FAFAF5] p-1 rounded-lg border border-[#2E7D32]/10 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              statusFilter === tab.value
                ? 'bg-white text-[#1B2B1B] shadow-sm'
                : 'text-[#5A6E5A] hover:text-[#1B2B1B]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#2E7D32]/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-[#FAFAF5] border-b border-[#2E7D32]/10">
                <th className="px-6 py-3 text-xs font-semibold text-[#5A6E5A] uppercase tracking-wide">Farmer</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#5A6E5A] uppercase tracking-wide">Course</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#5A6E5A] uppercase tracking-wide">Amount</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#5A6E5A] uppercase tracking-wide">Requested</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#5A6E5A] uppercase tracking-wide">Progress</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#5A6E5A] uppercase tracking-wide">Reason</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#5A6E5A] uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#5A6E5A] uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length > 0 ? (
                filtered.map((refund) => {
                  const badge = statusBadge[refund.autoApproved ? 'AUTO_APPROVED' : refund.status] || statusBadge.PENDING;
                  return (
                    <tr key={refund.id} className="border-b border-[#2E7D32]/5 hover:bg-[#FAFAF5]/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-[#1B2B1B]">
                        {refund.user?.profile?.displayName || refund.user?.email || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-[#1B2B1B] max-w-[200px] truncate">
                        {refund.course?.title || refund.enrollment?.course?.title || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 font-semibold text-[#1B2B1B]">
                        {formatUGX(Number(refund.amount || 0))}
                      </td>
                      <td className="px-6 py-4 text-[#5A6E5A] whitespace-nowrap">
                        {formatDate(refund.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-[#2E7D32]/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#2E7D32] rounded-full"
                              style={{ width: `${refund.progressAtRequest || 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-[#5A6E5A]">{refund.progressAtRequest || 0}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#5A6E5A] max-w-[180px] truncate" title={refund.reason}>
                        {refund.reason || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ring-1 ring-inset ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {refund.status === 'PENDING' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAction(refund.id, 'approve')}
                              disabled={!!actionLoading}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#2E7D32] text-white hover:bg-[#2E7D32]/90 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-1"
                            >
                              {actionLoading === `approve-${refund.id}` ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <CheckCircle size={14} />
                              )}
                              Approve
                            </button>
                            <button
                              onClick={() => handleAction(refund.id, 'reject')}
                              disabled={!!actionLoading}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1"
                            >
                              {actionLoading === `reject-${refund.id}` ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <XCircle size={14} />
                              )}
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-[#5A6E5A]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-[#2E7D32]/5 flex items-center justify-center mx-auto mb-3">
                      <ReceiptText size={20} className="text-[#5A6E5A]" />
                    </div>
                    <p className="text-[#1B2B1B] font-semibold mb-1">No refund requests</p>
                    <p className="text-sm text-[#5A6E5A]">
                      {statusFilter ? `No ${statusFilter.toLowerCase()} refunds found.` : 'No refund requests have been submitted yet.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
