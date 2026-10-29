import type { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import type { CourseDetails, CourseRecord } from '@/schemas/course';
import { Button } from '@/components/ui/Button';
import { mockCourseCategories } from '@/mocks/categories';
import { BilingualRichField, BilingualTextField } from '../BilingualFields';
import { ImagePickerField } from '../ImagePickerField';

type Props = {
  details: CourseDetails;
  setDetails: Dispatch<SetStateAction<CourseDetails>>;
  pending: boolean;
  language: 'ar' | 'en';
  course: CourseRecord;
};
export function CourseBasicsPanel({ details, setDetails, pending, language, course }: Props) {
  const { t } = useTranslation('courses');
  const updateText = (key: 'title' | 'shortDescription', value: string) =>
    setDetails((current) => ({ ...current, [key]: { ...current[key], [language]: value } }));
  return (
    <>
      <article id="basics" className="grid gap-4 rounded-md border border-border bg-surface p-5">
        <h2 className="text-lg font-bold">{t('sections.basics')}</h2>
        <label className="grid gap-1 text-sm">
          {t(language === 'ar' ? 'titleAr' : 'titleEn')}
          <input
            disabled={pending}
            className="min-h-11 rounded-sm border border-border px-3"
            value={details.title[language]}
            onChange={(event) => updateText('title', event.target.value)}
          />
        </label>
        <label className="grid gap-1 text-sm">
          {t('slug')}
          <input
            disabled={pending}
            dir="ltr"
            className="min-h-11 rounded-sm border border-border px-3"
            value={details.slug}
            onChange={(event) =>
              setDetails((current) => ({ ...current, slug: event.target.value }))
            }
          />
        </label>
        {course.publishedVersion > 0 && details.slug !== course.details.slug && (
          <p className="text-sm text-warning">{t('slugRedirectNotice')}</p>
        )}
        {course.slugHistory.length > 0 && (
          <p className="text-xs text-muted">
            {t('slugHistory')}: {course.slugHistory.join(', ')}
          </p>
        )}
        <label className="grid gap-1 text-sm">
          {t(language === 'ar' ? 'descriptionAr' : 'descriptionEn')}
          <textarea
            disabled={pending}
            className="min-h-28 rounded-sm border border-border px-3 py-2"
            value={details.shortDescription[language]}
            onChange={(event) => updateText('shortDescription', event.target.value)}
          />
        </label>
        <label className="grid gap-1 text-sm">
          {t('category')}
          <select
            disabled={pending}
            className="min-h-11 rounded-sm border border-border px-3"
            value={details.category}
            onChange={(event) =>
              setDetails((current) => ({ ...current, category: event.target.value }))
            }
          >
            <option value="">{t('chooseCategory')}</option>
            {mockCourseCategories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <BilingualRichField
          label={t('targetAudience')}
          value={details.targetAudience}
          disabled={pending}
          onChange={(value) => setDetails((current) => ({ ...current, targetAudience: value }))}
        />
      </article>
      <article
        id="instructor"
        className="grid gap-4 rounded-md border border-border bg-surface p-5"
      >
        <h2 className="font-bold">{t('sections.instructor')}</h2>
        <BilingualTextField
          label={t('instructorName')}
          value={details.instructor.name}
          disabled={pending}
          onChange={(value) =>
            setDetails((current) => ({
              ...current,
              instructor: { ...current.instructor, name: value },
            }))
          }
        />
        <BilingualTextField
          label={t('instructorTitle')}
          value={details.instructor.title ?? { ar: '', en: '' }}
          disabled={pending}
          onChange={(value) =>
            setDetails((current) => ({
              ...current,
              instructor: { ...current.instructor, title: value },
            }))
          }
        />
        <BilingualRichField
          label={t('instructorBio')}
          value={details.instructor.bio}
          disabled={pending}
          onChange={(value) =>
            setDetails((current) => ({
              ...current,
              instructor: { ...current.instructor, bio: value },
            }))
          }
        />
        {details.instructor.photo && (
          <ImagePickerField
            label={t('instructorPhoto')}
            value={details.instructor.photo}
            disabled={pending}
            onChange={(value) =>
              setDetails((current) => ({
                ...current,
                instructor: { ...current.instructor, photo: value },
              }))
            }
          />
        )}
        {!details.instructor.photo && (
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() =>
              setDetails((current) => ({
                ...current,
                instructor: { ...current.instructor, photo: current.coverImage },
              }))
            }
          >
            {t('addInstructorPhoto')}
          </Button>
        )}
      </article>
      <article id="media" className="grid gap-4 rounded-md border border-border bg-surface p-5">
        <h2 className="font-bold">{t('sections.media')}</h2>
        <ImagePickerField
          label={t('coverImage')}
          value={details.coverImage}
          disabled={pending}
          onChange={(value) => setDetails((current) => ({ ...current, coverImage: value }))}
        />
        {details.gallery?.map((image, index) => (
          <ImagePickerField
            key={`${image.src}-${index}`}
            label={t('galleryImage', { index: index + 1 })}
            value={image}
            disabled={pending}
            onChange={(value) =>
              setDetails((current) => ({
                ...current,
                gallery: current.gallery?.map((entry, itemIndex) =>
                  itemIndex === index ? value : entry,
                ),
              }))
            }
          />
        ))}
        <button
          type="button"
          disabled={pending || (details.gallery?.length ?? 0) >= 24}
          className="min-h-11 justify-self-start rounded-sm border border-border px-4 text-sm"
          onClick={() =>
            setDetails((current) => ({
              ...current,
              gallery: [
                ...(current.gallery ?? []),
                { src: current.coverImage.src, alt: { ar: '', en: '' }, decorative: false },
              ],
            }))
          }
        >
          {t('addGalleryImage')}
        </button>
      </article>
    </>
  );
}
