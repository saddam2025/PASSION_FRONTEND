import { SmartImage } from '@/components/common/SmartImage';
import { getBilingualText } from '@/i18n/useLanguage';
import type { BilingualText, ImageRef } from '@/schemas/sections';
import { useContext } from 'react';
import { SectionHeadingContext } from './SectionHeadingContext';
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  language,
  as = 'h2',
}: {
  eyebrow?: BilingualText;
  title?: BilingualText;
  subtitle?: BilingualText;
  language: 'ar' | 'en';
  as?: 'h1' | 'h2';
}) {
  const overrides = useContext(SectionHeadingContext);
  const eyebrowText = overrides?.eyebrow ? getBilingualText(overrides.eyebrow, language) : eyebrow ? getBilingualText(eyebrow, language) : '';
  const headingText = overrides?.title ? getBilingualText(overrides.title, language) : title ? getBilingualText(title, language) : '';
  const accentText = overrides?.titleAccent ? getBilingualText(overrides.titleAccent, language) : '';
  const sub = overrides?.subtitle ? getBilingualText(overrides.subtitle, language) : subtitle ? getBilingualText(subtitle, language) : '';
  if (!eyebrowText && !headingText && !accentText && !sub) return null;
  const HeadingTag = as;
  return (
    <header className="mb-6 grid gap-2">
      {eyebrowText && <p className="text-sm font-semibold tracking-wide text-primary-strong">{eyebrowText}</p>}
      {(headingText || accentText) && <HeadingTag className={`${as === 'h1' ? 'section-hero-title' : 'section-heading-title'} font-display font-bold leading-tight`}><span>{headingText}</span>{accentText && <>{headingText ? ' ' : ''}<span className={overrides?.highlight === 'underline' ? 'section-title-accent' : 'text-primary-strong'}>{accentText}</span></>}</HeadingTag>}
      {sub && <p className="text-muted">{sub}</p>}
    </header>
  );
}
export function SectionImage({
  image,
  language,
  width = 900,
  height = 640,
  priority = false,
  className = '',
}: {
  image: ImageRef;
  language: 'ar' | 'en';
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
}) {
  return (
    <SmartImage
      slot="about"
      srcOverride={image.src}
      alt={image.decorative ? '' : getBilingualText(image.alt ?? { ar: '', en: '' }, language)}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      className={className}
    />
  );
}
export function getText(value: BilingualText | undefined, language: 'ar' | 'en'): string {
  return value ? getBilingualText(value, language) : '';
}
