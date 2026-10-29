import { useCallback, useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { SmartImage } from '@/components/common/SmartImage';
export interface GalleryItem {
  src: string;
  alt: string;
  caption?: string;
}
export function GalleryLightbox({
  items,
  title,
  language,
  previousLabel,
  nextLabel,
  closeLabel,
  columns = 3,
}: {
  items: GalleryItem[];
  title: string;
  language: 'ar' | 'en';
  previousLabel: string;
  nextLabel: string;
  closeLabel: string;
  columns?: 2 | 3 | 4;
}) {
  const [active, setActive] = useState<number | null>(null);
  const move = useCallback(
    (direction: number) =>
      setActive((current) =>
        current === null ? 0 : (current + direction + items.length) % items.length,
      ),
    [items.length],
  );
  useEffect(() => {
    if (active === null) return;
    const key = (event: KeyboardEvent) => {
      const rtl = language === 'ar';
      if (event.key === 'ArrowRight') move(rtl ? -1 : 1);
      if (event.key === 'ArrowLeft') move(rtl ? 1 : -1);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [active, items.length, language, move]);
  if (!items.length) return null;
  const rtl = language === 'ar';
  return (
    <>
      <div className="section-gallery-grid" data-columns={columns}>
        {items.map((item, index) => (
          <button
            key={`${item.src}-${index}`}
            type="button"
            aria-label={item.alt}
            className="min-h-28 overflow-hidden rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            onClick={() => setActive(index)}
          >
            <SmartImage
              slot="gallery-1"
              srcOverride={item.src}
              alt={item.alt}
              width={600}
              height={450}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
      <Dialog.Root open={active !== null} onOpenChange={(open) => !open && setActive(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-secondary/80" />
          <Dialog.Content
            aria-label={title}
            className="fixed start-1/2 top-1/2 z-50 w-[min(92vw,56rem)] -translate-x-1/2 -translate-y-1/2 rounded-md bg-surface p-4"
          >
            <Dialog.Title className="sr-only">{title}</Dialog.Title>
            {active !== null && (
              <figure>
                <SmartImage
                  slot="gallery-1"
                  srcOverride={items[active]?.src}
                  alt={items[active]?.alt ?? ''}
                  width={1200}
                  height={900}
                  className="max-h-[70vh] w-full object-contain"
                />
                {items[active]?.caption && (
                  <figcaption className="mt-2 text-center">{items[active].caption}</figcaption>
                )}
              </figure>
            )}
            <div className="mt-3 flex justify-between gap-2">
              <button
                type="button"
                className="min-h-11 ps-4 pe-4"
                onClick={() => move(rtl ? 1 : -1)}
              >
                {previousLabel}
              </button>
              <Dialog.Close className="min-h-11 ps-4 pe-4">{closeLabel}</Dialog.Close>
              <button
                type="button"
                className="min-h-11 ps-4 pe-4"
                onClick={() => move(rtl ? -1 : 1)}
              >
                {nextLabel}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
