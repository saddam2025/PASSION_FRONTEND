import { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ArrowUpRight, Bell, Check, CircleHelp } from 'lucide-react';
import { LanguageSwitcher } from '@/i18n/LanguageSwitcher';
import { useLanguage } from '@/i18n/useLanguage';
import { SmartImage } from '@/components/common/SmartImage';
import { FormField } from '@/components/ui/FormField';
import { Button, IconButton } from '@/components/ui/Button';
import { Input, PasswordInput, Textarea } from '@/components/ui/fields';
import { Select } from '@/components/ui/Select';
import { Checkbox, RadioGroup, Switch } from '@/components/ui/selection';
import { Accordion, Tabs } from '@/components/ui/TabsAccordion';
import { Avatar, Badge, Card, Pagination, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/dataDisplay';
import { Breadcrumbs, Container, PageTitle, Section } from '@/components/ui/layout';
import { ConfirmDialog, DropdownMenu, Modal, Tooltip } from '@/components/ui/Overlay';
import { EmptyState, ErrorState, Skeleton, Spinner, useToast } from '@/components/ui/feedback';
import { PageTransition, Reveal, Stagger, StaggerItem, MicroInteraction } from '@/components/common/motion';

const sampleFormSchema = z.object({ email: z.string().email() });
type SampleFormValues = z.infer<typeof sampleFormSchema>;

export default function UiKitPage() {
  const { language } = useLanguage();
  const { notify } = useToast();
  const [checked, setChecked] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [page, setPage] = useState(1);
  const ar = language === 'ar';
  const label = (english: string, arabic: string) => ar ? arabic : english;
  const { control } = useForm<SampleFormValues>({ resolver: zodResolver(sampleFormSchema), defaultValues: { email: '' } });

  return <PageTransition className="min-h-screen bg-canvas pb-24">
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/90 ps-container pe-container py-3 backdrop-blur"><p className="font-display font-bold">{label('UI Kit · Development only', 'مكتبة الواجهة · للتطوير فقط')}</p><LanguageSwitcher /></header>
    <Section className="py-10"><Container className="grid gap-8">
      <PageTitle eyebrow="F1" title={label('Design system & UI kit', 'نظام التصميم ومكتبة الواجهة')} description={label('Accessible, typed components using the shared theme tokens.', 'مكونات واضحة الوصول ومكتوبة الأنواع باستخدام رموز التصميم المشتركة.')} />
      <Reveal><Card className="grid gap-5"><h2 className="text-xl font-bold">{label('Actions', 'الأزرار')}</h2><div className="flex flex-wrap items-center gap-3"><Button>{label('Primary', 'أساسي')}</Button><Button variant="secondary">{label('Secondary', 'ثانوي')}</Button><Button variant="outline">{label('Outline', 'محدد')}</Button><Button variant="ghost">{label('Ghost', 'شفاف')}</Button><Button variant="danger">{label('Danger', 'خطر')}</Button><Button loading>{label('Loading', 'جارٍ')}</Button><Tooltip content={label('Help', 'مساعدة')}><IconButton aria-label={label('Help', 'مساعدة')}><CircleHelp size={18} /></IconButton></Tooltip><MicroInteraction><Button variant="secondary">{label('Hover / press', 'مرّر أو اضغط')}</Button></MicroInteraction></div></Card></Reveal>

      <Card className="grid gap-5"><h2 className="text-xl font-bold">{label('Form controls', 'حقول النماذج')}</h2><div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-semibold">{label('Email', 'البريد الإلكتروني')}<Input type="email" placeholder="name@example.test" /></label>
        <label className="grid gap-1.5 text-sm font-semibold">{label('Password', 'كلمة المرور')}<PasswordInput autoComplete="new-password" /></label>
        <label className="grid gap-1.5 text-sm font-semibold">{label('Select', 'قائمة اختيار')}<Select aria-label={label('Select an option', 'اختر خيارًا')} placeholder={label('Choose…', 'اختر…')} options={[{ value: 'one', label: label('Option one', 'الخيار الأول') }, { value: 'two', label: label('Option two', 'الخيار الثاني') }]} /></label>
        <label className="inline-flex items-center gap-2 self-center"><Checkbox checked={checked} onCheckedChange={(value) => setChecked(value === true)} /><span>{label('Checkbox', 'مربع اختيار')}</span></label>
        <div className="grid gap-2"><p className="text-sm font-semibold">{label('Radio group', 'مجموعة أزرار الاختيار')}</p><RadioGroup aria-label={label('Radio options', 'خيارات')} defaultValue="first" options={[{ value: 'first', label: label('First', 'الأول') }, { value: 'second', label: label('Second', 'الثاني') }]} /></div>
        <label className="inline-flex items-center gap-3 self-center"><Switch checked={enabled} onCheckedChange={setEnabled} /><span>{label('Switch', 'مفتاح')}</span></label>
        <label className="grid gap-1.5 text-sm font-semibold md:col-span-2">{label('Textarea', 'نص متعدد الأسطر')}<Textarea rows={3} placeholder={label('Type here…', 'اكتب هنا…')} /></label>
        <FormField<SampleFormValues> name="email" control={control} label={label('React Hook Form field', 'حقل React Hook Form')} hint={label('Validation uses the shared Zod resolver.', 'التحقق يستخدم Zod.')} render={(field) => <Input {...field} type="email" />} />
      </div></Card>

      <Card className="grid gap-5"><h2 className="text-xl font-bold">{label('Status and identity', 'الحالة والهوية')}</h2><div className="flex flex-wrap items-center gap-3"><Badge>{label('Default', 'افتراضي')}</Badge><Badge variant="success">{label('Success', 'نجاح')}</Badge><Badge variant="warning">{label('Pending', 'قيد الانتظار')}</Badge><Badge variant="danger">{label('Error', 'خطأ')}</Badge><Badge variant="info">{label('Info', 'معلومة')}</Badge><Avatar name="?" /><Avatar name="?" size="lg" /><DropdownMenu label={label('Actions', 'إجراءات')} items={[{ label: label('Show toast', 'عرض تنبيه'), onSelect: () => notify({ title: label('Action selected', 'تم اختيار الإجراء'), tone: 'info' }) }]} /></div><SmartImage slot="hero" alt={label('Image placeholder', 'عنصر نائب للصورة')} width={640} height={360} className="max-h-64 rounded-md" /></Card>

      <Card className="grid gap-5"><h2 className="text-xl font-bold">{label('Navigation and content', 'التنقل والمحتوى')}</h2><Breadcrumbs homeLabel={label('Home', 'الرئيسية')} items={[{ label: label('Section', 'قسم'), href: '/' }, { label: label('Current page', 'الصفحة الحالية') }]} />
        <Tabs items={[{ value: 'one', label: label('Overview', 'نظرة عامة'), content: <p className="py-3 text-sm text-muted">{label('Tab panel', 'محتوى التبويب')}</p> }, { value: 'two', label: label('Details', 'تفاصيل'), content: <p className="py-3 text-sm text-muted">{label('Second panel', 'المحتوى الثاني')}</p> }]} />
        <Accordion items={[{ value: 'one', title: label('Accordion item', 'عنصر مطوي'), content: <p>{label('Expanded content', 'المحتوى بعد الفتح')}</p> }]} />
        <DropdownMenu label={label('More', 'المزيد')} items={[{ label: label('Open dialog', 'فتح نافذة'), onSelect: () => setModalOpen(true) }, { label: label('Confirm action', 'تأكيد إجراء'), onSelect: () => setConfirmOpen(true) }]} />
      </Card>

      <Card className="grid gap-5"><h2 className="text-xl font-bold">{label('Tables and paging', 'الجداول وتقسيم الصفحات')}</h2><Table label={label('UI table sample', 'نموذج جدول')}><TableHeader><TableRow><TableHead>{label('Field', 'الحقل')}</TableHead><TableHead>{label('Value', 'القيمة')}</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>{label('Placeholder row', 'صف توضيحي')}</TableCell><TableCell>—</TableCell></TableRow></TableBody></Table><Pagination page={page} pages={3} onPageChange={setPage} label={label('Pagination', 'التنقل بين الصفحات')} /></Card>

      <Card className="grid gap-5"><h2 className="text-xl font-bold">{label('Feedback and loading', 'الحالات والتحميل')}</h2><div className="grid gap-4 sm:grid-cols-2"><Spinner label={label('Loading', 'جارٍ التحميل')} /><Skeleton variant="text" /><Skeleton variant="title" /><Skeleton variant="avatar" /><EmptyState title={label('Nothing here yet', 'لا يوجد محتوى بعد')} description={label('This is an empty state.', 'هذه حالة فارغة.')} /><ErrorState title={label('Could not load', 'تعذر التحميل')} description={label('An error state example.', 'نموذج لحالة خطأ.')} onRetry={() => notify({ title: label('Retry requested', 'تم طلب إعادة المحاولة'), tone: 'info' })} /></div><div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => notify({ title: label('Information', 'معلومة'), description: label('Toast message', 'رسالة تنبيه'), tone: 'info' })}><Bell size={16} />{label('Toast', 'تنبيه')}</Button><Button onClick={() => setModalOpen(true)}>{label('Modal', 'نافذة')}</Button><Button variant="outline" onClick={() => setConfirmOpen(true)}>{label('Confirm dialog', 'نافذة تأكيد')}</Button></div></Card>

      <Card className="grid gap-4"><h2 className="text-xl font-bold">{label('Motion helpers', 'مساعدات الحركة')}</h2><Stagger className="grid gap-3 sm:grid-cols-3"><StaggerItem><Card>{label('Stagger item', 'عنصر متتابع')}</Card></StaggerItem><StaggerItem><Card>{label('Stagger item', 'عنصر متتابع')}</Card></StaggerItem><StaggerItem><Card><Check aria-hidden="true" className="text-success" />{label('Reduced motion supported', 'دعم تقليل الحركة')}</Card></StaggerItem></Stagger></Card>
    </Container></Section>
    <Modal open={modalOpen} onOpenChange={setModalOpen} title={label('Modal', 'نافذة')} description={label('Accessible dialog example.', 'مثال لنافذة حوار واضحة الوصول.')} footer={<Button onClick={() => setModalOpen(false)}>{label('Close', 'إغلاق')}</Button>}><p className="text-sm text-muted">{label('Dialog content', 'محتوى النافذة')}</p><a className="inline-flex items-center gap-1 text-sm text-primary-strong" href="#" onClick={(event) => event.preventDefault()}>{label('Link', 'رابط')}<ArrowUpRight size={14} /></a></Modal>
    <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title={label('Confirm action', 'تأكيد الإجراء')} description={label('This control demonstrates a confirmation dialog.', 'هذا العنصر يعرض نافذة تأكيد.')} confirmLabel={label('Confirm', 'تأكيد')} cancelLabel={label('Cancel', 'إلغاء')} onConfirm={() => notify({ title: label('Confirmed', 'تم التأكيد'), tone: 'success' })} />
  </PageTransition>;
}


