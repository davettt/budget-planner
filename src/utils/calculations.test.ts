import { describe, expect, it } from 'vitest';

import { calculateLoanRepayment, calculateLVR } from './calculations';

describe('calculateLoanRepayment', () => {
  it('calculates a standard reducing-balance monthly repayment', () => {
    const result = calculateLoanRepayment(500_000, 6, 30, 'monthly');
    expect(result.repayment).toBeCloseTo(2997.75, 2);
    expect(result.totalCost).toBeCloseTo(result.repayment * 360, 8);
    expect(result.totalInterest).toBeCloseTo(result.totalCost - 500_000, 8);
  });

  it('handles zero interest and invalid terms', () => {
    expect(calculateLoanRepayment(120_000, 0, 10, 'monthly').repayment).toBe(1000);
    expect(calculateLoanRepayment(120_000, 5, 0, 'monthly')).toEqual({
      repayment: 0,
      totalInterest: 0,
      totalCost: 0,
    });
  });
});

describe('calculateLVR', () => {
  it('calculates the loan-to-value ratio and handles a zero price', () => {
    expect(calculateLVR(800_000, 160_000)).toBe(80);
    expect(calculateLVR(0, 0)).toBe(0);
  });
});
