// MOCK: private receipt previews stay in memory and expire; replace with authenticated API in A3.
export interface PrivateMediaAsset {
  assetId: string;
  src: string;
  mime: string;
  size: number;
  createdAt: string;
}
export interface PrivateMediaService {
  upload(file: File): Promise<PrivateMediaAsset>;
  getSignedUrl(assetId: string): Promise<{ url: string; expiresAt: string }>;
}
const assets = new Map<string, { file: File; url: string; createdAt: string }>();
export const privateMediaService: PrivateMediaService = {
  async upload(file) {
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    )
      throw new Error('Choose a JPEG, PNG or WebP under 5 MB');
    const assetId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const url = URL.createObjectURL(file);
    assets.set(assetId, { file, url, createdAt });
    return { assetId, src: `private/${assetId}`, mime: file.type, size: file.size, createdAt };
  },
  async getSignedUrl(assetId) {
    const asset = assets.get(assetId);
    if (!asset) throw new Error('Receipt unavailable');
    return { url: asset.url, expiresAt: new Date(Date.now() + 5 * 60_000).toISOString() };
  },
};
