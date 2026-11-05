import { Outlet } from 'react-router-dom';
import { SmartImage } from '@/components/common/SmartImage';
import { usePublicSettings } from '@/services/usePublicSettings';

export function LegalLayout() {
  const settings = usePublicSettings();
  const name = settings.academyName.ar;
  return <div className="min-h-dvh bg-canvas">
    <header className="border-b border-border bg-surface px-container py-4">
      <div className="mx-auto flex max-w-6xl items-center gap-3">
        <SmartImage slot="logo" alt={name || 'شعار الأكاديمية'} width={120} height={40} srcOverride={settings.logo || undefined} className="h-10 w-32 object-contain" />
        {name && <span className="font-semibold">{name}</span>}
      </div>
    </header>
    <Outlet />
  </div>;
}
