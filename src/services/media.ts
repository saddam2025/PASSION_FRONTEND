import { apiRequest, apiUpload } from '@/api/client';

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

export const mediaService: MediaService = {
  async upload(file, onProgress) {
    const form = new FormData();
    form.append('file', file, file.name);
    return normalizeMedia(await apiUpload<unknown>('media', form, onProgress));
  },
  async list(options) {
    const query = new URLSearchParams({
      page: String(options.page),
      pageSize: '12',
      ...(options.search ? { search: options.search } : {}),
    });
    const result = await apiRequest<{ items: unknown[]; total: number; page: number; pageSize: number }>(`media?${query.toString()}`);
    return { ...result, items: result.items.map(normalizeMedia), pageCount: Math.ceil(result.total / result.pageSize) };
  },
  async checkUsage(id) {
    const result = await apiRequest<{ id: string; usages?: { entityType: string; entityId: string; field: string }[] }>(`media/${encodeURIComponent(id)}`);
    const usages = result.usages ?? [];
    return { assetId: id, usageCount: usages.length, courseTitles: [] };
  },
  async remove(id) {
    try { await apiRequest(`media/${encodeURIComponent(id)}`, { method: 'DELETE' }); return { assetId: id, usageCount: 0, courseTitles: [], removed: true }; }
    catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'MEDIA_IN_USE') {
        const details = (error as { details?: unknown }).details;
        return { assetId: id, usageCount: Array.isArray(details) ? details.length : 1, courseTitles: [], removed: false };
      }
      throw error;
    }
  },
};

function normalizeMedia(value: unknown): MediaAsset {
  const item = value as { id?: string; key?: string; mime?: string; size?: number; width?: number; height?: number; variants?: Partial<Record<'thumb' | 'medium' | 'large', string>>; createdAt?: string };
  const variants = item.variants ?? {};
  return {
    id: item.id ?? '', key: item.key ?? '', mime: (item.mime as MediaAsset['mime']) ?? 'image/webp',
    size: item.size ?? 0, width: item.width ?? 0, height: item.height ?? 0,
    variants: { thumb: variants.thumb ?? '', medium: variants.medium ?? '', large: variants.large ?? '' },
    createdAt: item.createdAt ?? '',
  };
}
