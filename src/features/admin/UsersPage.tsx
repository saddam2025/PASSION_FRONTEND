import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Overlay';
import { EmptyState, ErrorState, Skeleton, useToast } from '@/components/ui/feedback';
import { adminService } from '@/services/admin.mock';
import type { UserPermission } from '@/services/auth.types';
import { PermissionKey, permissionCatalog, rolePermissionDefaults } from '@/schemas/permissions';

export default function UsersPage() {
  const { t } = useTranslation('users');
  const client = useQueryClient();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const users = useQuery({ queryKey: ['admin-users'], queryFn: () => adminService.users() });
  const invites = useQuery({ queryKey: ['admin-invites'], queryFn: () => adminService.invites() });
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
  const [resetLink, setResetLink] = useState('');
  const [inviteHours, setInviteHours] = useState<24 | 72 | 168>(72);
  const [permissions, setPermissions] = useState<UserPermission[]>([
    ...rolePermissionDefaults.assistant,
  ]);
  const [editing, setEditing] = useState<{ id: string; permissions: UserPermission[] } | null>(
    null,
  );
  const [confirm, setConfirm] = useState<{ id: string; active: boolean } | null>(null);
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['admin-users'] });
    void client.invalidateQueries({ queryKey: ['admin-invites'] });
  };
  const invite = useMutation({
    mutationFn: () => adminService.createInvite(email, name || undefined, permissions, inviteHours),
    onSuccess: (result) => {
      setLink(result.link);
      setInviteOpen(false);
      setEmail('');
      setName('');
      refresh();
    },
  });
  const resend = useMutation({
    mutationFn: (id: string) => adminService.resendInvite(id),
    onSuccess: (url) => {
      setLink(url);
      refresh();
    },
  });
  const revoke = useMutation({
    mutationFn: (id: string) => adminService.revokeInvite(id),
    onSuccess: refresh,
  });
  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      adminService.setActive(id, active),
    onSuccess: refresh,
    onError: (error) => toast.notify({ title: error.message, tone: 'danger' }),
  });
  const savePermissions = useMutation({
    mutationFn: () =>
      editing
        ? adminService.updatePermissions(editing.id, editing.permissions)
        : Promise.resolve(null),
    onSuccess: () => {
      setEditing(null);
      refresh();
    },
  });
  const reset = useMutation({
    mutationFn: (id: string) => adminService.generatePasswordResetLink(id),
    onSuccess: setResetLink,
  });
  const removeInvite = useMutation({
    mutationFn: (id: string) => adminService.deleteInvite(id),
    onSuccess: refresh,
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
        {users.data?.map((member) => (
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
              <p className="text-xs text-muted">
                {member.permissions.map((key) => t(permissionCatalog[key].labelKey)).join(' · ')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => setEditing({ id: member.id, permissions: [...member.permissions] })}
              >
                {t('editPermissions')}
              </Button>
              {member.id !== sessionStorage.getItem('passion-mock-session') && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => setConfirm({ id: member.id, active: !member.active })}
                  >
                    {member.active ? t('deactivate') : t('reactivate')}
                  </Button>
                  <select
                    aria-label={t('changeRole')}
                    className="min-h-11 rounded-xs border px-2"
                    value={member.role}
                    onChange={(e) => {
                      if (window.confirm(t('confirmRoleChange')))
                        void adminService
                          .changeRole(member.id, e.target.value as 'admin' | 'assistant')
                          .then(refresh)
                          .catch((error: Error) =>
                            toast.notify({ title: error.message, tone: 'danger' }),
                          );
                    }}
                  >
                    <option value="admin">{t('roles.admin')}</option>
                    <option value="assistant">{t('roles.assistant')}</option>
                  </select>
                </>
              )}
              <Button variant="secondary" onClick={() => reset.mutate(member.id)}>
                {t('resetLink')}
              </Button>
            </div>
          </article>
        ))}
      </section>
      <section className="grid gap-3">
        <h2 className="text-xl font-bold">{t('invites')}</h2>
        {invites.isLoading ? (
          <Skeleton variant="card" />
        ) : invites.isError ? (
          <ErrorState title={t('loadError')} />
        ) : invites.data?.length ? (
          invites.data.map((item) => (
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
                {item.status !== 'pending' && (
                  <Button variant="danger" onClick={() => removeInvite.mutate(item.id)}>
                    {t('delete')}
                  </Button>
                )}
              </div>
            </article>
          ))
        ) : (
          <EmptyState title={t('emptyInvites')} />
        )}
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
          {(Object.keys(PermissionKey) as UserPermission[]).map((permission) => (
            <label key={permission} className="flex min-h-11 items-center gap-3">
              <input
                type="checkbox"
                checked={permissions.includes(permission)}
                onChange={(e) =>
                  setPermissions((current) =>
                    e.target.checked
                      ? [...current, permission]
                      : current.filter((x) => x !== permission),
                  )
                }
              />
              <span>{t(permissionCatalog[permission].labelKey)}</span>
            </label>
          ))}
          <p className="text-sm text-muted">{t('linkOnce')}</p>
        </div>
      </Modal>
      <Modal
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        title={t('editPermissions')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              {t('cancel')}
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                setEditing((current) =>
                  current
                    ? { ...current, permissions: [...rolePermissionDefaults.assistant] }
                    : current,
                )
              }
            >
              {t('resetDefaults')}
            </Button>
            <Button onClick={() => savePermissions.mutate()}>{t('save')}</Button>
          </>
        }
      >
        <div className="grid gap-2">
          {editing &&
            (Object.keys(PermissionKey) as UserPermission[]).map((permission) => (
              <label key={permission} className="flex min-h-11 items-center gap-3">
                <input
                  type="checkbox"
                  checked={editing.permissions.includes(permission)}
                  onChange={(e) =>
                    setEditing((current) =>
                      !current
                        ? current
                        : {
                            ...current,
                            permissions: e.target.checked
                              ? [...current.permissions, permission]
                              : current.permissions.filter((x) => x !== permission),
                          },
                    )
                  }
                />
                <span>
                  {t(permissionCatalog[permission].labelKey)}
                  <small className="block text-muted">
                    {t(permissionCatalog[permission].descriptionKey)}
                  </small>
                </span>
              </label>
            ))}
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
              onClick={() => void navigator.clipboard.writeText(`${window.location.origin}${link}`)}
            >
              {t('copyLink')}
            </Button>
            <a
              className="inline-flex min-h-11 items-center rounded-xs border px-4"
              target="_blank"
              rel="noopener noreferrer"
              href={`https://wa.me/?text=${encodeURIComponent(`رابط الدعوة: ${window.location.origin}${link}`)}`}
            >
              {t('shareWhatsApp')}
            </a>
          </div>
        </div>
      </Modal>
      <Modal
        open={Boolean(resetLink)}
        onOpenChange={(open) => !open && setResetLink('')}
        title={t('resetLinkTitle')}
        description={t('linkOnce')}
      >
        <div className="grid gap-3">
          <input className="min-h-11 rounded-xs border px-3" dir="ltr" readOnly value={resetLink} />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() =>
                void navigator.clipboard.writeText(`${window.location.origin}${resetLink}`)
              }
            >
              {t('copyLink')}
            </Button>
            <a
              className="inline-flex min-h-11 items-center rounded-xs border px-4"
              target="_blank"
              rel="noopener noreferrer"
              href={`https://wa.me/?text=${encodeURIComponent(`رابط إعادة تعيين كلمة المرور: ${window.location.origin}${resetLink}`)}`}
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
