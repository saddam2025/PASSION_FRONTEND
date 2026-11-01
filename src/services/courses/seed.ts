import type { Course, Snapshot } from '@/schemas/course';
import { createTemplatePageConfig } from './templates';

function createSnapshot(params: {
  title: { ar: string; en: string };
  shortDescription: { ar: string; en: string };
  category: string;
  price: number | null;
  promo?: number | null;
  registrationOpen?: boolean;
  startDate?: string;
  duration?: { ar: string; en: string };
  instructorName?: { ar: string; en: string };
  verifiedAccreditation?: boolean;
}): Snapshot {
  const page = createTemplatePageConfig('full', params.title);

  return {
    details: {
      title: params.title,
      shortDescription: params.shortDescription,
      category: params.category,
      instructor: {
        name: params.instructorName ?? { ar: 'د. هاني الشامي', en: 'Dr. Hany Elshamy' },
        title: { ar: 'مدرب معتمد وخبير', en: 'Master Certified Coach' },
      },
      coverImage: {
        src: '/images/course-cover-default.webp',
        alt: params.title,
        decorative: false,
      },
      delivery: {
        method: 'online',
        location: { ar: 'أونلاين ببث مباشر وتفاعلي', en: 'Live Interactive Online' },
        attendanceNotes: { ar: 'جلسات أسبوعية تفاعلية ومسجلة', en: 'Recorded weekly live sessions' },
      },
      schedule: {
        startDate: params.startDate ?? '2026-11-15',
        endDate: '2026-12-30',
        scheduleText: { ar: 'أيام السبت والثلاثاء 7:00 مساءً', en: 'Saturdays & Tuesdays at 7:00 PM' },
        duration: params.duration ?? { ar: '6 أسابيع (36 ساعة تدريبية)', en: '6 weeks (36 training hours)' },
      },
      pricing: {
        price: params.price,
        promo: params.promo ?? null,
        currency: 'EGP',
        contactUs: params.price === null,
      },
      enrollment: {
        registrationOpen: params.registrationOpen ?? true,
        capacity: 25,
      },
      accreditation: {
        text: { ar: 'شهادة حضور معتمدة من أكاديمية شغف', en: 'Accredited certificate from Passion Academy' },
        verifiedByAcademy: params.verifiedAccreditation ?? false,
      },
      whatsappOverrides: {
        number: '+201000000000',
        messageTemplate: {
          ar: 'أهلًا {name}، بخصوص التسجيل في كورس {course}، رقم الطلب {reference}.',
          en: 'Hello, I would like to inquire about and register for {{courseTitle}}.',
        },
      },
    },
    page,
    form: {
      fields: [
        {
          id: 'experience-level',
          type: 'select',
          label: { ar: 'مستوى الخبرة', en: 'Experience Level' },
          required: false,
          options: [
            { value: 'beginner', label: { ar: 'مبتدئ', en: 'Beginner' } },
            { value: 'intermediate', label: { ar: 'متوسط', en: 'Intermediate' } },
            { value: 'advanced', label: { ar: 'متقدم', en: 'Advanced' } },
          ],
        },
      ],
    },
    seo: {
      title: params.title,
      description: params.shortDescription,
    },
  };
}

export function createSeedCourses(): Course[] {
  const now = new Date().toISOString();
  const pastDay = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const pastTwoDays = new Date(Date.now() - 48 * 3600 * 1000).toISOString();

  // 1. Published course with unpublished changes
  const seed1Published = createSnapshot({
    title: { ar: 'القيادة التنفيذية الفعالة', en: 'Executive Leadership' },
    shortDescription: {
      ar: 'برنامج عملي يساعدك تطور مهارات القيادة وإدارة فرق العمل.',
      en: 'A practical training program in executive leadership and team management.',
    },
    category: 'إدارة',
    price: 1200000,
    promo: 950000,
    registrationOpen: true,
    verifiedAccreditation: true,
  });

  const seed1Draft: Snapshot = {
    ...seed1Published,
    details: {
      ...seed1Published.details,
      title: { ar: 'القيادة التنفيذية والتأثير المؤسسي', en: 'Executive Leadership & Influence' },
      shortDescription: {
        ar: 'برنامج عملي متقدم يساعدك تطور مهارات القيادة والتأثير المؤسسي واتخاذ القرار.',
        en: 'Advanced practical program in leadership skills, organizational influence and decision-making.',
      },
    },
  };

  const course1: Course = {
    id: 'course-seed-001',
    slug: 'executive-leadership',
    slugHistory: [],
    status: 'published',
    featured: true,
    createdBy: 'user-admin-001',
    createdAt: pastTwoDays,
    updatedAt: now,
    version: 2,
    publishedVersion: 1,
    published: seed1Published,
    draft: seed1Draft,
    review: { state: 'none' },
    versions: [
      {
        version: 1,
        snapshot: seed1Published,
        publishedBy: 'user-admin-001',
        publishedAt: pastDay,
      },
    ],
  };

  // 2. Pending review (Assistant submitted)
  const seed2Draft = createSnapshot({
    title: { ar: 'مهارات التواصل والإقناع', en: 'Communication & Persuasion Skills' },
    shortDescription: {
      ar: 'اتعلم مهارات الحوار الفعّال وبناء علاقات مهنية قوية.',
      en: 'Master effective dialogue and build strong professional relationships.',
    },
    category: 'تواصل',
    price: 450000,
    promo: null,
    registrationOpen: false,
    verifiedAccreditation: false,
  });

  const course2: Course = {
    id: 'course-seed-002',
    slug: 'communication-skills',
    slugHistory: [],
    status: 'draft',
    featured: false,
    createdBy: 'user-assistant-001',
    createdAt: pastDay,
    updatedAt: now,
    version: 1,
    publishedVersion: 0,
    published: null,
    draft: seed2Draft,
    review: {
      state: 'pending',
      submittedBy: 'user-assistant-001',
      submittedAt: pastDay,
    },
    versions: [],
  };

  // 3. Rejected course
  const seed3Draft = createSnapshot({
    title: { ar: 'مقدمة في الكوتشينج الشخصي', en: 'Introduction to Personal Coaching' },
    shortDescription: {
      ar: 'كورس تأسيسي تتعرف فيه على أدوات ومبادئ الكوتشينج الشخصي والمهني.',
      en: 'Foundational course exploring personal and executive coaching tools.',
    },
    category: 'التدريب الشخصي',
    price: 600000,
    promo: null,
    registrationOpen: false,
    verifiedAccreditation: false,
  });

  const course3: Course = {
    id: 'course-seed-003',
    slug: 'personal-coaching',
    slugHistory: [],
    status: 'draft',
    featured: false,
    createdBy: 'user-assistant-001',
    createdAt: pastTwoDays,
    updatedAt: pastDay,
    version: 1,
    publishedVersion: 0,
    published: null,
    draft: seed3Draft,
    review: {
      state: 'rejected',
      submittedBy: 'user-assistant-001',
      submittedAt: pastTwoDays,
      reviewedBy: 'user-admin-001',
      reviewedAt: pastDay,
      reason: 'من فضلك كمّل محاور المنهج وحدد المواعيد بدقة قبل ما تبعت الطلب تاني.',
    },
    versions: [],
  };

  // 4. Clean Draft
  const seed4Draft = createSnapshot({
    title: { ar: 'أساسيات الذكاء العاطفي', en: 'Emotional Intelligence Basics' },
    shortDescription: {
      ar: 'افهم مشاعرك واتعلم تديرها وتطوّر تواصلك مع نفسك واللي حواليك.',
      en: 'Understanding and managing emotions to develop positive relationships.',
    },
    category: 'تطوير الذات',
    price: 350000,
    promo: 290000,
    registrationOpen: false,
    verifiedAccreditation: false,
  });

  const course4: Course = {
    id: 'course-seed-004',
    slug: 'emotional-intelligence',
    slugHistory: [],
    status: 'draft',
    featured: false,
    createdBy: 'user-admin-001',
    createdAt: now,
    updatedAt: now,
    version: 1,
    publishedVersion: 0,
    published: null,
    draft: seed4Draft,
    review: { state: 'none' },
    versions: [],
  };

  // 5. Archived course
  const seed5Snapshot = createSnapshot({
    title: { ar: 'إدارة فرق العمل عن بُعد', en: 'Remote Team Management' },
    shortDescription: {
      ar: 'اتعلم أدوات واستراتيجيات قيادة الفرق عن بُعد وإدارتها بفاعلية.',
      en: 'Tools and strategies for leading and managing distributed digital teams.',
    },
    category: 'إدارة',
    price: 500000,
    promo: null,
    registrationOpen: false,
    verifiedAccreditation: false,
  });

  const course5: Course = {
    id: 'course-seed-005',
    slug: 'remote-team-management',
    slugHistory: [],
    status: 'archived',
    featured: false,
    createdBy: 'user-admin-001',
    createdAt: pastTwoDays,
    updatedAt: pastDay,
    version: 1,
    publishedVersion: 1,
    published: seed5Snapshot,
    draft: seed5Snapshot,
    review: { state: 'none' },
    versions: [
      {
        version: 1,
        snapshot: seed5Snapshot,
        publishedBy: 'user-admin-001',
        publishedAt: pastTwoDays,
      },
    ],
  };

  return clearEnglishContent([course1, course2, course3, course4, course5]);
}

function clearEnglishContent<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => clearEnglishContent(item)) as T;
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key !== 'en')
      .map(([key, child]) => [key, clearEnglishContent(child)]),
  ) as T;
}
