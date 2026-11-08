// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import { CoursePageProvider, type CoursePageContextValue } from '@/features/sections/CoursePageContext';
import { SectionSchema } from '@/schemas/sections';
import PricingCtaRenderer from './PricingCtaRenderer';

const baseCourse: CoursePageContextValue['course'] = {
  id: 'course-1', slug: 'course-one', title: { ar: 'كورس تجريبي', en: '' }, shortDescription: { ar: 'وصف', en: '' },
  price: 2000, promoPrice: null, currency: 'EGP', startDate: '', registrationOpen: true,
  whatsappMessageTemplate: { ar: '', en: '' },
};
const section = SectionSchema.parse({ id: '4f4c7246-86ac-4f16-9c59-dd3bf2a6801d', type: 'pricingCta' });

function renderPricing(course: CoursePageContextValue['course']) {
  return render(<LanguageProvider><CoursePageProvider value={{ course, settings: { academyName: { ar: 'الأكاديمية', en: '' }, whatsappNumber: '', phone: '', email: '' }, formDefinition: { fields: [] }, mode: 'public' }}><PricingCtaRenderer section={section} mode="public" /></CoursePageProvider></LanguageProvider>);
}

describe('single selected-currency public pricing section', () => {
  afterEach(() => cleanup());
  it('keeps the single existing Egyptian price when foreign pricing is disabled', () => {
    renderPricing(baseCourse);
    expect(screen.getByText('2,000 ج.م')).toBeTruthy();
    expect(screen.queryByText(/المصريين|الأجانب/)).toBeNull();
  });

  it('shows one USD offer and its promotional amount when USD is selected', () => {
    renderPricing({ ...baseCourse, price: 150, promoPrice: 125, currency: 'USD' });
    expect(screen.getByText('$125').getAttribute('dir')).toBe('ltr');
    expect(screen.getByText('$150').getAttribute('dir')).toBe('ltr');
    expect(screen.queryByText(/المصريين|الأجانب/)).toBeNull();
  });

  it('shows a single contact-for-price state in the selected currency', () => {
    renderPricing({ ...baseCourse, price: null, pricingContactUs: true, currency: 'USD' });
    expect(screen.getAllByText('تواصل لمعرفة السعر')).toHaveLength(1);
  });
});
