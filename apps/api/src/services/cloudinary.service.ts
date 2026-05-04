import { v2 as cloudinary } from 'cloudinary';
import { StorageService, UploadResult } from './storage.service';

cloudinary.config({
  // CLOUDINARY_URL is automatically picked up if set in environment.
  // We can also let the global CLOUDINARY_URL do its job, but standard practice is setup:
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class CloudinaryStorageService implements StorageService {
  
  async uploadImage(file: Buffer, folder: string): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ folder: `farmwise/${folder}` }, (error, result) => {
        if (error || !result) return reject(error);
        resolve({
          publicId: result.public_id,
          url: result.secure_url,
          format: result.format,
        });
      }).end(file);
    });
  }

  async uploadVideo(file: Buffer, folder: string): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ 
        folder: `farmwise/${folder}`, 
        resource_type: 'video',
        eager: 'sp_full_hd/m3u8',
        eager_async: true
      }, (error, result) => {
        if (error || !result) return reject(error);
        resolve({
          publicId: result.public_id,
          url: result.secure_url,
          format: result.format,
        });
      }).end(file);
    });
  }

  getSignedVideoUrl(publicId: string, expiresInSeconds: number = 300): string {
    return cloudinary.url(publicId, {
      resource_type: 'video',
      format: 'm3u8',
      streaming_profile: 'hd',
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
      secure: true,
    });
  }

  getHlsUrl(publicId: string): string {
    return cloudinary.url(publicId, {
      resource_type: 'video',
      format: 'm3u8',
      streaming_profile: 'hd',
      secure: true,
    });
  }

  getSignedRawUrl(publicId: string, expiresInSeconds: number = 300): string {
    return cloudinary.url(publicId, {
      resource_type: 'raw',
      sign_url: true,
      type: 'authenticated',
      expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
      secure: true,
    });
  }

  async deleteAsset(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }

  generateUploadSignature(folder: string, resourceType: 'image' | 'video' | 'raw' = 'image') {
    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign: Record<string, any> = {
      timestamp,
      folder: `farmwise/${folder}`,
    };

    // Video uploads: generate HLS (sp_full_hd/m3u8) asynchronously after upload
    // - eager_async=true queues the transform (doesn't block upload)
    // - async=true makes the entire upload processing async (needed for >100MB)
    // Cloudinary webhook `handleVideoReadyWebhook` fires when HLS ready
    // and populates lecture.hlsUrl + videoStatus='READY'.
    if (resourceType === 'video') {
      paramsToSign.eager = 'sp_full_hd/m3u8';
      paramsToSign.eager_async = true;
    }

    // PDFs uploaded as authenticated raw — viewing requires signed URL.
    // type=authenticated must be part of the signed params or Cloudinary
    // rejects the upload.
    if (resourceType === 'raw') {
      paramsToSign.type = 'authenticated';
    }

    // Fallback secret parsing for missing CLOUDINARY_API_SECRET if CLOUDINARY_URL format used
    let apiSecret = process.env.CLOUDINARY_API_SECRET;
    let apiKey = process.env.CLOUDINARY_API_KEY;

    if (!apiSecret && process.env.CLOUDINARY_URL) {
      // cloudinary://key:secret@cloud
      const match = process.env.CLOUDINARY_URL.match(/cloudinary:\/\/([^:]+):([^@]+)@/);
      if (match) {
        apiKey = match[1];
        apiSecret = match[2];
      }
    }

    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret!);
    return {
      signature,
      timestamp,
      folder: paramsToSign.folder,
      eager: paramsToSign.eager,
      eager_async: paramsToSign.eager_async,
      type: paramsToSign.type,
      api_key: apiKey,
      resourceType,
    };
  }
}

// Map the factory so we can swap with AWS later if needed
const provider = process.env.STORAGE_PROVIDER || 'cloudinary';
export const storageService = provider === 'aws' ? new CloudinaryStorageService() /* mock for now */ : new CloudinaryStorageService();
