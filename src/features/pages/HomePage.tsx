import { Fragment, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/i18n/useLanguage';
import { publicCoursesService } from '@/services/courses';
import { usePublicSettings } from '@/services/usePublicSettings';
import { useSeo } from '@/lib/useSeo';
import { HeroSection } from '@/features/public/home/sections/HeroSection';
import { AboutSection } from '@/features/public/home/sections/AboutSection';
import { FeaturedCoursesSection } from '@/features/public/home/sections/FeaturedCoursesSection';
import { HowItWorksSection } from '@/features/public/home/sections/HowItWorksSection';
import { ContactSection } from '@/features/public/home/sections/ContactSection';
import { CourseCategoryTicker } from '@/features/public/home/sections/CourseCategoryTicker';
import { CourseAccreditationSection, CourseInstructorsSection, CourseModesSection } from '@/features/public/home/sections/AcademyHighlightsSections';
import { ErrorState } from '@/components/ui/feedback';

export default function HomePage() {
  const { language } = useLanguage();
  const { t } = useTranslation('home');
  const [settingsError, setSettingsError] = useState(false);
  const handleSettingsLoad = useCallback((state: 'loaded' | 'error') => setSettingsError(state === 'error'), []);
  const settings = usePublicSettings(handleSettingsLoad);
  const featured = useQuery({ queryKey: ['public-courses', 'featured', 12], queryFn: () => publicCoursesService.getFeatured(12) });
  useSeo({ title: settings.academyName.ar || t('title'), description: settings.description.ar || t('intro'), language });
  const sections = [
    { id: 'home-hero', type: 'hero', visible: true, order: 0, content: { title: t('heroTitle'), intro: t('heroIntro') } },
    { id: 'home-about', type: 'about', visible: true, order: 1, content: { title: t('aboutTitle'), text: t('aboutText') } },
    { id: 'home-courses', type: 'featuredCourses', visible: true, order: 2, content: { title: t('featuredTitle') } },
    { id: 'home-how', type: 'howItWorks', visible: true, order: 3, content: { title: t('howTitle'), steps: [t('howStep1'), t('howStep2'), t('howStep3')] } },
    { id: 'home-contact', type: 'contact', visible: true, order: 4, content: { title: t('contactTitle') } },
  ];
  const courses = featured.data ?? [];
  return <>{settingsError && <div className="ps-container pe-container pt-6"><ErrorState title="حصلت مشكلة في تحميل إعدادات الموقع، جرّب تاني." onRetry={() => window.dispatchEvent(new Event('passion-settings-updated'))} /></div>}{sections.map((section) => {
    if (section.type === 'hero') return <Fragment key={section.id}><HeroSection title={String(section.content.title)} intro={String(section.content.intro)} /><CourseCategoryTicker courses={courses} /></Fragment>;
    if (section.type === 'about') return <AboutSection key={section.id} title={String(section.content.title)} body={String(section.content.text)} />;
    if (section.type === 'featuredCourses') return <FeaturedCoursesSection key={section.id} title={String(section.content.title)} courses={courses} loading={featured.isPending} error={featured.isError} onRetry={() => void featured.refetch()} />;
    if (section.type === 'howItWorks') return <Fragment key={section.id}><HowItWorksSection title={String(section.content.title)} steps={section.content.steps as string[]} /><CourseModesSection courses={courses} /><CourseInstructorsSection courses={courses} /><CourseAccreditationSection courses={courses} /></Fragment>;
    return <ContactSection key={section.id} title={String(section.content.title)} />;
  })}</>;
}
