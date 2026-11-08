import { ArrowRight, X } from 'lucide-react';
import type { ReadinessIssue } from '@/schemas/courseReadiness';
import type { Section } from '@/schemas/sections';
import { Button, IconButton } from '@/components/ui/Button';

const groups: Array<{ id: ReadinessIssue['tab']; title: string }> = [
  { id: 'page', title: 'الصفحة' },
  { id: 'details', title: 'التفاصيل' },
  { id: 'form', title: 'نموذج التسجيل' },
  { id: 'seo', title: 'تحسين محركات البحث' },
];

function fieldLabel(issue: ReadinessIssue, sections: Section[]) {
  const section = issue.sectionId && sections.find((item) => item.id === issue.sectionId);
  if (section) return `قسم ${section.type === 'hero' ? 'المقدمة' : section.type === 'imageText' ? 'الصورة والنص' : section.type === 'featureCards' ? 'المميزات' : section.type === 'faq' ? 'الأسئلة الشائعة' : section.type === 'registrationForm' ? 'التسجيل' : section.type === 'curriculum' ? 'المنهج' : section.type === 'instructor' ? 'المدرب' : section.type === 'pricingCta' ? 'السعر والتسجيل' : section.type === 'steps' ? 'خطوات الاشتراك' : 'النص'}`;
  if (issue.path.includes('title')) return 'عنوان الكورس';
  if (issue.path.includes('shortDescription')) return 'الوصف المختصر';
  if (issue.path.includes('category')) return 'التصنيف';
  if (issue.path.includes('slug')) return 'الرابط المختصر';
  if (issue.path.includes('coverImage')) return 'صورة الغلاف';
  if (issue.path.includes('pricing.price')) return 'السعر';
  if (issue.path.includes('pricing.promo')) return 'سعر العرض';
  if (issue.path.includes('consentText')) return 'نص الموافقة';
  if (issue.path.includes('form')) return 'حقول نموذج التسجيل';
  return 'بيانات الكورس';
}

export function ReadinessPanel({
  issues,
  sections,
  onGo,
  onClose,
}: {
  issues: ReadinessIssue[];
  sections: Section[];
  onGo: (issue: ReadinessIssue) => void;
  onClose: () => void;
}) {
  return <div className="fixed inset-0 z-[80] grid place-items-center bg-black/40 p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section role="dialog" aria-modal="true" aria-labelledby="readiness-title" className="max-h-[min(85dvh,48rem)] w-full max-w-2xl overflow-y-auto rounded-md border border-border bg-surface p-5 shadow-elevated">
      <header className="mb-4 flex items-start justify-between gap-3"><div><h2 id="readiness-title" className="text-xl font-bold">محتاج انتباه</h2><p className="mt-1 text-sm text-muted">راجع النقاط دي عشان تقدر تكمل.</p></div><IconButton aria-label="إغلاق" onClick={onClose}><X size={18} /></IconButton></header>
      <div className="grid gap-5">{groups.map((group) => {
        const items = issues.filter((item) => item.tab === group.id);
        if (!items.length) return null;
        return <section key={group.id} className="grid gap-2"><h3 className="flex items-center gap-2 font-semibold">{group.title}<span className="rounded-full bg-danger px-2 py-0.5 text-xs text-white">{items.length}</span></h3><ul className="grid gap-2">{items.map((issue, index) => <li key={`${issue.path}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-danger/20 bg-danger/5 p-3"><div><p className="text-sm font-semibold">{fieldLabel(issue, sections)}</p><p className="mt-1 text-sm text-muted">{issue.message}</p></div><Button size="sm" variant="outline" onClick={() => onGo(issue)}><ArrowRight size={15} />روح للحقل</Button></li>)}</ul></section>;
      })}</div>
      <footer className="mt-5 flex flex-wrap justify-end gap-2 border-t border-border pt-4"><Button variant="outline" onClick={onClose}>إغلاق</Button><Button disabled={!issues.length} onClick={() => issues[0] && onGo(issues[0])}>ابدأ من أول مشكلة</Button></footer>
    </section>
  </div>;
}
