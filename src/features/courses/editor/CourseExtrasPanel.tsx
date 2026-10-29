import type { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import type { CourseDetails } from '@/schemas/course';
import { BilingualRichField, BilingualTextField } from '../BilingualFields';
import { ImagePickerField } from '../ImagePickerField';
import { Button } from '@/components/ui/Button';
type Props = {
  details: CourseDetails;
  setDetails: Dispatch<SetStateAction<CourseDetails>>;
  pending: boolean;
};
export function CourseExtrasPanel({ details, setDetails, pending }: Props) {
  const { t } = useTranslation('courses');
  return (
    <>
      <article
        id="requirements"
        className="grid gap-4 rounded-md border border-border bg-surface p-5"
      >
        <h2 className="font-bold">{t('sections.requirements')}</h2>
        <BilingualRichField
          label={t('requirements')}
          value={details.requirements}
          disabled={pending}
          onChange={(value) => setDetails((current) => ({ ...current, requirements: value }))}
        />
      </article>
      <article
        id="registrationForm"
        className="grid gap-3 rounded-md border border-border bg-surface p-5"
      >
        <h2 className="font-bold">{t('sections.registrationForm')}</h2>
        <p className="text-sm text-muted">{t('coreFormFields')}</p>
        {details.registrationForm.fields.map((field, index) => (
          <div key={field.id} className="grid gap-3 rounded-sm border border-border p-3">
            <BilingualTextField
              label={t('fieldLabel', { index: index + 1 })}
              value={field.label}
              disabled={pending}
              onChange={(value) =>
                setDetails((current) => ({
                  ...current,
                  registrationForm: {
                    fields: current.registrationForm.fields.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, label: value } : entry,
                    ),
                  },
                }))
              }
            />
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() =>
                setDetails((current) => ({
                  ...current,
                  registrationForm: {
                    fields: current.registrationForm.fields.filter(
                      (_, entryIndex) => entryIndex !== index,
                    ),
                  },
                }))
              }
            >
              {t('removeField')}
            </Button>
          </div>
        ))}
        <Button
          variant="secondary"
          disabled={pending || details.registrationForm.fields.length >= 12}
          onClick={() =>
            setDetails((current) => ({
              ...current,
              registrationForm: {
                fields: [
                  ...current.registrationForm.fields,
                  {
                    id: `custom-${Date.now()}`,
                    type: 'text' as const,
                    label: { ar: '', en: '' },
                    required: false,
                  },
                ],
              },
            }))
          }
        >
          {t('addTextField')}
        </Button>
      </article>
      <article id="contact" className="grid gap-4 rounded-md border border-border bg-surface p-5">
        <h2 className="font-bold">{t('sections.contact')}</h2>
        <label className="grid gap-1 text-sm">
          {t('whatsappOverride')}
          <input
            dir="ltr"
            disabled={pending}
            className="min-h-11 rounded-sm border border-border px-3"
            value={details.contact.whatsappNumberOverride ?? ''}
            onChange={(event) =>
              setDetails((current) => ({
                ...current,
                contact: { ...current.contact, whatsappNumberOverride: event.target.value },
              }))
            }
          />
        </label>
        <BilingualTextField
          label={t('whatsappTemplate')}
          multiline
          value={details.contact.whatsappMessageTemplate ?? { ar: '', en: '' }}
          disabled={pending}
          onChange={(value) =>
            setDetails((current) => ({
              ...current,
              contact: { ...current.contact, whatsappMessageTemplate: value },
            }))
          }
        />
      </article>
      <article id="seo" className="grid gap-4 rounded-md border border-border bg-surface p-5">
        <h2 className="font-bold">{t('sections.seo')}</h2>
        <BilingualTextField
          label={t('seoTitle')}
          value={details.seo.title ?? { ar: '', en: '' }}
          disabled={pending}
          onChange={(value) =>
            setDetails((current) => ({ ...current, seo: { ...current.seo, title: value } }))
          }
        />
        <BilingualTextField
          label={t('seoDescription')}
          multiline
          value={details.seo.description ?? { ar: '', en: '' }}
          disabled={pending}
          onChange={(value) =>
            setDetails((current) => ({ ...current, seo: { ...current.seo, description: value } }))
          }
        />
        {details.seo.ogImage && (
          <ImagePickerField
            label={t('ogImage')}
            value={details.seo.ogImage}
            disabled={pending}
            onChange={(value) =>
              setDetails((current) => ({ ...current, seo: { ...current.seo, ogImage: value } }))
            }
          />
        )}
        {!details.seo.ogImage && (
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() =>
              setDetails((current) => ({
                ...current,
                seo: { ...current.seo, ogImage: current.coverImage },
              }))
            }
          >
            {t('addOgImage')}
          </Button>
        )}
      </article>
    </>
  );
}
