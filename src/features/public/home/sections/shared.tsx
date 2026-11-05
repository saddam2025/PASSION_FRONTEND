import type { ReactNode } from 'react';
import { Reveal } from '@/components/common/motion';
import { cn } from '@/lib/cn';
export function Frame({
  id,
  title,
  children,
  tone = 'default',
  anchorIds = [],
}: {
  id?: string;
  title?: string;
  children: ReactNode;
  tone?: 'default' | 'brand';
  anchorIds?: string[];
}) {
  return <Reveal className="block">
    <section id={id} className={cn('relative scroll-mt-24 border-t ps-container pe-container py-section', tone === 'brand' ? 'border-slate-700 bg-secondary text-white' : 'border-border/70')}>
      {anchorIds.map((anchorId) => <span key={anchorId} id={anchorId} className="absolute start-0 top-0" aria-hidden="true" />)}
      <div className="mx-auto w-full max-w-6xl">
        {title && <div className="mx-auto mb-10 grid max-w-3xl justify-items-center gap-4 text-center sm:mb-14"><span className={cn('h-px w-14 bg-gradient-to-r from-transparent to-transparent', tone === 'brand' ? 'via-accent/80' : 'via-primary/60')} aria-hidden="true" /><h2 className={cn('font-display text-3xl font-bold tracking-tight sm:text-4xl', tone === 'brand' ? 'text-white' : 'text-ink')}>{title}</h2></div>}
        {children}
      </div>
    </section>
  </Reveal>;
}
