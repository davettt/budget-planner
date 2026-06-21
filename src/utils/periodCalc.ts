import type { DisplayPeriod, Frequency, Income, Expense, PeriodWindow } from '../types';

import { PERIODS_PER_YEAR } from './constants';

function parseDate(dateStr: string): Date {
  const parts = dateStr.split('-').map(Number);
  return new Date(parts[0]!, parts[1]! - 1, parts[2]!);
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

// ── Period Window Construction ──────────────────────────────

export function getWeekWindow(date: Date): PeriodWindow {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);
  return { start: monday, end: nextMonday };
}

const FORTNIGHT_EPOCH = new Date(2024, 0, 1); // Monday 2024-01-01

export function getFortnightWindow(date: Date): PeriodWindow {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const daysSinceEpoch = daysBetween(FORTNIGHT_EPOCH, d);
  const fortnightIndex = Math.floor(daysSinceEpoch / 14);
  const start = new Date(FORTNIGHT_EPOCH);
  start.setDate(start.getDate() + fortnightIndex * 14);
  const end = new Date(start);
  end.setDate(start.getDate() + 14);
  return { start, end };
}

export function getMonthWindow(date: Date): PeriodWindow {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
}

export function getFinancialYear(date: Date, fyStartMonth: number): PeriodWindow {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const startYear = month >= fyStartMonth ? year : year - 1;
  const start = new Date(startYear, fyStartMonth - 1, 1);
  const end = new Date(startYear + 1, fyStartMonth - 1, 1);
  return { start, end };
}

export function getCurrentPeriodWindow(period: DisplayPeriod, fyStartMonth: number): PeriodWindow {
  const now = new Date();
  switch (period) {
    case 'weekly':
      return getWeekWindow(now);
    case 'fortnightly':
      return getFortnightWindow(now);
    case 'monthly':
      return getMonthWindow(now);
    case 'annually':
      return getFinancialYear(now, fyStartMonth);
  }
}

export function shiftPeriod(
  window: PeriodWindow,
  period: DisplayPeriod,
  direction: 1 | -1,
): PeriodWindow {
  const ref = direction === 1 ? window.end : new Date(window.start.getTime() - 86_400_000);
  switch (period) {
    case 'weekly':
      return getWeekWindow(ref);
    case 'fortnightly':
      return getFortnightWindow(ref);
    case 'monthly': {
      const d = new Date(window.start.getFullYear(), window.start.getMonth() + direction, 1);
      return getMonthWindow(d);
    }
    case 'annually': {
      const d = new Date(window.start.getFullYear() + direction, window.start.getMonth(), 1);
      return { start: d, end: new Date(d.getFullYear() + 1, d.getMonth(), 1) };
    }
  }
}

// ── Period Labels ───────────────────────────────────────────

export function formatPeriodLabel(window: PeriodWindow, period: DisplayPeriod): string {
  const s = window.start;
  const e = new Date(window.end.getTime() - 86_400_000);

  switch (period) {
    case 'weekly':
    case 'fortnightly': {
      const sameMonth = s.getMonth() === e.getMonth();
      if (sameMonth) {
        return `${s.getDate()}-${e.getDate()} ${s.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}`;
      }
      return `${s.getDate()} ${s.toLocaleDateString('en-AU', { month: 'short' })} - ${e.getDate()} ${e.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}`;
    }
    case 'monthly':
      return s.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
    case 'annually': {
      const endYear = new Date(window.end.getTime() - 86_400_000).getFullYear();
      if (s.getMonth() === 0) {
        return String(s.getFullYear());
      }
      const sy = String(s.getFullYear());
      const ey = String(endYear).slice(-2);
      return `FY ${sy}-${ey}`;
    }
  }
}

// ── Proration ───────────────────────────────────────────────

function prorateByMonth(monthlyAmount: number, overlapStart: Date, overlapEnd: Date): number {
  let total = 0;
  const cursor = new Date(overlapStart.getFullYear(), overlapStart.getMonth(), 1);

  while (cursor < overlapEnd) {
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    const daysInMonth = daysBetween(monthStart, monthEnd);

    const effectiveStart = overlapStart > monthStart ? overlapStart : monthStart;
    const effectiveEnd = overlapEnd < monthEnd ? overlapEnd : monthEnd;
    const daysActive = daysBetween(effectiveStart, effectiveEnd);

    if (daysActive > 0) {
      total += monthlyAmount * (daysActive / daysInMonth);
    }

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return total;
}

export function calculateProratedAmount(
  amount: number,
  frequency: Frequency,
  itemStartDate: string,
  itemEndDate: string | null,
  window: PeriodWindow,
): number {
  const itemStart = parseDate(itemStartDate);
  const itemEnd = itemEndDate ? parseDate(itemEndDate) : null;

  // One-off: full amount only when the expense date falls inside the selected window.
  if (frequency === 'one-off') {
    return itemStart >= window.start && itemStart < window.end ? amount : 0;
  }

  // Daily: use exact day count
  if (frequency === 'daily') {
    const overlapStart = itemStart > window.start ? itemStart : window.start;
    const overlapEnd = itemEnd && itemEnd < window.end ? itemEnd : window.end;
    if (overlapStart >= overlapEnd) return 0;
    return amount * daysBetween(overlapStart, overlapEnd);
  }

  // All other frequencies: convert to monthly equivalent and count by calendar month.
  // Start snaps to 1st of month (payment in advance — full starting month).
  // End uses actual date + 1 day (exclusive) so the final month is prorated.
  const snappedStart = new Date(itemStart.getFullYear(), itemStart.getMonth(), 1);
  const adjustedEnd = itemEnd
    ? new Date(itemEnd.getFullYear(), itemEnd.getMonth(), itemEnd.getDate() + 1)
    : null;

  const overlapStart = snappedStart > window.start ? snappedStart : window.start;
  const overlapEnd = adjustedEnd && adjustedEnd < window.end ? adjustedEnd : window.end;

  if (overlapStart >= overlapEnd) return 0;

  const monthlyAmount = (amount * PERIODS_PER_YEAR[frequency]) / 12;
  return prorateByMonth(monthlyAmount, overlapStart, overlapEnd);
}

// ── Aggregation ─────────────────────────────────────────────

export function calculatePeriodIncome(incomes: Income[], window: PeriodWindow): number {
  return incomes
    .filter((i) => i.active)
    .reduce((sum, i) => {
      const net = i.isGross && i.taxRate ? i.amount * (1 - i.taxRate / 100) : i.amount;
      return sum + calculateProratedAmount(net, i.frequency, i.startDate, i.endDate, window);
    }, 0);
}

export function calculatePeriodExpenses(expenses: Expense[], window: PeriodWindow): number {
  return expenses
    .filter((e) => e.active && !e.paused)
    .reduce(
      (sum, e) =>
        sum + calculateProratedAmount(e.amount, e.frequency, e.startDate, e.endDate, window),
      0,
    );
}

export function calculatePeriodCategoryTotals(
  expenses: Expense[],
  window: PeriodWindow,
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const e of expenses.filter((e) => e.active && !e.paused)) {
    const amount = calculateProratedAmount(e.amount, e.frequency, e.startDate, e.endDate, window);
    if (amount > 0) {
      totals.set(e.categoryId, (totals.get(e.categoryId) || 0) + amount);
    }
  }
  return totals;
}
