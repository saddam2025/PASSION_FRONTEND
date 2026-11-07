/** Keeps duplication available only to admins and only for courses still in the workspace. */
export function canDuplicateCourse(role: string | undefined, deletedAt?: string | null): boolean {
  return role === 'admin' && !deletedAt;
}
