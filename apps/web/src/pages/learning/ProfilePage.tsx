import { useState, useEffect, useRef } from 'react';
import { fetchApi } from '../../lib/api';
import { uploadToCloudinary, type UploadProgress } from '../../lib/upload';
import { UploadProgressBar } from '../../components/ui/UploadProgress';
import { cloudinaryImageUrl, formatUGX } from '../../lib/utils';
import { useAuthStore } from '../../store/useAuthStore';
import {
  User,
  Camera,
  Bell,
  Shield,
  BookOpen,
  CreditCard,
  Save,
  Loader2,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

type TabKey = 'profile' | 'notifications' | 'security' | 'learning' | 'billing';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'learning', label: 'Learning', icon: BookOpen },
  { key: 'billing', label: 'Billing', icon: CreditCard },
];

const NOTIFICATION_TYPES = [
  { key: 'ENROLLMENT_CONFIRMED', label: 'Enrollment Confirmed' },
  { key: 'CERTIFICATE_ISSUED', label: 'Certificate Issued' },
  { key: 'NEW_ANNOUNCEMENT', label: 'New Announcement' },
  { key: 'NEW_ANSWER', label: 'Question Answered' },
  { key: 'COURSE_UPDATE', label: 'Course Update' },
  { key: 'PROMOTION', label: 'Promotions' },
];

const CHANNELS = ['email', 'sms', 'inApp'] as const;

const CLOUD_NAME = (import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME;

interface NotificationPrefs {
  [type: string]: { email: boolean; sms: boolean; inApp: boolean };
}

interface Purchase {
  id: string;
  courseTitle: string;
  amount: string;
  date: string;
  courseId: string;
  progressPercent: number;
  refundable: boolean;
}

function SectionSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3" />
      <div className="h-12 bg-gray-100 rounded w-full" />
      <div className="h-12 bg-gray-100 rounded w-full" />
      <div className="h-12 bg-gray-100 rounded w-2/3" />
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile fields
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [avatarPublicId, setAvatarPublicId] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarProgress, setAvatarProgress] = useState<UploadProgress | null>(null);

  // Notification prefs
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(() => {
    const prefs: NotificationPrefs = {};
    NOTIFICATION_TYPES.forEach((nt) => {
      prefs[nt.key] = { email: true, sms: false, inApp: true };
    });
    return prefs;
  });

  // Security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Learning prefs
  const [videoQuality, setVideoQuality] = useState('auto');
  const [playbackSpeed, setPlaybackSpeed] = useState('1');
  const [autoplayNext, setAutoplayNext] = useState(true);

  // Billing
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [refundingId, setRefundingId] = useState<string | null>(null);

  // Load profile
  useEffect(() => {
    fetchApi('/profile')
      .then((data: any) => {
        const p = data.profile || data;
        setDisplayName(p.displayName || '');
        setPhone(p.phone || data.user?.phone || '');
        setBio(p.bio || '');
        setCountry(p.country || p.farmLocation?.split(',').pop()?.trim() || '');
        setRegion(p.region || p.farmLocation?.split(',')[0]?.trim() || '');
        setAvatarPublicId(p.avatarPublicId || '');
        if (p.notificationPrefs) setNotifPrefs(p.notificationPrefs);
        if (p.learningPrefs) {
          setVideoQuality(p.learningPrefs.videoQuality || 'auto');
          setPlaybackSpeed(p.learningPrefs.playbackSpeed || '1');
          setAutoplayNext(p.learningPrefs.autoplayNext ?? true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Load purchases when billing tab active
  useEffect(() => {
    if (activeTab === 'billing' && purchases.length === 0) {
      setLoadingPurchases(true);
      fetchApi('/enrollments')
        .then((res) => {
          const enrs = res.enrollments || [];
          setPurchases(
            enrs
              .filter((e: any) => e.paidAmount || e.course?.price)
              .map((e: any) => {
                const daysSinceEnroll = Math.floor(
                  (Date.now() - new Date(e.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                );
                return {
                  id: e.id,
                  courseTitle: e.course?.title || 'Untitled',
                  amount: e.paidAmount || e.course?.price || '0',
                  date: e.createdAt,
                  courseId: e.course?.id || e.courseId,
                  progressPercent: e.completionPercent ?? e.progressPercent ?? 0,
                  refundable: daysSinceEnroll < 30 && (e.completionPercent ?? 0) < 30,
                };
              })
          );
        })
        .catch(console.error)
        .finally(() => setLoadingPurchases(false));
    }
  }, [activeTab]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setAvatarProgress({ loaded: 0, total: file.size, percent: 0, etaSeconds: null, bytesPerSec: 0 });
    try {
      const signRes = await fetchApi('/media/sign?folder=avatars&type=image');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signRes.apiKey);
      formData.append('timestamp', String(signRes.timestamp));
      formData.append('signature', signRes.signature);
      formData.append('folder', signRes.folder);
      if (signRes.eager) formData.append('eager', signRes.eager);

      const cloudName = signRes.cloudName || CLOUD_NAME;
      const uploadData = await uploadToCloudinary({
        cloudName,
        resourceType: 'image',
        formData,
        onProgress: setAvatarProgress,
      });
      let publicId: string = uploadData.public_id;
      if (publicId.startsWith('farmwise/')) publicId = publicId.slice('farmwise/'.length);

      await fetchApi('/profile', {
        method: 'PUT',
        body: JSON.stringify({ avatarPublicId: publicId }),
      });
      setAvatarPublicId(publicId);
      toast.success('Avatar updated');
    } catch (err: any) {
      toast.error(err.message || 'Avatar upload failed');
    } finally {
      setUploadingAvatar(false);
      setAvatarProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await fetchApi('/profile', {
        method: 'PUT',
        body: JSON.stringify({
          displayName: displayName || null,
          bio: bio || null,
          phone: phone || null,
          country: country || null,
          region: region || null,
        }),
      });
      toast.success('Profile saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      await fetchApi('/profile', {
        method: 'PUT',
        body: JSON.stringify({ notificationPrefs: notifPrefs }),
      });
      toast.success('Notification preferences saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setChangingPassword(true);
    try {
      await fetchApi('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveLearning = async () => {
    setSaving(true);
    try {
      await fetchApi('/profile', {
        method: 'PUT',
        body: JSON.stringify({
          learningPrefs: { videoQuality, playbackSpeed, autoplayNext },
        }),
      });
      toast.success('Learning preferences saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleRefund = async (purchase: Purchase) => {
    if (!confirm(`Request a refund for "${purchase.courseTitle}"?`)) return;
    setRefundingId(purchase.id);
    try {
      await fetchApi(`/enrollments/${purchase.id}/refund`, { method: 'POST' });
      toast.success('Refund requested successfully');
      setPurchases((prev) =>
        prev.map((p) => (p.id === purchase.id ? { ...p, refundable: false } : p))
      );
    } catch (err: any) {
      toast.error(err.message || 'Refund request failed');
    } finally {
      setRefundingId(null);
    }
  };

  const toggleNotifPref = (type: string, channel: (typeof CHANNELS)[number]) => {
    setNotifPrefs((prev) => ({
      ...prev,
      [type]: { ...prev[type], [channel]: !prev[type][channel] },
    }));
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-UG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF5] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#2E7D32]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF5]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1B2B1B] mb-6">Account Settings</h1>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-8 scrollbar-hide -mx-4 px-4">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] ${
                  activeTab === tab.key
                    ? 'bg-[#2E7D32] text-white'
                    : 'text-[#5A6E5A] hover:text-[#1B2B1B] hover:bg-white'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Avatar */}
            <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6">
              <h2 className="text-lg font-semibold text-[#1B2B1B] mb-4">Profile Photo</h2>
              <div className="flex items-center gap-6">
                {avatarPublicId ? (
                  <img
                    src={cloudinaryImageUrl(avatarPublicId, 128, 128)}
                    alt="Avatar"
                    className="h-20 w-20 rounded-full object-cover border-2 border-[#2E7D32]"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                    <User className="h-8 w-8 text-[#5A6E5A]" />
                  </div>
                )}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2E7D32]/20 text-sm text-[#1B2B1B] hover:bg-[#2E7D32]/5 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32]"
                  >
                    {uploadingAvatar ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Camera size={16} />
                        Change Photo
                      </>
                    )}
                  </button>
                </div>
                {uploadingAvatar && avatarProgress && (
                  <div className="mt-3">
                    <UploadProgressBar progress={avatarProgress} label="Uploading avatar" compact />
                  </div>
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-[#1B2B1B]">Basic Information</h2>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#1B2B1B]">Full Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-[#FAFAF5] text-sm text-[#1B2B1B] placeholder:text-[#5A6E5A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#1B2B1B]">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+256 7XX XXX XXX"
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-[#FAFAF5] text-sm text-[#1B2B1B] placeholder:text-[#5A6E5A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#1B2B1B]">Bio</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-[#FAFAF5] text-sm text-[#1B2B1B] placeholder:text-[#5A6E5A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#1B2B1B]">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Uganda"
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-[#FAFAF5] text-sm text-[#1B2B1B] placeholder:text-[#5A6E5A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#1B2B1B]">Region</label>
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="e.g., Northern Region"
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-[#FAFAF5] text-sm text-[#1B2B1B] placeholder:text-[#5A6E5A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                  />
                </div>
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#2E7D32] text-white font-medium rounded-lg hover:bg-[#2E7D32]/90 transition-colors text-sm disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Profile
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6">
            <h2 className="text-lg font-semibold text-[#1B2B1B] mb-4">Notification Preferences</h2>
            <p className="text-sm text-[#5A6E5A] mb-6">
              Choose how you want to be notified for each event.
            </p>

            {/* Header */}
            <div className="hidden sm:grid grid-cols-[1fr_80px_80px_80px] gap-2 mb-2 px-2">
              <div />
              <span className="text-xs font-medium text-[#5A6E5A] text-center">Email</span>
              <span className="text-xs font-medium text-[#5A6E5A] text-center">SMS</span>
              <span className="text-xs font-medium text-[#5A6E5A] text-center">In-App</span>
            </div>

            <div className="space-y-1">
              {NOTIFICATION_TYPES.map((nt) => (
                <div
                  key={nt.key}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_80px_80px_80px] gap-2 items-center p-2 rounded-lg hover:bg-[#FAFAF5]"
                >
                  <span className="text-sm text-[#1B2B1B] font-medium">{nt.label}</span>
                  {CHANNELS.map((ch) => (
                    <label
                      key={ch}
                      className="flex items-center gap-2 sm:justify-center cursor-pointer"
                    >
                      <span className="text-xs text-[#5A6E5A] sm:hidden capitalize">{ch === 'inApp' ? 'In-App' : ch}</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={notifPrefs[nt.key]?.[ch] ?? false}
                        onClick={() => toggleNotifPref(nt.key, ch)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 ${
                          notifPrefs[nt.key]?.[ch]
                            ? 'bg-[#2E7D32]'
                            : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                            notifPrefs[nt.key]?.[ch] ? 'translate-x-[18px]' : 'translate-x-[3px]'
                          }`}
                        />
                      </button>
                    </label>
                  ))}
                </div>
              ))}
            </div>

            <button
              onClick={handleSaveNotifications}
              disabled={saving}
              className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-[#2E7D32] text-white font-medium rounded-lg hover:bg-[#2E7D32]/90 transition-colors text-sm disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Preferences
                </>
              )}
            </button>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6">
            <h2 className="text-lg font-semibold text-[#1B2B1B] mb-4">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#1B2B1B]">Current Password</label>
                <div className="relative">
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full h-10 px-3 pr-10 rounded-lg border border-gray-200 bg-[#FAFAF5] text-sm text-[#1B2B1B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5A6E5A] hover:text-[#1B2B1B]"
                  >
                    {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#1B2B1B]">New Password</label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-[#FAFAF5] text-sm text-[#1B2B1B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#1B2B1B]">Confirm New Password</label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-[#FAFAF5] text-sm text-[#1B2B1B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
              </div>
              <button
                type="submit"
                disabled={changingPassword}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#2E7D32] text-white font-medium rounded-lg hover:bg-[#2E7D32]/90 transition-colors text-sm disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
              >
                {changingPassword ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Changing...
                  </>
                ) : (
                  <>
                    <Shield size={16} />
                    Change Password
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Learning Tab */}
        {activeTab === 'learning' && (
          <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-[#1B2B1B]">Learning Preferences</h2>

            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#1B2B1B]">
                  Default Video Quality
                </label>
                <select
                  value={videoQuality}
                  onChange={(e) => setVideoQuality(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-[#FAFAF5] text-sm text-[#1B2B1B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32]"
                >
                  <option value="auto">Auto</option>
                  <option value="360p">360p</option>
                  <option value="720p">720p</option>
                  <option value="1080p">1080p</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#1B2B1B]">
                  Default Playback Speed
                </label>
                <select
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-[#FAFAF5] text-sm text-[#1B2B1B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32]"
                >
                  <option value="0.5">0.5x</option>
                  <option value="0.75">0.75x</option>
                  <option value="1">1x (Normal)</option>
                  <option value="1.25">1.25x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2">2x</option>
                </select>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-[#1B2B1B]">Autoplay Next Lecture</p>
                  <p className="text-xs text-[#5A6E5A]">
                    Automatically play the next lecture when one finishes
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoplayNext}
                  onClick={() => setAutoplayNext(!autoplayNext)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 ${
                    autoplayNext ? 'bg-[#2E7D32]' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      autoplayNext ? 'translate-x-[22px]' : 'translate-x-[3px]'
                    }`}
                  />
                </button>
              </div>
            </div>

            <button
              onClick={handleSaveLearning}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#2E7D32] text-white font-medium rounded-lg hover:bg-[#2E7D32]/90 transition-colors text-sm disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Preferences
                </>
              )}
            </button>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6">
            <h2 className="text-lg font-semibold text-[#1B2B1B] mb-4">Purchase History</h2>

            {loadingPurchases ? (
              <SectionSkeleton />
            ) : purchases.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-medium text-[#5A6E5A]">Course</th>
                      <th className="text-left py-3 px-2 font-medium text-[#5A6E5A]">Amount</th>
                      <th className="text-left py-3 px-2 font-medium text-[#5A6E5A]">Date</th>
                      <th className="text-right py-3 px-2 font-medium text-[#5A6E5A]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((p) => (
                      <tr key={p.id} className="border-b border-gray-100 last:border-0">
                        <td className="py-3 px-2 text-[#1B2B1B] font-medium max-w-[200px] truncate">
                          {p.courseTitle}
                        </td>
                        <td className="py-3 px-2 text-[#1B2B1B]">{formatUGX(p.amount)}</td>
                        <td className="py-3 px-2 text-[#5A6E5A]">{formatDate(p.date)}</td>
                        <td className="py-3 px-2 text-right">
                          {p.refundable ? (
                            <button
                              onClick={() => handleRefund(p)}
                              disabled={refundingId === p.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                            >
                              {refundingId === p.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <RefreshCw size={12} />
                              )}
                              Refund
                            </button>
                          ) : (
                            <span className="text-xs text-[#5A6E5A]">--</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <CreditCard className="h-10 w-10 text-[#5A6E5A]/40 mx-auto mb-3" />
                <p className="text-sm text-[#5A6E5A]">No purchases yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
