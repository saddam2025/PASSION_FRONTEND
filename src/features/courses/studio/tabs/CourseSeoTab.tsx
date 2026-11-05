import { useEffect, useState } from 'react';
import { Input, Textarea } from '@/components/ui/fields';
import { Checkbox } from '@/components/ui/selection';
import { ImagePickerField } from '@/features/courses/ImagePickerField';
import { adminService } from '@/services/admin.service';
import { mediaUrl } from '@/lib/mediaUrl';
import { ImageHoverFrame } from '@/components/common/SmartImage';
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
  return <div className="grid grid-cols-[minmax(0,1fr)] w-full min-w-0 max-w-full gap-5">
    <section className="grid grid-cols-[minmax(0,1fr)] w-full min-w-0 max-w-full gap-4 rounded-md border border-border bg-surface p-4 sm:p-5"><h2 className="text-xl font-bold">الظهور في البحث والمشاركة</h2>
      <label data-readiness-path="seo.title.ar" className="grid gap-1.5 text-sm">عنوان الصفحة<Input maxLength={70} value={seo.title?.ar??''} onChange={(e)=>onChange({...snapshot,seo:{...seo,title:{ar:e.target.value,en:''}}})}/><span className="text-xs text-muted">{(seo.title?.ar??'').length}/60 حرفًا مقترحًا</span></label>
      <label data-readiness-path="seo.description.ar" className="grid gap-1.5 text-sm">وصف نتيجة البحث<Textarea rows={4} maxLength={200} value={seo.description?.ar??''} onChange={(e)=>onChange({...snapshot,seo:{...seo,description:{ar:e.target.value,en:''}}})}/><span className="text-xs text-muted">{(seo.description?.ar??'').length}/155 حرفًا مقترحًا</span></label>
      <ImagePickerField label="صورة المشاركة (تستخدم صورة الغلاف تلقائيًا لو ما اخترتش صورة)" value={image} onChange={(ogImage)=>onChange({...snapshot,seo:{...seo,ogImage}})}/>
      <p className="text-xs text-muted">لو سبت الحقول فاضية، هتُستخدم الإعدادات الافتراضية أو بيانات الكورس.</p>
      <label className="flex min-h-11 items-center gap-2 text-sm"><Checkbox checked={seo.noindex ?? !settingsDefaults.allowSearch} onCheckedChange={(checked)=>onChange({...snapshot,seo:{...seo,noindex:checked===true}})}/>إخفاء الكورس من محركات البحث</label>
    </section>
    <section className="grid grid-cols-[minmax(0,1fr)] w-full min-w-0 max-w-full gap-4 rounded-md border border-border bg-canvas p-4"><h3 className="font-bold">معاينة نتيجة البحث</h3><article className="grid w-full min-w-0 max-w-xl gap-1 rounded-sm bg-surface p-4"><p className="min-w-0 truncate text-lg text-[#1a0dab]">{pageTitle}</p><p dir="ltr" className="min-w-0 break-all text-start text-sm text-success">{window.location.origin}/ar/courses/{course.slug}</p><p className="min-w-0 break-words text-sm text-muted">{pageDescription}</p></article></section>
    <section className="grid grid-cols-[minmax(0,1fr)] w-full min-w-0 max-w-full gap-4 rounded-md border border-border bg-canvas p-4"><h3 className="font-bold">معاينة بطاقة المشاركة</h3><article className="grid w-full min-w-0 max-w-xl rounded-sm border border-border bg-surface">{previewImage&&<ImageHoverFrame className="aspect-[1.91/1] w-full max-w-full rounded-t-sm"><img src={previewImage} alt="" className="size-full object-cover"/></ImageHoverFrame>}<div className="grid min-w-0 gap-1 p-3"><p dir="ltr" className="min-w-0 break-all text-start text-xs text-muted">{window.location.host}</p><h4 className="min-w-0 break-words font-semibold">{pageTitle}</h4><p className="min-w-0 break-words line-clamp-2 text-sm text-muted">{pageDescription}</p></div></article></section>
  </div>;
}
