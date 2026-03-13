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
  deleteAsset(publicId: string): Promise<void>;
  generateUploadSignature(folder: string, resourceType?: 'image' | 'video'): {
    signature: string;
    timestamp: number;
    folder: string;
    eager?: string;
    eager_async?: boolean;
    api_key: string | undefined;
    resourceType?: string;
  };
}
