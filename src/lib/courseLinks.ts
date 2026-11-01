export function arabicCoursePath(pathname: string, search = '', hash = ''): string | null {
  const match = pathname.match(/^\/courses\/([^/]+)\/?$/);
  if (!match) return null;
  return `/ar/courses/${match[1]}${search}${hash}`;
}
