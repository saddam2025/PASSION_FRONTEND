const mediaKeyPattern =
  /^media\/\d{4}\/(?:0[1-9]|1[0-2])\/[A-Za-z0-9_-]{16,80}\.(?:avif|jpe?g|png|webp)$/i;
const staticImagePattern = /^\/images\/[A-Za-z0-9/_-]+\.(?:avif|jpe?g|png|webp)$/i;
const variantKeyPattern =
  /^media\/\d{4}\/(?:0[1-9]|1[0-2])\/[A-Za-z0-9_-]{16,80}-(?:thumb|medium|large)\.webp$/i;
export type MediaVariant = 'thumb' | 'medium' | 'large';

function variantKey(src: string, variant: MediaVariant): string {
  const normalized = src.replace(/-(?:original|thumb|medium|large)\.webp$/i, '');
  const base = normalized.slice(0, normalized.lastIndexOf('.'));
  return `${base}-${variant}.webp`;
}
function assetStem(key: string): string { return key.replace(/-(?:original|thumb|medium|large)\.webp$/i, '').replace(/\.(?:avif|jpe?g|png|webp)$/i, ''); }

export function mediaVariantKeys(src: string): Record<MediaVariant, string> | undefined {
  if (!mediaKeyPattern.test(src)) return undefined;
  return {
    thumb: variantKey(src, 'thumb'),
    medium: variantKey(src, 'medium'),
    large: variantKey(src, 'large'),
  };
}

export function mediaUrl(src: string, variant?: MediaVariant | string): string {
  if (!src) return '/images/course-cover-default.webp';
  if (staticImagePattern.test(src)) return src;
  if (!mediaKeyPattern.test(src))
    throw new Error('Expected a relative media key or same-origin /images path.');
  let key = src;
  if (variant) {
    if (variant === 'thumb' || variant === 'medium' || variant === 'large')
      key = variantKey(src, variant);
    else if (
      variantKeyPattern.test(variant) &&
      assetStem(variant) === assetStem(src)
    )
      key = variant;
    else throw new Error('Invalid media variant key.');
  }
  const base = (import.meta.env.VITE_MEDIA_BASE_URL ?? '').trim().replace(/\/+$/, '');
  if (base) return `${base}/${key}`;
  if (import.meta.env.DEV) return '/images/course-cover-default.webp';
  return `/${key}`;
}
