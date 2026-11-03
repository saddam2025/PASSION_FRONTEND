import { useEffect, useState } from 'react';
import { Input, Textarea } from '@/components/ui/fields';
import { Checkbox } from '@/components/ui/selection';
import { ImagePickerField } from '@/features/courses/ImagePickerField';
import { adminService } from '@/services/admin.service';
import { mediaUrl } from '@/lib/mediaUrl';
import type { Course, Snapshot } from '@/schemas/course';
import { resolveCourseSeo } from '@/lib/courseSeo';

export function CourseSeoTab({ course, snapshot, onChange }: { course: Course; snapshot: Snapshot; onChange: (value: Snapshot) => void }) {
  const seo = snapshot.seo;
  const [settingsDefaults, setSettingsDefaults] = useState<{ title: string; description: string; image: string; allowSearch: boolean }>({ title:'',description:'',image:'',allowSearch:true });
  useEffect(() => { void adminService.publicSettings().then((settings) => { const value = settings.values.seo as { titleTemplate?: string; description?: unknown; ogImage?: string; allowSearchEngines?: boolean } | undefined; const description = value?.description && typeof value.description === 'object' ? (value.description as { ar?: unknown }).ar : undefined; setSettingsDefaults({ title:value?.titleTemplate??'',description:typeof description === 'string' ? description : '',image:value?.ogImage??'',allowSearch:value?.allowSearchEngines??true }); }).catch(() => undefined); }, []);
  const resolved = resolveCourseSeo(snapshot, { titleTemplate: settingsDefaults.title, description: { ar: settingsDefaults.description }, ogImage: settingsDefaults.image, allowSearchEngines: settingsDefaults.allowSearch });
  const pageTitle = resolved.title.ar || course.slug;
  const pageDescription = resolved.description.ar;
  const image = resolved.ogImage;
  const previewImage = image?.src ? mediaUrl(image.src) : settingsDefaults.image ? mediaUrl(settingsDefaults.image) : '';
  return <div className="grid gap-5">
    <section className="grid gap-4 rounded-md border border-border bg-surface p-4 sm:p-5"><h2 className="text-xl font-bold">الظهور في البحث والمشاركة</h2>
      <label data-readiness-path="seo.title.ar" className="grid gap-1.5 text-sm">عنوان الصفحة<Input maxLength={70} value={seo.title?.ar??''} onChange={(e)=>onChange({...snapshot,seo:{...seo,title:{ar:e.target.value,en:''}}})}/><span className="text-xs text-muted">{(seo.title?.ar??'').length}/60 حرفًا مقترحًا</span></label>
      <label data-readiness-path="seo.description.ar" className="grid gap-1.5 text-sm">وصف نتيجة البحث<Textarea rows={4} maxLength={200} value={seo.description?.ar??''} onChange={(e)=>onChange({...snapshot,seo:{...seo,description:{ar:e.target.value,en:''}}})}/><span className="text-xs text-muted">{(seo.description?.ar??'').length}/155 حرفًا مقترحًا</span></label>
      <ImagePickerField label="صورة المشاركة (تستخدم صورة الغلاف تلقائيًا لو ما اخترتش صورة)" value={image} onChange={(ogImage)=>onChange({...snapshot,seo:{...seo,ogImage}})}/>
      <p className="text-xs text-muted">لو سبت الحقول فاضية، هتُستخدم الإعدادات الافتراضية أو بيانات الكورس.</p>
      <label className="flex min-h-11 items-center gap-2 text-sm"><Checkbox checked={seo.noindex ?? !settingsDefaults.allowSearch} onCheckedChange={(checked)=>onChange({...snapshot,seo:{...seo,noindex:checked===true}})}/>إخفاء الكورس من محركات البحث</label>
    </section>
    <section className="grid gap-4 rounded-md border border-border bg-canvas p-4"><h3 className="font-bold">معاينة نتيجة البحث</h3><article className="max-w-xl rounded-sm bg-surface p-4"><p className="truncate text-lg text-[#1a0dab]">{pageTitle}</p><p dir="ltr" className="truncate text-sm text-success">{window.location.origin}/ar/courses/{course.slug}</p><p className="text-sm text-muted">{pageDescription}</p></article></section>
    <section className="grid gap-4 rounded-md border border-border bg-canvas p-4"><h3 className="font-bold">معاينة بطاقة المشاركة</h3><article className="max-w-xl overflow-hidden rounded-sm border border-border bg-surface">{previewImage&&<img src={previewImage} alt="" className="aspect-[1.91/1] w-full object-cover"/>}<div className="grid gap-1 p-3"><p dir="ltr" className="text-xs text-muted">{window.location.host}</p><h4 className="font-semibold">{pageTitle}</h4><p className="line-clamp-2 text-sm text-muted">{pageDescription}</p></div></article></section>
  </div>;
}
