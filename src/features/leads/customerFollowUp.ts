import type { Enrollment } from '@/schemas/lead';

type EnrollmentLike = Pick<Enrollment, 'id' | 'followUpStatus'>;

export const customerQueryKey = (enrollmentId: string) => ['customer', enrollmentId] as const;

export const isFollowUpChange = (
  current: Enrollment['followUpStatus'],
  requested: Enrollment['followUpStatus'],
) => current !== requested;

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

/** A conflict is harmless when another request already persisted this exact status. */
export function hasFollowUpStatus<T extends { enrollments: EnrollmentLike[] }>(
  current: T | undefined,
  enrollmentId: string,
  followUpStatus: Enrollment['followUpStatus'],
): boolean {
  return current?.enrollments.some(
    (item) => item.id === enrollmentId && item.followUpStatus === followUpStatus,
  ) ?? false;
}

/** Restores the last confirmed cache value unless a competing request already saved this status. */
export function resolveFollowUpFailure<T extends { enrollments: EnrollmentLike[] }>(
  previous: T | undefined,
  latest: T | undefined,
  enrollmentId: string,
  requestedStatus: Enrollment['followUpStatus'],
): { data: T | undefined; alreadyApplied: boolean } {
  const alreadyApplied = hasFollowUpStatus(latest, enrollmentId, requestedStatus);
  return { data: alreadyApplied ? latest : previous, alreadyApplied };
}
