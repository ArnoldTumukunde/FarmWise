import { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api';
import { toast } from 'sonner';
import {
  Send,
  Megaphone,
  Loader2,
  Clock,
  CheckCircle,
  Mail,
  MessageSquare,
  Bell,
} from 'lucide-react';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const SMS_LIMIT = 160;

/* ── Skeleton ─────────────────────────────────────────── */



/* ── Main component ───────────────────────────────────── */

export function BroadcastLayout() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Form state
  const [recipients, setRecipients] = useState<'ALL_FARMERS' | 'ALL_INSTRUCTORS' | 'ALL_USERS'>('ALL_FARMERS');
  const [channels, setChannels] = useState<{ inApp: boolean; email: boolean; sms: boolean }>({
    inApp: true,
    email: false,
    sms: false,
  });
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [scheduleType, setScheduleType] = useState<'now' | 'scheduled'>('now');
  const [scheduledAt, setScheduledAt] = useState('');

  useEffect(() => {
    fetchApi('/admin/notifications/broadcasts')
      .then((data) => setHistory(data.broadcasts || data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleChannel = (ch: keyof typeof channels) => {
    setChannels((prev) => ({ ...prev, [ch]: !prev[ch] }));
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Subject and message are required');
      return;
    }
    if (!channels.inApp && !channels.email && !channels.sms) {
      toast.error('Select at least one channel');
      return;
    }
    if (scheduleType === 'scheduled' && !scheduledAt) {
      toast.error('Select a scheduled date/time');
      return;
    }

    setSending(true);
    try {
      await fetchApi('/admin/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          recipients,
          channels: Object.entries(channels)
            .filter(([, v]) => v)
            .map(([k]) => k),
          subject: subject.trim(),
          message: message.trim(),
          ...(scheduleType === 'scheduled' ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
        }),
      });
      toast.success(scheduleType === 'scheduled' ? 'Broadcast scheduled' : 'Broadcast sent');
      setSubject('');
      setMessage('');
      // Refresh history
      fetchApi('/admin/notifications/broadcasts')
        .then((data) => setHistory(data.broadcasts || data || []))
        .catch(() => {});
    } catch (e: any) {
      toast.error(e.message || 'Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  const recipientOptions = [
    { value: 'ALL_FARMERS' as const, label: 'All Farmers' },
    { value: 'ALL_INSTRUCTORS' as const, label: 'All Instructors' },
    { value: 'ALL_USERS' as const, label: 'All Users' },
  ];

  const channelOptions = [
    { key: 'inApp' as const, label: 'In-app', icon: Bell },
    { key: 'email' as const, label: 'Email', icon: Mail },
    { key: 'sms' as const, label: 'SMS', icon: MessageSquare },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1B2B1B]">Broadcast Notifications</h1>
        <p className="text-sm text-[#5A6E5A] mt-1">Send announcements to groups of users</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Compose Form (3 cols) */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-[#1B2B1B] flex items-center gap-2">
              <Megaphone size={18} className="text-[#2E7D32]" />
              Compose Broadcast
            </h2>

            {/* Recipients */}
            <div>
              <label className="block text-sm font-medium text-[#1B2B1B] mb-1.5">Recipients</label>
              <select
                value={recipients}
                onChange={(e) => setRecipients(e.target.value as any)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#2E7D32]/20 bg-white text-[#1B2B1B] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent transition-colors"
              >
                {recipientOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Channels */}
            <div>
              <label className="block text-sm font-medium text-[#1B2B1B] mb-2">Channels</label>
              <div className="flex gap-3 flex-wrap">
                {channelOptions.map((ch) => {
                  const Icon = ch.icon;
                  const active = channels[ch.key];
                  return (
                    <button
                      key={ch.key}
                      type="button"
                      onClick={() => toggleChannel(ch.key)}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 ${
                        active
                          ? 'bg-[#2E7D32]/10 border-[#2E7D32]/30 text-[#2E7D32]'
                          : 'border-[#2E7D32]/20 text-[#5A6E5A] hover:bg-[#FAFAF5]'
                      }`}
                    >
                      <Icon size={16} />
                      {ch.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-[#1B2B1B] mb-1.5">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Notification subject..."
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#2E7D32]/20 bg-white text-[#1B2B1B] placeholder:text-[#5A6E5A]/60 focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent transition-colors"
              />
            </div>

            {/* Message */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-[#1B2B1B]">Message</label>
                {channels.sms && (
                  <span className={`text-xs ${message.length > SMS_LIMIT ? 'text-red-500 font-semibold' : 'text-[#5A6E5A]'}`}>
                    {message.length}/{SMS_LIMIT} characters (SMS)
                  </span>
                )}
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                placeholder="Write your notification message..."
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#2E7D32]/20 bg-white text-[#1B2B1B] placeholder:text-[#5A6E5A]/60 focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent resize-none transition-colors"
              />
            </div>

            {/* Schedule */}
            <div>
              <label className="block text-sm font-medium text-[#1B2B1B] mb-2">Schedule</label>
              <div className="flex gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => setScheduleType('now')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    scheduleType === 'now'
                      ? 'bg-[#2E7D32]/10 border-[#2E7D32]/30 text-[#2E7D32]'
                      : 'border-[#2E7D32]/20 text-[#5A6E5A] hover:bg-[#FAFAF5]'
                  }`}
                >
                  Send Now
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleType('scheduled')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    scheduleType === 'scheduled'
                      ? 'bg-[#2E7D32]/10 border-[#2E7D32]/30 text-[#2E7D32]'
                      : 'border-[#2E7D32]/20 text-[#5A6E5A] hover:bg-[#FAFAF5]'
                  }`}
                >
                  Schedule
                </button>
              </div>
              {scheduleType === 'scheduled' && (
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#2E7D32]/20 bg-white text-[#1B2B1B] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent transition-colors"
                />
              )}
            </div>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={sending}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg bg-[#2E7D32] text-white hover:bg-[#2E7D32]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
            >
              {sending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              {scheduleType === 'scheduled' ? 'Schedule Broadcast' : 'Send Broadcast'}
            </button>
          </div>
        </div>

        {/* History (2 cols) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-[#2E7D32]/10">
            <div className="px-6 py-4 border-b border-[#2E7D32]/10">
              <h2 className="text-lg font-semibold text-[#1B2B1B]">Broadcast History</h2>
              <p className="text-sm text-[#5A6E5A]">Past notifications sent</p>
            </div>
            <div className="divide-y divide-[#2E7D32]/5">
              {loading ? (
                <div className="p-6 space-y-4 animate-pulse">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 w-48 bg-[#2E7D32]/10 rounded" />
                      <div className="h-3 w-32 bg-[#2E7D32]/10 rounded" />
                    </div>
                  ))}
                </div>
              ) : history.length > 0 ? (
                history.map((item) => (
                  <div key={item.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-[#1B2B1B] text-sm truncate">{item.title || item.subject}</p>
                        <p className="text-xs text-[#5A6E5A] mt-1 line-clamp-2">{item.body || item.message}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-xs text-[#5A6E5A]">{formatDate(item.createdAt || item.sentAt)}</span>
                          {item.channels?.map((ch: string) => (
                            <span
                              key={ch}
                              className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#2E7D32]/10 text-[#2E7D32]"
                            >
                              {ch}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {item.status === 'SENT' || item.status === 'DELIVERED' ? (
                          <CheckCircle size={16} className="text-[#2E7D32]" />
                        ) : (
                          <Clock size={16} className="text-amber-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-16 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#2E7D32]/5 flex items-center justify-center mx-auto mb-3">
                    <Megaphone size={20} className="text-[#5A6E5A]" />
                  </div>
                  <p className="text-sm text-[#5A6E5A]">No broadcasts sent yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
