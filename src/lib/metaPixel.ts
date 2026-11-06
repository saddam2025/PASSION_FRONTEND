import { META_PIXEL_REQUIRES_CONSENT } from '@/config/features';

export type MetaPixelEvent = 'PageView' | 'ViewContent' | 'Lead';
export type MetaPixelParams = Record<string, string | number | string[]>;
export type MetaPixelOptions = { eventID?: string };
export type MetaPixelConsentChoice = 'accepted' | 'rejected' | null;

type FbqFunction = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[][];
  push?: FbqFunction;
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    fbq?: FbqFunction;
    _fbq?: FbqFunction;
  }
}

export const META_PIXEL_CONSENT_STORAGE_KEY = 'passion.meta-pixel-consent';
const PIXEL_SCRIPT_ATTRIBUTE = 'data-meta-pixel';
let initializedPixelId: string | null = null;

function configuredPixelId(): string {
  const value = import.meta.env.VITE_META_PIXEL_ID?.trim() ?? '';
  return /^\d{8,20}$/.test(value) ? value : '';
}

export function isMetaPixelEnabled(): boolean {
  return configuredPixelId().length > 0;
}

export function getMetaPixelConsentChoice(): MetaPixelConsentChoice {
  if (!META_PIXEL_REQUIRES_CONSENT) return 'accepted';
  try {
    const value = window.localStorage.getItem(META_PIXEL_CONSENT_STORAGE_KEY);
    return value === 'accepted' || value === 'rejected' ? value : null;
  } catch {
    return null;
  }
}

export function hasMetaPixelConsent(): boolean {
  return !META_PIXEL_REQUIRES_CONSENT || getMetaPixelConsentChoice() === 'accepted';
}

export function saveMetaPixelConsentChoice(choice: Exclude<MetaPixelConsentChoice, null>): void {
  try {
    window.localStorage.setItem(META_PIXEL_CONSENT_STORAGE_KEY, choice);
  } catch {
    // Storage may be disabled; the choice still applies to the mounted page.
  }
}

function createQueue(): FbqFunction {
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue?.push(args);
  } as FbqFunction;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];
  return fbq;
}

/** Initializes the async browser pixel once. Returns false when disabled or blocked. */
export function initPixel(): boolean {
  const pixelId = configuredPixelId();
  if (!pixelId || !hasMetaPixelConsent() || typeof window === 'undefined' || typeof document === 'undefined') return false;
  try {
    if (initializedPixelId === pixelId && window.fbq) return true;
    const fbq = window.fbq ?? createQueue();
    window.fbq = fbq;
    window._fbq = fbq;
    fbq('init', pixelId);
    initializedPixelId = pixelId;

    if (!document.querySelector(`script[${PIXEL_SCRIPT_ATTRIBUTE}]`)) {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      script.setAttribute(PIXEL_SCRIPT_ATTRIBUTE, '');
      document.head.append(script);
    }
    return true;
  } catch {
    return false;
  }
}

/** Safe event wrapper: never sends user data and never lets a pixel error escape. */
export function track(
  eventName: MetaPixelEvent,
  params?: MetaPixelParams,
  options?: MetaPixelOptions,
): void {
  if (!initPixel()) return;
  try {
    window.fbq?.('track', eventName, params, options);
  } catch {
    // Tracking must never interrupt the registration or landing page experience.
  }
}
