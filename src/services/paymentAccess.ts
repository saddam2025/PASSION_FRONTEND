import type { PaymentRecord } from '@/schemas/payment';
import type { AuthUser } from './auth.types';

export function canVoidPaymentRecord(record: Pick<PaymentRecord, 'kind' | 'status' | 'recordedBy'>, actor?: Pick<AuthUser, 'id' | 'role'> | null): boolean {
  return Boolean(actor && record.kind === 'payment' && record.status === 'confirmed' && (actor.role === 'admin' || record.recordedBy === actor.id));
}
