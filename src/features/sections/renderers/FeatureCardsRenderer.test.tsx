// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import { CoursePageProvider, type CoursePageContextValue } from '@/features/sections/CoursePageContext';
import type { Section } from '@/schemas/sections';
import FeatureCardsRenderer from './FeatureCardsRenderer';

const section: Extract<Section, { type: 'featureCards' }> = {
  id: 'c6d4bb3a-1cc1-4ef4-ae5c-8b20e884ce22', type: 'featureCards', visible: true,
  settings: { background: 'none', spacing: 'md', width: 'contained', reveal: 'none' },
  content: {
    title: { ar: 'ليه تختار الكورس ده؟', en: '' },
    subtitle: { ar: 'تجربة تدريبية متكاملة في الكوتشينج', en: '' },
    columns: 3, layout: 'grid3', variant: 'standard',
    items: [
      { title: { ar: 'الميزة الأولى', en: '' }, text: { ar: 'تفاصيل الميزة الأولى', en: '' }, details: [], detailsMode: 'inline', ratio: 'landscape' },
      { title: { ar: 'الميزة الثانية', en: '' }, text: { ar: 'تفاصيل الميزة الثانية', en: '' }, details: [], detailsMode: 'inline', ratio: 'landscape' },
    ],
  },
};
const context: CoursePageContextValue = {
  course: {
    id: 'course-1', slug: 'course-one', title: { ar: 'كورس الإدارة', en: '' }, shortDescription: { ar: 'نبذة عن الكورس', en: '' },
    price: 2000, promoPrice: null, currency: 'EGP', startDate: '2026-11-11', registrationOpen: true,
    instructor: { name: { ar: 'المدرب', en: '' } }, schedule: { duration: { ar: 'شهر', en: '' } }, whatsappMessageTemplate: { ar: '', en: '' },
  },
  settings: { academyName: { ar: 'الأكاديمية', en: '' }, whatsappNumber: '+201094700533', phone: '', email: '' },
  formDefinition: { fields: [], consentText: { ar: '', en: '' } }, mode: 'public',
};
function renderCards(mode: 'public' | 'preview' | 'builder' = 'public', selected: typeof section = section) {
  return render(<LanguageProvider><CoursePageProvider value={{ ...context, mode }}><div className="course-landing"><FeatureCardsRenderer section={selected} mode={mode} /></div></CoursePageProvider></LanguageProvider>);
}

describe('mobile feature card carousel', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() { return []; }
    });
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it('duplicates only the public why-choose section and keeps the visual copy out of keyboard navigation', () => {
    const { container } = renderCards();
    const grid = container.querySelector('.feature-card-grid');
    const clone = grid?.querySelector('[data-clone="true"]');
    const track = grid?.querySelector('.feature-card-grid-track');
    expect(grid?.classList.contains('is-mobile-carousel')).toBe(true);
    expect(track?.querySelectorAll('.feature-card-grid-group')).toHaveLength(2);
    expect(grid?.querySelectorAll('.feature-card-grid-group')).toHaveLength(2);
    expect(clone?.getAttribute('aria-hidden')).toBe('true');
    expect(clone?.hasAttribute('inert')).toBe(true);
    expect(clone?.querySelectorAll('.feature-card-grid-item')).toHaveLength(section.content.items.length);
  });

  it('keeps other sections and builder previews in their existing grid layout', () => {
    const builder = renderCards('builder');
    expect(builder.container.querySelector('.feature-card-grid.is-mobile-carousel')).toBeNull();
    builder.unmount();
    const otherSection = { ...section, content: { ...section.content, title: { ar: 'المميزات', en: '' } } };
    const other = renderCards('public', otherSection);
    expect(other.container.querySelector('.feature-card-grid.is-mobile-carousel')).toBeNull();
  });

  it('limits the automatic loop to phone widths and provides a reduced-motion fallback', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/features/sections/landing.css'), 'utf8');
    expect(css).toMatch(/@media\s*\(max-width:\s*639px\)[\s\S]*?feature-card-grid\.is-mobile-carousel[\s\S]*?landing-feature-cards-loop/);
    expect(css).toMatch(/feature-card-grid\.is-mobile-carousel \.feature-card-grid-track\s*\{[^}]*animation:\s*landing-feature-cards-loop/s);
    expect(css).toMatch(/feature-card-grid\.is-mobile-carousel \.feature-card-grid-item\s*\{[^}]*align-self:\s*stretch/s);
    expect(css).toMatch(/feature-card-grid\.is-mobile-carousel \.feature-card\s*\{\s*display:\s*flex;\s*flex-direction:\s*column/s);
    expect(css).toMatch(/feature-card-grid\.is-mobile-carousel \.feature-card-content\s*\{[^}]*flex:\s*1/s);
    expect(css).toMatch(/\.feature-card-grid\.is-mobile-carousel:active \.feature-card-grid-track\s*,[\s\S]*?animation-play-state:\s*paused/s);
    expect(css).toMatch(/@keyframes landing-feature-cards-loop[\s\S]*?to\s*\{\s*transform:\s*translateX\(50%\)/);
    expect(css).toMatch(/@media\s*\(max-width:\s*639px\)\s+and\s+\(prefers-reduced-motion:\s*reduce\)[\s\S]*?feature-card-grid\.is-mobile-carousel[\s\S]*?overflow-x:\s*auto/);
    expect(css).toMatch(/\[data-landing-background='brand'\] \.landing-heading-muted,[\s\S]*?\[data-landing-background='softGradient'\] \.landing-heading-muted\s*\{\s*color:\s*#adcdff/s);
    expect(css).toContain('overflow-x: auto');
  });
});
