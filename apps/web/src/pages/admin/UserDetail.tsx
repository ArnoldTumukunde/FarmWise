import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchApi } from '../../lib/api';
import { toast } from 'sonner';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Globe,
  Calendar,
  BookOpen,
  Star,
  ShieldBan,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

const formatUGX = (amount: number) =>
  new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(amount);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' });

const roleBadge: Record<string, string> = {
  ADMIN: 'bg-purple-50 text-purple-700 ring-purple-600/20',
  INSTRUCTOR: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  FARMER: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
};

/* ── Skeletons ────────────────────────────────────────── */

function SkeletonProfile() {
  return (
    <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6 animate-pulse space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#2E7D32]/10" />
        <div className="space-y-2 flex-1">
          <div className="h-6 w-40 bg-[#2E7D32]/10 rounded" />
          <div className="h-4 w-56 bg-[#2E7D32]/10 rounded" />
        </div>
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-4 w-full bg-[#2E7D32]/10 rounded" />
      ))}
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-12 w-full bg-[#2E7D32]/10 rounded" />
      ))}
    </div>
  );
}

/* ── Main component ───────────────────────────────────── */

export function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'enrollments' | 'reviews'>('enrollments');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchApi(`/admin/users/${id}`)
      .then((data) => {
        setUser(data.user || data);
        setEnrollments(data.enrollments || []);
        setReviews(data.reviews || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleRoleChange = async (role: string) => {
    setActionLoading('role');
    try {
      await fetchApi(`/admin/users/${id}/role`, {
        method: 'POST',
        body: JSON.stringify({ role }),
      });
      setUser((prev: any) => ({ ...prev, role }));
      toast.success(`Role updated to ${role}`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async () => {
    const willSuspend = user.isVerified !== false;
    setActionLoading('suspend');
    try {
      await fetchApi(`/admin/users/${id}/suspend`, {
        method: 'POST',
        body: JSON.stringify({ suspended: willSuspend }),
      });
      setUser((prev: any) => ({ ...prev, isVerified: !willSuspend }));
      toast.success(willSuspend ? 'User suspended' : 'User activated');
    } catch (e: any) {
      toast.error(e.message || 'Failed to update user status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBan = async () => {
    if (!window.confirm('Are you sure you want to ban this user? This action is severe.')) return;
    setActionLoading('ban');
    try {
      await fetchApi(`/admin/users/${id}/ban`, { method: 'POST' });
      setUser((prev: any) => ({ ...prev, isBanned: true, isVerified: false }));
      toast.success('User has been banned');
    } catch (e: any) {
      toast.error(e.message || 'Failed to ban user');
    } finally {
      setActionLoading(null);
    }
  };

  /* ── Error state ──────────────────────────────────────── */

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <span className="text-red-500 text-2xl">!</span>
        </div>
        <p className="text-[#1B2B1B] font-semibold mb-1">Failed to load user</p>
        <p className="text-sm text-[#5A6E5A]">{error}</p>
        <button
          onClick={() => navigate('/admin/users')}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-[#2E7D32]/20 text-[#1B2B1B] hover:bg-[#FAFAF5] transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Users
        </button>
      </div>
    );
  }

  const tabs = [
    { key: 'enrollments' as const, label: 'Enrollments', count: enrollments.length },
    { key: 'reviews' as const, label: 'Reviews', count: reviews.length },
  ];

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/users')}
          className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#2E7D32]/20 text-[#1B2B1B] hover:bg-[#FAFAF5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#1B2B1B]">User Detail</h1>
          <p className="text-sm text-[#5A6E5A] mt-0.5">View and manage user account</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Profile + Activity */}
        <div className="lg:w-[70%] space-y-6">
          {/* Profile card */}
          {loading ? (
            <SkeletonProfile />
          ) : (
            <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-[#2E7D32]/10 flex items-center justify-center flex-shrink-0">
                  {user.profile?.avatarUrl ? (
                    <img src={user.profile.avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <User size={28} className="text-[#5A6E5A]" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-xl font-bold text-[#1B2B1B]">
                      {user.profile?.displayName || 'Unknown'}
                    </h2>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ring-1 ring-inset ${
                        roleBadge[user.role] || 'bg-gray-50 text-gray-700'
                      }`}
                    >
                      {user.role}
                    </span>
                    {user.isVerified === false && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full ring-1 ring-inset bg-red-50 text-red-700 ring-red-600/20">
                        SUSPENDED
                      </span>
                    )}
                  </div>
                  {user.profile?.bio && (
                    <p className="text-sm text-[#5A6E5A] mt-1">{user.profile.bio}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {user.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail size={16} className="text-[#5A6E5A]" />
                    <span className="text-[#1B2B1B]">{user.email}</span>
                  </div>
                )}
                {user.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone size={16} className="text-[#5A6E5A]" />
                    <span className="text-[#1B2B1B]">{user.phone}</span>
                  </div>
                )}
                {user.profile?.country && (
                  <div className="flex items-center gap-3 text-sm">
                    <Globe size={16} className="text-[#5A6E5A]" />
                    <span className="text-[#1B2B1B]">{user.profile.country}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Calendar size={16} className="text-[#5A6E5A]" />
                  <span className="text-[#1B2B1B]">Joined {formatDate(user.createdAt)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Activity tabs */}
          {loading ? (
            <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6">
              <SkeletonTable />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#2E7D32]/10">
              {/* Tab header */}
              <div className="flex gap-1 px-6 pt-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                      activeTab === tab.key
                        ? 'bg-[#2E7D32]/10 text-[#2E7D32] border-b-2 border-[#2E7D32]'
                        : 'text-[#5A6E5A] hover:text-[#1B2B1B]'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === 'enrollments' && (
                  enrollments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr className="border-b border-[#2E7D32]/10">
                            <th className="py-3 pr-4 text-xs font-semibold text-[#5A6E5A] uppercase tracking-wide">Course</th>
                            <th className="py-3 pr-4 text-xs font-semibold text-[#5A6E5A] uppercase tracking-wide">Progress</th>
                            <th className="py-3 pr-4 text-xs font-semibold text-[#5A6E5A] uppercase tracking-wide">Amount Paid</th>
                            <th className="py-3 text-xs font-semibold text-[#5A6E5A] uppercase tracking-wide">Enrolled</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2E7D32]/5">
                          {enrollments.map((enr: any) => (
                            <tr key={enr.id}>
                              <td className="py-3 pr-4 font-medium text-[#1B2B1B]">
                                {enr.course?.title || 'Unknown Course'}
                              </td>
                              <td className="py-3 pr-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-24 h-2 bg-[#2E7D32]/10 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-[#2E7D32] rounded-full"
                                      style={{ width: `${enr.progress || 0}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-[#5A6E5A]">{enr.progress || 0}%</span>
                                </div>
                              </td>
                              <td className="py-3 pr-4 text-[#1B2B1B]">
                                {formatUGX(Number(enr.amountPaid || 0))}
                              </td>
                              <td className="py-3 text-[#5A6E5A]">{formatDate(enr.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-10 text-center">
                      <div className="w-12 h-12 rounded-full bg-[#2E7D32]/5 flex items-center justify-center mx-auto mb-3">
                        <BookOpen size={20} className="text-[#5A6E5A]" />
                      </div>
                      <p className="text-sm text-[#5A6E5A]">No enrollments yet.</p>
                    </div>
                  )
                )}

                {activeTab === 'reviews' && (
                  reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review: any) => (
                        <div key={review.id} className="border border-[#2E7D32]/10 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium text-[#1B2B1B] text-sm">
                              {review.course?.title || 'Unknown Course'}
                            </p>
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  size={14}
                                  className={i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-[#5A6E5A] leading-relaxed">{review.body}</p>
                          <p className="text-xs text-[#5A6E5A] mt-2">{formatDate(review.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 text-center">
                      <div className="w-12 h-12 rounded-full bg-[#2E7D32]/5 flex items-center justify-center mx-auto mb-3">
                        <Star size={20} className="text-[#5A6E5A]" />
                      </div>
                      <p className="text-sm text-[#5A6E5A]">No reviews yet.</p>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Admin Actions Sidebar (30%) */}
        <div className="lg:w-[30%]">
          <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6 sticky top-6 space-y-6">
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 w-full bg-[#2E7D32]/10 rounded" />
                ))}
              </div>
            ) : (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-[#1B2B1B] mb-4">Admin Actions</h3>

                  {/* Role change */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-[#1B2B1B] mb-2">Change Role</label>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      disabled={actionLoading === 'role'}
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#2E7D32]/20 bg-white text-[#1B2B1B] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent disabled:opacity-50 transition-colors"
                    >
                      <option value="FARMER">FARMER</option>
                      <option value="INSTRUCTOR">INSTRUCTOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-[#2E7D32]/10 pt-4 space-y-3">
                  {/* Suspend / Activate */}
                  <button
                    onClick={handleSuspend}
                    disabled={!!actionLoading}
                    className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                      user.isVerified === false
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:ring-emerald-500'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100 focus-visible:ring-amber-500'
                    }`}
                  >
                    {actionLoading === 'suspend' ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : user.isVerified === false ? (
                      <ShieldCheck size={16} />
                    ) : (
                      <ShieldBan size={16} />
                    )}
                    {user.isVerified === false ? 'Activate User' : 'Suspend User'}
                  </button>

                  {/* Ban */}
                  <button
                    onClick={handleBan}
                    disabled={!!actionLoading || user.isBanned}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                  >
                    {actionLoading === 'ban' ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <ShieldBan size={16} />
                    )}
                    {user.isBanned ? 'User Banned' : 'Ban User'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
