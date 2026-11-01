import { useEffect, useState } from 'react';
import { Input, Textarea } from '@/components/ui/fields';
import { Checkbox } from '@/components/ui/selection';
import { useAuth } from '@/app/AuthContext';
import { ImagePickerField } from '@/features/courses/ImagePickerField';
import { coursesAdminService } from '@/services/courses.admin';
import { coursesService } from '@/services/courses';
import { hasInvalidWhatsappTokens, type Course, type Snapshot } from '@/schemas/course';
import { reservedSlugs } from '@/schemas/courseDraft';
import { slugFromArabic } from '@/lib/courseSlug';

type Details = Snapshot['details'];
const emptyImage = () => ({ src: '', alt: { ar: '', en: '' }, decorative: false });
const phonePattern = /^\+?[0-9\s()-]{8,20}$/;

export function CourseDetailsTab({ course, snapshot, onChange, assistant }: { course: Course; snapshot: Snapshot; onChange: (value: Snapshot) => void; assistant: boolean }) {
  const { user } = useAuth();
  const details = snapshot.details;
  const [categories, setCategories] = useState<string[]>([]);
  const [slug, setSlug] = useState(course.slug);
  const [slugEdited, setSlugEdited] = useState(false);
  const [slugStatus, setSlugStatus] = useState<'checking'|'available'|'taken'|'invalid'|'reserved'>('available');
  const admin = user?.role === 'admin' && !assistant;
  const setDetails = (patch: Partial<Details>) => onChange({ ...snapshot, details: { ...details, ...patch } });
  const updateText = (field: 'title'|'shortDescription', ar: string) => {
    const patch: Partial<Details> = { [field]: { ...details[field], ar, en: '' } } as Partial<Details>;
    if (field === 'title' && !slugEdited) {
      const next = slugFromArabic(ar, course.id.replace(/[^a-z0-9]/gi, '').slice(-4) || 'xxxx');
      setSlug(next);
      patch.slug = next;
    }
    setDetails(patch);
  };
  useEffect(() => {
    let live = true;
    void coursesAdminService.categories().then((items) => {
      if (!live) return;
      setCategories(items);
    }).catch(() => { if (live) setCategories([]); });
    return () => { live = false; };
  }, []);
  useEffect(() => {
    setSlug(course.slug);
    setSlugEdited(false);
  }, [course.id, course.slug]);
  useEffect(() => {
    const normalized = slug.trim().toLowerCase();
    if (reservedSlugs.has(normalized)) { setSlugStatus('reserved'); return; }
    if (normalized.length < 3 || normalized.length > 80 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) { setSlugStatus('invalid'); return; }
    setSlugStatus('checking');
    const timer = window.setTimeout(() => void coursesService.checkSlug(normalized, course.id).then((result) => setSlugStatus(result.ok && result.data ? 'available' : 'taken')), 250);
    return () => window.clearTimeout(timer);
  }, [slug, course.id]);
  const saveSlugToDraft = (value: string) => { setSlug(value); setSlugEdited(true); setDetails({ slug: value }); };
  const pricing = details.pricing;
  const accreditation = details.accreditation;
  const overrides = details.whatsappOverrides ?? {};
  const promo = pricing.promo ?? pricing.promoPrice;
  const promoError = pricing.price !== null && promo != null && promo >= pricing.price;
  const phoneError = Boolean(overrides.number?.trim() && (!phonePattern.test(overrides.number.trim()) || !/^\+/.test(overrides.number.trim())));
  const whatsappUrlError = Boolean(overrides.url && !/^https:\/\/(?:wa\.me|api\.whatsapp\.com)\//i.test(overrides.url));
  const message = overrides.messageTemplate?.ar ?? '';
  const messageError = hasInvalidWhatsappTokens(message);
  const moneyValue = (minor: number | null | undefined) => minor == null ? '' : String(minor / 100);
  const moneyOnChange = (value: string) => value === '' ? null : Math.round(Number(value) * 100);
  return <div className="grid gap-5">
    <section className="grid gap-4 rounded-md border border-border bg-surface p-4 sm:p-5">
      <h2 className="text-xl font-bold">تفاصيل الكورس</h2>
      <label data-readiness-path="details.title.ar" className="grid gap-1.5 text-sm font-semibold">عنوان الكورس <span className="text-danger">مطلوب</span><Input required value={details.title.ar} onChange={(e) => updateText('title', e.target.value)} /></label>
      <label data-readiness-path="details.shortDescription.ar" className="grid gap-1.5 text-sm font-semibold">وصف مختصر <span className="text-danger">مطلوب</span><Textarea required rows={3} value={details.shortDescription.ar} onChange={(e) => updateText('shortDescription', e.target.value)} /></label>
      <label data-readiness-path="details.category" className="grid gap-1.5 text-sm font-semibold">التصنيف <span className="text-danger">مطلوب</span><select className="min-h-11 rounded-xs border border-border bg-surface px-3" value={details.category} onChange={(e) => setDetails({ category: e.target.value })}><option value="">اختار التصنيف</option>{categories.map((name) => <option key={name} value={name}>{name}</option>)}</select>{categories.length === 0 && <span className="font-normal text-muted">أضف تصنيفًا من الإعدادات الأول.</span>}</label>
      <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm">اسم المدرب<Input value={details.instructor.name.ar} onChange={(e) => setDetails({ instructor: { ...details.instructor, name: { ...details.instructor.name, ar: e.target.value, en: '' } } })} /></label><label className="grid gap-1.5 text-sm">المسمى الوظيفي<Input value={details.instructor.title?.ar ?? ''} onChange={(e) => setDetails({ instructor: { ...details.instructor, title: { ar: e.target.value, en: '' } } })} /></label></div>
      <label className="grid gap-1.5 text-sm">نبذة عن المدرب<Textarea rows={3} value={details.instructor.bio?.ar?.map((block) => block.children?.map((child) => child.text ?? '').join('') ?? '').join('\n') ?? ''} onChange={(e) => setDetails({ instructor: { ...details.instructor, bio: { ar: [{ type: 'paragraph', children: [{ text: e.target.value }] }], en: [] } } })} /></label>
      <ImagePickerField label="صورة المدرب" value={details.instructor.photo ?? emptyImage()} onChange={(photo) => setDetails({ instructor: { ...details.instructor, photo } })} />
      <div data-readiness-path="details.coverImage.src"><ImagePickerField label="صورة الغلاف · مطلوب" value={details.coverImage.src ? details.coverImage : { ...emptyImage(), ...details.coverImage }} onChange={(coverImage) => setDetails({ coverImage })} /></div>
    </section>
    <section className="grid gap-4 rounded-md border border-border bg-surface p-4 sm:p-5">
      <h2 className="text-lg font-bold">طريقة التقديم والمواعيد</h2>
      <label className="grid gap-1.5 text-sm">طريقة الحضور<select className="min-h-11 rounded-xs border border-border bg-surface px-3" value={details.delivery.method} onChange={(e) => setDetails({ delivery: { ...details.delivery, method: e.target.value as Details['delivery']['method'] } })}><option value="online">عن بُعد</option><option value="in_person">حضوري</option><option value="hybrid">حضوري وعن بُعد</option></select></label>
      {details.delivery.method !== 'online' && <label className="grid gap-1.5 text-sm">مكان الحضور<Input value={details.delivery.location?.ar ?? ''} onChange={(e) => setDetails({ delivery: { ...details.delivery, location: { ar: e.target.value, en: '' } } })} /></label>}
      <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm">تاريخ البداية<Input type="date" value={details.schedule.startDate ?? ''} onChange={(e) => setDetails({ schedule: { ...details.schedule, startDate: e.target.value } })} /></label><label className="grid gap-1.5 text-sm">تاريخ النهاية<Input type="date" value={details.schedule.endDate ?? ''} onChange={(e) => setDetails({ schedule: { ...details.schedule, endDate: e.target.value } })} /></label></div>
      <label className="grid gap-1.5 text-sm">الأيام والمواعيد<Textarea rows={2} value={details.schedule.scheduleText?.ar ?? ''} onChange={(e) => setDetails({ schedule: { ...details.schedule, scheduleText: { ar: e.target.value, en: '' } } })} /></label>
      <label className="grid gap-1.5 text-sm">مدة الكورس<Input value={details.schedule.duration?.ar ?? ''} onChange={(e) => setDetails({ schedule: { ...details.schedule, duration: { ar: e.target.value, en: '' } } })} /></label>
      <label className="flex min-h-11 items-center gap-2 text-sm"><Checkbox checked={details.enrollment.registrationOpen} onCheckedChange={(checked) => setDetails({ enrollment: { ...details.enrollment, registrationOpen: checked === true } })} />التسجيل متاح</label>
      <label className="grid gap-1.5 text-sm">الحد الأقصى للمقاعد (اتركه فارغًا بلا حد)<Input type="number" min="1" step="1" value={details.enrollment.capacity ?? ''} onChange={(e) => setDetails({ enrollment: { ...details.enrollment, capacity: e.target.value ? Number(e.target.value) : null } })} /></label>
    </section>
    <section className="grid gap-4 rounded-md border border-border bg-surface p-4 sm:p-5">
      <h2 className="text-lg font-bold">السعر</h2>
      <label className="flex min-h-11 items-center gap-2 text-sm"><Checkbox checked={pricing.contactUs === true} onCheckedChange={(checked) => setDetails({ pricing: { ...pricing, contactUs: checked === true, price: checked ? null : pricing.price } })} />تواصل لمعرفة السعر</label>
      {pricing.contactUs !== true && <><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm">السعر بالجنيه المصري · مطلوب<Input data-readiness-path="details.pricing.price" type="number" min="0" step="0.01" value={moneyValue(pricing.price)} onChange={(e) => setDetails({ pricing: { ...pricing, price: moneyOnChange(e.target.value) } })} /></label><label data-readiness-path="details.pricing.promo" className="grid gap-1.5 text-sm">سعر العرض<Input type="number" min="0" step="0.01" value={moneyValue(promo)} onChange={(e) => setDetails({ pricing: { ...pricing, promo: moneyOnChange(e.target.value) ?? undefined, promoPrice: undefined } })} aria-invalid={promoError} /></label></div>{promoError && <p role="alert" className="text-sm text-danger">سعر العرض لازم يكون أقل من السعر الأساسي.</p>}</>}
    </section>
    <section className="grid gap-4 rounded-md border border-border bg-surface p-4 sm:p-5">
      <h2 className="text-lg font-bold">رابط الكورس</h2>
      <label data-readiness-path="slug" className="grid gap-1.5 text-sm">الرابط المختصر <span dir="ltr" className="text-start text-xs text-muted">/{slug}</span><Input dir="ltr" value={slug} onChange={(e) => saveSlugToDraft(e.target.value)} aria-invalid={slugStatus !== 'available'} /></label>
      <p role={slugStatus === 'taken' || slugStatus === 'reserved' || slugStatus === 'invalid' ? 'alert' : 'status'} className={`text-sm ${slugStatus === 'available' ? 'text-success' : 'text-muted'}`}>{slugStatus === 'checking' ? 'جاري التحقق من الرابط…' : slugStatus === 'available' ? 'الرابط متاح.' : slugStatus === 'reserved' ? 'الرابط ده محجوز.' : slugStatus === 'taken' ? 'الرابط مستخدم بالفعل.' : 'اكتب رابطًا من حروف لاتينية صغيرة وأرقام وشرطات.'}</p>
      <p className="text-sm text-muted">لو غيّرت رابط كورس منشور، الرابط القديم هيفضل شغال.</p>
    </section>
    <section className="grid gap-4 rounded-md border border-border bg-surface p-4 sm:p-5">
      <h2 className="text-lg font-bold">الاعتماد والشهادة</h2>
      <label className="grid gap-1.5 text-sm">معلومات الاعتماد (لن تظهر للزوار إلا بعد التحقق)<Textarea rows={3} value={accreditation.text?.ar ?? ''} onChange={(e) => setDetails({ accreditation: { ...accreditation, text: { ar: e.target.value, en: '' } } })} /></label>
      <label className={`flex min-h-11 items-center gap-2 text-sm ${!admin ? 'text-muted' : ''}`}><Checkbox disabled={!admin} checked={accreditation.verifiedByAcademy} onCheckedChange={(checked) => setDetails({ accreditation: { ...accreditation, verifiedByAcademy: checked === true } })} />تم التأكد من الاعتماد</label>
      {!admin && <p className="text-sm text-muted">التأكيد متاح للإدارة فقط.</p>}
    </section>
    <section className="grid gap-4 rounded-md border border-border bg-surface p-4 sm:p-5">
      <h2 className="text-lg font-bold">رسائل واتساب للكورس (اختياري)</h2>
      <label className="grid gap-1.5 text-sm">رقم واتساب<Input dir="ltr" inputMode="tel" value={overrides.number ?? ''} onChange={(e) => setDetails({ whatsappOverrides: { ...overrides, number: e.target.value } })} aria-invalid={phoneError} /></label>{phoneError && <p role="alert" className="text-sm text-danger">اكتب رقمًا صحيحًا مع مفتاح الدولة.</p>}
      <label className="grid gap-1.5 text-sm">نص الرسالة<textarea className="min-h-24 rounded-xs border border-border bg-surface px-3 py-2" value={message} onChange={(e) => setDetails({ whatsappOverrides: { ...overrides, messageTemplate: { ar: e.target.value, en: '' } } })} /></label>
      <p className="text-xs text-muted">المتغيرات المتاحة: {'{name}'}، {'{course}'}، {'{reference}'}.</p>{messageError && <p role="alert" className="text-sm text-danger">استخدم المتغيرات المحددة فقط بين الأقواس.</p>}
      <label className="grid gap-1.5 text-sm">رابط واتساب اختياري<Input dir="ltr" type="url" value={overrides.url ?? ''} onChange={(e) => setDetails({ whatsappOverrides: { ...overrides, url: e.target.value } })} aria-invalid={whatsappUrlError} /></label>{whatsappUrlError && <p role="alert" className="text-sm text-danger">استخدم رابط واتساب يبدأ بـ https://wa.me/.</p>}
    </section>
  </div>;
}
