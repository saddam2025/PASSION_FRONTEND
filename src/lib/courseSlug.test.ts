import { describe, expect, it } from 'vitest';
import { courseCopySlug } from './courseSlug';

describe('courseCopySlug', () => {
  it('transliterates the Arabic title and appends a unique suffix', () => {
    expect(courseCopySlug('نسخة من الكورس', 'a1b2c3d4')).toBe('nskhh-mn-alkwrs-a1b2c3d4');
  });

  it('uses a valid fallback for titles without Latin transliteration', () => {
    expect(courseCopySlug('!!!', 'a1b2c3d4')).toBe('course-a1b2c3d4');
  });

  it('keeps the slug within the backend limit and URL-safe', () => {
    const value = courseCopySlug('كورس '.repeat(100), '12345678');
    expect(value).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(value.length).toBeLessThanOrEqual(80);
    expect(value.endsWith('-12345678')).toBe(true);
  });
});
