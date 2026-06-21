import type { Frequency } from '../types';

import { PERIODS_PER_YEAR } from './constants';

export function calculateLoanRepayment(
  principal: number,
  annualRate: number,
  termYears: number,
  frequency: Frequency,
): { repayment: number; totalInterest: number; totalCost: number } {
  if (termYears <= 0) {
    return { repayment: 0, totalInterest: 0, totalCost: 0 };
  }

  const periodsPerYear = PERIODS_PER_YEAR[frequency] || 12;
  const r = annualRate / 100 / periodsPerYear;
  const n = termYears * periodsPerYear;

  if (r === 0) {
    const repayment = principal / n;
    return { repayment, totalInterest: 0, totalCost: principal };
  }

  const repayment = (principal * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
  const totalCost = repayment * n;
  const totalInterest = totalCost - principal;

  return { repayment, totalInterest, totalCost };
}

export function calculateLVR(purchasePrice: number, deposit: number): number {
  if (purchasePrice <= 0) return 0;
  return ((purchasePrice - deposit) / purchasePrice) * 100;
}
