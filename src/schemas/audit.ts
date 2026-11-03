export const auditActions = [
  'course.created',
  'course.details_saved',
  'course.published_directly',
  'course.unpublished',
  'course.archived',
  'course.unarchived',
  'course.deleted',
  'lead.created',
  'lead.updated',
  'enrollment.created',
  'enrollment.follow_up_changed',
  'enrollment.assigned',
  'enrollment.confirmed',
  'enrollment.cancelled',
  'enrollment.note_added',
  'enrollment.note_deleted',
  'enrollment.contact_logged',
  'payment.recorded',
  'payment.voided',
  'user.role_changed',
  'user.deactivated',
  'user.reactivated',
  'user.password_reset_link',
  'invite.created',
  'invite.resent',
  'invite.revoked',
  'invite.deleted',
  'invite.accepted',
  'settings.updated',
  'auth.login_failed',
  'auth.login_succeeded',
  'export.csv',
] as const;
export type AuditAction = (typeof auditActions)[number];
export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !/(password|token|secret|authorization)/i.test(key))
        .map(([key, item]) => [key, redact(item)]),
    );
  return value;
}
