import { useState } from 'react';
import type { ImgHTMLAttributes } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { AssetFallback } from '@/assets/AssetFallback';
import { assetManifest, type AssetSlot } from '@/assets/manifest';
import { mediaSrcSet, mediaUrl, mediaVariantKeys, type MediaVariant } from '@/lib/mediaUrl';
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
export function ImageHoverFrame({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <span className={cn('image-hover-frame', className)} style={style}>{children}<span className="image-hover-scan" aria-hidden="true" /></span>;
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
      const keys = variantKeys ?? mediaVariantKeys(srcOverride);
      src = mediaUrl(srcOverride, 'large', keys);
      srcSet = mediaSrcSet(srcOverride, keys);
    }
  } catch {
    src = asset.src;
    srcSet = undefined;
  }
  if (failed)
    return (
      <ImageHoverFrame className={className} style={{ aspectRatio: `${width || asset.width} / ${height || asset.height}` }}>
        <AssetFallback slot={slot} alt={alt} width={width || asset.width} height={height || asset.height} className={cn('overflow-hidden', className)} />
      </ImageHoverFrame>
    );
  return (
    <ImageHoverFrame className={className} style={{ aspectRatio: `${width || asset.width} / ${height || asset.height}` }}>
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
        className={cn('image-hover-target max-w-full object-cover', className)}
        onError={() => setFailed(true)}
      />
    </ImageHoverFrame>
  );
}
