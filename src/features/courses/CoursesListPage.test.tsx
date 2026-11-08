/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import { ToastProvider } from '@/components/ui/feedback';
import { coursesAdminService } from '@/services/courses.admin';
import { NewCourseDialogContext } from './newCourseDialogStore';
import CoursesListPage from './CoursesListPage';

const { authRole } = vi.hoisted(() => ({ authRole: { current: 'admin' } }));
vi.mock('@/app/AuthContext', () => ({ useAuth: () => ({ user: { role: authRole.current } }) }));
vi.mock('@/services/courses.admin', () => ({ coursesAdminService: { list: vi.fn() } }));

const course = {
  id: 'active-course', slug: 'active-course', status: 'draft' as const, hasUnpublishedChanges: false,
  featured: false, title: { ar: 'كورس تجريبي', en: '' }, category: 'إدارة',
  coverImage: { src: '', alt: { ar: '', en: '' } }, updatedAt: '', createdAt: '', version: 1,
};

function renderList(role: string, deletedAt?: string, error?: Error) {
  authRole.current = role;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  if (error) vi.mocked(coursesAdminService.list).mockRejectedValue(error);
  else vi.mocked(coursesAdminService.list).mockResolvedValue({
    items: [{ ...course, ...(deletedAt ? { deletedAt } : {}) }], total: 1, page: 1, pageSize: 50,
    pageCount: 1, counts: { all: 1, published: 0, draft: 1, archived: 0, unpublished_changes: 0 },
  });
  return render(
    <LanguageProvider><QueryClientProvider client={client}><ToastProvider>
      <NewCourseDialogContext.Provider value={{ open: vi.fn(), close: vi.fn() }}>
        <MemoryRouter><CoursesListPage /></MemoryRouter>
      </NewCourseDialogContext.Provider>
    </ToastProvider></QueryClientProvider></LanguageProvider>,
  );
}

describe('course list duplication action', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('shows the duplicate action to Admin for active courses and hides it for deleted courses', async () => {
    const view = renderList('admin');
    await screen.findByText('كورس تجريبي');
    fireEvent.keyDown(screen.getByRole('button', { name: /الإجراءات/ }), { key: 'Enter' });
    expect(await screen.findByRole('menuitem', { name: 'تكرار' })).toBeTruthy();
    view.unmount();

    renderList('admin', '2026-11-01T00:00:00.000Z');
    await screen.findByText('كورس تجريبي');
    fireEvent.keyDown(screen.getByRole('button', { name: /الإجراءات/ }), { key: 'Enter' });
    await waitFor(() => expect(screen.queryByRole('menuitem', { name: 'تكرار' })).toBeNull());
  });

  it('hides the duplicate action from Assistant', async () => {
    renderList('assistant');
    await screen.findByText('كورس تجريبي');
    fireEvent.keyDown(screen.getByRole('button', { name: /الإجراءات/ }), { key: 'Enter' });
    expect(screen.queryByRole('menuitem', { name: 'تكرار' })).toBeNull();
  });

  it('shows the mapped API error when loading the course list fails', async () => {
    renderList('admin', undefined, new Error('انتهت جلسة الدخول. سجّل دخولك تاني وبعدها جرّب النشر.'));
    expect((await screen.findByRole('alert')).textContent).toContain('انتهت جلسة الدخول. سجّل دخولك تاني وبعدها جرّب النشر.');
  });
});
