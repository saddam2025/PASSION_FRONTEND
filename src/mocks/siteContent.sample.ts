// MOCK: remove in batch A4
import type { HomeSection } from '@/services/siteContent';
export const sampleSections: HomeSection[] = [
  {
    id: 'sample-stats',
    type: 'trustStrip',
    visible: true,
    order: 2,
    content: {
      items: [
        { label: { ar: 'مثال توضيحي', en: 'Illustrative sample' }, value: '12', sample: true },
      ],
    },
  },
  {
    id: 'sample-accreditation',
    type: 'accreditation',
    visible: true,
    order: 7,
    content: {
      items: [
        {
          name: { ar: 'اعتماد تجريبي', en: 'Sample accreditation' },
          description: {
            ar: 'بيانات تجريبية للمعاينة فقط وليست اعتماداً حقيقياً.',
            en: 'Preview data only; this is not a real accreditation.',
          },
          sample: true,
        },
      ],
    },
  },
  {
    id: 'sample-testimonials',
    type: 'testimonials',
    visible: true,
    order: 8,
    content: {
      items: [
        {
          quote: { ar: 'نص تجريبي للمعاينة فقط.', en: 'Sample quote for preview only.' },
          author: { ar: 'اسم تجريبي', en: 'Sample author' },
          sample: true,
        },
      ],
    },
  },
  {
    id: 'sample-gallery',
    type: 'gallery',
    visible: true,
    order: 9,
    content: {
      items: [1, 2, 3].map((n) => ({
        src: `/images/gallery-${n}.webp`,
        alt: { ar: 'صورة تجريبية للمعاينة', en: 'Sample preview image' },
        sample: true,
      })),
    },
  },
];
