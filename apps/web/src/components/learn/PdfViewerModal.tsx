import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { X, ChevronLeft, ChevronRight, Loader2, ZoomIn, ZoomOut, AlertCircle } from 'lucide-react';
import { fetchApi } from '../../lib/api';

// Worker is loaded from a Vite-resolved URL so it ships with the bundle.
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

interface Props {
  lectureId: string;
  title: string;
  open: boolean;
  onClose: () => void;
  onLastPageReached?: () => void;
}

/**
 * Read-only PDF viewer modal.
 *
 * Pages render to canvas (no native PDF download / print toolbar). Source URL
 * is a 5-min Cloudinary signed URL fetched from the API; the URL is held in
 * a blob to keep it out of the address bar. Determined users can still
 * extract from the network tab during the TTL — this is friction, not DRM.
 */
export function PdfViewerModal({ lectureId, title, open, onClose, onLastPageReached }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPageReportedRef = useRef(false);

  // Load signed URL → fetch as blob → use blob URL.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let createdBlobUrl: string | null = null;

    (async () => {
      setError(null);
      setBlobUrl(null);
      setCurrentPage(1);
      setNumPages(0);
      lastPageReportedRef.current = false;

      try {
        const data = await fetchApi(`/learn/lectures/${lectureId}/pdf-url`, { method: 'GET' });
        if (cancelled) return;
        if (!data?.url) throw new Error('No PDF URL returned');

        const res = await fetch(data.url);
        if (!res.ok) throw new Error(`PDF fetch failed (${res.status})`);
        const blob = await res.blob();
        if (cancelled) return;
        createdBlobUrl = URL.createObjectURL(blob);
        setBlobUrl(createdBlobUrl);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load PDF');
      }
    })();

    return () => {
      cancelled = true;
      if (createdBlobUrl) URL.revokeObjectURL(createdBlobUrl);
    };
  }, [open, lectureId]);

  // Fit to container width
  useEffect(() => {
    if (!open || !containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width ?? 0;
      setContainerWidth(Math.max(0, w - 32)); // padding
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  const onDocumentLoadSuccess = useCallback((doc: { numPages: number }) => {
    setNumPages(doc.numPages);
  }, []);

  // Fire the "viewed last page" callback once
  useEffect(() => {
    if (!onLastPageReached) return;
    if (numPages > 0 && currentPage >= numPages && !lastPageReportedRef.current) {
      lastPageReportedRef.current = true;
      onLastPageReached();
    }
  }, [currentPage, numPages, onLastPageReached]);

  // Esc to close, arrow keys to navigate
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setCurrentPage((p) => Math.min(p + 1, numPages || 1));
      if (e.key === 'ArrowLeft') setCurrentPage((p) => Math.max(p - 1, 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, numPages, onClose]);

  const pageWidth = useMemo(() => {
    if (!containerWidth) return undefined;
    return Math.min(containerWidth, 900) * scale;
  }, [containerWidth, scale]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`PDF: ${title}`}
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/80"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex flex-col w-full max-w-5xl mx-4 my-4 bg-white rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-[#1B2B1B] truncate">{title}</h2>
            <p className="text-xs text-[#5A6E5A] mt-0.5">View only — downloading is disabled.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32]"
            aria-label="Close PDF viewer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-[#FAFAF5] shrink-0 text-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage <= 1 || !numPages}
              className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32]"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs tabular-nums text-[#1B2B1B] min-w-[3.5rem] text-center">
              {numPages ? `${currentPage} / ${numPages}` : '— / —'}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, numPages || 1))}
              disabled={!numPages || currentPage >= numPages}
              className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32]"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
              className="p-1.5 rounded hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32]"
              aria-label="Zoom out"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-xs tabular-nums text-[#5A6E5A] min-w-[3rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale((s) => Math.min(3, s + 0.2))}
              className="p-1.5 rounded hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32]"
              aria-label="Zoom in"
            >
              <ZoomIn size={16} />
            </button>
          </div>
        </div>

        {/* Document area */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto bg-gray-100 px-4 py-4 select-none pdf-viewer-area"
        >
          {error ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-sm text-red-600">
              <AlertCircle size={24} className="mb-2" />
              {error}
            </div>
          ) : !blobUrl ? (
            <div className="flex flex-col items-center justify-center h-full text-[#5A6E5A]">
              <Loader2 size={24} className="animate-spin mb-2" />
              <p className="text-xs">Loading PDF…</p>
            </div>
          ) : (
            <div className="flex justify-center">
              <Document
                file={blobUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={(e) => setError(e?.message || 'Failed to render PDF')}
                loading={
                  <div className="flex items-center gap-2 text-[#5A6E5A] py-12">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-sm">Rendering…</span>
                  </div>
                }
              >
                {numPages > 0 && (
                  <Page
                    pageNumber={currentPage}
                    width={pageWidth}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="shadow-md bg-white"
                  />
                )}
              </Document>
            </div>
          )}
        </div>
      </div>

      {/* Disable text selection visually inside the document area */}
      <style>{`
        .pdf-viewer-area, .pdf-viewer-area * {
          user-select: none !important;
          -webkit-user-select: none !important;
        }
      `}</style>
    </div>
  );
}
