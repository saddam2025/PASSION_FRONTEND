import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Overlay';
import { useTranslation } from 'react-i18next';

export function CourseDeleteDialog({
  open,
  onOpenChange,
  slug,
  typedSlug,
  onSlugChange,
  enrollmentCount,
  paymentCount,
  loading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  typedSlug: string;
  onSlugChange: (value: string) => void;
  enrollmentCount: number;
  paymentCount: number;
  loading: boolean;
  onConfirm: () => void;
}) {
  const { t } = useTranslation('courses');
  const usesHistory = enrollmentCount > 0 || paymentCount > 0;
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t('deleteCourse')}
      description={t('typeSlugToConfirm', { slug })}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button variant="danger" disabled={typedSlug !== slug || loading} onClick={onConfirm}>
            {t('confirmDelete')}
          </Button>
        </>
      }
    >
      <input
        dir="ltr"
        aria-label={t('slug')}
        className="min-h-11 rounded-sm border border-border px-3 text-start"
        value={typedSlug}
        onChange={(event) => onSlugChange(event.target.value)}
      />
      <p className="text-sm text-muted">
        {usesHistory
          ? t('softDeleteUsage', { enrollments: enrollmentCount, payments: paymentCount })
          : t('hardDeleteWarning')}
      </p>
    </Modal>
  );
}
