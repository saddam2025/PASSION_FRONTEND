// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import { CoursePageProvider, type CoursePageContextValue } from '@/features/sections/CoursePageContext';
import RegistrationFormRenderer from './RegistrationFormRenderer';
import type { Section } from '@/schemas/sections';
import { registrationsService } from '@/services/registrations';
import { RegistrationServiceError } from '@/services/registrations.types';

vi.mock('@/services/registrations', () => ({
  registrationsService: { submit: vi.fn(), getConfirmation: vi.fn() },
}));

const section: Extract<Section, { type: 'registrationForm' }> = {
  id: 'c6d4bb3a-1cc1-4ef4-ae5c-8b20e884ce22',
  type: 'registrationForm' as const,
  visible: true,
  settings: { background: 'none' as const, spacing: 'md' as const, width: 'contained' as const, reveal: 'none' as const },
  content: { title: { ar: 'سجّل بياناتك', en: '' }, layout: 'card' as const },
};
const context: Omit<CoursePageContextValue, 'mode'> = {
  course: {
    id: 'course-1', slug: 'course-one', title: { ar: 'كورس الإدارة', en: '' },
    shortDescription: { ar: '', en: '' }, price: 2000, promoPrice: null, currency: 'EGP',
    startDate: '', registrationOpen: true, whatsappMessageTemplate: { ar: '', en: '' },
  },
  settings: { academyName: { ar: 'الأكاديمية', en: '' }, whatsappNumber: '+201094700533', phone: '', email: '' },
  formDefinition: {
    fields: [
      { id: 'learning-goal', type: 'text', label: { ar: 'هدفك من الكورس', en: '' }, required: true },
      { id: 'course-track', type: 'select', label: { ar: 'المسار', en: '' }, required: true, options: [
        { value: 'management', label: { ar: 'إدارة', en: '' } },
        { value: 'coaching', label: { ar: 'كوتشينج', en: '' } },
      ] },
      { id: 'contact-ok', type: 'checkbox', label: { ar: 'أوافق على التواصل', en: '' }, required: true },
    ],
    consentText: { ar: 'أوافق على استخدام بياناتي للتواصل معي', en: '' },
  },
};

function renderPublicForm() {
  return render(
    <LanguageProvider>
      <CoursePageProvider value={{ ...context, mode: 'public' }}>
        <RegistrationFormRenderer section={section} mode="public" registrationTarget />
      </CoursePageProvider>
    </LanguageProvider>,
  );
}

describe('public course registration form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('crypto', { randomUUID: () => 'f60e6190-0bf0-49a6-bc38-3766cb665129' });
    HTMLElement.prototype.scrollIntoView = vi.fn();
    HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
    HTMLElement.prototype.setPointerCapture = vi.fn();
    HTMLElement.prototype.releasePointerCapture = vi.fn();
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('shows field errors and focuses the first invalid field on submit', async () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderPublicForm();
    fireEvent.click(await screen.findByRole('button', { name: 'سجّل دلوقتي' }));

    expect(await screen.findByText('راجع الحقول المطلوبة')).toBeTruthy();
    expect(screen.getByLabelText('الاسم الكامل').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByLabelText('البريد الإلكتروني').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByLabelText('رقم الهاتف').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByLabelText('هدفك من الكورس').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByRole('combobox').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByRole('checkbox', { name: 'أوافق على التواصل' }).getAttribute('aria-invalid')).toBe('true');
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('الاسم الكامل')));
    expect(errorLog).toHaveBeenCalledWith('[Registration] validation blocked', { fields: expect.arrayContaining(['fullName', 'email', 'phone']) });
    expect(registrationsService.submit).not.toHaveBeenCalled();
  });

  it('keeps the public form interactive and submits valid visible fields once', async () => {
    vi.mocked(registrationsService.submit).mockResolvedValue({ reference: 'PAS-123456', status: 'received' });
    const mountedAt = Date.now();
    const now = vi.spyOn(Date, 'now').mockReturnValue(mountedAt);
    renderPublicForm();

    const submit = await screen.findByRole('button', { name: 'سجّل دلوقتي' });
    expect(submit.hasAttribute('disabled')).toBe(false);
    fireEvent.change(screen.getByLabelText('الاسم الكامل'), { target: { value: 'سلمى أحمد' } });
    fireEvent.change(screen.getByLabelText('البريد الإلكتروني'), { target: { value: 'salma@example.com' } });
    fireEvent.change(screen.getByLabelText('رقم الهاتف'), { target: { value: '01012345678' } });
    fireEvent.change(screen.getByLabelText('هدفك من الكورس'), { target: { value: 'تطوير مهاراتي' } });
    const select = screen.getByRole('combobox');
    fireEvent.pointerDown(select, { button: 0, ctrlKey: false });
    fireEvent.keyDown(select, { key: 'ArrowDown' });
    fireEvent.click(await screen.findByRole('option', { name: 'إدارة' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'أوافق على التواصل' }));
    fireEvent.click(screen.getByRole('checkbox', { name: /أوافق على استخدام بياناتي للتواصل معي/ }));
    now.mockReturnValue(mountedAt + 2100);

    fireEvent.click(submit);
    await waitFor(() => expect(registrationsService.submit).toHaveBeenCalledTimes(1));
    expect(registrationsService.submit).toHaveBeenCalledWith(expect.objectContaining({
      courseSlug: 'course-one', fullName: 'سلمى أحمد', email: 'salma@example.com', phone: '+201012345678',
      answers: { 'learning-goal': 'تطوير مهاراتي', 'course-track': 'management', 'contact-ok': true },
      consent: true, honeypot: '', formStartedAt: mountedAt,
      idempotencyKey: 'f60e6190-0bf0-49a6-bc38-3766cb665129', attribution: {},
    }));
    expect(await screen.findByRole('heading', { name: 'تم حجز الكورس مبدئيًا' })).toBeTruthy();
  });

  it('links legal pages only from the consent text and opens them in a new tab', async () => {
    renderPublicForm();
    const privacy = await screen.findByRole('link', { name: 'سياسة الخصوصية' });
    const terms = screen.getByRole('link', { name: 'الشروط والأحكام' });
    expect(privacy.getAttribute('href')).toBe('/ar/privacy');
    expect(terms.getAttribute('href')).toBe('/ar/terms');
    expect(privacy.getAttribute('target')).toBe('_blank');
    expect(terms.getAttribute('target')).toBe('_blank');
  });

  it('shows the consent error when consent is unchecked', async () => {
    renderPublicForm();
    fireEvent.change(await screen.findByLabelText('الاسم الكامل'), { target: { value: 'سلمى أحمد' } });
    fireEvent.change(screen.getByLabelText('البريد الإلكتروني'), { target: { value: 'salma@example.com' } });
    fireEvent.change(screen.getByLabelText('رقم الهاتف'), { target: { value: '01012345678' } });
    fireEvent.change(screen.getByLabelText('هدفك من الكورس'), { target: { value: 'تطوير مهاراتي' } });
    const select = screen.getByRole('combobox');
    fireEvent.pointerDown(select, { button: 0, ctrlKey: false });
    fireEvent.keyDown(select, { key: 'ArrowDown' });
    fireEvent.click(await screen.findByRole('option', { name: 'إدارة' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'أوافق على التواصل' }));
    fireEvent.click(screen.getByRole('button', { name: 'سجّل دلوقتي' }));
    expect(await screen.findByText('الموافقة مطلوبة.')).toBeTruthy();
    expect(registrationsService.submit).not.toHaveBeenCalled();
  });

  it('shows API failures without clearing the visitor values or exposing personal data in development logs', async () => {
    vi.mocked(registrationsService.submit).mockRejectedValue(new RegistrationServiceError('COURSE_FULL', 'الأماكن المتاحة في الكورس اكتملت.', {}, 'request-123'));
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const mountedAt = Date.now();
    const now = vi.spyOn(Date, 'now').mockReturnValue(mountedAt);
    renderPublicForm();
    fireEvent.change(await screen.findByLabelText('الاسم الكامل'), { target: { value: 'سلمى أحمد' } });
    fireEvent.change(screen.getByLabelText('البريد الإلكتروني'), { target: { value: 'salma@example.com' } });
    fireEvent.change(screen.getByLabelText('رقم الهاتف'), { target: { value: '01012345678' } });
    fireEvent.change(screen.getByLabelText('هدفك من الكورس'), { target: { value: 'تطوير مهاراتي' } });
    const select = screen.getByRole('combobox');
    fireEvent.pointerDown(select, { button: 0, ctrlKey: false });
    fireEvent.keyDown(select, { key: 'ArrowDown' });
    fireEvent.click(await screen.findByRole('option', { name: 'إدارة' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'أوافق على التواصل' }));
    fireEvent.click(screen.getByRole('checkbox', { name: /أوافق على استخدام بياناتي للتواصل معي/ }));
    now.mockReturnValue(mountedAt + 2100);
    fireEvent.click(screen.getByRole('button', { name: 'سجّل دلوقتي' }));

    expect(await screen.findByText('الأماكن المتاحة في الكورس اكتملت.')).toBeTruthy();
    expect((screen.getByLabelText('الاسم الكامل') as HTMLInputElement).value).toBe('سلمى أحمد');
    expect(screen.queryByRole('heading', { name: 'تم حجز الكورس مبدئيًا' })).toBeNull();
    expect(errorLog).toHaveBeenCalledWith('[Registration] request failed', { code: 'COURSE_FULL', requestId: 'request-123' });
  });
});
