import type { Frequency, DisplayPeriod } from '../types';

import { PERIODS_PER_YEAR } from './constants';

export function convertAmount(
  amount: number,
  fromFrequency: Frequency,
  toFrequency: Frequency,
): number {
  if (fromFrequency === 'one-off' || toFrequency === 'one-off') return amount;
  const annualAmount = amount * PERIODS_PER_YEAR[fromFrequency];
  return annualAmount / PERIODS_PER_YEAR[toFrequency];
}

export function isActiveOnDate(startDate: string, endDate: string | null, date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const today = `${y}-${m}-${d}`;
  return startDate <= today && (!endDate || endDate >= today);
}

export function formatCurrency(amount: number, symbol = '$'): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-AU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return amount < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}

export function periodLabel(period: DisplayPeriod): string {
  const labels: Record<DisplayPeriod, string> = {
    weekly: '/week',
    fortnightly: '/fortnight',
    monthly: '/month',
    annually: '/year',
  };
  return labels[period];
}

export function periodLabelFull(period: DisplayPeriod): string {
  const labels: Record<DisplayPeriod, string> = {
    weekly: 'Weekly',
    fortnightly: 'Fortnightly',
    monthly: 'Monthly',
    annually: 'Annually',
  };
  return labels[period];
}
