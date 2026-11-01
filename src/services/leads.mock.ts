// MOCK: browser-persisted lead/enrollment workflows; replace in A3.
import { mockAuthService } from './auth.mock';
import { readMockDb, writeMockDb, recordMockAudit } from '@/mocks/db';
import { hasPermission, type PermissionKey } from '@/schemas/permissions';
import type { Enrollment } from '@/schemas/lead';
import { computePaymentStatus } from '@/schemas/payment';

export class ForbiddenError extends Error {
  readonly code = 'forbidden';
}
async function staff(permission: PermissionKey = 'viewLeads') {
  const user = await mockAuthService.getCurrentUser();
  if (!user || !hasPermission(user, permission)) throw new ForbiddenError('Not permitted');
  return user;
}
export interface LeadFilters {
  search?: string;
  courseId?: string;
  enrollmentStatus?: Enrollment['enrollmentStatus'];
  followUpStatus?: Enrollment['followUpStatus'];
  paymentStatus?: string;
  assigned?: 'me' | 'unassigned' | string;
  dateFrom?: string;
  dateTo?: string;
  needsAttention?: boolean;
  sort?: 'newest' | 'oldest' | 'name' | 'course';
  page?: number;
  pageSize?: number;
}
export const leadsService = {
  async queueCounts() {
    const user = await staff();
    const db = readMockDb();
    const newNeedsContact = db.enrollments.filter(
      (e) =>
        e.followUpStatus === 'new' && Date.now() - Date.parse(e.registeredAt) > 24 * 60 * 60 * 1000,
    ).length;
    const assignedAwaiting = db.enrollments.filter(
      (e) => e.assignedToUserId === user.id && e.followUpStatus === 'awaiting_payment',
    ).length;
    return { newNeedsContact, assignedAwaiting };
  },
  async list(filters: LeadFilters = {}) {
    const user = await staff();
    const db = readMockDb();
    const needle = (filters.search ?? '').toLocaleLowerCase();
    const rows = db.enrollments
      .filter((e) => {
        const lead = db.leads.find((l) => l.id === e.leadId);
        if (!lead) return false;
        const payments = db.payments.filter((p) => p.enrollmentId === e.id);
        return (
          (!needle ||
            `${lead.fullName} ${lead.email} ${lead.phone} ${e.reference}`
              .toLocaleLowerCase()
              .includes(needle)) &&
          (!filters.courseId || e.courseId === filters.courseId) &&
          (!filters.enrollmentStatus || e.enrollmentStatus === filters.enrollmentStatus) &&
          (!filters.followUpStatus || e.followUpStatus === filters.followUpStatus) &&
          (!filters.assigned ||
            (filters.assigned === 'me'
              ? e.assignedToUserId === user.id
              : filters.assigned === 'unassigned'
                ? !e.assignedToUserId
                : e.assignedToUserId === filters.assigned)) &&
          (!filters.paymentStatus ||
            filters.paymentStatus
              .split(',')
              .includes(
                computePaymentStatus(e.priceSnapshot, payments, e.enrollmentStatus === 'cancelled'),
              )) &&
          (!filters.dateFrom || e.registeredAt >= filters.dateFrom) &&
          (!filters.dateTo || e.registeredAt <= filters.dateTo) &&
          (!filters.needsAttention ||
            (e.followUpStatus === 'new' &&
              Date.now() - Date.parse(e.registeredAt) > 24 * 60 * 60 * 1000))
        );
      })
      .sort((a, b) =>
        filters.sort === 'oldest'
          ? a.registeredAt.localeCompare(b.registeredAt)
          : filters.sort === 'name'
            ? (db.leads.find((l) => l.id === a.leadId)?.fullName ?? '').localeCompare(
                db.leads.find((l) => l.id === b.leadId)?.fullName ?? '',
              )
            : filters.sort === 'course'
              ? a.courseSnapshot.title.ar.localeCompare(b.courseSnapshot.title.ar)
              : b.registeredAt.localeCompare(a.registeredAt),
      );
    const page = Math.max(filters.page ?? 1, 1),
      pageSize = Math.min(Math.max(filters.pageSize ?? 25, 1), 50);
    return {
      items: rows.slice((page - 1) * pageSize, page * pageSize),
      total: rows.length,
      page,
      pageSize,
      pageCount: Math.ceil(rows.length / pageSize),
      leads: db.leads,
      enrollments: db.enrollments,
      customerRows: db.leads
        .filter((lead) => rows.some((enrollment) => enrollment.leadId === lead.id))
        .map((lead) => ({
          lead,
          count: db.enrollments.filter((enrollment) => enrollment.leadId === lead.id).length,
        })),
      users: db.users.map(({ id, name, email, role, permissions }) => ({
        id,
        name,
        email,
        role,
        permissions,
      })),
    };
  },
  async getCustomer(id: string) {
    await staff();
    const db = readMockDb();
    const lead = db.leads.find((x) => x.id === id);
    if (!lead) throw new Error('Customer not found');
    return {
      lead,
      enrollments: db.enrollments.filter((e) => e.leadId === id),
      payments: db.payments,
      notes: db.notes.filter((n) => n.leadId === id),
      users: db.users,
    };
  },
  async updateFollowUp(id: string, status: Enrollment['followUpStatus'], note = '') {
    const user = await staff('updateFollowUp');
    const db = readMockDb();
    const e = db.enrollments.find((item) => item.id === id);
    if (!e) throw new Error('Enrollment not found');
    const before = e.followUpStatus;
    e.followUpStatus = status;
    e.history.push({
      type: 'follow_up',
      actor: user.id,
      at: new Date().toISOString(),
      from: before,
      to: status,
      note: note.trim() || undefined,
    });
    recordMockAudit(db, user.id, 'enrollment.follow_up_changed', id);
    writeMockDb(db);
    return e;
  },
  async exportCsv(filters: LeadFilters = {}) {
    const user = await staff('exportCsv');
    const db = readMockDb();
    const needle = (filters.search ?? '').toLocaleLowerCase();
    const rows = db.enrollments
      .filter((e) => {
        const lead = db.leads.find((l) => l.id === e.leadId);
        return (
          Boolean(lead) &&
          (!needle ||
            `${lead!.fullName} ${lead!.email} ${lead!.phone} ${e.reference}`
              .toLocaleLowerCase()
              .includes(needle)) &&
          (!filters.courseId || e.courseId === filters.courseId) &&
          (!filters.followUpStatus || e.followUpStatus === filters.followUpStatus) &&
          (!filters.enrollmentStatus || e.enrollmentStatus === filters.enrollmentStatus) &&
          (!filters.paymentStatus ||
            computePaymentStatus(
              e.priceSnapshot,
              db.payments.filter((p) => p.enrollmentId === e.id),
              e.enrollmentStatus === 'cancelled',
            ) === filters.paymentStatus) &&
          (!filters.assigned ||
            (filters.assigned === 'me'
              ? e.assignedToUserId === user.id
              : filters.assigned === 'unassigned'
                ? !e.assignedToUserId
                : e.assignedToUserId === filters.assigned)) &&
          (!filters.dateFrom || e.registeredAt >= filters.dateFrom) &&
          (!filters.dateTo || e.registeredAt <= filters.dateTo) &&
          (!filters.needsAttention ||
            (e.followUpStatus === 'new' &&
              Date.now() - Date.parse(e.registeredAt) > 24 * 60 * 60 * 1000))
        );
      })
      .slice(0, 5000);
    rows.sort((a, b) =>
      filters.sort === 'oldest'
        ? a.registeredAt.localeCompare(b.registeredAt)
        : filters.sort === 'name'
          ? (db.leads.find((l) => l.id === a.leadId)?.fullName ?? '').localeCompare(
              db.leads.find((l) => l.id === b.leadId)?.fullName ?? '',
            )
          : filters.sort === 'course'
            ? a.courseSnapshot.title.ar.localeCompare(b.courseSnapshot.title.ar)
            : b.registeredAt.localeCompare(a.registeredAt),
    );
    recordMockAudit(db, user.id, 'export.csv', 'leads', { filters, rowCount: rows.length });
    writeMockDb(db);
    return rows.map((enrollment) => {
      const lead = db.leads.find((item) => item.id === enrollment.leadId);
      const records = db.payments.filter((p) => p.enrollmentId === enrollment.id);
      return {
        enrollment,
        lead,
        paymentStatus: computePaymentStatus(
          enrollment.priceSnapshot,
          records,
          enrollment.enrollmentStatus === 'cancelled',
        ),
        paid: hasPermission(user, 'viewPayments')
          ? records
              .filter((p) => p.status === 'confirmed')
              .reduce((sum, p) => sum + (p.kind === 'payment' ? p.amount : -p.amount), 0)
          : undefined,
        outstanding: hasPermission(user, 'viewPayments')
          ? Math.max(
              (enrollment.priceSnapshot.amount ?? 0) -
                records
                  .filter((p) => p.status === 'confirmed')
                  .reduce((sum, p) => sum + (p.kind === 'payment' ? p.amount : -p.amount), 0),
              0,
            )
          : undefined,
      };
    });
  },
  async assign(id: string, userId?: string) {
    const actor = await staff();
    const db = readMockDb();
    const e = db.enrollments.find((item) => item.id === id);
    if (!e) throw new Error('Enrollment not found');
    if (
      actor.role !== 'admin' &&
      ((userId && userId !== actor.id) ||
        (e.assignedToUserId && e.assignedToUserId !== actor.id) ||
        userId !== actor.id)
    )
      throw new ForbiddenError('Not permitted');
    if (userId && !db.users.some((member) => member.id === userId && member.active))
      throw new Error('Choose an active staff member');
    e.assignedToUserId = userId;
    e.history.push({
      type: 'assigned',
      actor: actor.id,
      at: new Date().toISOString(),
      to: userId ?? '',
    });
    recordMockAudit(db, actor.id, 'enrollment.assigned', id);
    writeMockDb(db);
    return e;
  },
  async addNote(input: { leadId: string; enrollmentId?: string; body: string }) {
    const actor = await staff('manageNotes');
    const body = input.body.trim();
    if (!body || body.length > 2000) throw new Error('Note must be 1-2000 characters');
    const db = readMockDb();
    const note = {
      id: crypto.randomUUID(),
      leadId: input.leadId,
      enrollmentId: input.enrollmentId,
      authorId: actor.id,
      body,
      createdAt: new Date().toISOString(),
    };
    db.notes.unshift(note);
    recordMockAudit(db, actor.id, 'enrollment.note_added', input.enrollmentId ?? input.leadId);
    writeMockDb(db);
    return note;
  },
  async deleteNote(id: string) {
    const actor = await staff('manageNotes');
    const db = readMockDb();
    const note = db.notes.find((item) => item.id === id);
    if (!note) throw new Error('Note not found');
    if (actor.role !== 'admin' && note.authorId !== actor.id)
      throw new ForbiddenError('Only the author or Admin may remove this note');
    db.notes = db.notes.filter((item) => item.id !== id);
    recordMockAudit(db, actor.id, 'enrollment.note_deleted', id);
    writeMockDb(db);
  },
  async confirmEnrollment(id: string, reason = '') {
    const actor = await staff();
    const db = readMockDb();
    const enrollment = db.enrollments.find((item) => item.id === id);
    if (!enrollment) throw new Error('Enrollment not found');
    const payments = db.payments.filter((item) => item.enrollmentId === id);
    const paymentStatus = computePaymentStatus(enrollment.priceSnapshot, payments);
    const noPrice =
      enrollment.priceSnapshot.amount === null || enrollment.priceSnapshot.amount === 0;
    if (
      paymentStatus !== 'paid' &&
      !noPrice &&
      (actor.role !== 'admin' || reason.trim().length < 3)
    )
      throw new ForbiddenError('An Admin reason is required to confirm before full payment');
    const before = enrollment.enrollmentStatus;
    enrollment.enrollmentStatus = 'confirmed';
    enrollment.history.push({
      type: 'confirmed',
      actor: actor.id,
      at: new Date().toISOString(),
      from: before,
      to: 'confirmed',
      note: reason.trim() || undefined,
    });
    recordMockAudit(db, actor.id, 'enrollment.confirmed', id);
    writeMockDb(db);
    return enrollment;
  },
  async cancelEnrollment(id: string, reason: string) {
    const actor = await staff();
    if (reason.trim().length < 3) throw new Error('Cancellation reason required');
    const db = readMockDb();
    const enrollment = db.enrollments.find((item) => item.id === id);
    if (!enrollment) throw new Error('Enrollment not found');
    const before = enrollment.enrollmentStatus;
    enrollment.enrollmentStatus = 'cancelled';
    enrollment.cancelledReason = reason.trim();
    enrollment.history.push({
      type: 'cancelled',
      actor: actor.id,
      at: new Date().toISOString(),
      from: before,
      to: 'cancelled',
      note: reason.trim(),
    });
    recordMockAudit(db, actor.id, 'enrollment.cancelled', id);
    writeMockDb(db);
    return enrollment;
  },
  async logContact(id: string, setContacted = false) {
    const actor = await staff();
    if (setContacted && !hasPermission(actor, 'updateFollowUp'))
      throw new ForbiddenError('Follow-up permission required');
    const db = readMockDb();
    const enrollment = db.enrollments.find((item) => item.id === id);
    if (!enrollment) throw new Error('Enrollment not found');
    enrollment.history.push({
      type: 'whatsapp_contact_logged',
      actor: actor.id,
      at: new Date().toISOString(),
    });
    if (setContacted) {
      const before = enrollment.followUpStatus;
      enrollment.followUpStatus = 'contacted';
      enrollment.history.push({
        type: 'follow_up',
        actor: actor.id,
        at: new Date().toISOString(),
        from: before,
        to: 'contacted',
      });
    }
    recordMockAudit(db, actor.id, 'enrollment.contact_logged', id);
    writeMockDb(db);
    return enrollment;
  },
};
