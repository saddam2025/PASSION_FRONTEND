import type { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import type { CourseDetails } from '@/schemas/course';
import { BilingualTextField } from '../BilingualFields';
type Props = {
  details: CourseDetails;
  setDetails: Dispatch<SetStateAction<CourseDetails>>;
  pending: boolean;
  admin: boolean;
};
export function CourseEnrollmentPanel({ details, setDetails, pending, admin }: Props) {
  const { t } = useTranslation('courses');
  return (
    <>
      <article
        id="enrollment"
        className="grid gap-3 rounded-md border border-border bg-surface p-5"
      >
        <h2 className="font-bold">{t('sections.enrollment')}</h2>
        <label className="flex min-h-11 items-center gap-3">
          <input
            type="checkbox"
            disabled={pending}
            checked={details.enrollment.registrationOpen}
            onChange={(event) =>
              setDetails((current) => ({
                ...current,
                enrollment: { ...current.enrollment, registrationOpen: event.target.checked },
              }))
            }
          />
          {t('registrationOpen')}
        </label>
        <label className="grid gap-1 text-sm">
          {t('capacity')}
          <input
            type="number"
            min="1"
            disabled={pending}
            className="min-h-11 rounded-sm border border-border px-3"
            value={details.enrollment.capacity ?? ''}
            onChange={(event) =>
              setDetails((current) => ({
                ...current,
                enrollment: {
                  ...current.enrollment,
                  capacity: event.target.value ? Number(event.target.value) : null,
                },
              }))
            }
          />
        </label>
        <label className="grid gap-1 text-sm">
          {t('registrationDeadline')}
          <input
            type="date"
            disabled={pending}
            className="min-h-11 rounded-sm border border-border px-3"
            value={details.enrollment.registrationDeadline ?? ''}
            onChange={(event) =>
              setDetails((current) => ({
                ...current,
                enrollment: { ...current.enrollment, registrationDeadline: event.target.value },
              }))
            }
          />
        </label>
      </article>
      <article
        id="accreditation"
        className="grid gap-4 rounded-md border border-border bg-surface p-5"
      >
        <h2 className="font-bold">{t('sections.accreditation')}</h2>
        <p className="text-sm text-warning">{t('verifyClaims')}</p>
        <BilingualTextField
          label={t('certificateType')}
          value={details.accreditation.certificateType ?? { ar: '', en: '' }}
          disabled={pending}
          onChange={(value) =>
            setDetails((current) => ({
              ...current,
              accreditation: { ...current.accreditation, certificateType: value },
            }))
          }
        />
        <BilingualTextField
          label={t('accreditationStatement')}
          value={details.accreditation.statement ?? { ar: '', en: '' }}
          disabled={pending}
          multiline
          onChange={(value) =>
            setDetails((current) => ({
              ...current,
              accreditation: { ...current.accreditation, statement: value },
            }))
          }
        />
        <BilingualTextField
          label={t('accreditingBody')}
          value={details.accreditation.accreditingBody ?? { ar: '', en: '' }}
          disabled={pending}
          onChange={(value) =>
            setDetails((current) => ({
              ...current,
              accreditation: { ...current.accreditation, accreditingBody: value },
            }))
          }
        />
        <label className="flex min-h-11 items-center gap-3">
          <input
            type="checkbox"
            disabled={pending || !admin}
            checked={details.accreditation.verifiedByAcademy}
            onChange={(event) =>
              setDetails((current) => ({
                ...current,
                accreditation: {
                  ...current.accreditation,
                  verifiedByAcademy: event.target.checked,
                },
              }))
            }
          />
          {t('verifiedByAcademy')}
        </label>
        {!admin && <p className="text-xs text-muted">{t('adminOnly')}</p>}
      </article>
    </>
  );
}
