import type { Frequency } from '../types';

export const PERIODS_PER_YEAR: Record<Frequency, number> = {
  daily: 365,
  weekly: 52,
  fortnightly: 26,
  monthly: 12,
  quarterly: 4,
  annually: 1,
  'one-off': 0,
};
