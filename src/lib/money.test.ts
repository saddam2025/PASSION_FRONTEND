import { describe, expect, it } from 'vitest';
import { majorToMinor, minorToMajor, minorToMajorText } from './money';
import { formatMoney, formatMoneyMinor } from './formatters';

describe('minor/major currency conversion', () => {
  it('converts decimal inputs without adding binary floats', () => {
    expect(majorToMinor('0.1') + majorToMinor('0.2')).toBe(30);
    expect(() => majorToMinor(0.1 + 0.2)).toThrow();
    expect(minorToMajor(30)).toBe(0.3);
    expect(minorToMajorText(30)).toBe('0.3');
  });
  it('rejects rounding beyond two decimals and rejects unsafe values', () => {
    expect(() => majorToMinor('1.004')).toThrow();
    expect(() => majorToMinor('1.005')).toThrow();
    expect(majorToMinor('90071992547409.91')).toBe(Number.MAX_SAFE_INTEGER);
    expect(() => majorToMinor('90071992547409.92')).toThrow();
    expect(() => majorToMinor('-1.00')).toThrow();
  });
  it('uses the same exact minor-unit rules for USD cents and formats each currency distinctly', () => {
    expect(majorToMinor('123456789.12', 'USD')).toBe(12_345_678_912);
    expect(minorToMajorText(1500)).toBe('15');
    expect(formatMoney(2000, 'EGP')).toBe('2,000 ج.م');
    expect(formatMoney(2000, 'USD')).toBe('2,000 $');
    expect(formatMoneyMinor(200_000, 'EGP')).toBe('2,000 ج.م');
    expect(formatMoneyMinor(150_025, 'USD')).toBe('1,500.25 $');
    expect(formatMoneyMinor(9_007_199_254_740_991, 'USD')).toBe('90,071,992,547,409.91 $');
    expect(() => formatMoneyMinor(-1, 'EGP')).toThrow();
  });
});
