import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchApi, API_URL } from '@/lib/api';
import { uploadToCloudinary } from '@/lib/upload';
import { UploadProgressBar } from '@/components/ui/UploadProgress';
import { formatUGX, cloudinaryImageUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowLeft,
  GripVertical,
  Plus,
  PlayCircle,
  FileText,
  HelpCircle,
  Eye,
  Send,
  Loader2,
  Save,
  Upload,
  Trash2,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { RichTextEditor } from '@/components/ui/RichTextEditor';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface Lecture {
  id: string;
  title: string;
  order: number;
  type: string;
  isPreview?: boolean;
  videoPublicId?: string;
  videoStatus?: string;
  duration?: number;
  content?: string;
  quizData?: { question: string; options: string[]; correctIndex: number }[];
}

interface Section {
  id: string;
  title: string;
  order: number;
  lectures: Lecture[];
}

interface Course {
  id: string;
  slug?: string;
  title: string;
  subtitle?: string;
  description?: string;
  price?: string;
  level?: string;
  language?: string;
  status: string;
  thumbnailPublicId?: string;
  outcomes?: string[];
  requirements?: string[];
  sections: Section[];
  category?: { id: string; name: string };
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700',
  PUBLISHED: 'bg-[#2E7D32]/10 text-[#2E7D32]',
  UNPUBLISHED: 'bg-red-100 text-red-700',
};

const TYPE_STYLES: Record<string, { bg: string; text: string; icon: typeof PlayCircle }> = {
  VIDEO: { bg: 'bg-blue-100', text: 'text-blue-700', icon: PlayCircle },
  ARTICLE: { bg: 'bg-amber-100', text: 'text-amber-700', icon: FileText },
  QUIZ: { bg: 'bg-purple-100', text: 'text-purple-700', icon: HelpCircle },
};

const CLOUD_NAME = (import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME;

/* ------------------------------------------------------------------ */
/*  Inline Editable Text                                               */
/* ------------------------------------------------------------------ */

function InlineEdit({
  value,
  onSave,
  className = '',
}: {
  value: string;
  onSave: (v: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    else setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <Input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') { setDraft(value); setEditing(false); }
          }}
          className="h-7 text-sm py-0 focus-visible:ring-[#2E7D32]"
        />
        <button onClick={commit} className="p-1 text-[#2E7D32] hover:bg-[#2E7D32]/10 rounded">
          <Check size={14} />
        </button>
        <button onClick={() => { setDraft(value); setEditing(false); }} className="p-1 text-gray-400 hover:bg-gray-100 rounded">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={`flex items-center gap-1.5 group text-left min-w-0 ${className}`}
      title="Click to edit"
    >
      <span className="truncate">{value}</span>
      <Pencil size={12} className="opacity-0 group-hover:opacity-60 shrink-0 transition-opacity" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  ArticleEditor                                                      */
/* ------------------------------------------------------------------ */

const ArticleEditor = ({
  lectureId,
  courseId,
  initialContent,
  onSave,
}: {
  lectureId: string;
  courseId: string;
  initialContent: string;
  onSave: () => void;
}) => {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetchApi(`/instructor/courses/${courseId}/lectures/${lectureId}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
      });
      toast.success('Article content saved');
      onSave();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#5A6E5A]">Article Content</span>
        <span className="text-xs text-gray-400">Rich text · images · YouTube embeds</span>
      </div>
      <RichTextEditor
        content={content}
        onChange={setContent}
        placeholder="Write your article content here. Use the toolbar to add images, YouTube videos, quotes, and more."
      />
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="bg-[#2E7D32] hover:bg-[#256829] text-white focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
        >
          {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : <Save size={14} className="mr-1" />}
          Save Article
        </Button>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  QuizEditor                                                         */
/* ------------------------------------------------------------------ */

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

const QuizEditor = ({
  lectureId,
  courseId,
  initialQuizData,
  onSave,
}: {
  lectureId: string;
  courseId: string;
  initialQuizData: QuizQuestion[];
  onSave: () => void;
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    initialQuizData.length > 0 ? initialQuizData : []
  );
  const [saving, setSaving] = useState(false);

  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
      { question: '', options: ['', '', '', ''], correctIndex: 0 },
    ]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, field: string, value: any) => {
    setQuestions(prev =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q))
    );
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    setQuestions(prev =>
      prev.map((q, i) =>
        i === qIdx
          ? { ...q, options: q.options.map((o, j) => (j === oIdx ? value : o)) }
          : q
      )
    );
  };

  const handleSave = async () => {
    // Validate: each question must have text and at least 2 non-empty options
    for (const q of questions) {
      if (!q.question.trim()) {
        toast.error('All questions must have text');
        return;
      }
      const filledOptions = q.options.filter(o => o.trim());
      if (filledOptions.length < 2) {
        toast.error('Each question needs at least 2 options');
        return;
      }
    }

    setSaving(true);
    try {
      await fetchApi(`/instructor/courses/${courseId}/lectures/${lectureId}`, {
        method: 'PUT',
        body: JSON.stringify({ quizData: questions }),
      });
      toast.success('Quiz saved');
      onSave();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#5A6E5A]">Quiz Questions</span>
        <span className="text-xs text-gray-400">{questions.length} question{questions.length !== 1 ? 's' : ''}</span>
      </div>

      {questions.map((q, qIdx) => (
        <div key={qIdx} className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <label className="text-xs text-[#5A6E5A] font-medium">Question {qIdx + 1}</label>
              <Input
                value={q.question}
                onChange={e => updateQuestion(qIdx, 'question', e.target.value)}
                placeholder="Enter your question..."
                className="mt-1 bg-white focus-visible:ring-[#2E7D32]"
              />
            </div>
            <button
              onClick={() => removeQuestion(qIdx)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors mt-5"
              aria-label="Remove question"
            >
              <Trash2 size={14} />
            </button>
          </div>

          <div className="space-y-1.5 pl-2">
            <label className="text-xs text-[#5A6E5A]">Options (click radio to set correct answer)</label>
            {q.options.map((opt, oIdx) => (
              <div key={oIdx} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${qIdx}`}
                  checked={q.correctIndex === oIdx}
                  onChange={() => updateQuestion(qIdx, 'correctIndex', oIdx)}
                  className="accent-[#2E7D32]"
                />
                <Input
                  value={opt}
                  onChange={e => updateOption(qIdx, oIdx, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                  className="flex-1 h-8 text-sm bg-white focus-visible:ring-[#2E7D32]"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={addQuestion}
          className="focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
        >
          <Plus size={14} className="mr-1" />
          Add Question
        </Button>
        {questions.length > 0 && (
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-[#2E7D32] hover:bg-[#256829] text-white focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : <Save size={14} className="mr-1" />}
            Save Quiz
          </Button>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  SortableLecture                                                    */
/* ------------------------------------------------------------------ */

const SortableLecture = ({
  lecture,
  courseId,
  onReload,
  onRenameOptimistic,
}: {
  lecture: Lecture;
  courseId: string;
  onReload: () => void;
  onRenameOptimistic: (lectureId: string, title: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: lecture.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const typeStyle = TYPE_STYLES[lecture.type] || TYPE_STYLES.VIDEO;
  const TypeIcon = typeStyle.icon;
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState<import('@/lib/upload').UploadProgress | null>(null);
  const [videoAbort, setVideoAbort] = useState<AbortController | null>(null);
  const [videoFileName, setVideoFileName] = useState('');
  const [updatingField, setUpdatingField] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleRename = async (newTitle: string) => {
    onRenameOptimistic(lecture.id, newTitle);
    try {
      await fetchApi(`/instructor/courses/${courseId}/lectures/${lecture.id}`, {
        method: 'PUT',
        body: JSON.stringify({ title: newTitle }),
      });
    } catch (e: any) {
      toast.error(e.message || 'Failed to rename lecture');
      onReload();
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete lecture "${lecture.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await fetchApi(`/instructor/courses/${courseId}/lectures/${lecture.id}`, {
        method: 'DELETE',
      });
      toast.success('Lecture deleted');
      onReload();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete lecture');
      setDeleting(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    // Warn if > 500MB
    if (file.size > 500 * 1024 * 1024) {
      if (!confirm('This video is over 500MB. Upload may take a while. Continue?')) return;
    }

    setUploadingVideo(true);
    setVideoFileName(file.name);
    setVideoProgress({ loaded: 0, total: file.size, percent: 0, etaSeconds: null, bytesPerSec: 0 });
    const abort = new AbortController();
    setVideoAbort(abort);

    try {
      const signRes = await fetchApi('/media/sign?folder=videos&type=video');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signRes.apiKey);
      formData.append('timestamp', String(signRes.timestamp));
      formData.append('signature', signRes.signature);
      formData.append('folder', signRes.folder);
      if (signRes.eager) formData.append('eager', signRes.eager);
      if (signRes.eager_async) formData.append('eager_async', String(signRes.eager_async));

      const cloudName = signRes.cloudName || CLOUD_NAME;
      const uploadData = await uploadToCloudinary({
        cloudName,
        resourceType: 'video',
        formData,
        onProgress: setVideoProgress,
        signal: abort.signal,
      });

      const publicId = uploadData.public_id;
      const duration = Math.round(uploadData.duration || 0);
      await fetchApi(`/instructor/courses/${courseId}/lectures/${lecture.id}`, {
        method: 'PUT',
        body: JSON.stringify({ videoPublicId: publicId, duration }),
      });
      toast.success('Video uploaded! HLS transcoding will complete shortly.');
      onReload();
    } catch (err: any) {
      if (err.message !== 'Upload cancelled') {
        toast.error(err.message || 'Failed to upload video');
      }
    } finally {
      setUploadingVideo(false);
      setVideoProgress(null);
      setVideoAbort(null);
      setVideoFileName('');
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const cancelVideoUpload = () => videoAbort?.abort();

  const handleTogglePreview = async () => {
    setUpdatingField(true);
    try {
      await fetchApi(`/instructor/courses/${courseId}/lectures/${lecture.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isPreview: !lecture.isPreview }),
      });
      onReload();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update');
    } finally {
      setUpdatingField(false);
    }
  };

  const videoStatusLabel: Record<string, { text: string; color: string }> = {
    PENDING: { text: 'No video', color: 'text-gray-400' },
    PROCESSING: { text: 'Processing...', color: 'text-amber-600' },
    READY: { text: 'Ready', color: 'text-[#2E7D32]' },
    FAILED: { text: 'Failed', color: 'text-red-500' },
  };

  const vStatus = videoStatusLabel[lecture.videoStatus || 'PENDING'] || videoStatusLabel.PENDING;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-gray-200 rounded-lg shadow-sm mb-2 hover:shadow-md transition-shadow group"
    >
      {/* Hidden video file input */}
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleVideoUpload}
      />

      {/* Main row */}
      <div className="p-3 flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors p-1"
        >
          <GripVertical size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <InlineEdit
            value={lecture.title}
            onSave={handleRename}
            className="text-sm font-medium text-[#1B2B1B]"
          />
        </div>
        {lecture.isPreview && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#2E7D32]/10 text-[#2E7D32] font-medium shrink-0">
            Preview
          </span>
        )}
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 shrink-0 ${typeStyle.bg} ${typeStyle.text}`}
        >
          <TypeIcon size={12} />
          {lecture.type}
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-1"
          aria-label="Expand lecture details"
        >
          <svg
            className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1"
          aria-label={`Delete ${lecture.title}`}
        >
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
      </div>

      {/* Expanded details panel */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3">
          {/* Video upload (for VIDEO type) */}
          {lecture.type === 'VIDEO' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#5A6E5A]">Video</span>
                <span className={`text-xs font-medium ${vStatus.color}`}>{vStatus.text}</span>
              </div>
              {uploadingVideo && videoProgress ? (
                <UploadProgressBar
                  progress={videoProgress}
                  label={`Uploading ${videoFileName}`}
                  onCancel={cancelVideoUpload}
                />
              ) : lecture.videoPublicId ? (
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                  <PlayCircle size={20} className="text-[#2E7D32] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#1B2B1B] truncate">{lecture.videoPublicId?.split('/').pop() || 'No file'}</p>
                    {lecture.duration ? (
                      <p className="text-xs text-[#5A6E5A]">
                        {Math.floor(lecture.duration / 60)}:{String(lecture.duration % 60).padStart(2, '0')}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploadingVideo}
                    className="text-xs shrink-0"
                  >
                    Replace
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploadingVideo}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#2E7D32]/50 transition-colors cursor-pointer"
                >
                  <Upload size={20} className="mx-auto mb-1 text-gray-400" />
                  <p className="text-sm text-[#5A6E5A]">Click to upload a video</p>
                  <p className="text-xs text-gray-400 mt-0.5">MP4, MOV, WebM — max 500MB recommended</p>
                </button>
              )}
            </div>
          )}

          {/* Preview toggle */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[#5A6E5A]">Free preview</label>
            <button
              onClick={handleTogglePreview}
              disabled={updatingField}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 ${
                lecture.isPreview ? 'bg-[#2E7D32]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                  lecture.isPreview ? 'translate-x-4.5' : 'translate-x-0.5'
                }`}
                style={{ transform: lecture.isPreview ? 'translateX(18px)' : 'translateX(2px)' }}
              />
            </button>
          </div>

          {/* Article editor */}
          {lecture.type === 'ARTICLE' && (
            <ArticleEditor
              lectureId={lecture.id}
              courseId={courseId}
              initialContent={lecture.content || ''}
              onSave={onReload}
            />
          )}

          {/* Quiz editor */}
          {lecture.type === 'QUIZ' && (
            <QuizEditor
              lectureId={lecture.id}
              courseId={courseId}
              initialQuizData={lecture.quizData || []}
              onSave={onReload}
            />
          )}

          {/* Duration display */}
          {lecture.duration ? (
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#5A6E5A]">Duration</span>
              <span className="text-xs text-[#1B2B1B]">
                {Math.floor(lecture.duration / 60)}m {lecture.duration % 60}s
              </span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  SectionBuilder                                                     */
/* ------------------------------------------------------------------ */

const SectionBuilder = ({
  section,
  index,
  courseId,
  onAddLecture,
  onReload,
  onSectionRename,
  onSectionDelete,
  onLectureRename,
}: {
  section: Section;
  index: number;
  courseId: string;
  onAddLecture: (sectionId: string, title: string, type: 'VIDEO' | 'ARTICLE' | 'QUIZ') => void;
  onReload: () => void;
  onSectionRename: (sectionId: string, title: string) => void;
  onSectionDelete: (sectionId: string, title: string) => void;
  onLectureRename: (lectureId: string, title: string) => void;
}) => {
  const [newLectureTitle, setNewLectureTitle] = useState('');
  const [newLectureType, setNewLectureType] = useState<'VIDEO' | 'ARTICLE' | 'QUIZ'>('VIDEO');

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardContent className="p-5">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#2E7D32]/10 flex items-center justify-center text-[#2E7D32] text-sm font-bold shrink-0">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <InlineEdit
              value={section.title}
              onSave={(v) => onSectionRename(section.id, v)}
              className="font-bold text-base text-[#1B2B1B]"
            />
          </div>
          <span className="text-xs text-[#5A6E5A] bg-gray-100 px-2.5 py-1 rounded-full shrink-0">
            {section.lectures.length} lecture{section.lectures.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => onSectionDelete(section.id, section.title)}
            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1"
            aria-label={`Delete section ${section.title}`}
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Lectures */}
        <SortableContext
          items={section.lectures.map(l => l.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="min-h-[40px]">
            {section.lectures.map(lecture => (
              <SortableLecture
                key={lecture.id}
                lecture={lecture}
                courseId={courseId}
                onReload={onReload}
                onRenameOptimistic={onLectureRename}
              />
            ))}
            {section.lectures.length === 0 && (
              <div className="text-sm text-[#5A6E5A] italic p-6 text-center border-2 border-dashed border-gray-200 rounded-lg">
                No lectures yet. Add one below.
              </div>
            )}
          </div>
        </SortableContext>

        {/* Add Lecture Form */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
          <Input
            placeholder="New lecture title..."
            value={newLectureTitle}
            onChange={e => setNewLectureTitle(e.target.value)}
            className="flex-grow bg-white focus-visible:ring-[#2E7D32]"
          />
          <select
            value={newLectureType}
            onChange={e => setNewLectureType(e.target.value as 'VIDEO' | 'ARTICLE' | 'QUIZ')}
            className="border border-gray-200 rounded-md px-3 bg-white text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
          >
            <option value="VIDEO">Video</option>
            <option value="ARTICLE">Article</option>
            <option value="QUIZ">Quiz</option>
          </select>
          <Button
            variant="secondary"
            onClick={() => {
              if (newLectureTitle.trim()) {
                onAddLecture(section.id, newLectureTitle, newLectureType);
                setNewLectureTitle('');
              }
            }}
            className="focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
          >
            <Plus size={16} className="mr-1" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/* ------------------------------------------------------------------ */
/*  CourseBuilder (main)                                                */
/* ------------------------------------------------------------------ */

export default function CourseBuilder() {
  const { id } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'curriculum'>('curriculum');

  // Editable course fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [level, setLevel] = useState('BEGINNER');
  const [language, setLanguage] = useState('English');
  const [outcomes, setOutcomes] = useState<string[]>([]);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Thumbnail upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [thumbProgress, setThumbProgress] = useState<import('@/lib/upload').UploadProgress | null>(null);

  // New outcome / requirement inputs
  const [newOutcome, setNewOutcome] = useState('');
  const [newRequirement, setNewRequirement] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  /* ---- Sync form fields when course loads ---- */
  const syncFormFields = useCallback((c: Course) => {
    setTitle(c.title || '');
    setSubtitle(c.subtitle || '');
    setDescription(c.description || '');
    setPrice(c.price || '0');
    setLevel(c.level || 'BEGINNER');
    setLanguage(c.language || 'English');
    setOutcomes(c.outcomes || []);
    setRequirements(c.requirements || []);
  }, []);

  const loadCourse = useCallback(() => {
    fetchApi(`/instructor/courses/${id}`)
      .then(res => {
        setCourse(res.course);
        syncFormFields(res.course);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, syncFormFields]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  /* ---- Save course details ---- */
  const handleSaveDetails = async () => {
    setSaving(true);
    try {
      const res = await fetchApi(`/instructor/courses/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title,
          subtitle,
          description,
          price,
          level,
          language,
          outcomes,
          requirements,
        }),
      });
      setCourse(res.course);
      toast.success('Course details saved successfully!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save course details');
    } finally {
      setSaving(false);
    }
  };

  /* ---- Thumbnail upload ---- */
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setThumbProgress({ loaded: 0, total: file.size, percent: 0, etaSeconds: null, bytesPerSec: 0 });
    try {
      const signRes = await fetchApi('/media/sign?folder=thumbnails');

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
        onProgress: setThumbProgress,
      });

      // 3. Save publicId to course
      const publicId = uploadData.public_id.replace(/^farmwise\//, '');
      const updateRes = await fetchApi(`/instructor/courses/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ thumbnailPublicId: publicId }),
      });
      setCourse(updateRes.course);
      toast.success('Thumbnail uploaded!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload thumbnail');
    } finally {
      setUploading(false);
      setThumbProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /* ---- Submit for review ---- */
  const handleSubmitForReview = async () => {
    if (!confirm('Submit this course for review? You will not be able to edit it until the review is complete.')) return;
    setSubmitting(true);
    try {
      const res = await fetchApi(`/instructor/courses/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'UNDER_REVIEW' }),
      });
      setCourse((prev) => prev ? { ...prev, status: 'UNDER_REVIEW' } : prev);
      toast.success('Course submitted for review!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit for review');
    } finally {
      setSubmitting(false);
    }
  };

  /* ---- Section management ---- */
  const handleAddSection = async () => {
    if (!newSectionTitle.trim()) return;
    try {
      await fetchApi(`/instructor/courses/${id}/sections`, {
        method: 'POST',
        body: JSON.stringify({ title: newSectionTitle }),
      });
      setNewSectionTitle('');
      toast.success('Section added');
      loadCourse();
    } catch (e: any) {
      toast.error(e.message || 'Failed to add section');
    }
  };

  const handleSectionRename = async (sectionId: string, newTitle: string) => {
    // Optimistic update
    setCourse(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map(s =>
          s.id === sectionId ? { ...s, title: newTitle } : s
        ),
      };
    });
    try {
      await fetchApi(`/instructor/courses/${id}/sections/${sectionId}`, {
        method: 'PUT',
        body: JSON.stringify({ title: newTitle }),
      });
    } catch (e: any) {
      toast.error(e.message || 'Failed to rename section');
      loadCourse();
    }
  };

  const handleSectionDelete = async (sectionId: string, sectionTitle: string) => {
    if (!confirm(`Delete section "${sectionTitle}" and all its lectures? This cannot be undone.`)) return;
    try {
      await fetchApi(`/instructor/courses/${id}/sections/${sectionId}`, {
        method: 'DELETE',
      });
      toast.success('Section deleted');
      loadCourse();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete section');
    }
  };

  /* ---- Lecture management ---- */
  const handleAddLecture = async (
    sectionId: string,
    lectureTitle: string,
    type: 'VIDEO' | 'ARTICLE' | 'QUIZ'
  ) => {
    try {
      await fetchApi(`/instructor/sections/${sectionId}/lectures`, {
        method: 'POST',
        body: JSON.stringify({ title: lectureTitle, type }),
      });
      toast.success('Lecture added');
      loadCourse();
    } catch (e: any) {
      toast.error(e.message || 'Failed to add lecture');
    }
  };

  const handleLectureRenameOptimistic = (lectureId: string, newTitle: string) => {
    setCourse(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map(s => ({
          ...s,
          lectures: s.lectures.map(l =>
            l.id === lectureId ? { ...l, title: newTitle } : l
          ),
        })),
      };
    });
  };

  /* ---- Drag & Drop ---- */
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !course) return;

    // Find which section contains the active and over items
    let activeSectionIdx = -1;
    let overSectionIdx = -1;
    let activeLectureIdx = -1;
    let overLectureIdx = -1;

    for (let si = 0; si < course.sections.length; si++) {
      const section = course.sections[si];
      const aIdx = section.lectures.findIndex(l => l.id === active.id);
      const oIdx = section.lectures.findIndex(l => l.id === over.id);
      if (aIdx !== -1) { activeSectionIdx = si; activeLectureIdx = aIdx; }
      if (oIdx !== -1) { overSectionIdx = si; overLectureIdx = oIdx; }
    }

    // Only handle lecture reorder within the same section for now
    if (activeSectionIdx === -1 || overSectionIdx === -1) return;
    if (activeSectionIdx !== overSectionIdx) {
      toast.error('Moving lectures between sections is not supported yet');
      return;
    }

    const sectionIdx = activeSectionIdx;
    const section = course.sections[sectionIdx];
    const reordered = arrayMove(section.lectures, activeLectureIdx, overLectureIdx);

    // Optimistic update
    const updatedSections = [...course.sections];
    updatedSections[sectionIdx] = { ...section, lectures: reordered };
    setCourse({ ...course, sections: updatedSections });

    // API call
    try {
      await fetchApi(`/instructor/courses/${id}/reorder-lectures`, {
        method: 'PUT',
        body: JSON.stringify({
          sectionId: section.id,
          lectureIds: reordered.map(l => l.id),
        }),
      });
    } catch (e: any) {
      toast.error(e.message || 'Failed to reorder lectures');
      loadCourse();
    }
  };

  /* ---- Outcomes & Requirements helpers ---- */
  const addOutcome = () => {
    if (newOutcome.trim()) {
      setOutcomes([...outcomes, newOutcome.trim()]);
      setNewOutcome('');
    }
  };
  const removeOutcome = (idx: number) => setOutcomes(outcomes.filter((_, i) => i !== idx));

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setRequirements([...requirements, newRequirement.trim()]);
      setNewRequirement('');
    }
  };
  const removeRequirement = (idx: number) => setRequirements(requirements.filter((_, i) => i !== idx));

  /* ---- Loading / Not Found ---- */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF5] flex items-center justify-center font-[Inter]">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-[#2E7D32] mx-auto mb-3" />
          <p className="text-[#5A6E5A] text-sm">Loading course builder...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#FAFAF5] flex items-center justify-center font-[Inter]">
        <div className="text-center">
          <p className="text-red-500 font-medium">Course not found</p>
          <Link
            to="/instructor"
            className="text-[#2E7D32] text-sm mt-2 inline-block hover:underline"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const statusStyle = STATUS_STYLES[course.status] || 'bg-gray-100 text-gray-700';
  const canSubmit = course.status !== 'UNDER_REVIEW' && course.status !== 'PUBLISHED';

  /* ---- Details Panel ---- */
  const DetailsPanel = () => (
    <div className="space-y-5">
      {/* Hidden file input for thumbnail */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleThumbnailUpload}
      />

      <div className="space-y-2">
        <Label className="text-sm font-medium text-[#1B2B1B]">Title</Label>
        <Input
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="focus-visible:ring-[#2E7D32]"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium text-[#1B2B1B]">Subtitle</Label>
        <Input
          value={subtitle}
          onChange={e => setSubtitle(e.target.value)}
          placeholder="A short subtitle..."
          className="focus-visible:ring-[#2E7D32]"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium text-[#1B2B1B]">Description</Label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="What will students learn?"
          rows={5}
          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 resize-y"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-[#1B2B1B]">Price (UGX)</Label>
          <Input
            type="number"
            value={price}
            onChange={e => setPrice(e.target.value)}
            min="0"
            step="1"
            className="focus-visible:ring-[#2E7D32]"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-[#1B2B1B]">Level</Label>
          <select
            value={level}
            onChange={e => setLevel(e.target.value)}
            className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
          >
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium text-[#1B2B1B]">Language</Label>
        <Input
          value={language}
          onChange={e => setLanguage(e.target.value)}
          placeholder="e.g. English, Luganda"
          className="focus-visible:ring-[#2E7D32]"
        />
      </div>

      {/* Outcomes */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-[#1B2B1B]">Learning Outcomes</Label>
        <div className="space-y-1.5">
          {outcomes.map((o, i) => (
            <div key={i} className="flex items-center gap-2 text-sm bg-gray-50 rounded px-2.5 py-1.5">
              <span className="flex-1">{o}</span>
              <button onClick={() => removeOutcome(i)} className="text-gray-400 hover:text-red-500">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newOutcome}
            onChange={e => setNewOutcome(e.target.value)}
            placeholder="Add an outcome..."
            className="focus-visible:ring-[#2E7D32]"
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOutcome(); } }}
          />
          <Button variant="secondary" size="sm" onClick={addOutcome} disabled={!newOutcome.trim()}>
            <Plus size={14} />
          </Button>
        </div>
      </div>

      {/* Requirements */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-[#1B2B1B]">Requirements</Label>
        <div className="space-y-1.5">
          {requirements.map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-sm bg-gray-50 rounded px-2.5 py-1.5">
              <span className="flex-1">{r}</span>
              <button onClick={() => removeRequirement(i)} className="text-gray-400 hover:text-red-500">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newRequirement}
            onChange={e => setNewRequirement(e.target.value)}
            placeholder="Add a requirement..."
            className="focus-visible:ring-[#2E7D32]"
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addRequirement(); } }}
          />
          <Button variant="secondary" size="sm" onClick={addRequirement} disabled={!newRequirement.trim()}>
            <Plus size={14} />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-[#1B2B1B]">Category</Label>
        <Input
          defaultValue={course.category?.name || ''}
          disabled
          className="bg-gray-50"
        />
      </div>

      {/* Thumbnail */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-[#1B2B1B]">Thumbnail</Label>
        {uploading && thumbProgress && (
          <UploadProgressBar progress={thumbProgress} label="Uploading thumbnail" compact />
        )}
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#2E7D32]/50 transition-colors cursor-pointer relative"
        >
          {uploading && !thumbProgress && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg z-10">
              <Loader2 size={24} className="animate-spin text-[#2E7D32]" />
            </div>
          )}
          {course.thumbnailPublicId ? (
            <img
              src={cloudinaryImageUrl(course.thumbnailPublicId!, 320, 200)}
              alt="Thumbnail"
              className="w-full rounded-md"
            />
          ) : (
            <div className="text-[#5A6E5A] text-sm">
              <Upload size={24} className="mx-auto mb-2 text-gray-400" />
              <p>Click to upload a thumbnail</p>
              <p className="text-xs mt-1">Recommended: 1280x720</p>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSaveDetails}
        disabled={saving}
        className="w-full bg-[#2E7D32] hover:bg-[#2E7D32]/90 focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
      >
        {saving ? (
          <Loader2 size={16} className="animate-spin mr-2" />
        ) : (
          <Save size={16} className="mr-2" />
        )}
        Save Changes
      </Button>
    </div>
  );

  /* ---- Curriculum Panel ---- */
  const CurriculumPanel = () => (
    <div className="space-y-6">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {course.sections.map((section, idx) => (
          <SectionBuilder
            key={section.id}
            section={section}
            index={idx}
            courseId={course.id}
            onAddLecture={handleAddLecture}
            onReload={loadCourse}
            onSectionRename={handleSectionRename}
            onSectionDelete={handleSectionDelete}
            onLectureRename={handleLectureRenameOptimistic}
          />
        ))}
      </DndContext>

      {/* Add Section */}
      <Card className="border-2 border-dashed border-gray-300 bg-gray-50/50">
        <CardContent className="p-5 flex gap-3 items-end">
          <div className="flex-grow space-y-2">
            <Label className="text-sm font-medium text-[#1B2B1B]">Add New Section</Label>
            <Input
              placeholder="e.g. Introduction to Soil Types"
              value={newSectionTitle}
              onChange={e => setNewSectionTitle(e.target.value)}
              className="bg-white focus-visible:ring-[#2E7D32]"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSection();
                }
              }}
            />
          </div>
          <Button
            onClick={handleAddSection}
            disabled={!newSectionTitle.trim()}
            className="bg-[#2E7D32] hover:bg-[#2E7D32]/90 focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
          >
            <Plus size={16} className="mr-1.5" />
            Add Section
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="bg-[#FAFAF5] min-h-screen font-[Inter]">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link
            to="/instructor"
            className="p-2 rounded-md hover:bg-gray-100 transition-colors focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={20} className="text-[#1B2B1B]" />
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-[#1B2B1B] truncate">{course.title}</h1>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${statusStyle}`}
              >
                {course.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
              onClick={() => {
                const slug = course.slug || course.id;
                window.open(`/course/${slug}`, '_blank');
              }}
            >
              <Eye size={14} className="mr-1.5" />
              Preview
            </Button>
            <Button
              size="sm"
              className="bg-[#2E7D32] hover:bg-[#2E7D32]/90 focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 disabled:opacity-50"
              onClick={handleSubmitForReview}
              disabled={!canSubmit || submitting}
            >
              {submitting ? (
                <Loader2 size={14} className="animate-spin mr-1.5" />
              ) : (
                <Send size={14} className="mr-1.5" />
              )}
              <span className="hidden sm:inline">Submit for Review</span>
              <span className="sm:hidden">Submit</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden border-b border-gray-200 bg-white">
        <div className="flex">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-3 text-sm font-medium text-center transition-colors relative focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 ${
              activeTab === 'details'
                ? 'text-[#2E7D32]'
                : 'text-[#5A6E5A]'
            }`}
          >
            Details
            {activeTab === 'details' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2E7D32]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('curriculum')}
            className={`flex-1 py-3 text-sm font-medium text-center transition-colors relative focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 ${
              activeTab === 'curriculum'
                ? 'text-[#2E7D32]'
                : 'text-[#5A6E5A]'
            }`}
          >
            Curriculum
            {activeTab === 'curriculum' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2E7D32]" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Desktop: Side by side */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-8">
          {/* Left: Details */}
          <div className="lg:col-span-1">
            <Card className="border-gray-200 sticky top-20">
              <CardContent className="p-5">
                <h2 className="text-base font-bold text-[#1B2B1B] mb-4">Course Details</h2>
                <DetailsPanel />
              </CardContent>
            </Card>
          </div>

          {/* Right: Curriculum */}
          <div className="lg:col-span-2">
            <h2 className="text-base font-bold text-[#1B2B1B] mb-4">Curriculum</h2>
            <CurriculumPanel />
          </div>
        </div>

        {/* Mobile: Tabs */}
        <div className="lg:hidden">
          {activeTab === 'details' && (
            <Card className="border-gray-200">
              <CardContent className="p-5">
                <DetailsPanel />
              </CardContent>
            </Card>
          )}
          {activeTab === 'curriculum' && <CurriculumPanel />}
        </div>
      </div>
    </div>
  );
}
