// MOCK: versioned local workflow database validation; replace with API DTO validation in A4.
import { z } from 'zod';
import { RevisionSchema } from '@/schemas/revision';
import { LeadSchema, EnrollmentSchema } from '@/schemas/lead';
import { PaymentRecordSchema } from '@/schemas/payment';
import { PermissionKeySchema } from '@/schemas/permissions';

export const MockDatabaseSchema = z
  .object({
    schemaVersion: z.literal(2),
    courses: z.array(z.any()),
    revisions: z.array(RevisionSchema),
    notifications: z.array(
      z
        .object({
          id: z.string(),
          type: z.enum([
            'course_submitted',
            'course_withdrawn',
            'course_published',
            'course_unpublished',
            'revision_approved',
            'revision_rejected',
            'course_deletion_requested',
            'course_deletion_approved',
            'course_deletion_rejected',
            'new_registration',
            'payment_recorded',
          ]),
          entityId: z.string(),
          courseId: z.string().optional(),
          recipientRole: z.enum(['admin', 'assistant']),
          recipientId: z.string().optional(),
          createdAt: z.string(),
          readAt: z.string().nullable(),
        })
        .strict(),
    ),
    audit: z.array(
      z
        .object({
          id: z.string(),
          actorId: z.string(),
          action: z.string(),
          entityId: z.string(),
          at: z.string(),
          entityType: z.string().optional(),
          from: z.string().optional(),
          to: z.string().optional(),
          note: z.string().optional(),
          metadata: z.unknown().optional(),
        })
        .strict(),
    ),
    leads: z.array(LeadSchema),
    enrollments: z.array(EnrollmentSchema),
    payments: z.array(PaymentRecordSchema),
    users: z.array(
      z
        .object({
          id: z.string(),
          name: z.object({ ar: z.string(), en: z.string() }),
          email: z.string().email(),
          role: z.enum(['admin', 'assistant']),
          permissions: z.array(PermissionKeySchema),
          active: z.boolean(),
          createdAt: z.string(),
          lastLogin: z.string().optional(),
          passwordSalt: z.string().optional(),
          passwordHash: z.string().optional(),
          failedLogins: z.number().optional(),
          lockoutUntil: z.number().optional(),
        })
        .strict(),
    ),
    invites: z.array(
      z
        .object({
          id: z.string(),
          email: z.string().email(),
          name: z.string().optional(),
          permissions: z.array(PermissionKeySchema),
          tokenHash: z.string(),
          createdAt: z.string(),
          expiresAt: z.string(),
          invitedBy: z.string(),
          status: z.enum(['pending', 'accepted', 'revoked']),
          acceptedAt: z.string().optional(),
        })
        .strict(),
    ),
    resetTokens: z.array(
      z
        .object({
          id: z.string(),
          userId: z.string(),
          tokenHash: z.string(),
          expiresAt: z.string(),
          usedAt: z.string().optional(),
        })
        .strict(),
    ),
    notes: z.array(
      z
        .object({
          id: z.string(),
          leadId: z.string().optional(),
          enrollmentId: z.string().optional(),
          authorId: z.string(),
          body: z.string(),
          createdAt: z.string(),
        })
        .strict(),
    ),
    alreadyRegisteredRefs: z.array(z.string()),
    demoIds: z
      .object({
        leads: z.array(z.string()),
        enrollments: z.array(z.string()),
        payments: z.array(z.string()),
      })
      .optional(),
    settings: z
      .object({
        version: z.number(),
        values: z.record(z.string(), z.unknown()),
        policyVersion: z.number(),
      })
      .strict(),
  })
  .strict();
