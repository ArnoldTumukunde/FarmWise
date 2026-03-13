import { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api';
import { StickyNote, Trash2, Save, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';

export function NotesSection({ lectureId }: { lectureId: string }) {
  const [notes, setNotes] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadNotes();
  }, [lectureId]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const res = await fetchApi(`/community/lectures/${lectureId}/notes`);
      setNotes(res.notes);
    } catch (e) {
      console.error('Failed to load notes', e);
    } finally {
      setLoading(false);
    }
  };

  const saveNote = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await fetchApi(`/community/lectures/${lectureId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      setContent('');
      toast.success('Note saved');
      loadNotes();
    } catch (e) {
      toast.error('Failed to save note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await fetchApi(`/community/notes/${id}`, { method: 'DELETE' });
      toast.success('Note deleted');
      loadNotes();
    } catch (e) {
      toast.error('Failed to delete note');
    }
  };

  const formatTimestamp = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <StickyNote size={20} className="text-[#F57F17]" />
        <h3 className="text-lg font-bold text-[#1B2B1B]">Personal Notes</h3>
        {notes.length > 0 && (
          <span className="text-xs bg-gray-200 text-[#5A6E5A] px-2 py-0.5 rounded-full font-medium">
            {notes.length}
          </span>
        )}
      </div>

      {/* Note Input */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Take notes while watching to remember key points. Notes are private to you."
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-[#FAFAF5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 min-h-[100px] resize-y placeholder:text-[#5A6E5A]/50"
        />
        <div className="flex justify-end">
          <button
            onClick={saveNote}
            disabled={!content.trim() || saving}
            className="px-5 py-2 bg-[#2E7D32] text-white font-medium rounded-lg hover:bg-[#2E7D32]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Note
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
              <div className="w-24 h-3 bg-gray-200 rounded mb-3" />
              <div className="w-full h-3 bg-gray-200 rounded" />
              <div className="w-3/4 h-3 bg-gray-100 rounded mt-2" />
            </div>
          ))}
        </div>
      )}

      {/* Notes List */}
      {!loading && (
        <div className="space-y-3">
          {notes.map(n => (
            <div
              key={n.id}
              className="bg-white border border-gray-200 rounded-xl p-4 group hover:shadow-sm transition-shadow"
            >
              {/* Timestamp */}
              {(n.createdAt || n.timestamp) && (
                <div className="flex items-center gap-1.5 mb-2">
                  <Clock size={12} className="text-[#F57F17]" />
                  <span className="text-xs font-medium text-[#F57F17] bg-[#F57F17]/10 px-2 py-0.5 rounded-full">
                    {n.timestamp
                      ? `${Math.floor(n.timestamp / 60)}:${String(n.timestamp % 60).padStart(2, '0')}`
                      : formatTimestamp(n.createdAt)}
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between gap-3">
                <p className="whitespace-pre-wrap text-[#1B2B1B] text-sm leading-relaxed flex-1">
                  {n.content}
                </p>
                <button
                  onClick={() => deleteNote(n.id)}
                  className="shrink-0 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                  aria-label="Delete note"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {notes.length === 0 && (
            <div className="py-12 text-center">
              <div className="w-14 h-14 mx-auto bg-[#F57F17]/10 rounded-full flex items-center justify-center mb-4">
                <StickyNote size={24} className="text-[#F57F17]" />
              </div>
              <p className="text-[#5A6E5A] text-sm font-medium">No notes yet.</p>
              <p className="text-[#5A6E5A] text-xs mt-1">
                Take notes while watching to remember key points.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
