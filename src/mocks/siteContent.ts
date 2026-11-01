// MOCK: remove in batch A4
import type { SiteContent } from '@/services/siteContent';
export const mockSiteContent: SiteContent = {
  homeSections: [
    {
      id: 'hero',
      type: 'hero',
      visible: true,
      order: 0,
      content: {
        title: { ar: 'مكان تتعلم فيه وتطوّر مهاراتك', en: 'A space to learn and grow' },
        intro: {
          ar: 'شوف البرامج المتاحة واختار اللي يناسبك.',
          en: 'Explore available learning programs and choose what fits you.',
        },
      },
    },
    {
      id: 'about',
      type: 'about',
      visible: true,
      order: 1,
      content: {
        title: { ar: 'عن الأكاديمية', en: 'About the academy' },
        text: {
          ar: 'اتعرف على البرامج والمحتوى المتاح عبر المنصة.',
          en: 'Explore the programs and information available on this platform.',
        },
        highlights: [],
      },
    },
    { id: 'trust', type: 'trustStrip', visible: true, order: 2, content: { items: [] } },
    {
      id: 'featured',
      type: 'featuredCourses',
      visible: true,
      order: 3,
      content: { title: { ar: 'الكورسات المتاحة', en: 'Available courses' } },
    },
    {
      id: 'why',
      type: 'whyUs',
      visible: true,
      order: 4,
      content: {
        title: { ar: 'هتلاقي إيه هنا؟', en: 'What you will find here' },
        items: [
          {
            title: { ar: 'محتوى واضح', en: 'Clear information' },
            text: {
          ar: 'هتلاقي تفاصيل البرامج عشان تختار اللي يناسبك.',
              en: 'Program details are presented to help you choose.',
            },
          },
        ],
      },
    },
    {
      id: 'steps',
      type: 'howItWorks',
      visible: true,
      order: 5,
      content: {
        title: { ar: 'خطوات التسجيل', en: 'Registration steps' },
        steps: [
          { ar: 'اختار الكورس اللي يناسبك.', en: 'Choose a course.' },
          { ar: 'سجّل دلوقتي.', en: 'ابعت the registration request.' },
          {
            ar: 'هنتواصل معاك على واتساب في أقرب وقت.',
            en: 'Continue with an academy assistant on WhatsApp.',
          },
          { ar: 'الدفع بيتم بالتنسيق مع مساعد الأكاديمية.', en: 'Arrange payment with the assistant.' },
          {
            ar: 'هتلاقي تفاصيل الكورس بعد ما يتأكد مكانك.',
            en: 'Receive course details after confirmation.',
          },
        ],
      },
    },
    { id: 'instructor', type: 'instructor', visible: false, order: 6, content: {} },
    { id: 'accreditation', type: 'accreditation', visible: true, order: 7, content: { items: [] } },
    { id: 'testimonials', type: 'testimonials', visible: true, order: 8, content: { items: [] } },
    { id: 'gallery', type: 'gallery', visible: true, order: 9, content: { items: [] } },
    {
      id: 'faq',
      type: 'faq',
      visible: true,
      order: 10,
      content: {
        title: { ar: 'أسئلة شائعة', en: 'Frequently asked questions' },
        items: [
          {
            question: { ar: 'كيف أبدأ؟', en: 'How do I get started?' },
            answer: {
              ar: 'اختار كورس وابعت طلب التسجيل.',
              en: 'Choose a course, then submit a registration request.',
            },
          },
        ],
      },
    },
    {
      id: 'contact',
      type: 'contact',
      visible: true,
      order: 11,
      content: { title: { ar: 'تواصل معنا', en: 'Contact us' } },
    },
  ],
  privacy: [
    {
      heading: { ar: 'البيانات التي تقدمها', en: 'Information you provide' },
      paragraphs: [
        {
          ar: 'تُستخدم المعلومات التي ترسلها للرد على طلبك ومتابعته. تُستكمل هذه المسودة بمراجعة قانونية قبل النشر.',
          en: 'Information you submit is used to respond to and follow up on your request. This draft needs legal review before publication.',
        },
      ],
    },
  ],
};
