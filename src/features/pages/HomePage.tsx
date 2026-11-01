import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Reveal } from '@/components/common/motion';
import { useLanguage } from '@/i18n/useLanguage';
import { publicCoursesService as coursesService } from '@/services/courses';
import { siteContentService } from '@/services/siteContent.mock';
import type { HomeSection } from '@/services/siteContent';
import type { CourseSummary } from '@/services/courses.types';
import { list, text } from '@/features/public/home/sections/content';
import { HeroSection } from '@/features/public/home/sections/HeroSection';
import { AboutSection } from '@/features/public/home/sections/AboutSection';
import { TrustStripSection } from '@/features/public/home/sections/TrustStripSection';
import { FeaturedCoursesSection } from '@/features/public/home/sections/FeaturedCoursesSection';
import { WhyUsSection } from '@/features/public/home/sections/WhyUsSection';
import { HowItWorksSection } from '@/features/public/home/sections/HowItWorksSection';
import { InstructorSection } from '@/features/public/home/sections/InstructorSection';
import { AccreditationSection } from '@/features/public/home/sections/AccreditationSection';
import { TestimonialsSection } from '@/features/public/home/sections/TestimonialsSection';
import { GallerySection } from '@/features/public/home/sections/GallerySection';
import { FaqSection } from '@/features/public/home/sections/FaqSection';
import { ContactSection } from '@/features/public/home/sections/ContactSection';
import { useSeo } from '@/lib/useSeo';
function hasRequiredContent(section: HomeSection, courses: CourseSummary[]): boolean {
  const content = section.content;
  const filled = (key: string) => Boolean(text(content[key], 'ar'));
  switch (section.type) {
    case 'hero':
      return filled('title');
    case 'about':
      return filled('text');
    case 'trustStrip':
    case 'whyUs':
    case 'howItWorks':
    case 'accreditation':
    case 'testimonials':
    case 'gallery':
    case 'faq':
      return (
        list(
          section,
          section.type === 'trustStrip' ||
            section.type === 'accreditation' ||
            section.type === 'testimonials' ||
            section.type === 'gallery'
            ? 'items'
            : section.type === 'whyUs'
              ? 'items'
              : section.type === 'howItWorks'
                ? 'steps'
                : 'items',
        ).length > 0
      );
    case 'featuredCourses':
      return courses.length > 0;
    case 'instructor':
      return filled('name') && filled('bio');
    case 'contact':
      return true;
  }
}
export default function HomePage() {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [sample, setSample] = useState(false);
  const [params] = useSearchParams();
  const { language } = useLanguage();
  const { t } = useTranslation('home');
  useSeo({ title: t('title'), description: t('intro'), language });
  useEffect(() => {
    let live = true;
    void Promise.all([siteContentService.get(), coursesService.getFeatured(12)]).then(
      async ([content, featured]) => {
        let data = content.homeSections;
        if (import.meta.env.DEV && params.get('sample') === '1') {
          const fixture = await import('@/mocks/siteContent.sample');
          data = [
            ...data.filter(
              (x) => !['trustStrip', 'accreditation', 'testimonials', 'gallery'].includes(x.type),
            ),
            ...fixture.sampleSections,
          ];
          if (live) setSample(true);
        }
        if (live) {
          setSections(data.sort((a, b) => a.order - b.order));
          setCourses(featured);
        }
      },
    );
    return () => {
      live = false;
    };
  }, [params]);
  const map: Record<string, (s: HomeSection) => React.ReactNode> = {
    hero: (s) => <HeroSection section={s} />,
    about: (s) => <AboutSection section={s} />,
    trustStrip: (s) => <TrustStripSection section={s} />,
    featuredCourses: (s) => <FeaturedCoursesSection section={s} courses={courses} />,
    whyUs: (s) => <WhyUsSection section={s} />,
    howItWorks: (s) => <HowItWorksSection section={s} />,
    instructor: (s) => <InstructorSection section={s} />,
    accreditation: (s) => <AccreditationSection section={s} />,
    testimonials: (s) => <TestimonialsSection section={s} />,
    gallery: (s) => <GallerySection section={s} />,
    faq: (s) => <FaqSection section={s} />,
    contact: (s) => <ContactSection section={s} />,
  };
  return (
    <>
      {sample && (
        <div className="fixed end-3 top-20 z-50 rounded-full bg-warning ps-3 pe-3 py-2 text-xs font-bold text-white">
          {t('sampleData')}
        </div>
      )}
      {sections
        .filter((s) => s.visible && map[s.type] && hasRequiredContent(s, courses))
        .map((s) => (
          <Reveal key={s.id}>{map[s.type](s)}</Reveal>
        ))}
      {!sections.some((section) => section.type === 'featuredCourses' && section.visible) && courses.length > 0 && (
        <FeaturedCoursesSection
          section={{ id: 'published-courses', type: 'featuredCourses', visible: true, order: Number.MAX_SAFE_INTEGER, content: { title: { ar: 'الكورسات المتاحة', en: '' } } }}
          courses={courses}
        />
      )}
    </>
  );
}
