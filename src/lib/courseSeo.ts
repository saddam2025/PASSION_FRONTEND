import type { Snapshot } from '@/schemas/course';

export interface CourseSeoDefaults {
  titleTemplate?: string;
  description?: { ar?: string };
  ogImage?: string;
  allowSearchEngines?: boolean;
}

export function resolveCourseSeo(snapshot: Snapshot, defaults: CourseSeoDefaults = {}) {
  const title = (snapshot.seo.title?.ar ? snapshot.seo.title.ar : defaults.titleTemplate || snapshot.details.title.ar)
    .replaceAll('{course}', snapshot.details.title.ar);
  return {
    title: { ar: title, en: '' },
    description: snapshot.seo.description?.ar ? snapshot.seo.description : { ar: defaults.description?.ar || snapshot.details.shortDescription.ar, en: '' },
    noindex: snapshot.seo.noindex ?? !defaults.allowSearchEngines,
    ogImage: snapshot.seo.ogImage ?? (defaults.ogImage ? { src: defaults.ogImage, alt: { ar: '', en: '' }, decorative: true } : snapshot.details.coverImage),
  };
}
