import { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api';
import { toast } from 'sonner';
import {
  Settings,
  CreditCard,
  BookCheck,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Save,
} from 'lucide-react';

type SettingsTab = 'general' | 'payments' | 'content' | 'features';

const tabs: { key: SettingsTab; label: string; icon: any }[] = [
  { key: 'general', label: 'General', icon: Settings },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'content', label: 'Content Standards', icon: BookCheck },
  { key: 'features', label: 'Feature Flags', icon: ToggleRight },
];

/* ── Skeleton ─────────────────────────────────────────── */

function SkeletonFields() {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-32 bg-[#2E7D32]/10 rounded" />
          <div className="h-10 w-full bg-[#2E7D32]/10 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/* ── Toggle Switch ────────────────────────────────────── */

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 disabled:opacity-50 ${
        checked ? 'bg-[#2E7D32]' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

/* ── Main component ───────────────────────────────────── */

export function SettingsLayout() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Settings state
  const [general, setGeneral] = useState({
    platformName: 'AAN Academy',
    tagline: 'Empowering Agricultural Learning',
    supportEmail: 'support@aan.academy',
  });

  const [payments, setPayments] = useState({
    defaultInstructorSharePercent: 70,
    minPayoutThreshold: 50000,
  });

  const [content, setContent] = useState({
    minLecturesPerCourse: 5,
    minLectureDuration: 120,
  });

  const [features, setFeatures] = useState({
    certificates_enabled: true,
    qa_enabled: true,
    offline_downloads_enabled: true,
    reviews_enabled: true,
    coupons_enabled: true,
    sms_notifications_enabled: true,
  });

  useEffect(() => {
    fetchApi('/admin/settings')
      .then((data) => {
        if (data.general) setGeneral(data.general);
        if (data.payments) setPayments(data.payments);
        if (data.content) setContent(data.content);
        if (data.features) setFeatures((prev) => ({ ...prev, ...data.features }));
      })
      .catch(() => {
        // Use defaults if settings endpoint doesn't exist yet
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (section: string, data: any) => {
    setSaving(section);
    try {
      await fetchApi('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({ section, data }),
      });
      toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save settings');
    } finally {
      setSaving(null);
    }
  };

  const featureFlags = [
    { key: 'certificates_enabled', label: 'Certificates', description: 'Allow users to earn course completion certificates' },
    { key: 'qa_enabled', label: 'Q&A Forum', description: 'Enable questions and answers on lectures' },
    { key: 'offline_downloads_enabled', label: 'Offline Downloads', description: 'Allow users to download courses for offline viewing' },
    { key: 'reviews_enabled', label: 'Course Reviews', description: 'Allow farmers to leave reviews on courses' },
    { key: 'coupons_enabled', label: 'Coupons', description: 'Enable discount coupon functionality' },
    { key: 'sms_notifications_enabled', label: 'SMS Notifications', description: 'Send SMS notifications via AfricasTalking' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1B2B1B]">Platform Settings</h1>
        <p className="text-sm text-[#5A6E5A] mt-1">Configure platform behavior and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tab sidebar */}
        <div className="lg:w-56 flex-shrink-0">
          <nav className="flex lg:flex-col gap-1 bg-[#FAFAF5] lg:bg-transparent p-1 lg:p-0 rounded-lg lg:rounded-none border border-[#2E7D32]/10 lg:border-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors w-full text-left ${
                    activeTab === tab.key
                      ? 'bg-white lg:bg-[#2E7D32]/10 text-[#2E7D32] shadow-sm lg:shadow-none'
                      : 'text-[#5A6E5A] hover:text-[#1B2B1B] hover:bg-white lg:hover:bg-[#2E7D32]/5'
                  }`}
                >
                  <Icon size={18} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content area */}
        <div className="flex-1">
          {loading ? (
            <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6">
              <SkeletonFields />
            </div>
          ) : (
            <>
              {/* General */}
              {activeTab === 'general' && (
                <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6 space-y-5">
                  <h2 className="text-lg font-semibold text-[#1B2B1B]">General Settings</h2>

                  <div>
                    <label className="block text-sm font-medium text-[#1B2B1B] mb-1.5">Platform Name</label>
                    <input
                      type="text"
                      value={general.platformName}
                      onChange={(e) => setGeneral((p) => ({ ...p, platformName: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#2E7D32]/20 bg-white text-[#1B2B1B] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1B2B1B] mb-1.5">Tagline</label>
                    <input
                      type="text"
                      value={general.tagline}
                      onChange={(e) => setGeneral((p) => ({ ...p, tagline: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#2E7D32]/20 bg-white text-[#1B2B1B] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1B2B1B] mb-1.5">Support Email</label>
                    <input
                      type="email"
                      value={general.supportEmail}
                      onChange={(e) => setGeneral((p) => ({ ...p, supportEmail: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#2E7D32]/20 bg-white text-[#1B2B1B] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent transition-colors"
                    />
                  </div>

                  <button
                    onClick={() => handleSave('general', general)}
                    disabled={saving === 'general'}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-[#2E7D32] text-white hover:bg-[#2E7D32]/90 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                  >
                    {saving === 'general' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Save General Settings
                  </button>
                </div>
              )}

              {/* Payments */}
              {activeTab === 'payments' && (
                <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6 space-y-5">
                  <h2 className="text-lg font-semibold text-[#1B2B1B]">Revenue Split</h2>

                  <div>
                    <label className="block text-sm font-medium text-[#1B2B1B] mb-1.5">
                      Default Instructor Share (%)
                    </label>
                    <input
                      type="number"
                      value={payments.defaultInstructorSharePercent}
                      onChange={(e) => setPayments((p) => ({ ...p, defaultInstructorSharePercent: Number(e.target.value) }))}
                      min="0"
                      max="100"
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#2E7D32]/20 bg-white text-[#1B2B1B] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent transition-colors"
                    />
                    <p className="text-xs text-[#5A6E5A] mt-1">
                      Percentage of each sale kept by the instructor. The platform keeps the remainder
                      ({Math.max(0, Math.min(100, 100 - payments.defaultInstructorSharePercent))}%).
                      Changes apply to <strong>future</strong> sales only — past earnings keep the share
                      that was in effect when the customer paid.
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#FAFAF5] border border-[#2E7D32]/10 p-4">
                    <p className="text-xs text-[#5A6E5A] leading-relaxed">
                      <strong className="text-[#1B2B1B]">Per-course override:</strong> for partner
                      courses (e.g. universities), set the instructor share to <strong>100%</strong>
                      directly on the course's edit page. Set it to <strong>blank</strong> to use the
                      default above.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1B2B1B] mb-1.5">Minimum Payout Threshold (UGX)</label>
                    <input
                      type="number"
                      value={payments.minPayoutThreshold}
                      onChange={(e) => setPayments((p) => ({ ...p, minPayoutThreshold: Number(e.target.value) }))}
                      min="0"
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#2E7D32]/20 bg-white text-[#1B2B1B] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent transition-colors"
                    />
                    <p className="text-xs text-[#5A6E5A] mt-1">
                      Minimum pending balance before an instructor is included in the next payout batch.
                    </p>
                  </div>

                  <button
                    onClick={() => handleSave('payments', payments)}
                    disabled={saving === 'payments'}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-[#2E7D32] text-white hover:bg-[#2E7D32]/90 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                  >
                    {saving === 'payments' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Save Payment Settings
                  </button>
                </div>
              )}

              {/* Content Standards */}
              {activeTab === 'content' && (
                <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6 space-y-5">
                  <h2 className="text-lg font-semibold text-[#1B2B1B]">Content Standards</h2>

                  <div>
                    <label className="block text-sm font-medium text-[#1B2B1B] mb-1.5">Minimum Lectures per Course</label>
                    <input
                      type="number"
                      value={content.minLecturesPerCourse}
                      onChange={(e) => setContent((p) => ({ ...p, minLecturesPerCourse: Number(e.target.value) }))}
                      min="1"
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#2E7D32]/20 bg-white text-[#1B2B1B] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent transition-colors"
                    />
                    <p className="text-xs text-[#5A6E5A] mt-1">
                      Courses must have at least this many lectures before submission for review.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1B2B1B] mb-1.5">Minimum Lecture Duration (seconds)</label>
                    <input
                      type="number"
                      value={content.minLectureDuration}
                      onChange={(e) => setContent((p) => ({ ...p, minLectureDuration: Number(e.target.value) }))}
                      min="0"
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#2E7D32]/20 bg-white text-[#1B2B1B] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent transition-colors"
                    />
                    <p className="text-xs text-[#5A6E5A] mt-1">
                      Each lecture video must be at least this long. Currently set to {Math.round(content.minLectureDuration / 60)} minutes.
                    </p>
                  </div>

                  <button
                    onClick={() => handleSave('content', content)}
                    disabled={saving === 'content'}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-[#2E7D32] text-white hover:bg-[#2E7D32]/90 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                  >
                    {saving === 'content' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Save Content Standards
                  </button>
                </div>
              )}

              {/* Feature Flags */}
              {activeTab === 'features' && (
                <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6 space-y-2">
                  <h2 className="text-lg font-semibold text-[#1B2B1B] mb-4">Feature Flags</h2>

                  <div className="divide-y divide-[#2E7D32]/10">
                    {featureFlags.map((flag) => (
                      <div key={flag.key} className="flex items-center justify-between py-4">
                        <div>
                          <p className="text-sm font-medium text-[#1B2B1B]">{flag.label}</p>
                          <p className="text-xs text-[#5A6E5A]">{flag.description}</p>
                        </div>
                        <Toggle
                          checked={features[flag.key as keyof typeof features]}
                          onChange={() =>
                            setFeatures((prev) => ({
                              ...prev,
                              [flag.key]: !prev[flag.key as keyof typeof features],
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => handleSave('features', features)}
                      disabled={saving === 'features'}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-[#2E7D32] text-white hover:bg-[#2E7D32]/90 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                    >
                      {saving === 'features' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      Save Feature Flags
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
