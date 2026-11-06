import { describe, expect, it } from 'vitest';
import { serverReadinessIssues } from './serverReadinessIssues';

describe('serverReadinessIssues', () => {
  it('maps backend readiness paths to actionable section issues and keeps Arabic server messages', () => {
    expect(serverReadinessIssues([{ field: 'page.sections.section-1.content.title.ar', sectionId: 'section-1', message: 'اكتب عنوان القسم بالعربي.' }])).toEqual([
      { path: 'page.sections.section-1.content.title.ar', sectionId: 'section-1', tab: 'page', message: 'اكتب عنوان القسم بالعربي.' },
    ]);
  });

  it('normalizes Zod draft paths and replaces non-Arabic validator messages with a useful Arabic hint', () => {
    expect(serverReadinessIssues([{ path: ['draft', 'details', 'foreignPricing', 'price'], message: 'Invalid input' }])).toEqual([
      { path: 'details.foreignPricing.price', tab: 'details', message: 'راجع سعر الأجانب أو اختار التواصل لمعرفة السعر.' },
    ]);
  });

  it('maps a backend that rejects foreignPricing to its exact editable setting', () => {
    expect(serverReadinessIssues([{
      code: 'unrecognized_keys',
      keys: ['foreignPricing'],
      path: ['draft', 'details'],
      message: "Unrecognized key(s) in object: 'foreignPricing'",
    }])).toEqual([{
      path: 'details.foreignPricing',
      tab: 'details',
      message: 'نسخة الخادم المتصلة لا تدعم إعداد التسعير بعملة أجنبية. يلزم تحديث الباك إند قبل نشر الكورس.',
    }]);
  });

  it('supports flattened Zod field errors and ignores malformed details', () => {
    expect(serverReadinessIssues({ fieldErrors: { 'form.fields.0.label.ar': ['Required'] } })).toHaveLength(1);
    expect(serverReadinessIssues({ nope: true })).toEqual([]);
  });
});
