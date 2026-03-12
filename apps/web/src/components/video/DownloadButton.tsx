import { useEffect, useState } from 'react';
import { Download, CheckCircle, AlertCircle, X } from 'lucide-react';
import { downloadLecture, getDownloadStatus, deleteLecture } from '../../offline/downloadManager';
import { DownloadRecord } from '../../offline/db';

export function DownloadButton({ lectureId, sizeMb = 85 }: { lectureId: string, sizeMb?: number }) {
  const [status, setStatus] = useState<DownloadRecord | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let interval: any;
    const fetchStatus = async () => {
      const s = await getDownloadStatus(lectureId);
      setStatus(s);
    };
    fetchStatus();
    
    // Poll while downloading
    if (status?.status === 'DOWNLOADING') {
      interval = setInterval(fetchStatus, 1000);
    }
    return () => clearInterval(interval);
  }, [lectureId, status?.status]);

  const handleDownload = async () => {
    setIsModalOpen(false);
    try {
      setStatus({ lectureId, status: 'DOWNLOADING', total: 100, cached: 0 }); // Optimistic UI
      await downloadLecture(lectureId);
      const s = await getDownloadStatus(lectureId);
      setStatus(s);
    } catch (e: any) {
      alert('Download failed: ' + e.message);
      setStatus(undefined); 
    }
  };

  const handleRemove = async () => {
      await deleteLecture(lectureId);
      setStatus(undefined);
  }

  if (status?.status === 'DOWNLOADING') {
    const pct = status.total > 0 ? Math.round((status.cached / status.total) * 100) : 0;
    return (
      <div className="flex flex-col items-center gap-1 w-24">
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-text-muted">{pct}%</span>
      </div>
    );
  }

  if (status?.status === 'DOWNLOADED') {
    return (
        <button onClick={handleRemove} title="Remove Download" className="group flex items-center gap-1 text-sm text-green-600 hover:text-red-500 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded px-1">
          <CheckCircle size={14} className="group-hover:hidden" />
          <span className="group-hover:hidden">Downloaded</span>
          <X size={14} className="hidden group-hover:inline" />
          <span className="hidden group-hover:inline">Remove</span>
        </button>
    );
  }

  if (status?.status === 'FAILED') {
    return (
      <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1 text-sm text-red-500 hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded px-1">
        <AlertCircle size={14} /> Retry
      </button>
    );
  }

  return (
    <>
      <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1 text-sm text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded px-1">
        <Download size={14} /> Download
      </button>
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-text-base">Download for offline use</h3>
            <p className="text-sm text-text-muted mt-2">
              This lecture is ~{sizeMb} MB. Download it for offline viewing.
              {sizeMb > 100 && <span className="block mt-2 text-amber-600 font-medium">⚠ Large file — use Wi-Fi if possible.</span>}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 text-text-base"
              >
                Cancel
              </button>
              <button 
                onClick={handleDownload}
                className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
