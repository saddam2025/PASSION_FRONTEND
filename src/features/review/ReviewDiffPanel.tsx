import { useTranslation } from 'react-i18next';
import { diffWords, type CourseChange } from './diff/diffCourseDetails';
import { mediaUrl } from '@/lib/mediaUrl';

function imageSource(value: unknown): string | null {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('src' in value) ||
    typeof value.src !== 'string'
  )
    return null;
  return value.src;
}

export function ReviewDiffPanel({
  details,
  page,
}: {
  details: CourseChange[];
  page: CourseChange[];
}) {
  const { t } = useTranslation('review');
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <article className="rounded-md border border-border bg-surface p-4">
        <h2 className="font-bold">
          {t('courseDetails')} · {details.length}
        </h2>
        <ul className="mt-3 grid gap-2">
          {details.slice(0, 30).map((change) => {
            const beforeImage = imageSource(change.before);
            const afterImage = imageSource(change.after);
            return (
              <li key={change.path} className="border-t border-border pt-2 text-sm">
                <span className="font-semibold">{change.path}</span>
                {typeof change.before === 'string' && typeof change.after === 'string' ? (
                  <p className="mt-1 leading-relaxed">
                    {diffWords(change.before, change.after).map((part, index) =>
                      part.kind === 'removed' ? (
                        <del key={index} className="bg-danger/10 text-danger">
                          {part.text}
                        </del>
                      ) : part.kind === 'added' ? (
                        <ins key={index} className="bg-success/10 text-success no-underline">
                          {part.text}
                        </ins>
                      ) : (
                        <span key={index}>{part.text}</span>
                      ),
                    )}
                  </p>
                ) : (
                  <div className="mt-1 grid gap-1 text-muted">
                    <span>
                      {t('before')}: {formatValue(change.before)}
                    </span>
                    <span>
                      {t('after')}: {formatValue(change.after)}
                    </span>
                    {(beforeImage || afterImage) && (
                      <div className="grid grid-cols-2 gap-2">
                        {[beforeImage, afterImage].map((src, index) =>
                          src ? (
                            <img
                              key={`${index}-${src}`}
                              src={mediaUrl(src, 'thumb')}
                              alt=""
                              width={160}
                              height={100}
                              className="h-24 w-full rounded-xs border border-border object-cover"
                            />
                          ) : (
                            <span
                              key={index}
                              className="grid h-24 place-items-center rounded-xs bg-canvas"
                            >
                              —
                            </span>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </article>
      <article className="rounded-md border border-border bg-surface p-4">
        <h2 className="font-bold">
          {t('pageSections')} · {page.length}
        </h2>
        <ul className="mt-3 grid gap-2">
          {page.map((change, index) => (
            <li key={`${change.path}-${index}`} className="border-t border-border pt-2 text-sm">
              <span className="font-semibold">
                {change.kind === 'changed' ? t('changed') : t(change.kind)}
              </span>{' '}
              · {change.path}
              {change.path.endsWith('position') && (
                <p>
                  {t('before')}: {String(change.before)} → {t('after')}: {String(change.after)}
                </p>
              )}
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}
function formatValue(value: unknown): string {
  return value == null ? '—' : typeof value === 'object' ? JSON.stringify(value) : String(value);
}
