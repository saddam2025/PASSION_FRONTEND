import type { Enrollment } from '@/schemas/lead';

type EnrollmentLike = Pick<Enrollment, 'id' | 'followUpStatus'>;

/** Updates only the selected enrollment while preserving the customer query shape. */
export function withFollowUpStatus<T extends { enrollments: EnrollmentLike[] }>(
  current: T | undefined,
  enrollmentId: string,
  followUpStatus: Enrollment['followUpStatus'],
): T | undefined {
  if (!current) return current;

  return {
    ...current,
    enrollments: current.enrollments.map((item) =>
      item.id === enrollmentId ? { ...item, followUpStatus } : item,
    ),
  };
}
