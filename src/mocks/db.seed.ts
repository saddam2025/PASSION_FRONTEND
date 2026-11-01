// MOCK: seed data for the browser-persisted workflow store.
import { mockCourseRecords } from './courses';
import type { MockCourseRecord, MockDatabase } from './db';
import { CourseDetailsSchema } from '@/schemas/course';
import { PageConfigSchema } from '@/schemas/sections';
import type { Revision } from '@/schemas/revision';
import type { Lead, Enrollment } from '@/schemas/lead';
import type { BilingualRichText } from '@/schemas/sections';
import { clearEnglishContent } from './arabicOnly';

const emptyRich: BilingualRichText = { ar: [], en: [] };
export function createInitialMockDatabase(): MockDatabase {
  const now = new Date().toISOString();
  const baseCourses: MockCourseRecord[] = mockCourseRecords.map((course) => ({
    id: course.id,
    slug: course.slug,
    details: CourseDetailsSchema.parse({
      title: course.title,
      slug: course.slug,
      category: course.category.ar,
      shortDescription: course.shortDescription,
      featured: course.featured,
      targetAudience: emptyRich,
      instructor: { name: course.instructorName, title: { ar: '', en: '' }, bio: emptyRich },
      coverImage: course.coverImage,
      delivery: {
        method: 'online',
        location: { ar: '', en: '' },
        attendanceNotes: { ar: '', en: '' },
      },
      schedule: {
        startDate: course.startDate,
        endDate: '',
        scheduleText: { ar: '', en: '' },
        duration: course.duration,
      },
      pricing: {
        price: course.price,
        contactUs: course.price === null,
        promoPrice: course.promoPrice,
        currency: course.currency as 'EGP',
        paymentInstructions: emptyRich,
        paymentMethods: [],
      },
      enrollment: {
        registrationOpen: course.registrationOpen,
        capacity: null,
        registrationDeadline: '',
      },
      accreditation: {
        certificateType: { ar: '', en: '' },
        statement: { ar: '', en: '' },
        accreditingBody: { ar: '', en: '' },
        verifiedByAcademy: false,
      },
      requirements: emptyRich,
      registrationForm: course.formDefinition,
      contact: { whatsappMessageTemplate: course.whatsappMessageTemplate },
      seo: { title: course.title, description: course.shortDescription },
    }),
    pageConfig: PageConfigSchema.parse(course.pageConfig),
    status: 'published' as const,
    publishedVersion: 1,
    slugHistory: [],
    createdAt: now,
    updatedAt: now,
  }));
  const draftCourse: MockCourseRecord = {
    ...baseCourses[0]!,
    id: 'mock-course-draft',
    status: 'draft',
    publishedVersion: 0,
    slugHistory: [],
    createdAt: now,
    updatedAt: now,
    details: {
      ...baseCourses[0]!.details,
      title: { ar: 'مسودة كورس تجريبية', en: 'Sample draft course' },
      slug: 'sample-draft-course',
    },
  };
  const reviewCourse: MockCourseRecord = {
    ...baseCourses[0]!,
    id: 'mock-course-review',
    status: 'pending_review',
    publishedVersion: 0,
    slugHistory: [],
    createdAt: now,
    updatedAt: now,
    details: {
      ...baseCourses[0]!.details,
      title: { ar: 'كورس قيد المراجعة', en: 'الكورس awaiting review' },
      slug: 'course-awaiting-review',
    },
  };
  const archivedCourse: MockCourseRecord = {
    ...baseCourses[1]!,
    id: 'mock-course-archived',
    status: 'archived',
    slugHistory: [],
    createdAt: now,
    updatedAt: now,
    details: {
      ...baseCourses[1]!.details,
      title: { ar: 'كورس مؤرشفة تجريبية', en: 'Sample archived course' },
      slug: 'sample-archived-course',
    },
  };
  const courses: MockCourseRecord[] = clearEnglishContent([
    baseCourses[0]!,
    baseCourses[1]!,
    draftCourse,
    reviewCourse,
    archivedCourse,
  ]);
  const sampleRevision: Revision = {
    id: 'mock-revision-pending',
    courseId: baseCourses[0]!.id,
    kind: 'update',
    status: 'pending_review',
    authorId: 'mock-assistant-001',
    baseVersion: 1,
    createdAt: now,
    submittedAt: now,
    snapshot: { details: baseCourses[0]!.details, pageConfig: baseCourses[0]!.pageConfig },
    summary: { detailsChanged: 0, sectionsChanged: 0 },
  };
  const newCourseRevision: Revision = {
    ...sampleRevision,
    id: 'mock-revision-new-course',
    courseId: reviewCourse.id,
    kind: 'new_course',
    snapshot: { details: reviewCourse.details, pageConfig: reviewCourse.pageConfig },
  };
  const sampleLead: Lead = {
    id: 'mock-lead-course-enrollment',
    fullName: 'Mock الكورس Learner',
    email: 'learner@example.test',
    phone: '+201000000000',
    phoneNormalized: '+201000000000',
    createdAt: now,
    consent: { acceptedAt: now, policyVersion: 1 },
    attribution: {},
    isDemo: true,
  };
  const sampleEnrollment: Enrollment = {
    id: 'mock-enrollment-course',
    reference: 'PAS-234567',
    leadId: sampleLead.id,
    courseId: baseCourses[0]!.id,
    courseSnapshot: { title: baseCourses[0]!.details.title, slug: baseCourses[0]!.slug },
    priceSnapshot: { amount: baseCourses[0]!.details.pricing.price, currency: 'EGP' },
    formSnapshot: { fields: [] },
    answers: {},
    enrollmentStatus: 'pending',
    followUpStatus: 'new',
    registeredAt: now,
    idempotencyKey: 'mock-enrollment-seed',
    history: [],
    isDemo: true,
  };
  return {
    schemaVersion: 2,
    courses: courses.map((course, index) =>
      index === 1 ? { ...course, slugHistory: ['learning-basics-old'] } : course,
    ),
    revisions: [sampleRevision, newCourseRevision],
    notifications: [
      {
        id: 'mock-notification-pending-course',
        type: 'course_submitted',
        entityId: sampleRevision.id,
        courseId: baseCourses[0]!.id,
        recipientRole: 'admin',
        createdAt: now,
        readAt: null,
      },
      {
        id: 'mock-notification-new-course',
        type: 'course_submitted',
        entityId: newCourseRevision.id,
        courseId: reviewCourse.id,
        recipientRole: 'admin',
        createdAt: now,
        readAt: null,
      },
    ],
    audit: [],
    leads: [sampleLead],
    enrollments: [sampleEnrollment],
    payments: [],
    users: [],
    invites: [],
    resetTokens: [],
    notes: [],
    alreadyRegisteredRefs: [],
    demoIds: { leads: [], enrollments: [], payments: [] },
    settings: {
      version: 1,
      policyVersion: 1,
      values: {
        categories: {
          items: [...new Set(baseCourses.map((course) => course.details.category))].map((name) => ({ name: { ar: name, en: '' }, active: true })),
        },
      },
    },
  };
}
