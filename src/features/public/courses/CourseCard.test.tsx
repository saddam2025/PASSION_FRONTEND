// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import type { CourseSummary } from '@/services/courses.types';
import { CourseCard } from './CourseCard';

const course: CourseSummary = {
  slug: 'dual-course', title: { ar: 'كورس تجريبي', en: '' }, shortDescription: { ar: '', en: '' },
  category: { ar: 'إدارة', en: '' }, instructorName: { ar: '', en: '' },
  coverImage: { src: '/cover.webp', alt: { ar: '', en: '' }, decorative: true },
  price: 2000, promoPrice: 1800, pricingContactUs: false, currency: 'EGP',
  foreignPricing: { enabled: true, price: 150, promoPrice: 125, currency: 'USD' },
  startDate: '', duration: { ar: '', en: '' }, deliveryMethod: '', publishedAt: '', featured: false,
};

describe('public course card dual-currency prices', () => {
  afterEach(() => cleanup());

  it('shows separately labeled EGP and USD prices with their promotional amounts', () => {
    render(<LanguageProvider><MemoryRouter><CourseCard course={course} /></MemoryRouter></LanguageProvider>);
    expect(screen.getByText('السعر للمصريين: 1,800 ج.م')).toBeTruthy();
    expect(screen.getByText('السعر للأجانب: 125 $')).toBeTruthy();
    expect(screen.getByText('2,000 ج.م')).toBeTruthy();
    expect(screen.getByText('150 $')).toBeTruthy();
  });
});
