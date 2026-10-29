import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { RouteSkeleton, ErrorState } from '@/components/ui/feedback';
import { PageRenderer } from '@/features/sections/PageRenderer';
import type { CoursePageContextValue } from '@/features/sections/CoursePageContext';
import { useLanguage, getBilingualText } from '@/i18n/useLanguage';
import { usePublicSettings } from '@/services/usePublicSettings';
import { coursesService } from '@/services/courses';
import type { CoursePageDetail } from '@/services/courses.types';
import { useSeo } from '@/lib/useSeo';
import { captureAttribution } from '@/lib/attribution';
export default function CourseDetailPage() {
  const { slug = '' } = useParams();
  const { language } = useLanguage();
  const { t } = useTranslation(['sections', 'courses']);
  const settings = usePublicSettings();
  const navigate = useNavigate();
  const [course, setCourse] = useState<CoursePageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const jsonLdRef = useRef<HTMLScriptElement>(null);
  useEffect(() => {
    captureAttribution(window.location.search, window.location.pathname);
  }, [slug]);
  useEffect(() => {
    let current = true;
    setLoading(true);
    setCourse(null);
    setMissing(false);
    void coursesService
      .getBySlug(slug)
      .then((result) => {
        if (!current) return;
        if (result.status === 'redirect') {
          navigate(`/${language}/courses/${result.slug}`, { replace: true });
          return;
        }
        if (result.status === 'notFound') {
          setMissing(true);
          return;
        }
        setCourse(result.course);
      })
      .catch(() => {
        if (current) setMissing(true);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [slug, language, navigate]);
  const context = useMemo(
    () =>
      course
        ? ({
            course: {
              id: course.id,
              slug: course.slug,
              title: course.title,
              shortDescription: course.shortDescription,
              price: course.price,
              promoPrice: course.promoPrice,
              currency: course.currency,
              startDate: course.startDate,
              registrationOpen: course.registrationOpen,
              accreditationVerified: course.accreditationVerified ?? false,
              instructor: course.instructor,
              delivery: course.delivery,
              schedule: course.schedule,
              accreditation: course.accreditation,
              whatsappMessageTemplate: course.whatsappMessageTemplate,
            },
            settings: {
              academyName: settings.academyName,
              whatsappNumber: settings.whatsappNumber,
              phone: settings.phone,
              email: settings.email,
            },
            formDefinition: course.formDefinition,
          } satisfies Omit<CoursePageContextValue, 'mode'>)
        : null,
    [course, settings],
  );
  useSeo({
    title: course
      ? `${getBilingualText(course.title, language)} | ${getBilingualText(settings.academyName, language)}`
      : t('detailTitle', { ns: 'courses' }),
    description: course
      ? getBilingualText(course.shortDescription, language)
      : t('detailIntro', { ns: 'courses' }),
    language,
    robots: missing ? 'noindex,follow' : 'index,follow',
  });
  const first = course?.pageConfig.sections.find((section) => section.visible);
  const hideCrumb = first?.type === 'hero' && first.content.layout === 'imageBackground';
  const hasRegistration = Boolean(
    course?.pageConfig.sections.some(
      (section) => section.type === 'registrationForm' && section.visible,
    ),
  );
  useEffect(() => {
    if (!course || !course.registrationOpen || !hasRegistration) return;
    const node = document.getElementById('register');
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setFormVisible(Boolean(entry?.isIntersecting)),
      { rootMargin: '0px 0px -15% 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [course, hasRegistration]);
  const schema = course
    ? JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: getBilingualText(course.title, language),
        description: getBilingualText(course.shortDescription, language),
        provider: {
          '@type': 'Organization',
          name: getBilingualText(settings.academyName, language),
        },
        courseMode: course.deliveryMethod || undefined,
        startDate: course.startDate || undefined,
      }).replace(/</g, '\\u003c')
    : '';
  useEffect(() => {
    if (jsonLdRef.current) jsonLdRef.current.textContent = schema;
  }, [schema]);
  if (loading)
    return (
      <div className="ps-container pe-container py-12">
        <RouteSkeleton />
      </div>
    );
  if (missing || !course)
    return (
      <section className="ps-container pe-container grid justify-items-start gap-5 py-16">
        <ErrorState title={t('notFound')} description={t('detailIntro')} />
        <Link className="text-primary-strong underline" to={`/${language}/courses`}>
          {t('catalog')}
        </Link>
      </section>
    );
  return (
    <>
      <script ref={jsonLdRef} type="application/ld+json" />
      {!hideCrumb && (
        <nav
          aria-label={language === 'ar' ? 'مسار التنقل' : 'Breadcrumb'}
          className="ps-container pe-container py-4 text-sm text-muted"
        >
          <Link to={`/${language}`}>{t('home')}</Link>
          <span aria-hidden="true"> / </span>
          <Link to={`/${language}/courses`}>{t('courses')}</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page" className="text-ink">
            {getBilingualText(course.title, language)}
          </span>
        </nav>
      )}
      <PageRenderer config={course.pageConfig} context={context!} />
      {course.registrationOpen && hasRegistration && !formVisible && (
        <div className="sticky-register-bar z-30 border-t border-border bg-surface/95 p-3 shadow-elevated backdrop-blur lg:hidden">
          <Button
            className="w-full"
            onClick={() =>
              document.getElementById('register')?.scrollIntoView({
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                  ? 'auto'
                  : 'smooth',
                block: 'start',
              })
            }
          >
            {t('register')}
          </Button>
        </div>
      )}
    </>
  );
}
