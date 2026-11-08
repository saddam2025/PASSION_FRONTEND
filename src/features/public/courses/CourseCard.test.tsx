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
  startDate: '', duration: { ar: '', en: '' }, deliveryMethod: '', publishedAt: '', featured: false,
};

describe('public course card selected-currency price', () => {
  afterEach(() => cleanup());

  it('shows one selected USD price and its promotional amount', () => {
    const usdCourse = { ...course, price: 150, promoPrice: 125, currency: 'USD' };
    render(<LanguageProvider><MemoryRouter><CourseCard course={usdCourse} /></MemoryRouter></LanguageProvider>);
    expect(screen.getByText('125 $')).toBeTruthy();
    expect(screen.getByText('150 $')).toBeTruthy();
    expect(screen.queryByText(/المصريين|الأجانب/)).toBeNull();
  });
});
