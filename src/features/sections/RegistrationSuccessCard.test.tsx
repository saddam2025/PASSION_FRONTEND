// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import { RegistrationSuccessCard } from './RegistrationSuccessCard';

describe('registration success card', () => {
  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  function renderCard(props: Partial<ComponentProps<typeof RegistrationSuccessCard>> = {}) {
    return render(
      <LanguageProvider>
        <RegistrationSuccessCard
          reference="PAS-123456"
          name="سلمى أحمد"
          courseTitle="كورس الإدارة"
          whatsappNumber="+201094700533"
          messageTemplate="أهلاً {name}، بخصوص حجز {course}، رقم {reference}."
          {...props}
        />
      </LanguageProvider>,
    );
  }

  it('renders only when the API supplied a reference and uses the exact shared Arabic wording', () => {
    const { rerender } = renderCard({ reference: '' });
    expect(screen.queryByRole('status')).toBeNull();
    rerender(
      <LanguageProvider>
        <RegistrationSuccessCard reference="PAS-123456" name="سلمى أحمد" courseTitle="كورس الإدارة" whatsappNumber="+201094700533" />
      </LanguageProvider>,
    );
    expect(screen.getByRole('heading', { name: 'تم حجز الكورس مبدئيًا' })).toBeTruthy();
    expect(screen.getByText('تواصل مع الدعم خلال 24 ساعة عشان تكمّل إجراءات الدفع.')).toBeTruthy();
    expect(screen.getByText('رقم الحجز:')).toBeTruthy();
    expect(screen.getByText('لو الزرار ما اشتغلش، احفظ رقم الحجز وكلمنا على واتساب.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'استكمل الإجراءات على واتساب.' })).toBeTruthy();
  });

  it('encodes only the name, course title, and reference in the WhatsApp message', () => {
    renderCard();
    const link = screen.getByRole('link', { name: 'استكمل الإجراءات على واتساب.' }) as HTMLAnchorElement;
    const url = new URL(link.href);
    expect(url.origin + url.pathname).toBe('https://wa.me/201094700533');
    expect([...url.searchParams.keys()]).toEqual(['text']);
    expect(url.searchParams.get('text')).toBe('أهلاً سلمى أحمد، بخصوص حجز كورس الإدارة، رقم PAS-123456.');
    expect(url.href).toContain(encodeURIComponent('سلمى أحمد'));
  });

  it('hides WhatsApp and gives a contact fallback when settings have no academy number', () => {
    renderCard({ whatsappNumber: '' });
    expect(screen.queryByRole('link', { name: 'استكمل الإجراءات على واتساب.' })).toBeNull();
    expect(screen.getByText('احفظ رقم الحجز وتواصل مع الأكاديمية من بيانات التواصل الموجودة في الصفحة.')).toBeTruthy();
    expect(screen.getByText('PAS-123456')).toBeTruthy();
  });
});
