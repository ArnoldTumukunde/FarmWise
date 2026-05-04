export interface UploadResult {
  publicId: string;
  url: string;
  format: string;
}

export interface StorageService {
  uploadImage(file: Buffer, folder: string): Promise<UploadResult>;
  uploadVideo(file: Buffer, folder: string): Promise<UploadResult>;
  getSignedVideoUrl(publicId: string, expiresInSeconds: number): string;
  getHlsUrl(publicId: string): string;
  /** Signed short-lived URL for non-streaming raw assets (PDFs, etc). */
  getSignedRawUrl(publicId: string, expiresInSeconds: number): string;
  deleteAsset(publicId: string): Promise<void>;
  generateUploadSignature(folder: string, resourceType?: 'image' | 'video' | 'raw'): {
    signature: string;
    timestamp: number;
    folder: string;
    eager?: string;
    eager_async?: boolean;
    type?: string;
    api_key: string | undefined;
    resourceType?: string;
  };
}
