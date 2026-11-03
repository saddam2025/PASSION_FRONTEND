import { ApiError, apiRequest, apiUpload } from '@/api/client';

export interface PrivateMediaAsset {
  assetId: string;
  src: string;
  mime: string;
  size: number;
  createdAt: string;
  receiptMediaKey?: string;
}
export interface PrivateMediaService {
  upload(file: File): Promise<PrivateMediaAsset>;
  getSignedUrl(assetId: string): Promise<{ url: string; expiresAt: string }>;
}
const receiptIdsByKey = new Map<string, string>();
const receiptSessionKey = 'passion.private-receipt-ids.v1';
function rememberReceiptId(key: string, id: string) {
  receiptIdsByKey.set(key, id);
  try {
    const saved = JSON.parse(sessionStorage.getItem(receiptSessionKey) ?? '{}') as Record<string, string>;
    sessionStorage.setItem(receiptSessionKey, JSON.stringify({ ...saved, [key]: id }));
  } catch { /* Storage may be disabled; the in-memory mapping still serves this page. */ }
}
export const apiPrivateMediaService: PrivateMediaService = {
  async upload(file) {
    const form = new FormData(); form.append('file', file, file.name);
    try {
      const result = await apiUpload<{ id: string; key: string }>('media/receipts', form);
      rememberReceiptId(result.key, result.id);
      return { assetId: result.id, src: result.key, receiptMediaKey: result.key, mime: file.type, size: file.size, createdAt: new Date().toISOString() };
    } catch (error) {
      if (error instanceof ApiError && error.code === 'VALIDATION_ERROR') {
        const details = Array.isArray(error.details) ? error.details as Array<{ code?: string }> : [];
        if (details.some((item) => item.code === 'too_big')) throw new ApiError('RECEIPT_TOO_LARGE', error.status, error.details, error.requestId);
        if (details.some((item) => item.code === 'unsupported_type')) throw new ApiError('RECEIPT_TYPE_INVALID', error.status, error.details, error.requestId);
      }
      throw error;
    }
  },
  async getSignedUrl(assetId) {
    const result = await apiRequest<{ url: string; expiresIn: number }>(`media/receipts/${encodeURIComponent(assetId)}/url`);
    return { url: result.url, expiresAt: new Date(Date.now() + result.expiresIn * 1000).toISOString() };
  },
};

export const privateMediaService: PrivateMediaService = apiPrivateMediaService;

/** Receipt identifiers are transient; signed URLs are fetched on demand and are never cached. */
export function receiptIdForKey(key: string): string | undefined {
  const inMemory = receiptIdsByKey.get(key); if (inMemory) return inMemory;
  try { const saved = JSON.parse(sessionStorage.getItem(receiptSessionKey) ?? '{}') as Record<string, string>; return saved[key]; }
  catch { return undefined; }
}
