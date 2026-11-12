import { describe, expect, it } from 'vitest';
import { customerQueryKey, hasFollowUpStatus, withFollowUpStatus } from './customerFollowUp';

describe('withFollowUpStatus', () => {
  it('keys customer detail cache by enrollment id, not lead id', () => {
    expect(customerQueryKey('enrollment-1')).toEqual(['customer', 'enrollment-1']);
  });

  it('updates the selected enrollment immediately without mutating cached data', () => {
    const current = {
      lead: { id: 'lead-1' },
      enrollments: [
        { id: 'enrollment-1', followUpStatus: 'new' as const },
        { id: 'enrollment-2', followUpStatus: 'contacted' as const },
      ],
    };

    const next = withFollowUpStatus(current, 'enrollment-1', 'interested');

    expect(next?.enrollments).toEqual([
      { id: 'enrollment-1', followUpStatus: 'interested' },
      { id: 'enrollment-2', followUpStatus: 'contacted' },
    ]);
    expect(current.enrollments[0].followUpStatus).toBe('new');
    expect(next?.lead).toBe(current.lead);
  });

  it('keeps an absent customer query absent', () => {
    expect(withFollowUpStatus(undefined, 'enrollment-1', 'interested')).toBeUndefined();
  });

  it('recognizes a conflict when the requested status is already authoritative', () => {
    const current = { enrollments: [{ id: 'enrollment-1', followUpStatus: 'interested' as const }] };
    expect(hasFollowUpStatus(current, 'enrollment-1', 'interested')).toBe(true);
    expect(hasFollowUpStatus(current, 'enrollment-1', 'contacted')).toBe(false);
    expect(hasFollowUpStatus(current, 'other-enrollment', 'interested')).toBe(false);
  });
});
