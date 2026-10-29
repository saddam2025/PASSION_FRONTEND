import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { escapeCsvCell, toCsv } from './csv';
describe('CSV safety', () => {
  it('quotes commas, quotes and line breaks per RFC 4180', () => {
    assert.equal(escapeCsvCell('a,"b"'), '"a,""b"""');
    assert.equal(escapeCsvCell('a\nb'), '"a\nb"');
  });
  it('neutralizes formula-leading cells', () => {
    for (const prefix of ['=', '+', '-', '@', '\t', '\r'])
      assert.ok(escapeCsvCell(`${prefix}SUM(1,2)`).includes("'"));
  });
  it('adds UTF-8 BOM and CRLF rows', () => {
    assert.equal(toCsv(['الاسم'], [['علي']]), '\uFEFF"الاسم"\r\n"علي"');
  });
});
