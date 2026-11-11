import { describe, expect, it } from 'vitest';
import { withFollowUpStatus } from './customerFollowUp';

describe('withFollowUpStatus', () => {
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
});
