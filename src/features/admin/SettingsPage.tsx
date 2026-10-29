import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { ErrorState, Skeleton, useToast } from '@/components/ui/feedback';
import { adminService } from '@/services/admin.mock';
import { useAuth } from '@/app/AuthContext';
import { SettingsSectionEditor } from './SettingsSectionEditor';
import {
  settingsObject,
  settingsSectionDefaults,
  settingsSections,
  type SettingsSection,
} from './settingsConfig';

export default function SettingsPage() {
  const { t } = useTranslation('settings');
  const client = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminService.getSettings(),
  });
  const [section, setSection] = useState<SettingsSection>('contact');
  const [value, setValue] = useState<Record<string, unknown>>({});
  const [error, setError] = useState('');
  useEffect(() => {
    const current = {
      ...settingsSectionDefaults[section],
      ...settingsObject(query.data?.values[section]),
    };
    setValue(current);
    setError('');
  }, [query.data, section]);
  const initial = useMemo(
    () => ({ ...settingsSectionDefaults[section], ...settingsObject(query.data?.values[section]) }),
    [section, query.data],
  );
  const dirty = JSON.stringify(value) !== JSON.stringify(initial);
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [dirty]);
  const save = useMutation({
    mutationFn: () => adminService.saveSettings(section, value, query.data?.version ?? 1),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['admin-settings'] });
      toast.notify({ title: t('saved'), tone: 'success' });
      setError('');
    },
    onError: (cause) =>
      setError(
        cause instanceof Error && cause.message.includes('changed')
          ? t('conflict')
          : cause instanceof Error
            ? cause.message
            : t('saveError'),
      ),
  });
  if (query.isLoading) return <Skeleton variant="card" />;
  if (query.isError || !query.data)
    return <ErrorState title={t('loadError')} onRetry={() => void query.refetch()} />;
  const canManage = user?.role === 'admin';
  const update = (key: string, next: unknown) =>
    setValue((current) => ({ ...current, [key]: next }));
  return (
    <main className="grid gap-5">
      <header>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('lastSaved', { version: query.data.version })}</p>
      </header>
      <div className="grid gap-5 lg:grid-cols-[15rem_1fr]">
        <nav
          aria-label={t('sectionsNav')}
          className="flex gap-2 overflow-x-auto pb-1 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:flex-col lg:overflow-y-auto"
        >
          {settingsSections.map((key) => (
            <button
              key={key}
              type="button"
              className="min-h-11 shrink-0 rounded-xs border border-border px-3 text-start text-sm"
              aria-current={section === key ? 'page' : undefined}
              onClick={() => {
                if (dirty && !window.confirm(t('discardPrompt'))) return;
                setSection(key);
              }}
            >
              {t(`sections.${key}`)}
            </button>
          ))}
        </nav>
        <section className="grid content-start gap-4 rounded-sm border border-border bg-surface p-4 sm:p-6">
          <header>
            <h2 className="text-xl font-bold">{t(`sections.${section}`)}</h2>
            {dirty && (
              <p role="status" className="text-sm text-warning">
                {t('unsaved')}
              </p>
            )}
          </header>
          {section === 'categories' ? (
            <div className="grid gap-3">
              <p className="text-sm text-muted">{t('categoriesManagedWithCourses')}</p>
              <Link to="/admin/courses" className="text-primary-strong underline">
                {t('manageCourses')}
              </Link>
            </div>
          ) : section === 'legal' ? (
            <p className="rounded-xs border border-warning/30 bg-warning/5 p-3 text-sm text-warning">
              {t('legalStructuredSkipped')}
            </p>
          ) : (
            <SettingsSectionEditor section={section} value={value} onChange={update} />
          )}
          {section === 'payments' && (
            <p className="text-sm text-muted">{t('manualPaymentsNote')}</p>
          )}
          {section === 'seo' && !value.allowSearchEngines && (
            <p role="alert" className="rounded-xs bg-warning/10 p-3 text-sm text-warning">
              {t('searchDisabledWarning')}
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <footer className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface py-3">
            <span className="text-sm text-muted">{dirty ? t('unsaved') : t('savedState')}</span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={!dirty || save.isPending}
                onClick={() => setValue(initial)}
              >
                {t('discard')}
              </Button>
              <Button
                disabled={!dirty || save.isPending || !canManage}
                onClick={() => save.mutate()}
              >
                {save.isPending ? t('saving') : t('save')}
              </Button>
            </div>
          </footer>
        </section>
      </div>
      <aside className="flex flex-wrap gap-3 rounded-sm border border-border bg-canvas p-4 text-sm">
        <span>{t('courseManagementHint')}</span>
        <Link className="text-primary-strong underline" to="/admin/courses">
          {t('manageCourses')}
        </Link>
        <Link className="text-primary-strong underline" to="/admin/users">
          {t('manageUsers')}
        </Link>
      </aside>
    </main>
  );
}
