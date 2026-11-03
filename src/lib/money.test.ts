import { describe, expect, it } from 'vitest';
import { majorToMinor, minorToMajor } from './money';

describe('minor/major currency conversion', () => {
  it('converts decimal inputs without adding binary floats', () => {
    expect(majorToMinor('0.1') + majorToMinor('0.2')).toBe(30);
    expect(majorToMinor(0.1 + 0.2)).toBe(30);
    expect(minorToMajor(30)).toBe(0.3);
  });
  it('rounds to the nearest piaster, half up, and rejects unsafe values', () => {
    expect(majorToMinor('1.004')).toBe(100);
    expect(majorToMinor('1.005')).toBe(101);
    expect(majorToMinor('90071992547409.91')).toBe(Number.MAX_SAFE_INTEGER);
    expect(() => majorToMinor('90071992547409.92')).toThrow();
    expect(() => majorToMinor('-1.00')).toThrow();
  });
});
