import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Overlay';
import { EmptyState, ErrorState, Skeleton, useToast } from '@/components/ui/feedback';
import { adminService } from '@/services/admin.service';
import { useAuth } from '@/app/AuthContext';

export default function UsersPage() {
  const { t } = useTranslation('users');
  const { user } = useAuth();
  const client = useQueryClient();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [inviteSearch, setInviteSearch] = useState('');
  const [inviteStatus, setInviteStatus] = useState('');
  const [invitePage, setInvitePage] = useState(1);
  const users = useQuery({ queryKey: ['admin-users', userSearch, roleFilter, activeFilter, userPage], queryFn: () => adminService.usersPage({ search: userSearch || undefined, role: roleFilter || undefined, active: activeFilter ? activeFilter === 'true' : undefined, page: userPage }) });
  const invites = useQuery({ queryKey: ['admin-invites', inviteSearch, inviteStatus, invitePage], queryFn: () => adminService.invitesPage({ search: inviteSearch || undefined, status: inviteStatus || undefined, page: invitePage }) });
  const [inviteOpen, setInviteOpen] = useState(false);
  useEffect(() => {
    if (params.get('invite') !== '1') return;
    setInviteOpen(true);
    const next = new URLSearchParams(params);
    next.delete('invite');
    setParams(next, { replace: true });
  }, [params, setParams]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [inviteHours, setInviteHours] = useState<24 | 72 | 168>(72);
  const [confirm, setConfirm] = useState<{ id: string; active: boolean } | null>(null);
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['admin-users'] });
    void client.invalidateQueries({ queryKey: ['admin-invites'] });
  };
  const invite = useMutation({
    mutationFn: () => adminService.createInvite(email, name || undefined, inviteHours),
    onSuccess: (result) => {
      setLink(result.link);
      setInviteOpen(false);
      setEmail('');
      setName('');
      refresh();
    },
    onError: (error) => toast.notify({ title: error.message, tone: 'danger' }),
  });
  const resend = useMutation({
    mutationFn: (id: string) => adminService.resendInvite(id),
    onSuccess: (url) => {
      setLink(url);
      refresh();
    },
    onError: (error) => toast.notify({ title: error.message, tone: 'danger' }),
  });
  const revoke = useMutation({
    mutationFn: (id: string) => adminService.revokeInvite(id),
    onSuccess: refresh,
    onError: (error) => toast.notify({ title: error.message, tone: 'danger' }),
  });
  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      adminService.setActive(id, active),
    onSuccess: refresh,
    onError: (error) => toast.notify({ title: error.message, tone: 'danger' }),
  });
  if (users.isLoading) return <Skeleton variant="card" />;
  if (users.isError)
    return <ErrorState title={t('loadError')} onRetry={() => void users.refetch()} />;
  return (
    <main className="grid gap-5">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <Button onClick={() => setInviteOpen(true)}>{t('inviteAssistant')}</Button>
      </header>
      <section className="grid gap-3">
        <h2 className="text-xl font-bold">{t('users')}</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          <input className="min-h-11 rounded-xs border px-3" value={userSearch} placeholder={t('searchUsers')} aria-label={t('searchUsers')} onChange={(event) => { setUserSearch(event.target.value); setUserPage(1); }} />
          <select className="min-h-11 rounded-xs border px-3" value={roleFilter} aria-label={t('allRoles')} onChange={(event) => { setRoleFilter(event.target.value); setUserPage(1); }}><option value="">{t('allRoles')}</option><option value="admin">{t('roles.admin')}</option><option value="assistant">{t('roles.assistant')}</option></select>
          <select className="min-h-11 rounded-xs border px-3" value={activeFilter} aria-label={t('allStatuses')} onChange={(event) => { setActiveFilter(event.target.value); setUserPage(1); }}><option value="">{t('allStatuses')}</option><option value="true">{t('active')}</option><option value="false">{t('deactivated')}</option></select>
        </div>
        {users.data?.items.map((member) => (
          <article
            key={member.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-border bg-surface p-4"
          >
            <div>
              <strong>{member.name.ar}</strong>
              <p dir="ltr">{member.email}</p>
              <p>
                {t(`roles.${member.role}`)} · {member.active ? t('active') : t('deactivated')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {member.id !== user?.id && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => setConfirm({ id: member.id, active: !member.active })}
                  >
                    {member.active ? t('deactivate') : t('reactivate')}
                  </Button>
                </>
              )}
            </div>
          </article>
        ))}
        {!users.data?.items.length && <p className="text-sm text-muted">{t('noUsers')}</p>}
        <Pagination page={userPage} pageSize={users.data?.pageSize ?? 20} total={users.data?.total ?? 0} onPage={setUserPage} t={t} />
      </section>
      <section className="grid gap-3">
        <h2 className="text-xl font-bold">{t('invites')}</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <input className="min-h-11 rounded-xs border px-3" value={inviteSearch} placeholder={t('searchUsers')} aria-label={t('searchUsers')} onChange={(event) => { setInviteSearch(event.target.value); setInvitePage(1); }} />
          <select className="min-h-11 rounded-xs border px-3" value={inviteStatus} aria-label={t('allStatuses')} onChange={(event) => { setInviteStatus(event.target.value); setInvitePage(1); }}><option value="">{t('allStatuses')}</option>{(['pending', 'accepted', 'revoked', 'expired'] as const).map((status) => <option key={status} value={status}>{t(`inviteStatus.${status}`)}</option>)}</select>
        </div>
        {invites.isLoading ? (
          <Skeleton variant="card" />
        ) : invites.isError ? (
          <ErrorState title={t('loadError')} />
        ) : invites.data?.items.length ? (
          invites.data.items.map((item) => (
            <article
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-border p-4"
            >
              <div>
                <p dir="ltr">{item.email}</p>
                <p>
                  {t(`inviteStatus.${item.status}`)} · <time dir="ltr">{item.expiresAt}</time>
                </p>
              </div>
              <div className="flex gap-2">
                {item.status === 'pending' && (
                  <>
                    <Button variant="secondary" onClick={() => resend.mutate(item.id)}>
                      {t('resend')}
                    </Button>
                    <Button variant="danger" onClick={() => revoke.mutate(item.id)}>
                      {t('revoke')}
                    </Button>
                  </>
                )}
              </div>
            </article>
          ))
        ) : (
          <EmptyState title={t('emptyInvites')} />
        )}
        <Pagination page={invitePage} pageSize={invites.data?.pageSize ?? 20} total={invites.data?.total ?? 0} onPage={setInvitePage} t={t} />
      </section>
      <Modal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        title={t('inviteAssistant')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setInviteOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              onClick={() => invite.mutate()}
              loading={invite.isPending}
              disabled={!email.includes('@')}
            >
              {t('createInvite')}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <label className="grid gap-1">
            {t('email')}
            <input
              className="min-h-11 rounded-xs border px-3"
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="grid gap-1">
            {t('name')}
            <input
              className="min-h-11 rounded-xs border px-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="grid gap-1">
            {t('expiry')}
            <select
              className="min-h-11 rounded-xs border px-3"
              value={inviteHours}
              onChange={(e) => setInviteHours(Number(e.target.value) as 24 | 72 | 168)}
            >
              <option value={24}>{t('expiryHours', { count: 24 })}</option>
              <option value={72}>{t('expiryHours', { count: 72 })}</option>
              <option value={168}>{t('expiryDays', { count: 7 })}</option>
            </select>
          </label>
          <p className="text-sm text-muted">{t('linkOnce')}</p>
        </div>
      </Modal>
      <Modal
        open={Boolean(link)}
        onOpenChange={(open) => !open && setLink('')}
        title={t('inviteLinkTitle')}
        description={t('linkOnce')}
      >
        <div className="grid gap-3">
          <input className="min-h-11 rounded-xs border px-3" dir="ltr" readOnly value={link} />
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => void navigator.clipboard.writeText(new URL(link, window.location.origin).toString())}
            >
              {t('copyLink')}
            </Button>
            <a
              className="inline-flex min-h-11 items-center rounded-xs border px-4"
              target="_blank"
              rel="noopener noreferrer"
              href={`https://wa.me/?text=${encodeURIComponent(`رابط الدعوة: ${new URL(link, window.location.origin).toString()}`)}`}
            >
              {t('shareWhatsApp')}
            </a>
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        open={Boolean(confirm)}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={t('confirmTitle')}
        description={t('confirmDescription')}
        confirmLabel={t('confirm')}
        cancelLabel={t('cancel')}
        destructive={!confirm?.active}
        onConfirm={() => confirm && toggle.mutate(confirm)}
      />
    </main>
  );
}

function Pagination({ page, pageSize, total, onPage, t }: { page: number; pageSize: number; total: number; onPage: (page: number) => void; t: (key: string) => string }) {
  const pages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  if (pages <= 1) return null;
  return <nav className="flex items-center justify-between" aria-label={t('users')}><Button variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>{t('previous')}</Button><span>{page} / {pages}</span><Button variant="secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>{t('next')}</Button></nav>;
}
