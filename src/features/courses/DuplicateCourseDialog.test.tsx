// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import { ToastProvider } from '@/components/ui/feedback';
import { coursesAdminService } from '@/services/courses.admin';
import { DuplicateCourseDialog } from './DuplicateCourseDialog';
import { canDuplicateCourse } from './duplicateCourseEligibility';
import { courseCopySlug } from '@/lib/courseSlug';

vi.mock('@/services/courses.admin', () => ({ coursesAdminService: { checkSlug: vi.fn(), duplicate: vi.fn() } }));

const source = { id: 'course-source', title: { ar: 'كورس الإدارة' }, slug: 'course-management' };
function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}
function renderDialog() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Harness() {
    const [open, setOpen] = useState(true);
    return <><DuplicateCourseDialog course={source} open={open} onOpenChange={setOpen}/><LocationProbe/></>;
  }
  const view = render(<LanguageProvider><QueryClientProvider client={client}><ToastProvider><MemoryRouter initialEntries={['/admin/courses/course-source/studio/details']}><Routes><Route path="*" element={<Harness/>}/></Routes></MemoryRouter></ToastProvider></QueryClientProvider></LanguageProvider>);
  return { ...view, client };
}

describe('course duplication dialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('crypto', { randomUUID: () => 'abcd1234-0000-4000-8000-000000000000' });
    vi.mocked(coursesAdminService.checkSlug).mockResolvedValue(true);
    vi.mocked(coursesAdminService.duplicate).mockResolvedValue({ id: 'course-copy' } as never);
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it('restricts duplication to active Admin courses for list and studio menus', () => {
    expect(canDuplicateCourse('admin')).toBe(true);
    expect(canDuplicateCourse('assistant')).toBe(false);
    expect(canDuplicateCourse('admin', '2026-11-01T00:00:00.000Z')).toBe(false);
  });

  it('prefills the copy title and generated slug, then keeps them synced until the slug is edited', async () => {
    renderDialog();
    const title = screen.getByLabelText('عنوان النسخة الجديدة') as HTMLInputElement;
    const slug = screen.getByLabelText('الرابط المختصر') as HTMLInputElement;
    expect(title.value).toBe('نسخة من كورس الإدارة');
    expect(slug.value).toBe(courseCopySlug('نسخة من كورس الإدارة'));
    fireEvent.change(title, { target: { value: 'نسخة من كورس جديد' } });
    expect(slug.value).toBe(courseCopySlug('نسخة من كورس جديد'));
    fireEvent.change(slug, { target: { value: 'my-manual-copy' } });
    fireEvent.change(title, { target: { value: 'نسخة معدلة' } });
    expect(slug.value).toBe('my-manual-copy');
    await waitFor(() => expect(coursesAdminService.checkSlug).toHaveBeenCalledWith('my-manual-copy'));
  });

  it('blocks an invalid slug and shows a taken-slug error inline', async () => {
    renderDialog();
    const slug = screen.getByLabelText('الرابط المختصر');
    const submit = screen.getByRole('button', { name: 'تكرار' });
    fireEvent.change(slug, { target: { value: 'bad slug' } });
    expect((submit as HTMLButtonElement).disabled).toBe(true);
    expect(await screen.findByText('صيغة الرابط مش صح')).toBeTruthy();
    fireEvent.change(slug, { target: { value: 'taken-copy' } });
    vi.mocked(coursesAdminService.checkSlug).mockResolvedValue(false);
    await waitFor(() => expect(coursesAdminService.checkSlug).toHaveBeenCalledWith('taken-copy'));
    expect(await screen.findByText('الرابط مستخدم بالفعل.')).toBeTruthy();
    expect((submit as HTMLButtonElement).disabled).toBe(true);
    expect(coursesAdminService.duplicate).not.toHaveBeenCalled();
  });

  it('posts once, invalidates the list and opens the copied course Details tab', async () => {
    const { client } = renderDialog();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    await screen.findByText('الرابط متاح');
    fireEvent.click(screen.getByRole('button', { name: 'تكرار' }));
    await waitFor(() => expect(coursesAdminService.duplicate).toHaveBeenCalledTimes(1));
    expect(coursesAdminService.duplicate).toHaveBeenCalledWith('course-source', { title: { ar: 'نسخة من كورس الإدارة' }, slug: courseCopySlug('نسخة من كورس الإدارة') });
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/admin/courses/course-copy/studio/details'));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['courses-list'] });
    expect(await screen.findByText('تم تكرار الكورس، عدّل اللي محتاجه وانشره')).toBeTruthy();
  });

  it('guards rapid double submit while the request is pending', async () => {
    type DuplicateResult = Awaited<ReturnType<typeof coursesAdminService.duplicate>>;
    let resolveDuplicate!: (value: DuplicateResult) => void;
    vi.mocked(coursesAdminService.duplicate).mockReturnValue(new Promise((resolve) => { resolveDuplicate = resolve; }));
    renderDialog();
    await screen.findByText('الرابط متاح');
    const submit = screen.getByRole('button', { name: 'تكرار' });
    fireEvent.click(submit);
    fireEvent.click(submit);
    expect(coursesAdminService.duplicate).toHaveBeenCalledTimes(1);
    resolveDuplicate({ id: 'course-copy' } as DuplicateResult);
    await waitFor(() => expect(screen.getByTestId('location').textContent).toContain('course-copy'));
  });

  it('keeps the dialog open and maps duplicate slug conflicts to an inline error', async () => {
    vi.mocked(coursesAdminService.duplicate).mockRejectedValue(Object.assign(new Error('Conflict'), { code: 'CONFLICT' }));
    renderDialog();
    await screen.findByText('الرابط متاح');
    fireEvent.click(screen.getByRole('button', { name: 'تكرار' }));
    expect(await screen.findByText('الرابط مستخدم بالفعل.')).toBeTruthy();
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect((screen.getByLabelText('عنوان النسخة الجديدة') as HTMLInputElement).value).toBe('نسخة من كورس الإدارة');
  });

  it('keeps the dialog open and displays the mapped Arabic message for other errors', async () => {
    vi.mocked(coursesAdminService.duplicate).mockRejectedValue(new Error('حصلت مشكلة، جرّب تاني.'));
    renderDialog();
    await screen.findByText('الرابط متاح');
    fireEvent.click(screen.getByRole('button', { name: 'تكرار' }));
    expect((await screen.findByRole('alert')).textContent).toContain('حصلت مشكلة، جرّب تاني.');
    expect(screen.getByRole('dialog')).toBeTruthy();
  });
});
