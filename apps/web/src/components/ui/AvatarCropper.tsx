import { useState, useRef, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Check, Loader2 } from 'lucide-react';

interface Props {
  file: File;
  onCancel: () => void;
  onConfirm: (cropped: Blob) => void | Promise<void>;
  outputSize?: number; // px, default 400
  aspect?: number;     // default 1 (square)
}

export function AvatarCropper({ file, onCancel, onConfirm, outputSize = 400, aspect = 1 }: Props) {
  const [src, setSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>();
  const [pixelCrop, setPixelCrop] = useState<PixelCrop | null>(null);
  const [saving, setSaving] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => setSrc(reader.result as string);
    reader.readAsDataURL(file);
  }, [file]);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const initial = centerCrop(
      makeAspectCrop({ unit: '%', width: 80 }, aspect, width, height),
      width,
      height,
    );
    setCrop(initial);
  };

  const handleSave = async () => {
    if (!imgRef.current || !pixelCrop) return;
    setSaving(true);
    try {
      const blob = await cropToBlob(imgRef.current, pixelCrop, outputSize, file.type);
      if (blob) await onConfirm(blob);
    } catch (err) {
      console.error('Crop failed', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-[#1B2B1B]">Crop image</h3>
          <button onClick={onCancel} className="p-1 rounded hover:bg-gray-100" aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-5 bg-[#FAFAF5] flex items-center justify-center">
          {src ? (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setPixelCrop(c)}
              aspect={aspect}
              circularCrop
              keepSelection
              minWidth={50}
            >
              <img ref={imgRef} src={src} alt="crop preview" onLoad={onImageLoad} style={{ maxHeight: '60vh' }} />
            </ReactCrop>
          ) : (
            <Loader2 className="animate-spin text-[#2E7D32]" />
          )}
        </div>

        <footer className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-[#5A6E5A] hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!pixelCrop || saving}
            className="px-4 py-2 rounded-lg bg-[#2E7D32] text-white text-sm font-medium hover:bg-[#256828] disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Save crop
          </button>
        </footer>
      </div>
    </div>
  );
}

async function cropToBlob(img: HTMLImageElement, crop: PixelCrop, output: number, mime: string): Promise<Blob | null> {
  const scaleX = img.naturalWidth / img.width;
  const scaleY = img.naturalHeight / img.height;
  const canvas = document.createElement('canvas');
  canvas.width = output;
  canvas.height = output;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    img,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    output,
    output,
  );
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), mime || 'image/jpeg', 0.9);
  });
}
