import { Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { AssetSlot } from '@/assets/manifest';

export interface AssetFallbackProps {
  alt: string;
  className?: string;
  slot: AssetSlot;
  width: number;
  height: number;
}

export function AssetFallback({ alt, className, width, height }: AssetFallbackProps) {
  return (
    <svg
      role="img"
      aria-label={alt}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('block max-w-full rounded-sm bg-gradient-to-br from-canvas to-border/70 text-subtle', className)}
    >
      <title>{alt}</title>
      <rect width="100%" height="100%" fill="currentColor" opacity="0.08" />
      <foreignObject x="0" y="0" width={width} height={height}>
        <span className="grid size-full place-items-center">
          <ImageIcon aria-hidden="true" size={24} />
        </span>
      </foreignObject>
    </svg>
  );
}
