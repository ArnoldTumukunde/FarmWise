import { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api';
import { toast } from 'sonner';
import { Shield, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';

interface AuditEntry {
  id: string;
  adminId: string;
  admin: { email: string | null; profile: { displayName: string } | null };
  action: string;
  entity: string | null;
  entityId: string | null;
  details: any;
  ipAddress: string | null;
  createdAt: string;
}

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-[#2E7D32]/10 text-[#2E7D32]',
  update: 'bg-blue-50 text-blue-700',
  delete: 'bg-red-50 text-red-600',
  approve: 'bg-[#2E7D32]/10 text-[#2E7D32]',
  reject: 'bg-red-50 text-red-600',
  hide: 'bg-yellow-50 text-yellow-700',
  unhide: 'bg-blue-50 text-blue-700',
  moderate: 'bg-purple-50 text-purple-700',
  reorder: 'bg-gray-100 text-gray-600',
  settings: 'bg-gray-100 text-gray-600',
};

function getActionColor(action: string): string {
  for (const [key, cls] of Object.entries(ACTION_COLORS)) {
    if (action.toLowerCase().includes(key)) return cls;
  }
  return 'bg-gray-100 text-gray-600';
}

export function AuditLogLayout() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const loadLogs = (p = page) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: '30' });
    if (actionFilter) params.set('action', actionFilter);
    if (entityFilter) params.set('entity', entityFilter);

    fetchApi(`/admin/audit-logs?${params}`)
      .then((data) => {
        setLogs(data.logs || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      })
      .catch(() => toast.error('Failed to load audit logs'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadLogs(1); setPage(1); }, [actionFilter, entityFilter]);
  useEffect(() => { loadLogs(); }, [page]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('en-UG', { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2B1B]">Audit Log</h1>
          <p className="text-sm text-[#5A6E5A] mt-1">{total} logged admin actions</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
            showFilters || actionFilter || entityFilter
              ? 'border-[#2E7D32] text-[#2E7D32] bg-[#2E7D32]/5'
              : 'border-[#2E7D32]/20 text-[#5A6E5A] hover:bg-[#2E7D32]/5'
          }`}
        >
          <Filter size={16} />
          Filters
          {(actionFilter || entityFilter) && (
            <span className="ml-1 bg-[#2E7D32] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              {(actionFilter ? 1 : 0) + (entityFilter ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-[#1B2B1B] mb-1">Action contains</label>
            <input
              type="text"
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              placeholder="e.g. settings, course"
              className="px-3 py-2 text-sm rounded-lg border border-[#2E7D32]/20 bg-white w-48"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#1B2B1B] mb-1">Entity</label>
            <input
              type="text"
              value={entityFilter}
              onChange={e => setEntityFilter(e.target.value)}
              placeholder="e.g. Page, Course"
              className="px-3 py-2 text-sm rounded-lg border border-[#2E7D32]/20 bg-white w-48"
            />
          </div>
          {(actionFilter || entityFilter) && (
            <button
              onClick={() => { setActionFilter(''); setEntityFilter(''); }}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg"
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>
      )}

      {/* Log entries */}
      {loading ? (
        <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6 animate-pulse space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-[#2E7D32]/5 rounded-lg" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-12 text-center">
          <Shield size={40} className="mx-auto text-[#5A6E5A]/30 mb-3" />
          <p className="text-[#5A6E5A]">No audit log entries found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#2E7D32]/10 divide-y divide-[#2E7D32]/10">
          {logs.map((entry) => (
            <div key={entry.id}>
              <button
                onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-[#FAFAF5] transition-colors"
              >
                {/* Action badge */}
                <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${getActionColor(entry.action)}`}>
                  {entry.action}
                </span>

                {/* Entity */}
                {entry.entity && (
                  <span className="text-xs text-[#5A6E5A] flex-shrink-0">
                    {entry.entity}{entry.entityId ? `:${entry.entityId.slice(0, 8)}` : ''}
                  </span>
                )}

                {/* Spacer */}
                <div className="flex-1" />

                {/* Admin name */}
                <span className="text-xs text-[#5A6E5A] truncate max-w-[120px]">
                  {entry.admin?.profile?.displayName || entry.admin?.email || 'Admin'}
                </span>

                {/* Timestamp */}
                <span className="text-xs text-[#5A6E5A]/60 flex-shrink-0">
                  {formatDate(entry.createdAt)}
                </span>
              </button>

              {/* Expanded details */}
              {expandedId === entry.id && entry.details && (
                <div className="px-5 pb-4 bg-[#FAFAF5]">
                  <pre className="text-xs text-[#5A6E5A] bg-white rounded-lg p-3 overflow-x-auto border border-[#2E7D32]/10">
                    {JSON.stringify(entry.details, null, 2)}
                  </pre>
                  {entry.ipAddress && (
                    <p className="text-[10px] text-[#5A6E5A]/60 mt-2">IP: {entry.ipAddress}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg text-[#5A6E5A] hover:bg-[#2E7D32]/5 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-[#5A6E5A]">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg text-[#5A6E5A] hover:bg-[#2E7D32]/5 disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
