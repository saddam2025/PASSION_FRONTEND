import { buildWhatsAppLink } from './whatsapp';

export function buildRegistrationMessage(template: string, name: string, courseTitle: string, reference: string): string {
  return template
    .replaceAll('{name}', name)
    .replaceAll('{course}', courseTitle)
    .replaceAll('{reference}', reference);
}

export function buildRegistrationWhatsAppLink(phone: string, message: string, url?: string): string | null {
  if (url) {
    try {
      const link = new URL(url);
      link.searchParams.set('text', message);
      return link.toString();
    } catch { return null; }
  }
  return buildWhatsAppLink({ phone, message });
}
