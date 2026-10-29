import type { Dispatch, SetStateAction } from 'react';
import type { CourseRecord, CourseDetails } from '@/schemas/course';
import { useAuth } from '@/app/AuthContext';
import { CourseBasicsPanel } from './CourseBasicsPanel';
import { CourseSchedulePricingPanel } from './CourseSchedulePricingPanel';
import { CourseEnrollmentPanel } from './CourseEnrollmentPanel';
import { CourseExtrasPanel } from './CourseExtrasPanel';
import { useTranslation } from 'react-i18next';
export function CourseEditorPanels({
  details,
  setDetails,
  pending,
  language,
  course,
}: {
  details: CourseDetails;
  setDetails: Dispatch<SetStateAction<CourseDetails>>;
  pending: boolean;
  language: 'ar' | 'en';
  course: CourseRecord;
}) {
  const { user } = useAuth();
  const { t } = useTranslation('courses');
  return (
    <div className="grid gap-4">
      <CourseBasicsPanel
        details={details}
        setDetails={setDetails}
        pending={pending}
        language={language}
        course={course}
      />
      {user?.role === 'admin' && (
        <label className="flex items-center gap-3 rounded-sm border border-border bg-surface p-4">
          <input type="checkbox" checked={details.featured} disabled={pending} onChange={(event) => setDetails((current) => ({ ...current, featured: event.target.checked }))} />
          <span>{t('featured')}</span>
        </label>
      )}
      <CourseSchedulePricingPanel details={details} setDetails={setDetails} pending={pending} />
      <CourseEnrollmentPanel
        details={details}
        setDetails={setDetails}
        pending={pending}
        admin={user?.role === 'admin'}
      />
      <CourseExtrasPanel details={details} setDetails={setDetails} pending={pending} />
    </div>
  );
}
