// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { initPixel, META_PIXEL_CONSENT_STORAGE_KEY, track } from '@/lib/metaPixel';
import type { CoursePageDetail } from '@/services/courses.types';
import { useLandingMetaPixel } from './useLandingMetaPixel';

const consentConfig = vi.hoisted(() => ({ required: false }));
vi.mock('@/config/features', () => ({
  get META_PIXEL_REQUIRES_CONSENT() { return consentConfig.required; },
}));

const course = (overrides: Partial<CoursePageDetail> = {}): CoursePageDetail => ({
  id: 'course-id', slug: 'course-one', title: { ar: 'كورس تجريبي', en: '' },
  shortDescription: { ar: 'وصف', en: '' }, category: { ar: 'فئة', en: '' },
  instructorName: { ar: 'مدرب', en: '' }, coverImage: { src: '', alt: { ar: '', en: '' }, decorative: true }, price: 2000,
  promoPrice: null, currency: 'EGP', startDate: '', duration: { ar: '', en: '' },
  deliveryMethod: '', publishedAt: '', featured: false, registrationOpen: true,
  whatsappMessageTemplate: { ar: '', en: '' }, pageConfig: { schemaVersion: 1, sections: [] },
  formDefinition: { fields: [] }, ...overrides,
});

function trackedEvents() {
  return window.fbq?.queue?.filter((args) => args[0] === 'track') ?? [];
}

describe('Meta Pixel for published landing pages', () => {
  beforeEach(() => {
    consentConfig.required = false;
    vi.stubEnv('VITE_META_PIXEL_ID', '12345678');
    document.querySelectorAll('script[data-meta-pixel]').forEach((script) => script.remove());
    delete window.fbq;
    delete window._fbq;
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it.each(['', 'pixel-id', '1234567', '123456789012345678901'])('disables all pixel calls for invalid id %j', (pixelId) => {
    vi.stubEnv('VITE_META_PIXEL_ID', pixelId);
    expect(initPixel()).toBe(false);
    track('PageView');
    expect(document.querySelector('script[data-meta-pixel]')).toBeNull();
    expect(window.fbq).toBeUndefined();
  });

  it('injects the async script and initializes once even when called repeatedly', () => {
    expect(initPixel()).toBe(true);
    expect(initPixel()).toBe(true);
    const scripts = document.querySelectorAll('script[data-meta-pixel]');
    expect(scripts).toHaveLength(1);
    expect((scripts[0] as HTMLScriptElement).async).toBe(true);
    expect((scripts[0] as HTMLScriptElement).src).toBe('https://connect.facebook.net/en_US/fbevents.js');
    expect(window.fbq?.queue).toEqual([['init', '12345678']]);
  });

  it('tracks PageView and ViewContent once per slug with single-price data only', () => {
    const published = course();
    const hook = renderHook(({ value }) => useLandingMetaPixel(value, 'ar'), { initialProps: { value: published } });
    hook.rerender({ value: published });
    const events = trackedEvents();
    expect(events.filter((args) => args[1] === 'PageView')).toHaveLength(1);
    const viewContent = events.find((args) => args[1] === 'ViewContent');
    expect(viewContent?.[2]).toEqual({
      content_name: 'كورس تجريبي', content_type: 'course', content_ids: ['course-one'], currency: 'EGP', value: 2000,
    });
  });

  it('tracks the one selected USD offer without audience selection', () => {
    renderHook(() => useLandingMetaPixel(course({ price: 150, currency: 'USD' }), 'ar'));
    const viewContent = trackedEvents().find((args) => args[1] === 'ViewContent');
    expect(viewContent?.[2]).toEqual({ content_name: 'كورس تجريبي', content_type: 'course', content_ids: ['course-one'], currency: 'USD', value: 150 });
  });

  it('fires Lead once per reference with course-only parameters and the reference as eventID', () => {
    const hook = renderHook(() => useLandingMetaPixel(course(), 'ar'));
    hook.result.current.trackLead('PAS-REFERENCE');
    hook.result.current.trackLead('PAS-REFERENCE');
    const leadEvents = trackedEvents().filter((args) => args[1] === 'Lead');
    expect(leadEvents).toHaveLength(1);
    expect(leadEvents[0]?.[2]).toEqual({ content_name: 'كورس تجريبي', content_type: 'course' });
    expect(leadEvents[0]?.[3]).toEqual({ eventID: 'PAS-REFERENCE' });
    expect(JSON.stringify(leadEvents)).not.toMatch(/email|phone|fullName|answers|سلمى|010123/);
    expect(window.sessionStorage.getItem('passion.meta-pixel-lead-references')).toContain('PAS-REFERENCE');
  });

  it('waits for explicit consent, persists rejection, and initializes after acceptance', async () => {
    consentConfig.required = true;
    const hook = renderHook(() => useLandingMetaPixel(course(), 'ar'));
    expect(hook.result.current.showConsent).toBe(true);
    expect(window.fbq).toBeUndefined();
    act(() => hook.result.current.chooseConsent('rejected'));
    expect(window.localStorage.getItem(META_PIXEL_CONSENT_STORAGE_KEY)).toBe('rejected');
    expect(window.fbq).toBeUndefined();
    hook.unmount();

    window.localStorage.removeItem(META_PIXEL_CONSENT_STORAGE_KEY);
    const acceptedHook = renderHook(() => useLandingMetaPixel(course(), 'ar'));
    act(() => acceptedHook.result.current.chooseConsent('accepted'));
    expect(window.localStorage.getItem(META_PIXEL_CONSENT_STORAGE_KEY)).toBe('accepted');
    await waitFor(() => expect(trackedEvents().filter((args) => args[1] === 'PageView')).toHaveLength(1));
  });

  it('does not throw when the pixel script cannot be added or fbq throws', () => {
    const append = vi.spyOn(document.head, 'append').mockImplementation(() => { throw new Error('blocked'); });
    expect(() => track('PageView')).not.toThrow();
    append.mockRestore();
    window.fbq = (() => { throw new Error('blocked'); }) as typeof window.fbq;
    expect(() => track('Lead', { content_type: 'course' })).not.toThrow();
  });
});
