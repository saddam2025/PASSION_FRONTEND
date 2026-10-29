import type { BilingualText } from '@/schemas';
import type { Attribution } from '@/lib/attribution';
export interface PublicRegistrationConfirmation {
  reference: string;
  courseTitle: BilingualText;
  firstName: string;
  alreadyRegistered?: boolean;
}
export interface RegistrationSubmission {
  courseSlug: string;
  answers: Record<string, string | boolean | undefined>;
  consent: boolean;
  idempotencyKey: string;
  honeypot: string;
  renderedAt: number;
  attribution?: Attribution;
}
export interface RegistrationsService {
  getConfirmation(reference: string): Promise<PublicRegistrationConfirmation | null>;
  submit(input: RegistrationSubmission): Promise<PublicRegistrationConfirmation>;
}
