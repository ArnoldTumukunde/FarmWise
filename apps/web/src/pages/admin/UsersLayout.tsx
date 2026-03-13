import { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { Users, CheckCircle2, XCircle, Loader2, Trash2, ShieldBan, ShieldCheck } from 'lucide-react';

function SkeletonAppCard() {
  return (
    <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6 animate-pulse">
      <div className="flex justify-between">
        <div className="space-y-3 flex-1">
          <div className="h-5 w-40 bg-[#2E7D32]/10 rounded" />
          <div className="h-3 w-56 bg-[#2E7D32]/10 rounded" />
          <div className="h-16 w-full bg-[#2E7D32]/10 rounded" />
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-[#2E7D32]/10 rounded-full" />
            <div className="h-5 w-20 bg-[#2E7D32]/10 rounded-full" />
          </div>
        </div>
        <div className="ml-4 space-y-2 w-28">
          <div className="h-7 bg-[#2E7D32]/10 rounded" />
          <div className="h-9 bg-[#2E7D32]/10 rounded" />
          <div className="h-9 bg-[#2E7D32]/10 rounded" />
        </div>
      </div>
    </div>
  );
}

function SkeletonTableRow() {
  return (
    <tr className="border-b border-[#2E7D32]/5 animate-pulse">
      <td className="px-6 py-4"><div className="h-4 w-32 bg-[#2E7D32]/10 rounded" /></td>
      <td className="px-6 py-4"><div className="h-4 w-44 bg-[#2E7D32]/10 rounded" /></td>
      <td className="px-6 py-4"><div className="h-5 w-20 bg-[#2E7D32]/10 rounded-full" /></td>
      <td className="px-6 py-4"><div className="h-4 w-24 bg-[#2E7D32]/10 rounded" /></td>
      <td className="px-6 py-4"><div className="h-8 w-36 bg-[#2E7D32]/10 rounded" /></td>
    </tr>
  );
}

const roleBadge: Record<string, string> = {
  ADMIN: 'bg-purple-50 text-purple-700 ring-purple-600/20',
  INSTRUCTOR: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  FARMER: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
};

export function UsersLayout() {
  const [users, setUsers] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const currentUser = useAuthStore((s) => s.user);

  useEffect(() => {
    Promise.all([
      fetchApi('/admin/users'),
      fetchApi('/admin/applications')
    ]).then(([usersRes, appsRes]) => {
      setUsers(usersRes.users);
      setApps(appsRes.applications);
    }).finally(() => setLoading(false));
  }, []);

  const handleApproveReject = async (id: string, action: 'APPROVE' | 'REJECT') => {
    setActionLoading(id + action);
    try {
      await fetchApi(`/admin/applications/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ action, note: `Admin ${action.toLowerCase()}` })
      });
      toast.success(action === 'APPROVE' ? 'Application approved successfully' : 'Application rejected');
      const [appsRes, usersRes] = await Promise.all([
        fetchApi('/admin/applications'),
        fetchApi('/admin/users'),
      ]);
      setApps(appsRes.applications);
      setUsers(usersRes.users);
    } catch (e: any) {
      toast.error(e.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    setActionLoading(`role-${userId}`);
    try {
      await fetchApi(`/admin/users/${userId}/role`, {
        method: 'POST',
        body: JSON.stringify({ role }),
      });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
      toast.success(`Role updated to ${role}`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendToggle = async (user: any) => {
    const willSuspend = user.isVerified !== false; // if verified (or undefined/true), we suspend
    setActionLoading(`suspend-${user.id}`);
    try {
      await fetchApi(`/admin/users/${user.id}/suspend`, {
        method: 'POST',
        body: JSON.stringify({ suspended: willSuspend }),
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isVerified: !willSuspend } : u))
      );
      toast.success(willSuspend ? 'User suspended' : 'User activated');
    } catch (e: any) {
      toast.error(e.message || 'Failed to update user status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: string, displayName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${displayName || 'this user'}"? This action cannot be undone.`)) {
      return;
    }
    setActionLoading(`delete-${userId}`);
    try {
      await fetchApi(`/admin/users/${userId}`, { method: 'DELETE' });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success('User deleted');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  const isSelf = (userId: string) => currentUser?.id === userId;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1B2B1B]">Users & Instructor Applications</h1>
        <p className="text-sm text-[#5A6E5A] mt-1">Manage users and review instructor applications</p>
      </div>

      {/* Instructor Applications */}
      <div>
        <h2 className="text-lg font-semibold text-[#1B2B1B] mb-4">Instructor Applications</h2>
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => <SkeletonAppCard key={i} />)
          ) : apps.length > 0 ? (
            apps.map(app => {
              const statusStyles: Record<string, string> = {
                PENDING: 'bg-amber-50 text-amber-700 ring-amber-600/20',
                APPROVED: 'bg-green-50 text-green-700 ring-green-600/20',
                REJECTED: 'bg-red-50 text-red-700 ring-red-600/20',
              };
              return (
                <div key={app.id} className="bg-white rounded-xl border border-[#2E7D32]/10 p-6">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <h3 className="font-semibold text-[#1B2B1B]">{app.user?.profile?.displayName || 'Unknown'}</h3>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ring-1 ring-inset ${statusStyles[app.status] || ''}`}>
                          {app.status}
                        </span>
                      </div>
                      <p className="text-sm text-[#5A6E5A] mb-3">{app.user.email}</p>
                      <div className="bg-[#FAFAF5] border border-[#2E7D32]/10 rounded-lg p-3 mb-3">
                        <p className="text-xs font-semibold text-[#5A6E5A] uppercase tracking-wide mb-1">Motivation</p>
                        <p className="text-sm text-[#1B2B1B] leading-relaxed">{app.motivation}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {app.expertise.map((exp: string) => (
                          <span key={exp} className="bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 px-2.5 py-0.5 rounded-full text-xs font-medium">{exp}</span>
                        ))}
                      </div>
                    </div>
                    {app.status === 'PENDING' && (
                      <div className="flex sm:flex-col gap-2 sm:min-w-[130px]">
                        <button
                          onClick={() => handleApproveReject(app.id, 'APPROVE')}
                          disabled={actionLoading === app.id + 'APPROVE'}
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#2E7D32] text-white hover:bg-[#2E7D32]/90 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                        >
                          {actionLoading === app.id + 'APPROVE' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                          Approve
                        </button>
                        <button
                          onClick={() => handleApproveReject(app.id, 'REJECT')}
                          disabled={actionLoading === app.id + 'REJECT'}
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                        >
                          {actionLoading === app.id + 'REJECT' ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-xl border border-[#2E7D32]/10 py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-[#2E7D32]/5 flex items-center justify-center mx-auto mb-3">
                <Users size={20} className="text-[#5A6E5A]" />
              </div>
              <p className="text-[#5A6E5A] text-sm">No applications found.</p>
            </div>
          )}
        </div>
      </div>

      {/* All Users Table */}
      <div>
        <h2 className="text-lg font-semibold text-[#1B2B1B] mb-4">
          All Users{!loading && ` (${users.length})`}
        </h2>
        <div className="bg-white rounded-xl border border-[#2E7D32]/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-[#FAFAF5] border-b border-[#2E7D32]/10">
                  <th className="px-6 py-3 text-xs font-semibold text-[#5A6E5A] uppercase tracking-wide">Name</th>
                  <th className="px-6 py-3 text-xs font-semibold text-[#5A6E5A] uppercase tracking-wide">Email / Phone</th>
                  <th className="px-6 py-3 text-xs font-semibold text-[#5A6E5A] uppercase tracking-wide">Role</th>
                  <th className="px-6 py-3 text-xs font-semibold text-[#5A6E5A] uppercase tracking-wide">Joined</th>
                  <th className="px-6 py-3 text-xs font-semibold text-[#5A6E5A] uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} />)
                ) : users.length > 0 ? (
                  users.map(u => (
                    <tr key={u.id} className="border-b border-[#2E7D32]/5 hover:bg-[#FAFAF5]/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-[#1B2B1B]">{u.profile?.displayName || 'Unknown'}</td>
                      <td className="px-6 py-4 text-[#5A6E5A]">{u.email || u.phone}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${roleBadge[u.role] || 'bg-gray-50 text-gray-700'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#5A6E5A]">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {/* Role dropdown */}
                          <select
                            value={u.role}
                            disabled={isSelf(u.id) || actionLoading === `role-${u.id}`}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="text-xs font-medium rounded-lg border border-[#2E7D32]/20 bg-white px-2 py-1.5 text-[#1B2B1B] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <option value="FARMER">FARMER</option>
                            <option value="INSTRUCTOR">INSTRUCTOR</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>

                          {/* Suspend / Activate toggle */}
                          <button
                            onClick={() => handleSuspendToggle(u)}
                            disabled={isSelf(u.id) || actionLoading === `suspend-${u.id}`}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
                              u.isVerified === false
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:ring-emerald-500'
                                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 focus-visible:ring-amber-500'
                            }`}
                          >
                            {actionLoading === `suspend-${u.id}` ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : u.isVerified === false ? (
                              <ShieldCheck size={14} />
                            ) : (
                              <ShieldBan size={14} />
                            )}
                            {u.isVerified === false ? 'Activate' : 'Suspend'}
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => handleDelete(u.id, u.profile?.displayName)}
                            disabled={isSelf(u.id) || actionLoading === `delete-${u.id}`}
                            className="inline-flex items-center justify-center p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1"
                            title="Delete user"
                          >
                            {actionLoading === `delete-${u.id}` ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-[#5A6E5A]">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
