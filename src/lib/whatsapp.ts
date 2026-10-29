export function buildWhatsAppLink({
  phone,
  message,
}: {
  phone: string;
  message: string;
}): string | null {
  const digits = normalizePhone(phone);
  if (!isLikelyValidPhone(digits)) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
import { normalizePhone, isLikelyValidPhone } from '@/lib/phone';
