import { useState } from 'react';
import { usePublicSettings } from '@/services/usePublicSettings';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import { Button } from '@/components/ui/Button';

export function CourseShareLinks({ published, slug, title, whatsappNumber }: { published: boolean; slug: string; title: string; whatsappNumber?: string }) {
  const settings = usePublicSettings();
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/ar/courses/${slug}`;
  const whatsapp = buildWhatsAppLink({ phone: whatsappNumber || settings.whatsappNumber, message: `${title}\n${url}` });
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { setCopied(false); }
  };
  const openLive = () => {
    if (published) window.open(url, '_blank', 'noopener,noreferrer');
  };
  return <div className="grid gap-2 rounded-sm border border-border bg-surface p-3 sm:flex sm:flex-wrap sm:items-center">
    {published ? <a href={url} target="_blank" rel="noopener noreferrer" className="min-w-0 truncate font-mono text-xs text-primary-strong underline">{url}</a> : <span aria-disabled="true" className="min-w-0 truncate font-mono text-xs text-muted">انشر الكورس عشان الرابط يشتغل</span>}
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" disabled={!published} onClick={() => void copy()}>{copied ? 'تم النسخ' : 'انسخ الرابط'}</Button>
      <Button size="sm" variant="outline" disabled={!published} onClick={openLive}>افتح صفحة الكورس</Button>
      <Button size="sm" variant="outline" disabled={!published || !whatsapp} onClick={() => { if (whatsapp) window.open(whatsapp, '_blank', 'noopener,noreferrer'); }}>شارك على واتساب</Button>
    </div>
  </div>;
}
