import { X, Loader2 } from 'lucide-react';
import { formatBytes, formatEta, type UploadProgress as UP } from '@/lib/upload';

interface Props {
  progress: UP | null;
  label?: string;       // e.g. "Uploading video..." or filename
  onCancel?: () => void;
  compact?: boolean;    // smaller variant for inline use
}

export function UploadProgressBar({ progress, label, onCancel, compact }: Props) {
  if (!progress) return null;

  const { percent, loaded, total, etaSeconds, bytesPerSec } = progress;
  const speed = bytesPerSec > 0 ? `${formatBytes(bytesPerSec)}/s` : '';

  return (
    <div className={`w-full ${compact ? 'py-2' : 'p-4'} bg-white rounded-lg border border-[#2E7D32]/20`}>
      <div className="flex items-center gap-3 mb-2">
        <Loader2 size={compact ? 14 : 16} className="text-[#2E7D32] animate-spin shrink-0" />
        <div className="flex-1 min-w-0">
          <p className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-[#1B2B1B] truncate`}>
            {label || 'Uploading...'}
          </p>
          <p className="text-xs text-[#5A6E5A] mt-0.5 tabular-nums">
            {formatBytes(loaded)} / {formatBytes(total)}
            {speed && <span className="ml-2">• {speed}</span>}
            {etaSeconds != null && <span className="ml-2">• {formatEta(etaSeconds)} left</span>}
          </p>
        </div>
        <span className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-[#2E7D32] tabular-nums shrink-0`}>
          {percent}%
        </span>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded hover:bg-red-50 text-red-500 transition-colors shrink-0"
            aria-label="Cancel upload"
          >
            <X size={14} />
          </button>
        )}
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#2E7D32] to-[#4CAF50] transition-all duration-150"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
