import type { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import type { CourseDetails } from '@/schemas/course';
import { BilingualRichField, BilingualTextField } from '../BilingualFields';
type Props = {
  details: CourseDetails;
  setDetails: Dispatch<SetStateAction<CourseDetails>>;
  pending: boolean;
};
export function CourseSchedulePricingPanel({ details, setDetails, pending }: Props) {
  const { t } = useTranslation('courses');
  return (
    <>
      <article id="schedule" className="grid gap-4 rounded-md border border-border bg-surface p-5">
        <h2 className="font-bold">{t('sections.schedule')}</h2>
        <label className="grid gap-1 text-sm">
          {t('deliveryMethod')}
          <select
            disabled={pending}
            className="min-h-11 rounded-sm border border-border px-3"
            value={details.delivery.method}
            onChange={(event) =>
              setDetails((current) => ({
                ...current,
                delivery: {
                  ...current.delivery,
                  method: event.target.value as typeof current.delivery.method,
                },
              }))
            }
          >
            <option value="online">{t('online')}</option>
            <option value="in_person">{t('inPerson')}</option>
            <option value="hybrid">{t('hybrid')}</option>
          </select>
        </label>
        <BilingualTextField
          label={t('location')}
          value={details.delivery.location ?? { ar: '', en: '' }}
          disabled={pending}
          onChange={(value) =>
            setDetails((current) => ({
              ...current,
              delivery: { ...current.delivery, location: value },
            }))
          }
        />
        <BilingualTextField
          label={t('attendanceNotes')}
          value={details.delivery.attendanceNotes ?? { ar: '', en: '' }}
          disabled={pending}
          multiline
          onChange={(value) =>
            setDetails((current) => ({
              ...current,
              delivery: { ...current.delivery, attendanceNotes: value },
            }))
          }
        />
        <label className="grid gap-1 text-sm">
          {t('startDate')}
          <input
            type="date"
            disabled={pending}
            className="min-h-11 rounded-sm border border-border px-3"
            value={details.schedule.startDate ?? ''}
            onChange={(event) =>
              setDetails((current) => ({
                ...current,
                schedule: { ...current.schedule, startDate: event.target.value },
              }))
            }
          />
        </label>
        <label className="grid gap-1 text-sm">
          {t('endDate')}
          <input
            type="date"
            disabled={pending}
            className="min-h-11 rounded-sm border border-border px-3"
            value={details.schedule.endDate ?? ''}
            onChange={(event) =>
              setDetails((current) => ({
                ...current,
                schedule: { ...current.schedule, endDate: event.target.value },
              }))
            }
          />
        </label>
        <BilingualTextField
          label={t('scheduleText')}
          value={details.schedule.scheduleText ?? { ar: '', en: '' }}
          disabled={pending}
          multiline
          onChange={(value) =>
            setDetails((current) => ({
              ...current,
              schedule: { ...current.schedule, scheduleText: value },
            }))
          }
        />
        <BilingualTextField
          label={t('duration')}
          value={details.schedule.duration ?? { ar: '', en: '' }}
          disabled={pending}
          onChange={(value) =>
            setDetails((current) => ({
              ...current,
              schedule: { ...current.schedule, duration: value },
            }))
          }
        />
      </article>
      <article id="pricing" className="grid gap-3 rounded-md border border-border bg-surface p-5">
        <h2 className="font-bold">{t('sections.pricing')}</h2>
        <label className="grid gap-1 text-sm">
          {t('priceMajor')}
          <input
            disabled={pending || details.pricing.contactUs}
            inputMode="decimal"
            className="min-h-11 rounded-sm border border-border px-3"
            value={details.pricing.price === null ? '' : (details.pricing.price / 100).toFixed(2)}
            onChange={(event) => {
              const value = Number(event.target.value);
              setDetails((current) => ({
                ...current,
                pricing: {
                  ...current.pricing,
                  price: event.target.value === '' ? null : Math.round(value * 100),
                },
              }));
            }}
          />
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            disabled={pending}
            checked={details.pricing.contactUs}
            onChange={(event) =>
              setDetails((current) => ({
                ...current,
                pricing: {
                  ...current.pricing,
                  contactUs: event.target.checked,
                  price: event.target.checked ? null : current.pricing.price,
                },
              }))
            }
          />
          {t('contactUsPrice')}
        </label>
        <label className="grid gap-1 text-sm">
          {t('promoPrice')}
          <input
            disabled={pending || details.pricing.contactUs}
            inputMode="decimal"
            className="min-h-11 rounded-sm border border-border px-3"
            value={
              details.pricing.promoPrice == null
                ? ''
                : (details.pricing.promoPrice / 100).toFixed(2)
            }
            onChange={(event) => {
              const value = Number(event.target.value);
              setDetails((current) => ({
                ...current,
                pricing: {
                  ...current.pricing,
                  promoPrice: event.target.value === '' ? null : Math.round(value * 100),
                },
              }));
            }}
          />
        </label>
        <label className="grid gap-1 text-sm">
          {t('currency')}
          <select
            disabled={pending}
            className="min-h-11 rounded-sm border border-border px-3"
            value={details.pricing.currency}
            onChange={(event) =>
              setDetails((current) => ({
                ...current,
                pricing: {
                  ...current.pricing,
                  currency: event.target.value as typeof current.pricing.currency,
                },
              }))
            }
          >
            {['EGP', 'USD', 'SAR', 'AED', 'EUR'].map((code) => (
              <option key={code}>{code}</option>
            ))}
          </select>
        </label>
        <BilingualRichField
          label={t('paymentInstructions')}
          value={details.pricing.paymentInstructions}
          disabled={pending}
          onChange={(value) =>
            setDetails((current) => ({
              ...current,
              pricing: { ...current.pricing, paymentInstructions: value },
            }))
          }
        />
        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">{t('paymentMethods')}</legend>
          {(['cash', 'bank_transfer', 'e_wallet', 'instapay', 'other'] as const).map((method) => (
            <label key={method} className="flex min-h-10 items-center gap-2 text-sm">
              <input
                type="checkbox"
                disabled={pending}
                checked={details.pricing.paymentMethods.includes(method)}
                onChange={(event) =>
                  setDetails((current) => ({
                    ...current,
                    pricing: {
                      ...current.pricing,
                      paymentMethods: event.target.checked
                        ? [...current.pricing.paymentMethods, method]
                        : current.pricing.paymentMethods.filter((value) => value !== method),
                    },
                  }))
                }
              />
              {t(`methods.${method}`)}
            </label>
          ))}
        </fieldset>
      </article>
    </>
  );
}
