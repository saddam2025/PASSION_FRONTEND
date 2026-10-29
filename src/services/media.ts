import { apiRequest } from '@/services/apiClient';
import { mockMediaService } from '@/services/media.mock';

export interface MediaAsset {
  id: string;
  key: string;
  mime: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif';
  size: number;
  width: number;
  height: number;
  variants: { thumb: string; medium: string; large: string };
  createdAt: string;
}
export interface MediaListOptions {
  page: number;
  search?: string;
}
export interface MediaListResult {
  items: MediaAsset[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}
export interface MediaUsageResult {
  assetId: string;
  usageCount: number;
  courseTitles: { ar: string; en: string }[];
}
export interface MediaRemovalResult extends MediaUsageResult {
  removed: boolean;
}
export interface MediaService {
  upload(file: File, onProgress?: (percent: number) => void): Promise<MediaAsset>;
  list(options: MediaListOptions): Promise<MediaListResult>;
  checkUsage(id: string): Promise<MediaUsageResult>;
  remove(id: string): Promise<MediaRemovalResult>;
}

// Future backend adapter: multipart upload goes to the application API; browser code never receives R2 credentials or write URLs.
export const backendMediaService: MediaService = {
  async upload(file, onProgress) {
    onProgress?.(5);
    const form = new FormData();
    form.append('file', file, file.name);
    const asset = await apiRequest<MediaAsset>('media', { method: 'POST', body: form });
    onProgress?.(100);
    return asset;
  },
  list(options) {
    const query = new URLSearchParams({
      page: String(options.page),
      ...(options.search ? { search: options.search } : {}),
    });
    return apiRequest<MediaListResult>(`media?${query.toString()}`);
  },
  checkUsage(id) {
    return apiRequest<MediaUsageResult>(`media/${encodeURIComponent(id)}/usage`);
  },
  remove(id) {
    return apiRequest<MediaRemovalResult>(`media/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
};

// MOCK: replace with backendMediaService during API integration (A4).
export const mediaService: MediaService = mockMediaService;
