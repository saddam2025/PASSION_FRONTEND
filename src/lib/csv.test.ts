import { describe, expect, it } from 'vitest';
import { escapeCsvCell, toCsv } from './csv';
describe('CSV safety', () => {
  it('quotes commas, quotes and line breaks per RFC 4180', () => {
    expect(escapeCsvCell('a,"b"')).toBe('"a,""b"""');
    expect(escapeCsvCell('a\nb')).toBe('"a\nb"');
  });
  it('neutralizes formula-leading cells', () => {
    for (const prefix of ['=', '+', '-', '@', '\t', '\r'])
      expect(escapeCsvCell(`${prefix}SUM(1,2)`)).toContain("'");
  });
  it('adds UTF-8 BOM and CRLF rows', () => {
    expect(toCsv(['الاسم'], [['علي']])).toBe('\uFEFF"الاسم"\r\n"علي"');
  });
});
