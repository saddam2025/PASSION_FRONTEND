import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage, getBilingualText } from '@/i18n/useLanguage';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog, Modal } from '@/components/ui/Overlay';
import type { MediaAsset, MediaUsageResult } from '@/services/media';
import { mediaService } from '@/services/media';
import { mediaUrl } from '@/lib/mediaUrl';
import { apiErrorMessage } from '@/api/client';
import { EmptyState, ErrorState } from '@/components/ui/feedback';

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxBytes = 5 * 1024 * 1024;
export function MediaLibraryDialog({
  open,
  onOpenChange,
  onChoose,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChoose: (asset: MediaAsset) => void;
}) {
  const { t } = useTranslation('builder');
  const { language } = useLanguage();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const [usage, setUsage] = useState<MediaUsageResult | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    setError('');
    try {
      const result = await mediaService.list({ page, search });
      setAssets(result.items);
      setTotalPages(Math.max(1, result.pageCount));
    } catch (cause) {
      setError(apiErrorMessage(cause));
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [page, search]);
  useEffect(() => {
    if (open) void reload();
  }, [open, reload]);
  useEffect(() => {
    if (!selected) {
      setUsage(null);
      return;
    }
    let active = true;
    void mediaService
      .checkUsage(selected.id)
      .then((result) => {
        if (active) setUsage(result);
      })
      .catch(() => {
        if (active) {
          setUsage(null);
          setError(t('usageCheckError'));
        }
      });
    return () => {
      active = false;
    };
  }, [selected, t]);
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );
  const chooseFile = async (file?: File) => {
    if (!file) return;
    setError('');
    if (!allowedTypes.has(file.type)) {
      if (inputRef.current) inputRef.current.value = '';
      setError(t('invalidType'));
      return;
    }
    if (file.size > maxBytes) {
      if (inputRef.current) inputRef.current.value = '';
      setError(t('tooLarge'));
      return;
    }
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return localPreview;
    });
    setProgress(0);
    try {
      const asset = await mediaService.upload(file, setProgress);
      setAssets((current) => [asset, ...current.filter((item) => item.id !== asset.id)]);
      setSelected(asset);
      setPage(1);
    } catch (cause) {
      setError(apiErrorMessage(cause));
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };
  const remove = async () => {
    if (!selected || (usage?.usageCount ?? 0) > 0) return;
    try {
      const result = await mediaService.remove(selected.id);
      setUsage(result);
      if (!result.removed) {
        setError(t('deleteBlocked'));
        return;
      }
      setAssets((current) => current.filter((asset) => asset.id !== selected.id));
      setSelected(null);
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
    } catch (cause) {
      setError(apiErrorMessage(cause));
    }
  };
  const changeOpen = (nextOpen: boolean) => {
    if (!nextOpen)
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
    onOpenChange(nextOpen);
  };
  const imageSource = selected
    ? (previewUrl ?? mediaUrl(selected.key, selected.variants.large))
    : '';
  return (
    <>
      <Modal
        open={open}
        onOpenChange={changeOpen}
        title={t('title')}
        description={t('description')}
        footer={
          <>
            <Button variant="secondary" onClick={() => changeOpen(false)}>
              {t('close')}
            </Button>
            <Button
              disabled={!selected}
              onClick={() => {
                if (selected) {
                  onChoose(selected);
                  changeOpen(false);
                }
              }}
            >
              {t('select')}
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            <input
              className="min-h-11 min-w-48 flex-1 rounded-sm border border-border bg-surface ps-3 pe-3"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder={t('search')}
              aria-label={t('search')}
            />
            <input
              ref={inputRef}
              className="sr-only"
              type="file"
              aria-label={t('upload')}
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => void chooseFile(event.currentTarget.files?.[0])}
            />
            <Button
              variant="secondary"
              onClick={() => inputRef.current?.click()}
              disabled={progress !== null}
            >
              {t('upload')}
            </Button>
          </div>
          {progress !== null && (
            <div role="status" aria-live="polite">
              <p>{t('uploading', { progress })}</p>
              <progress className="w-full" max={100} value={progress} />
            </div>
          )}
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          {loading ? (
            <p role="status">{t('loading')}</p>
          ) : loadError ? (
            <ErrorState title={error || 'حصلت مشكلة في تحميل مكتبة الصور، جرّب تاني.'} onRetry={() => void reload()} />
          ) : assets.length ? (
            <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  aria-pressed={selected?.id === asset.id}
                  onClick={() => {
                    setError('');
                    setUsage(null);
                    setSelected(asset);
                    setPreviewUrl(null);
                  }}
                  className="grid gap-1 rounded-sm border border-border p-2 text-start aria-pressed:border-primary aria-pressed:ring-2 aria-pressed:ring-primary"
                >
                  <img
                    src={mediaUrl(asset.key, asset.variants.thumb)}
                    alt=""
                    width={asset.width}
                    height={asset.height}
                    className="aspect-[4/3] w-full rounded-xs object-cover"
                  />
                  <span className="truncate text-xs">{asset.key.split('/').at(-1)}</span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title={t('empty')} />
          )}
          <div className="flex items-center justify-between">
            <Button
              variant="secondary"
              disabled={page <= 1 || loading}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              ←
            </Button>
            <span aria-live="polite">
              {page} / {totalPages}
            </span>
            <Button
              variant="secondary"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            >
              →
            </Button>
          </div>
          {selected && (
            <section
              className="grid gap-3 rounded-sm border border-border p-3"
              aria-label={t('title')}
            >
              <div className="flex flex-wrap items-start gap-3">
                <img
                  src={imageSource}
                  alt=""
                  width={Math.min(selected.width, 320)}
                  height={Math.min(selected.height, 220)}
                  className="max-h-40 max-w-48 rounded-sm object-contain"
                />
                <div className="grid gap-1 text-sm">
                  <p>{t('dimensions', { width: selected.width, height: selected.height })}</p>
                  {selected.width < 800 || selected.height < 400 ? (
                    <p className="text-warning">{t('smallWarning')}</p>
                  ) : null}
                  <p className="break-all text-muted">{selected.key}</p>
                </div>
              </div>
              {!usage && <p className="text-sm text-warning">{t('usageUnavailable')}</p>}
              {usage && (
                <div className="grid gap-1 text-sm">
                  <p>
                    {usage.usageCount > 0 ? t('usage', { count: usage.usageCount }) : t('unused')}
                  </p>
                  {usage.courseTitles.length > 0 && <span>{t('usageCourses')}:</span>}
                  {usage.courseTitles.map((course) => (
                    <span key={course.ar} className="text-muted">
                      {getBilingualText(course, language)}
                    </span>
                  ))}
                </div>
              )}
              <Button
                variant="danger"
                disabled={!usage || usage.usageCount > 0 || progress !== null}
                onClick={() => setDeleteOpen(true)}
              >
                {t('delete')}
              </Button>
            </section>
          )}
        </div>
      </Modal>
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t('deleteConfirm')}
        description={usage?.usageCount ? t('deleteBlocked') : t('deleteDescription')}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        destructive
        onConfirm={() => void remove()}
      />
    </>
  );
}
