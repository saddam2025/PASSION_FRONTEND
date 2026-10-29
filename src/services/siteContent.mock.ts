// MOCK: remove in batch A4
import { mockSiteContent } from '@/mocks/siteContent';
import type { SiteContent } from '@/services/siteContent';
export const siteContentService = {
  async get(): Promise<SiteContent> {
    return mockSiteContent;
  },
};
