// MOCK: replace with backend API service during API integration (A4).
import type {
  MediaAsset,
  MediaListOptions,
  MediaListResult,
  MediaRemovalResult,
  MediaService,
  MediaUsageResult,
} from '@/services/media';
const makeAsset = (
  id: string,
  key: string,
  size: number,
  width: number,
  height: number,
  createdAt: string,
): MediaAsset => {
  const stem = key.slice(0, key.lastIndexOf('.'));
  return {
    id,
    key,
    mime: 'image/webp',
    size,
    width,
    height,
    variants: {
      thumb: `${stem}-thumb.webp`,
      medium: `${stem}-medium.webp`,
      large: `${stem}-large.webp`,
    },
    createdAt,
  };
};
const assets: MediaAsset[] = [
  makeAsset(
    'mock-media-01',
    'media/2026/10/8e3c0b7a2d194631a955.webp',
    143200,
    1600,
    1000,
    '2026-10-20T10:00:00.000Z',
  ),
  makeAsset(
    'mock-media-02',
    'media/2026/10/9c41f0a876d24bcf8d32.webp',
    82100,
    1200,
    800,
    '2026-10-18T09:30:00.000Z',
  ),
  makeAsset(
    'mock-media-03',
    'media/2026/09/5a7d2b91c04f4381ab65.webp',
    41200,
    640,
    480,
    '2026-09-30T12:00:00.000Z',
  ),
];
const sampleUsage: Record<string, { ar: string; en: string }[]> = {
  'mock-media-01': [{ ar: 'مهارات التواصل', en: 'Communication Skills' }],
};
const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
export const mockMediaService: MediaService = {
  async upload(file: File, onProgress) {
    for (const percent of [15, 45, 80, 100]) {
      await wait(90);
      onProgress?.(percent);
    }
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const id = `mock-${crypto.randomUUID()}`;
    const key = `media/${year}/${month}/${crypto.randomUUID().replaceAll('-', '')}.webp`;
    let width = 1200;
    let height = 800;
    try {
      const bitmap = await createImageBitmap(file);
      width = bitmap.width;
      height = bitmap.height;
      bitmap.close();
    } catch {
      /* The image preview in the dialog provides the user-visible decode error. */
    }
    const asset = makeAsset(id, key, file.size, width, height, now.toISOString());
    assets.unshift(asset);
    return asset;
  },
  async list({ page, search = '' }: MediaListOptions): Promise<MediaListResult> {
    const matches = assets.filter(
      (asset) =>
        asset.id.toLowerCase().includes(search.toLowerCase()) ||
        asset.key.toLowerCase().includes(search.toLowerCase()),
    );
    const pageSize = 12;
    const start = Math.max(0, page - 1) * pageSize;
    return {
      items: matches.slice(start, start + pageSize),
      total: matches.length,
      page,
      pageSize,
      pageCount: Math.ceil(matches.length / pageSize),
    };
  },
  async checkUsage(id: string): Promise<MediaUsageResult> {
    const courseTitles = sampleUsage[id] ?? [];
    return { assetId: id, usageCount: courseTitles.length, courseTitles };
  },
  async remove(id: string): Promise<MediaRemovalResult> {
    const usage = await this.checkUsage(id);
    if (usage.usageCount > 0) return { ...usage, removed: false };
    const index = assets.findIndex((asset) => asset.id === id);
    if (index >= 0) assets.splice(index, 1);
    return { ...usage, removed: index >= 0 };
  },
};
