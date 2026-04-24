import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format an amount in UGX (Ugandan Shilling).
 * UGX is a zero-decimal currency, so no decimal places are shown.
 * Example: formatUGX(25000) => "UGX 25,000"
 */
export function formatUGX(amount: number | string): string {
  const num = typeof amount === 'string' ? Number(amount) : amount;
  if (isNaN(num)) return 'UGX 0';
  if (num === 0) return 'Free';
  return `UGX ${Math.round(num).toLocaleString('en-US')}`;
}

const CLOUDINARY_CLOUD = (import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME || 'dufizdkxg';

/**
 * Build a Cloudinary image URL from a publicId stored in the database.
 * DB stores publicIds WITHOUT the "farmwise/" folder prefix.
 */
export function cloudinaryImageUrl(publicId: string, width = 480, height?: number): string {
  const transforms = height
    ? `w_${width},h_${height},c_fill,q_auto,f_auto`
    : `w_${width},c_fill,q_auto,f_auto`;
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload/${transforms}/farmwise/${publicId}`;
}

/**
 * Build a Cloudinary video URL for preview playback.
 */
export function cloudinaryVideoUrl(publicId: string): string {
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/video/upload/farmwise/${publicId}`;
}
