const transliteration: Record<string, string> = { ا:'a',أ:'a',إ:'i',آ:'aa',ب:'b',ت:'t',ث:'th',ج:'g',ح:'h',خ:'kh',د:'d',ذ:'th',ر:'r',ز:'z',س:'s',ش:'sh',ص:'s',ض:'d',ط:'t',ظ:'z',ع:'a',غ:'gh',ف:'f',ق:'q',ك:'k',ل:'l',م:'m',ن:'n',ه:'h',و:'w',ي:'y',ى:'a',ة:'h',ء:'',ؤ:'w',ئ:'y' };

export function slugFromArabic(title: string, fallbackId = crypto.randomUUID().slice(0, 4)): string {
  const latin = [...title.toLowerCase()].map((char) => transliteration[char] ?? char).join('');
  const slug = latin.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80).replace(/-$/g, '');
  return slug.length >= 3 ? slug : `course-${fallbackId.slice(0, 4)}`;
}

/** Creates a valid, collision-resistant slug for a course copy. */
export function courseCopySlug(title: string, suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 8)): string {
  const safeSuffix = suffix.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || crypto.randomUUID().replace(/-/g, '').slice(0, 8);
  const generated = slugFromArabic(title, safeSuffix);
  const base = (generated.startsWith('course-') ? 'course' : generated).slice(0, 80 - safeSuffix.length - 1).replace(/-+$/g, '');
  return `${base || 'course'}-${safeSuffix}`;
}
