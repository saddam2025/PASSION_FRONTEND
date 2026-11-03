import { describe, expect, it } from 'vitest';
import { buildRegistrationMessage, buildRegistrationWhatsAppLink } from './registrationWhatsApp';
import { DEFAULT_REGISTRATION_WHATSAPP_MESSAGE } from '@/schemas/settings';

describe('registration WhatsApp message', () => {
  it('contains only the name, course title, and reference and encodes the message in the link', () => {
    const message = buildRegistrationMessage('أهلًا {name}، بخصوص طلبك في كورس {course}، رقم الطلب {reference}.', 'سارة علي', 'مهارات التواصل', 'PAS-234567');
    expect(message).toBe('أهلًا سارة علي، بخصوص طلبك في كورس مهارات التواصل، رقم الطلب PAS-234567.');
    const link = buildRegistrationWhatsAppLink('+201000000000', message);
    expect(link).toContain('https://wa.me/201000000000?text=');
    expect(link).toContain(encodeURIComponent(message));
    expect(decodeURIComponent(link!.split('text=')[1])).toBe(message);
  });

  it('provides the required registration values in the default settings template', () => {
    expect(
      buildRegistrationMessage(
        DEFAULT_REGISTRATION_WHATSAPP_MESSAGE,
        'سارة علي',
        'مهارات التواصل',
        'PAS-234567',
      ),
    ).toBe('أهلًا سارة علي، بخصوص تسجيلك في كورس مهارات التواصل، رقم الطلب PAS-234567.');
  });
});
