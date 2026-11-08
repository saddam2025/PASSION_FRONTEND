import { useCallback, useEffect, useRef, useState } from 'react';
import { META_PIXEL_REQUIRES_CONSENT } from '@/config/features';
import type { AppLanguage } from '@/i18n';
import { getBilingualText } from '@/i18n/useLanguage';
import {
  getMetaPixelConsentChoice,
  initPixel,
  isMetaPixelEnabled,
  saveMetaPixelConsentChoice,
  track,
  type MetaPixelConsentChoice,
} from '@/lib/metaPixel';
import type { CoursePageDetail } from '@/services/courses.types';

const LEAD_SESSION_KEY = 'passion.meta-pixel-lead-references';

function wasLeadTracked(reference: string): boolean {
  try {
    const references: unknown = JSON.parse(window.sessionStorage.getItem(LEAD_SESSION_KEY) ?? '[]');
    return Array.isArray(references) && references.includes(reference);
  } catch {
    return false;
  }
}

function rememberLead(reference: string): void {
  try {
    const current: unknown = JSON.parse(window.sessionStorage.getItem(LEAD_SESSION_KEY) ?? '[]');
    const references = Array.isArray(current) ? current.filter((item): item is string => typeof item === 'string') : [];
    window.sessionStorage.setItem(LEAD_SESSION_KEY, JSON.stringify([...references.slice(-99), reference]));
  } catch {
    // Event delivery remains best effort when session storage is unavailable.
  }
}

export function useLandingMetaPixel(course: CoursePageDetail | null, language: AppLanguage) {
  const [consentChoice, setConsentChoice] = useState<MetaPixelConsentChoice>(getMetaPixelConsentChoice);
  const trackedSlug = useRef<string | null>(null);

  useEffect(() => {
    if (!course || !isMetaPixelEnabled() || (META_PIXEL_REQUIRES_CONSENT && consentChoice !== 'accepted')) return;
    if (trackedSlug.current === course.slug || !initPixel()) return;

    track('PageView');
    const params: Record<string, string | number | string[]> = {
      content_name: getBilingualText(course.title, language),
      content_type: 'course',
      content_ids: [course.slug],
    };
    if (typeof course.price === 'number' && Number.isFinite(course.price)) {
      params.currency = course.currency;
      params.value = course.promoPrice ?? course.price;
    }
    track('ViewContent', params);
    trackedSlug.current = course.slug;
  }, [course, language, consentChoice]);

  const trackLead = useCallback((reference: string) => {
    if (!course || !reference || !isMetaPixelEnabled() || !hasConsent(consentChoice) || !initPixel()) return;
    if (wasLeadTracked(reference)) return;
    rememberLead(reference);
    track('Lead', {
      content_name: getBilingualText(course.title, language),
      content_type: 'course',
    }, { eventID: reference });
  }, [course, consentChoice, language]);

  const chooseConsent = useCallback((choice: Exclude<MetaPixelConsentChoice, null>) => {
    saveMetaPixelConsentChoice(choice);
    setConsentChoice(choice);
  }, []);

  return {
    trackLead,
    consentChoice,
    showConsent: META_PIXEL_REQUIRES_CONSENT && isMetaPixelEnabled() && consentChoice === null,
    chooseConsent,
  };
}

function hasConsent(choice: MetaPixelConsentChoice): boolean {
  return !META_PIXEL_REQUIRES_CONSENT || choice === 'accepted';
}
