import type { RegistrationAttribution } from '@/lib/attribution';

export type RegistrationErrorCode =
  | 'COURSE_NOT_AVAILABLE'
  | 'REGISTRATION_CLOSED'
  | 'COURSE_FULL'
  | 'VALIDATION_ERROR'
  | 'IDEMPOTENCY_CONFLICT';

export class RegistrationServiceError extends Error {
  constructor(readonly code: RegistrationErrorCode, message: string) {
    super(message);
    this.name = 'RegistrationServiceError';
  }
}

export interface PublicRegistrationResult {
  reference: string;
  status: 'received';
}

export interface PublicRegistrationConfirmation extends PublicRegistrationResult {
  courseTitle: { ar: string };
}

export interface RegistrationSubmission {
  courseSlug: string;
  fullName?: string;
  email?: string;
  phone?: string;
  answers: Record<string, string | boolean | undefined>;
  consent?: boolean;
  idempotencyKey: string;
  honeypot: string;
  formStartedAt: number;
  attribution?: RegistrationAttribution;
}

export interface RegistrationsService {
  getConfirmation(reference: string): Promise<PublicRegistrationConfirmation | null>;
  submit(input: RegistrationSubmission): Promise<PublicRegistrationResult>;
}
