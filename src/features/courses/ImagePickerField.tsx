import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ImageRef } from '@/schemas/sections';
import type { MediaAsset } from '@/services/media';
import { mediaUrl } from '@/lib/mediaUrl';
import { MediaLibraryDialog } from '@/features/builder/media/MediaLibraryDialog';
import { Button } from '@/components/ui/Button';
import { BilingualTextField } from './BilingualFields';
export function ImagePickerField({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: ImageRef;
  onChange: (value: ImageRef) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation('courses');
  const choose = (asset: MediaAsset) => {
    onChange({ ...value, assetId: asset.id, src: asset.key, decorative: false });
    setOpen(false);
  };
  return (
    <div className="grid gap-3 rounded-sm border border-border p-3">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap items-center gap-3">
        {value.src && (
          <img
            src={mediaUrl(value.src)}
            alt=""
            width={112}
            height={72}
            className="h-[4.5rem] w-28 rounded-xs border border-border object-cover"
          />
        )}
        <Button variant="secondary" disabled={disabled} onClick={() => setOpen(true)}>
          {t('chooseImage')}
        </Button>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            disabled={disabled}
            checked={value.decorative ?? false}
            onChange={(event) => onChange({ ...value, decorative: event.target.checked })}
          />
          {t('decorativeImage')}
        </label>
      </div>
      <BilingualTextField
        label={t('imageAlt')}
        value={value.alt}
        onChange={(alt) => onChange({ ...value, alt })}
        disabled={disabled || Boolean(value.decorative)}
      />
      <MediaLibraryDialog open={open} onOpenChange={setOpen} onChoose={choose} />
    </div>
  );
}
