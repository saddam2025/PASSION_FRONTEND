// MOCK: remove in batch A4
import type { PublicRegistrationConfirmation } from '@/services/registrations.types';
export const mockConfirmations: PublicRegistrationConfirmation[] = [
  {
    reference: 'MOCK-REF-001',
    courseTitle: { ar: 'كورس تجريبي' },
    status: 'received',
  },
];
