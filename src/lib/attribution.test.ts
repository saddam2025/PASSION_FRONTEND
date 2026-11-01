import { afterEach, describe, expect, it, vi } from 'vitest';
import { captureAttribution, getAttribution, getRegistrationAttribution } from './attribution';

const values = new Map<string, string>();
const session = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => values.set(key, value),
  removeItem: (key: string) => values.delete(key),
};

describe('first-touch attribution', () => {
  afterEach(() => {
    values.clear();
    vi.unstubAllGlobals();
  });

  it('captures UTM values and referrer once, then maps them to the registration API shape', () => {
    vi.stubGlobal('sessionStorage', session);
    vi.stubGlobal('document', { referrer: 'https://example.test/ad?click=1' });
    captureAttribution('?utm_source=search&utm_medium=cpc&utm_campaign=november', '/ar/courses/leadership');
    captureAttribution('?utm_source=changed', '/ar/courses/other-course');
    expect(getAttribution()).toMatchObject({
      source: 'search',
      medium: 'cpc',
      campaign: 'november',
      referrer: 'https://example.test/ad?click=1',
      landingSlug: 'leadership',
    });
    expect(getRegistrationAttribution()).toEqual({
      utm_source: 'search',
      utm_medium: 'cpc',
      utm_campaign: 'november',
      referrer: 'https://example.test/ad?click=1',
    });
  });
});
