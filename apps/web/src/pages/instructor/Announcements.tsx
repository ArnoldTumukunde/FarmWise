import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Megaphone,
  Send,
  Loader2,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

interface Announcement {
  id: string;
  subject: string;
  body: string;
  sentTo: string;
  createdAt: string;
  status: string;
}

const AUDIENCES = [
  { value: 'ALL', label: 'All Students' },
  { value: 'COMPLETED', label: 'Completed Students' },
  { value: 'IN_PROGRESS', label: 'In Progress Students' },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-UG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function SkeletonTable() {
  return (
    <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-4 space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="flex-1 h-4 bg-gray-200 rounded" />
          <div className="w-20 h-4 bg-gray-200 rounded" />
          <div className="w-24 h-4 bg-gray-200 rounded" />
          <div className="w-16 h-4 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function Announcements() {
  const { courseId } = useParams<{ courseId: string }>();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sentTo, setSentTo] = useState('ALL');

  useEffect(() => {
    if (!courseId) return;
    fetchApi(`/instructor/courses/${courseId}/announcements`)
      .then((res) => setAnnouncements(res.announcements || res.data || res || []))
      .catch(() => toast.error('Failed to load announcements'))
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleSend = async () => {
    if (!subject.trim()) {
      toast.error('Subject is required');
      return;
    }
    if (!body.trim()) {
      toast.error('Body is required');
      return;
    }
    setSending(true);
    try {
      const res = await fetchApi(`/instructor/courses/${courseId}/announcements`, {
        method: 'POST',
        body: JSON.stringify({
          subject: subject.trim(),
          body: body.trim(),
          sentTo,
        }),
      });
      const newAnn = res.announcement || res;
      setAnnouncements((prev) => [newAnn, ...prev]);
      setSubject('');
      setBody('');
      setSentTo('ALL');
      toast.success('Announcement sent');
    } catch {
      toast.error('Failed to send announcement');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-[#FAFAF5] min-h-screen p-4 md:p-8 font-[Inter]">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2B1B]">Announcements</h1>
          <p className="text-[#5A6E5A] text-sm mt-1">
            Send announcements to your students
          </p>
        </div>

        {/* Create Form */}
        <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#1B2B1B]">New Announcement</h2>

          <div className="space-y-2">
            <Label className="text-[#1B2B1B] font-medium">Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value.slice(0, 80))}
              placeholder="Announcement subject"
              className="border-[#2E7D32]/10"
            />
            <p className="text-xs text-[#5A6E5A] text-right">{subject.length}/80</p>
          </div>

          <div className="space-y-2">
            <Label className="text-[#1B2B1B] font-medium">Body</Label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your announcement..."
              rows={5}
              className="w-full rounded-md border border-[#2E7D32]/10 px-3 py-2 text-sm text-[#1B2B1B] placeholder-[#5A6E5A] focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/20 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[#1B2B1B] font-medium">Send to</Label>
            <select
              value={sentTo}
              onChange={(e) => setSentTo(e.target.value)}
              className="w-full rounded-md border border-[#2E7D32]/10 px-3 py-2 text-sm bg-white text-[#1B2B1B] focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/20"
            >
              {AUDIENCES.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSend}
              disabled={sending || !subject.trim() || !body.trim()}
              className="bg-[#2E7D32] hover:bg-[#256329] text-white"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send Announcement
            </Button>
          </div>
        </div>

        {/* History */}
        <div>
          <h2 className="text-lg font-semibold text-[#1B2B1B] mb-4">History</h2>

          {loading ? (
            <SkeletonTable />
          ) : announcements.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-12 text-center">
              <Megaphone className="w-12 h-12 text-[#5A6E5A] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#1B2B1B] mb-2">
                No announcements yet
              </h3>
              <p className="text-[#5A6E5A]">
                Your sent announcements will appear here.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#2E7D32]/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-[#5A6E5A]">
                      <th className="text-left px-4 py-3 font-medium">Subject</th>
                      <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Sent to</th>
                      <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Date</th>
                      <th className="text-left px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {announcements.map((ann) => (
                      <tr
                        key={ann.id}
                        className="border-b border-gray-50 hover:bg-[#FAFAF5] transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-[#1B2B1B]">
                          {ann.subject}
                        </td>
                        <td className="px-4 py-3 text-[#5A6E5A] hidden md:table-cell">
                          {AUDIENCES.find((a) => a.value === ann.sentTo)?.label || ann.sentTo}
                        </td>
                        <td className="px-4 py-3 text-[#5A6E5A] hidden sm:table-cell">
                          {formatDate(ann.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                              ann.status === 'SENT' || !ann.status
                                ? 'bg-[#2E7D32]/10 text-[#2E7D32]'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {ann.status === 'SENT' || !ann.status ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {ann.status || 'Sent'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
