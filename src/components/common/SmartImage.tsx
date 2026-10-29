import { useState } from 'react';
import type { ImgHTMLAttributes } from 'react';
import { AssetFallback } from '@/assets/AssetFallback';
import { assetManifest, type AssetSlot } from '@/assets/manifest';
import { mediaUrl, mediaVariantKeys, type MediaVariant } from '@/lib/mediaUrl';
import { cn } from '@/lib/cn';

export interface SmartImageProps
  extends Omit<
    ImgHTMLAttributes<HTMLImageElement>,
    'src' | 'alt' | 'width' | 'height' | 'onError'
  > {
  slot: AssetSlot;
  alt: string;
  width: number;
  height: number;
  srcOverride?: string;
  variantKeys?: Partial<Record<MediaVariant, string>>;
  sizes?: string;
}
export function SmartImage({
  slot,
  alt,
  width,
  height,
  className,
  loading = 'lazy',
  srcOverride,
  variantKeys,
  sizes = '(max-width: 640px) 100vw, 800px',
  ...props
}: SmartImageProps) {
  const [failed, setFailed] = useState(false);
  const asset = assetManifest[slot];
  let src: string = asset.src;
  let srcSet: string | undefined;
  try {
    if (srcOverride) {
      src = mediaUrl(srcOverride, 'large');
      const keys = variantKeys ?? mediaVariantKeys(srcOverride);
      if (keys) {
        const entries: [MediaVariant, number][] = [
          ['thumb', 400],
          ['medium', 800],
          ['large', 1600],
        ];
        srcSet =
          entries
            .flatMap(([variant, descriptor]) => {
              const key = keys[variant];
              if (!key) return [];
              try {
                return [`${mediaUrl(srcOverride, key)} ${descriptor}w`];
              } catch {
                return [];
              }
            })
            .join(', ') || undefined;
      }
    }
  } catch {
    src = asset.src;
    srcSet = undefined;
  }
  if (failed)
    return (
      <AssetFallback
        slot={slot}
        alt={alt}
        width={width || asset.width}
        height={height || asset.height}
        className={cn('overflow-hidden', className)}
      />
    );
  return (
    <img
      {...props}
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      width={width || asset.width}
      height={height || asset.height}
      loading={loading}
      decoding="async"
      className={cn('max-w-full object-cover', className)}
      onError={() => setFailed(true)}
    />
  );
}
