import type { CtaLink, BilingualText } from '@/schemas/sections';
import { BilingualTextField } from '@/features/courses/BilingualFields';
import { Button } from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';

const emptyText = (): BilingualText => ({ ar: '', en: '' });
export function OptionalCtaEditor({ value, onChange }: { value?: CtaLink; onChange: (value?: CtaLink) => void }) {
  const { t } = useTranslation('sections');
  if (!value) return <Button variant="secondary" onClick={() => onChange({ label: emptyText(), destination: { kind: 'action', action: 'scrollToRegister' } })}>{t('editor.addCta')}</Button>;
  return <fieldset className="grid gap-2 rounded-sm border border-border p-3"><legend>{t('editor.cta')}</legend><BilingualTextField label={t('editor.buttonLabel')} value={value.label} onChange={(label) => onChange({ ...value, label })} /><label className="grid gap-1 text-sm">{t('editor.destination')}<select className="min-h-10 rounded-sm border border-border px-2" value={value.destination.kind === 'action' ? value.destination.action : 'scrollToRegister'} onChange={(event) => onChange({ ...value, destination: { kind: 'action', action: event.target.value as Extract<CtaLink['destination'], { kind: 'action' }>['action'] } })}><option value="scrollToRegister">{t('register')}</option><option value="whatsapp">{t('whatsapp')}</option><option value="call">{t('call')}</option></select></label><Button variant="danger" onClick={() => onChange(undefined)}>{t('editor.removeCta')}</Button></fieldset>;
}
