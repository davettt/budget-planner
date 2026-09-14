import { describe, expect, it } from 'vitest';

import { calculateProratedAmount, getFinancialYear, getFortnightWindow } from './periodCalc';

describe('period windows', () => {
  it('constructs an Australian financial year', () => {
    const window = getFinancialYear(new Date(2026, 8, 14), 7);
    expect(window.start).toEqual(new Date(2026, 6, 1));
    expect(window.end).toEqual(new Date(2027, 6, 1));
  });

  it('keeps fortnights aligned before and after the epoch', () => {
    expect(getFortnightWindow(new Date(2023, 11, 31)).start).toEqual(new Date(2023, 11, 18));
    expect(getFortnightWindow(new Date(2024, 0, 14)).end).toEqual(new Date(2024, 0, 15));
  });
});

describe('calculateProratedAmount', () => {
  const financialYear = { start: new Date(2024, 6, 1), end: new Date(2025, 6, 1) };

  it('includes one-off items only in their selected period', () => {
    expect(calculateProratedAmount(250, 'one-off', '2025-01-15', null, financialYear)).toBe(250);
    expect(calculateProratedAmount(250, 'one-off', '2025-07-01', null, financialYear)).toBe(0);
  });

  it('uses exact active days for daily items', () => {
    expect(calculateProratedAmount(10, 'daily', '2025-01-01', '2025-01-11', financialYear)).toBe(
      100,
    );
  });

  it('snaps recurring starts and prorates the final month', () => {
    const result = calculateProratedAmount(
      100,
      'monthly',
      '2024-06-15',
      '2025-03-15',
      financialYear,
    );
    expect(result).toBeCloseTo(800 + (15 / 31) * 100, 8);
  });
});
