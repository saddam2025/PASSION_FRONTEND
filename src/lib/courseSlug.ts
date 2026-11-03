const transliteration: Record<string, string> = { ا:'a',أ:'a',إ:'i',آ:'aa',ب:'b',ت:'t',ث:'th',ج:'g',ح:'h',خ:'kh',د:'d',ذ:'th',ر:'r',ز:'z',س:'s',ش:'sh',ص:'s',ض:'d',ط:'t',ظ:'z',ع:'a',غ:'gh',ف:'f',ق:'q',ك:'k',ل:'l',م:'m',ن:'n',ه:'h',و:'w',ي:'y',ى:'a',ة:'h',ء:'',ؤ:'w',ئ:'y' };

export function slugFromArabic(title: string, fallbackId = crypto.randomUUID().slice(0, 4)): string {
  const latin = [...title.toLowerCase()].map((char) => transliteration[char] ?? char).join('');
  const slug = latin.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80).replace(/-$/g, '');
  return slug.length >= 3 ? slug : `course-${fallbackId.slice(0, 4)}`;
}
