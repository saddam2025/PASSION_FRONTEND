import { SectionFrame } from '../SectionFrame';
import type { AnyRendererProps } from './types';
export default function DividerRenderer({ section }: AnyRendererProps) {
  if (section.type !== 'divider') return null;
  const c = section.content;
  const space =
    c.size === 'sm' ? 'py-3' : c.size === 'md' ? 'py-6' : c.size === 'lg' ? 'py-10' : 'py-16';
  if (c.variant === 'space') return <div aria-hidden="true" className={space} />;
  return (
    <div className={space}>
      <SectionFrame
        settings={{ ...section.settings, spacing: 'sm' }}
        id={section.settings.anchorId ?? section.id}
      >
        <hr className={c.variant === 'dots' ? 'sr-only' : 'border-0 border-t border-border'} />
        {c.variant === 'dots' && <div className="section-divider-dots" aria-hidden="true" />}
      </SectionFrame>
    </div>
  );
}
