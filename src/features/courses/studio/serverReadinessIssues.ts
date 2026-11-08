import type { ReadinessIssue } from '@/schemas/courseReadiness';

type ServerIssue = { field?: unknown; path?: unknown; message?: unknown; code?: unknown; keys?: unknown; sectionId?: unknown };

function normalizePath(value: unknown): string {
  const path = Array.isArray(value) ? value.join('.') : typeof value === 'string' ? value : '';
  return path.replace(/^(?:body\.)?draft\./, '').replace(/^body\./, '');
}

function arabicMessage(path: string): string {
  if (path.includes('pricing.promo')) return 'سعر العرض لازم يكون أقل من السعر الأساسي.';
  if (path.includes('pricing.price')) return 'راجع السعر أو اختار التواصل لمعرفة السعر.';
  if (path.includes('slug')) return 'اكتب رابط مختصر صالح ومتاح للكورس.';
  if (path.includes('coverImage')) return 'اختار صورة غلاف صالحة للكورس.';
  if (path.includes('form')) return 'راجع إعدادات نموذج التسجيل والحقول المطلوبة.';
  if (path.startsWith('page.sections')) return 'راجع محتوى القسم والحقول المطلوبة فيه.';
  if (path.includes('title')) return 'اكتب عنوان الكورس بالعربي.';
  if (path.includes('shortDescription')) return 'اكتب وصفًا مختصرًا للكورس بالعربي.';
  if (path.includes('category')) return 'اختار تصنيفًا للكورس.';
  return 'راجع البيانات المطلوبة في هذا الحقل.';
}

function inferTab(path: string): ReadinessIssue['tab'] {
  if (path.startsWith('page.')) return 'page';
  if (path.startsWith('form.')) return 'form';
  if (path.startsWith('seo.')) return 'seo';
  return 'details';
}

/** Convert backend Zod/readiness details into the same actionable UI issues as local readiness. */
export function serverReadinessIssues(details: unknown): ReadinessIssue[] {
  const candidates: ServerIssue[] = Array.isArray(details)
    ? details.filter((item): item is ServerIssue => Boolean(item) && typeof item === 'object')
    : details && typeof details === 'object' && 'fieldErrors' in details
      ? Object.entries((details as { fieldErrors?: Record<string, unknown> }).fieldErrors ?? {}).flatMap(([field, messages]) =>
        (Array.isArray(messages) ? messages : [messages]).map((message) => ({ field, message })))
      : [];

  const result = new Map<string, ReadinessIssue>();
  for (const candidate of candidates) {
    const path = normalizePath(candidate.field ?? candidate.path);
    if (!path) continue;
    const sectionFromPath = path.match(/^page\.sections\.([^.]+)/)?.[1];
    const sectionId = typeof candidate.sectionId === 'string' ? candidate.sectionId : sectionFromPath;
    const message = typeof candidate.message === 'string' && /[\u0600-\u06ff]/.test(candidate.message)
      ? candidate.message
      : arabicMessage(path);
    result.set(path, { path, message, tab: inferTab(path), ...(sectionId ? { sectionId } : {}) });
  }
  return [...result.values()];
}

