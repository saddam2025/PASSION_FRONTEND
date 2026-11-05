// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import { CoursePageProvider, type CoursePageContextValue } from '@/features/sections/CoursePageContext';
import HeroRenderer from './HeroRenderer';
import type { Section } from '@/schemas/sections';

const section: Extract<Section, { type: 'hero' }> = {
  id: 'c6d4bb3a-1cc1-4ef4-ae5c-8b20e884ce22', type: 'hero', visible: true,
  settings: { background: 'none', spacing: 'md', width: 'contained', reveal: 'none' },
  content: {
    title: { ar: 'عنوان الكورس', en: '' }, subtitle: { ar: 'وصف العنوان', en: '' }, layout: 'splitStart',
    primaryCta: { label: { ar: 'جاهز تسجل', en: '' }, destination: { kind: 'action', action: 'scrollToRegister' } },
    secondaryCta: { label: { ar: 'احجز على واتساب', en: '' }, destination: { kind: 'action', action: 'whatsapp' } },
    image: { src: '/images/academy-logo.webp', alt: { ar: 'صورة الكورس', en: '' }, decorative: false },
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
function renderHero(overrides: Partial<typeof context.course> = {}, selectedSection: typeof section = section) {
  return render(<LanguageProvider><CoursePageProvider value={{ ...context, course: { ...context.course, ...overrides } }}><div className="course-landing"><HeroRenderer section={selectedSection} mode="public" /></div></CoursePageProvider></LanguageProvider>);
}

describe('course landing hero layout', () => {
  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addListener: vi.fn(), removeListener: vi.fn() })));
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it('keeps the description and both CTAs below the heading in the text column', () => {
    const { container } = renderHero();
    const copy = container.querySelector('.landing-hero-copy');
    expect(copy).toBeTruthy();
    expect(copy!.querySelector('.landing-section-heading')).toBeTruthy();
    expect(copy!.querySelector('.landing-hero-brief')).toBeTruthy();
    expect(copy!.querySelector('.landing-hero-brief .landing-hero-actions, .landing-hero-brief a')).toBeTruthy();
    expect(copy!.querySelector('.landing-hero-primary-action button')).toBeTruthy();
    expect(copy!.compareDocumentPosition(container.querySelector('.landing-hero-media')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('uses an eager responsive image with explicit dimensions, contain fit, and vertical centering', () => {
    const { container } = renderHero();
    const image = container.querySelector<HTMLImageElement>('.landing-hero-image.image-hover-target');
    expect(image?.getAttribute('loading')).toBe('eager');
    expect(image?.getAttribute('width')).toBe('960'); expect(image?.getAttribute('height')).toBe('720');
    expect(container.querySelector('.landing-hero-image .image-hover-scan')).toBeTruthy();
    const css = readFileSync(resolve(process.cwd(), 'src/features/sections/landing.css'), 'utf8');
    expect(css).toMatch(/\.landing-hero-image\.image-hover-frame\s*>\s*img\s*\{[^}]*object-fit:\s*contain/s);
    expect(css).toMatch(/\.landing-hero-visual\s*\{[^}]*align-content:\s*center/s);
    expect(css).toMatch(/\.landing-hero-grid\.is-reference-split \.landing-hero-visual\s*\{[^}]*padding-inline:\s*clamp\(/s);
    expect(css).not.toMatch(/\.landing-hero-image \.image-hover-scan\s*\{[^}]*display:\s*none/s);
  });

  it('uses a full-width text layout when the hero has no image', () => {
    const { container } = renderHero({}, { ...section, content: { ...section.content, image: undefined } });
    const grid = container.querySelector('.landing-hero-grid');
    expect(grid?.getAttribute('data-has-image')).toBe('false');
    expect(container.querySelector('.landing-hero-media')).toBeNull();
    expect(screen.getByRole('heading', { name: /عنوان الكورس/ })).toBeTruthy();
    const css = readFileSync(resolve(process.cwd(), 'src/features/sections/landing.css'), 'utf8');
    expect(css).toContain(".landing-hero-grid.is-reference-split[data-has-image='false'] { grid-template-columns: minmax(0, 1fr); }");
  });

  it('never renders the removed trainer facts card', () => {
    const { container } = renderHero();
    expect(container.querySelector('.landing-hero-facts')).toBeNull();
    expect(screen.queryByText('المدرب')).toBeNull();
  });

  it('keeps the primary CTA wired to the registration form', () => {
    const registrationForm = document.createElement('section');
    registrationForm.setAttribute('data-registration-form', ''); document.body.append(registrationForm);
    renderHero(); fireEvent.click(screen.getByRole('button', { name: 'جاهز تسجل' }));
    expect(registrationForm.scrollIntoView).toHaveBeenCalledOnce(); registrationForm.remove();
  });

  it('preserves the configured image side for split layouts', () => {
    const { container } = renderHero({}, { ...section, content: { ...section.content, layout: 'splitEnd' } });
    expect(container.querySelector('.landing-hero-grid')?.classList.contains('is-image-end')).toBe(true);
  });
});
