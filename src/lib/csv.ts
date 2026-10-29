export function escapeCsvCell(value: unknown): string {
  let text = value == null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function toCsv(headers: readonly string[], rows: readonly (readonly unknown[])[]): string {
  return `\uFEFF${[headers, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\r\n')}`;
}
