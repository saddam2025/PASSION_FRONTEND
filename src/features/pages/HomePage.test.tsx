import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import HomePage from './HomePage';

const fixture = vi.hoisted(() => ({
  courses: [] as unknown[],
  settings: {
    academyName: { ar: '', en: '' }, logo: '', favicon: '', whatsappNumber: '', email: '', phone: '',
    address: { ar: '', en: '' }, mapLink: '', openingHours: { ar: '', en: '' },
    description: { ar: '', en: '' }, privacyUrl: '', allowSearchEngines: true,
    socials: { facebook: '', instagram: '', linkedin: '', youtube: '', tiktok: '', x: '' },
  },
}));

vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...await importOriginal(),
  useQuery: () => ({ data: fixture.courses }),
}));
vi.mock('@/i18n/useLanguage', () => ({ useLanguage: () => ({ language: 'ar' }) }));
vi.mock('@/services/usePublicSettings', () => ({ usePublicSettings: () => fixture.settings }));
vi.mock('@/lib/useSeo', () => ({ useSeo: vi.fn() }));
vi.mock('react-i18next', async (importOriginal) => ({
  ...await importOriginal(),
  useTranslation: (namespace: string) => ({
    t: (key: string) => ({
      'home.heroTitle': 'ابدأ خطوتك الجاية مع كورس مناسب ليك',
      'home.heroIntro': 'اختار من الكورسات المتاحة.',
      'home.aboutTitle': 'عن الأكاديمية',
      'home.aboutText': 'كلام تعريفي ثابت.',
      'home.featuredTitle': 'الكورسات المتاحة',
      'home.howTitle': 'إزاي تشترك؟',
      'home.howStep1': 'اختار الكورس.',
      'home.howStep2': 'راجع التفاصيل.',
      'home.howStep3': 'هنتواصل معاك.',
      'home.contactTitle': 'تواصل معنا',
      'home.browseCourses': 'شوف الكورسات',
      'home.contactWhatsApp': 'كلمنا على واتساب',
      'home.whatsappGreeting': 'رسالة ترحيب',
      'courses.viewAll': 'عرض الكل',
    } as Record<string, string>)[`${namespace}.${key}`] ?? key,
  }),
}));

describe('Home page with empty API data', () => {
  it('keeps fixed Arabic sections and hides empty featured courses and contact sections', () => {
    const markup = renderToStaticMarkup(<MemoryRouter><HomePage /></MemoryRouter>);

    expect(markup).toContain('ابدأ خطوتك الجاية مع كورس مناسب ليك');
    expect(markup).toContain('عن الأكاديمية');
    expect(markup).toContain('إزاي تشترك؟');
    expect(markup).not.toMatch(/<h2[^>]*>الكورسات المتاحة/);
    expect(markup).not.toMatch(/<h2[^>]*>تواصل معنا/);
    expect(markup).not.toContain('تجريبي');
  });
});
