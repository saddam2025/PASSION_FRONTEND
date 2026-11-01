import { describe, expect, it } from 'vitest';
import { arabicCoursePath } from './courseLinks';

describe('arabicCoursePath', () => {
  it('adds the Arabic prefix and preserves query string and hash', () => {
    expect(arabicCoursePath('/courses/leadership', '?utm_source=mail', '#register')).toBe(
      '/ar/courses/leadership?utm_source=mail#register',
    );
  });

  it('does not redirect unrelated paths', () => {
    expect(arabicCoursePath('/courses', '?q=leadership', '#top')).toBeNull();
  });
});
