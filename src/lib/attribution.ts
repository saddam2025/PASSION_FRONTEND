export interface Attribution {
  source?: string;
  medium?: string;
  campaign?: string;
  referrer?: string;
  referrerPath?: string;
  landingSlug?: string;
}
const key = 'passion-attribution.v1';
export function captureAttribution(
  search = window.location.search,
  pathname = window.location.pathname,
): Attribution {
  try {
    const existing = sessionStorage.getItem(key);
    if (existing) {
      const firstTouch = JSON.parse(existing) as Attribution;
      const landing = pathname.match(/\/courses\/([^/]+)/)?.[1];
      if (!firstTouch.landingSlug && landing) {
        firstTouch.landingSlug = landing;
        sessionStorage.setItem(key, JSON.stringify(firstTouch));
      }
      return firstTouch;
    }
    const params = new URLSearchParams(search);
    const match = pathname.match(/\/courses\/([^/]+)/);
    const data: Attribution = {
      source: params.get('utm_source') ?? undefined,
      medium: params.get('utm_medium') ?? undefined,
      campaign: params.get('utm_campaign') ?? undefined,
      referrer: document.referrer || undefined,
      referrerPath: document.referrer ? new URL(document.referrer).pathname : undefined,
      landingSlug: match?.[1],
    };
    sessionStorage.setItem(key, JSON.stringify(data));
    return data;
  } catch {
    return {};
  }
}
export function getAttribution(): Attribution {
  try {
    return JSON.parse(sessionStorage.getItem(key) ?? '{}') as Attribution;
  } catch {
    return {};
  }
}

export interface RegistrationAttribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer?: string;
}

export function getRegistrationAttribution(): RegistrationAttribution {
  const firstTouch = getAttribution();
  return {
    ...(firstTouch.source ? { utm_source: firstTouch.source } : {}),
    ...(firstTouch.medium ? { utm_medium: firstTouch.medium } : {}),
    ...(firstTouch.campaign ? { utm_campaign: firstTouch.campaign } : {}),
    ...(firstTouch.referrer ? { referrer: firstTouch.referrer } : {}),
  };
}
