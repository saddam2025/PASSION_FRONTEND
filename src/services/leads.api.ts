import { apiDownload, apiRequest } from '@/api/client';
import { adminService } from './admin.service';
import type { Enrollment, Lead } from '@/schemas/lead';
import type { PaymentRecord, PaymentStatus } from '@/schemas/payment';

type Page<T> = { items: T[]; total: number; page: number; pageSize: number };
export interface LeadFilters {
  search?: string; courseId?: string; enrollmentStatus?: Enrollment['enrollmentStatus'];
  followUpStatus?: Enrollment['followUpStatus']; paymentStatus?: string; assigned?: 'me' | 'unassigned' | string;
  dateFrom?: string; dateTo?: string; sort?: 'newest' | 'oldest' | 'name' | 'course';
  page?: number; pageSize?: number; actorRole?: 'admin' | 'assistant';
}
type WireSummary = { netMinor: number; status: PaymentStatus; lastPaymentAt?: string | null; outstandingMinor?: number | null };
type WireListRow = {
  id: string; reference: string; lead: { fullName: string; email?: string; phone?: string };
  courseTitle: { ar?: string } | string; priceSnapshot: { amount: number | null; currency: string };
  enrollmentStatus: Enrollment['enrollmentStatus']; followUpStatus: Enrollment['followUpStatus'];
  paymentSummary?: WireSummary; assignedTo?: { id: string; name: { ar: string } } | null; registeredAt: string;
};
type WirePayment = Record<string, unknown> & { id: string; enrollmentId: string; kind: 'payment' | 'refund'; amount: number; currency: string; method: PaymentRecord['method']; receivedAt: string; status: PaymentRecord['status']; recordedBy: string | { id: string }; createdAt: string };
const statusValues = new Set(['new', 'contacted', 'interested', 'awaiting_payment', 'no_answer', 'not_interested', 'closed']);
const bilingual = (value: unknown) => typeof value === 'string' ? { ar: value, en: '' } : value && typeof value === 'object' && 'ar' in value ? { ar: String((value as { ar: unknown }).ar ?? ''), en: '' } : { ar: '', en: '' };
const toCourseTitle = (value: WireListRow['courseTitle']) => typeof value === 'string' ? value : value?.ar ?? '';
async function activeStaff() {
  const first = await adminService.usersPage({ active: true, page: 1 });
  const pages = [first];
  for (let page = 2; (page - 1) * first.pageSize < first.total; page += 1) pages.push(await adminService.usersPage({ active: true, page }));
  return pages.flatMap((page) => page.items);
}

function mapLead(id: string, fullName: string, email: string | undefined, phone: string | undefined, createdAt: string): Lead {
  return { id, fullName, email: email ?? '', phone: phone ?? '', phoneNormalized: phone ?? '', createdAt, consent: { acceptedAt: createdAt, policyVersion: 1 }, attribution: {} } as Lead;
}
function mapListEnrollment(row: WireListRow): Enrollment & { paymentSummary?: WireSummary; lead: Lead } {
  return {
    id: row.id, reference: row.reference, leadId: row.id, courseId: '', lead: mapLead(row.id, row.lead.fullName, row.lead.email, row.lead.phone, row.registeredAt), courseSnapshot: { title: bilingual(toCourseTitle(row.courseTitle)), slug: '' },
    priceSnapshot: row.priceSnapshot, formSnapshot: { fields: [] }, answers: {}, enrollmentStatus: row.enrollmentStatus,
    followUpStatus: row.followUpStatus, ...(row.assignedTo?.id ? { assignedToUserId: row.assignedTo.id } : {}),
    registeredAt: row.registeredAt, idempotencyKey: '', history: [], ...(row.paymentSummary ? { paymentSummary: row.paymentSummary } : {}),
  };
}
function mapPayment(row: WirePayment): PaymentRecord & { receiptMediaKey?: string; receiptMediaId?: string } {
  const recordedBy = typeof row.recordedBy === 'string' ? row.recordedBy : row.recordedBy.id;
  return {
    id: row.id, enrollmentId: row.enrollmentId, kind: row.kind, amount: row.amount, currency: row.currency, method: row.method,
    ...(typeof row.reference === 'string' ? { reference: row.reference } : {}), ...(typeof row.note === 'string' ? { note: row.note } : {}),
    receivedAt: row.receivedAt, status: row.status, ...(typeof row.voidReason === 'string' ? { voidReason: row.voidReason } : {}),
    recordedBy, ...(typeof row.confirmedAt === 'string' ? { confirmedAt: row.confirmedAt } : {}), createdAt: row.createdAt,
    idempotencyKey: '', ...(typeof row.receiptMediaKey === 'string' ? { receiptMediaKey: row.receiptMediaKey } : {}),
  } as PaymentRecord & { receiptMediaKey?: string; receiptMediaId?: string };
}
function enrollmentQuery(filters: LeadFilters): URLSearchParams {
  const sort = filters.sort === 'name' || filters.sort === 'course' || filters.sort === 'oldest' ? filters.sort : 'newest';
  return new URLSearchParams({
    page: String(filters.page ?? 1), pageSize: String(Math.min(50, Math.max(1, filters.pageSize ?? 25))), sort,
    ...(filters.search ? { search: filters.search } : {}), ...(filters.courseId ? { courseId: filters.courseId } : {}),
    ...(filters.enrollmentStatus ? { enrollmentStatus: filters.enrollmentStatus } : {}),
    ...(filters.followUpStatus ? { followUpStatus: filters.followUpStatus } : {}),
    ...(filters.paymentStatus ? { paymentStatus: filters.paymentStatus } : {}),
    ...(filters.assigned ? { assignedTo: filters.assigned } : {}),
    // These are date-only keys from the UI and are interpreted as Africa/Cairo days by the API.
    ...(filters.dateFrom ? { dateFrom: filters.dateFrom.slice(0, 10) } : {}),
    ...(filters.dateTo ? { dateTo: filters.dateTo.slice(0, 10) } : {}),
  });
}
function mapHistory(history: Array<Record<string, unknown>> = []) {
  return history.map((event) => {
    const from = typeof event.from === 'string' ? event.from : undefined;
    const to = typeof event.to === 'string' ? event.to : undefined;
    const note = typeof event.note === 'string' ? event.note : undefined;
    const by = event.by && typeof event.by === 'object' ? event.by as { id?: string; name?: { ar?: string } } : undefined;
    const type = note === 'تحديث التعيين' ? 'assigned' : to === 'cancelled' ? 'cancelled' : to === 'confirmed' ? 'confirmed' : statusValues.has(to ?? '') ? 'follow_up' : 'status_changed';
    return { type, actor: by?.id ?? '', actorName: by?.name?.ar ?? '', at: String(event.at ?? ''), ...(from ? { from } : {}), ...(to ? { to } : {}), ...(note ? { note } : {}) };
  });
}

export const apiLeadsService = {
  async list(filters: LeadFilters = {}) {
    const query = enrollmentQuery(filters);
    const [page, staff] = await Promise.all([
      apiRequest<Page<WireListRow>>(`enrollments?${query}`),
      filters.actorRole === 'admin' ? activeStaff() : Promise.resolve([]),
    ]);
    const items = page.items.map(mapListEnrollment);
    return { items, total: page.total, page: page.page, pageSize: page.pageSize, pageCount: Math.ceil(page.total / page.pageSize),
      users: staff.map((item) => ({ ...item, name: bilingual(item.name), permissions: [] as never[], active: item.active })), paymentSummaryAvailable: page.items.length > 0 && page.items.every((row) => Boolean(row.paymentSummary)) };
  },
  async getCustomer(enrollmentId: string, actorRole?: 'admin' | 'assistant') {
    const [{ enrollment: row }, paymentsResult, activeStaffUsers] = await Promise.all([
      apiRequest<{ enrollment: Record<string, unknown> }>(`enrollments/${encodeURIComponent(enrollmentId)}`),
      apiRequest<{ items: WirePayment[]; total: number; paymentSummary: WireSummary; outstandingMinor: number | null }>(`enrollments/${encodeURIComponent(enrollmentId)}/payments`),
      actorRole === 'admin' ? activeStaff().catch(() => []) : Promise.resolve([]),
    ]);
    const leadWire = row.lead as { id: string; fullName: string; email?: string; phone?: string; phoneNormalized?: string };
    const registeredAt = String(row.registeredAt ?? '');
    const lead = mapLead(leadWire.id, leadWire.fullName, leadWire.email, leadWire.phoneNormalized ?? leadWire.phone, registeredAt);
    const course = row.courseSnapshot as { title?: unknown; slug?: string };
    const form = row.formSnapshot as { fields?: Array<{ id: string; label: unknown; type: string }> };
    const paymentSummary = { ...(row.paymentSummary as WireSummary | undefined ?? paymentsResult.paymentSummary), outstandingMinor: paymentsResult.outstandingMinor };
    const enrollment = {
      id: String(row.id), reference: String(row.reference), leadId: lead.id, courseId: '', courseSnapshot: { title: bilingual(course?.title), slug: course?.slug ?? '' },
      priceSnapshot: row.priceSnapshot as Enrollment['priceSnapshot'], formSnapshot: { fields: (form?.fields ?? []).map((field) => ({ ...field, label: bilingual(field.label) })) },
      answers: row.answers as Enrollment['answers'], enrollmentStatus: row.enrollmentStatus as Enrollment['enrollmentStatus'], followUpStatus: row.followUpStatus as Enrollment['followUpStatus'],
      ...(row.assignedTo && typeof row.assignedTo === 'object' && 'id' in row.assignedTo ? { assignedToUserId: String((row.assignedTo as { id: unknown }).id) } : {}),
      registeredAt, idempotencyKey: '', history: mapHistory(row.history as Array<Record<string, unknown>>) as Enrollment['history'], paymentSummary,
    } as Enrollment & { paymentSummary: WireSummary & { outstandingMinor: number | null } };
    const notes = Array.isArray(row.notes) ? row.notes.map((item) => { const note = item as Record<string, unknown>; return { id: String(note.id), body: String(note.body), createdAt: String(note.createdAt), author: note.author }; }) : [];
    const possibleDuplicate = row.possibleDuplicateOf as { hasPossibleDuplicate?: boolean; references?: Array<{ reference: string }> } | undefined;
    const otherEnrollments = (row.otherEnrollments as Array<{ reference: string }> | undefined) ?? [];
    const payments = paymentsResult.items.map(mapPayment);
    return { lead, enrollments: [enrollment], payments, notes, users: activeStaffUsers.map((item) => ({ id: item.id, name: bilingual(item.name), role: item.role, active: item.active })), paymentSummaries: { [enrollment.id]: paymentSummary }, possibleDuplicate, otherEnrollments };
  },
  async updateFollowUp(id: string, status: Enrollment['followUpStatus'], note = '') {
    const result = await apiRequest<{ enrollment: Record<string, unknown> }>(`enrollments/${encodeURIComponent(id)}/follow-up`, { method: 'PATCH', body: JSON.stringify({ followUpStatus: status, ...(note.trim() ? { note: note.trim() } : {}) }) });
    return result.enrollment;
  },
  async assign(id: string, userId?: string) { const result = await apiRequest<{ enrollment: Record<string, unknown> }>(`enrollments/${encodeURIComponent(id)}/assign`, { method: 'POST', body: JSON.stringify({ assigneeId: userId ?? null }) }); return result.enrollment; },
  async confirm(id: string, reason = '') { const result = await apiRequest<{ enrollment: Record<string, unknown> }>(`enrollments/${encodeURIComponent(id)}/confirm`, { method: 'POST', body: JSON.stringify(reason.trim() ? { reason: reason.trim() } : {}) }); return result.enrollment; },
  async cancelEnrollment(id: string, reason: string) { const result = await apiRequest<{ enrollment: Record<string, unknown> }>(`enrollments/${encodeURIComponent(id)}/cancel`, { method: 'POST', body: JSON.stringify({ reason: reason.trim() }) }); return result.enrollment; },
  async logContact(id: string) { const result = await apiRequest<{ enrollment: Record<string, unknown> }>(`enrollments/${encodeURIComponent(id)}/whatsapp-contact`, { method: 'POST', body: '{}' }); return result.enrollment; },
  async addNote(input: { leadId: string; enrollmentId?: string; body: string }) { const result = await apiRequest<{ note: unknown }>(`enrollments/${encodeURIComponent(input.enrollmentId ?? input.leadId)}/notes`, { method: 'POST', body: JSON.stringify({ body: input.body.trim() }) }); return result.note; },
  async whatsappTemplate(_courseId: string, fallbackTemplate?: string) { return fallbackTemplate ?? ''; },
  async exportCsv(filters: LeadFilters = {}) {
    const query = enrollmentQuery(filters);
    // Avoid putting the customer's raw search term in the URL; remaining filters are non-PII identifiers/enums/dates.
    query.delete('search');
    return apiDownload(`enrollments/export.csv?${query}`);
  },
};
