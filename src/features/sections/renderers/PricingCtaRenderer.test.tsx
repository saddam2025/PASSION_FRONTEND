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

describe('dual-currency public pricing section', () => {
  afterEach(() => cleanup());
  it('keeps the single existing Egyptian price when foreign pricing is disabled', () => {
    renderPricing(baseCourse);
    expect(screen.getByText('2,000 ج.م')).toBeTruthy();
    expect(screen.queryByText('للأجانب')).toBeNull();
  });

  it('shows two labeled offers, promotional amounts and contact pricing when enabled', () => {
    renderPricing({ ...baseCourse, promoPrice: 1800, foreignPricing: { enabled: true, price: 150, promoPrice: 125, currency: 'USD', contactUs: false } });
    expect(screen.getByText('للمصريين')).toBeTruthy();
    expect(screen.getByText('للأجانب')).toBeTruthy();
    expect(screen.getByText('1,800 ج.م')).toBeTruthy();
    expect(screen.getByText('$125').getAttribute('dir')).toBe('ltr');
    expect(screen.getByText('2,000 ج.م')).toBeTruthy();
    expect(screen.getByText('$150').getAttribute('dir')).toBe('ltr');
  });

  it('shows the contact-for-price state independently for either currency', () => {
    renderPricing({ ...baseCourse, price: null, pricingContactUs: true, foreignPricing: { enabled: true, price: null, promoPrice: null, currency: 'USD', contactUs: true } });
    expect(screen.getAllByText('كلم الأكاديمية عشان تعرف تفاصيل الكورس.')).toHaveLength(2);
  });
});
