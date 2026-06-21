import { create } from 'zustand';

import type { Settings, DisplayPeriod, CalcMode, PeriodWindow } from '../types';
import * as api from '../services/api';
import { getCurrentPeriodWindow, shiftPeriod } from '../utils/periodCalc';

const DISPLAY_PERIODS: readonly DisplayPeriod[] = ['weekly', 'fortnightly', 'monthly', 'annually'];

function normaliseDisplayPeriod(period: unknown): DisplayPeriod {
  return DISPLAY_PERIODS.includes(period as DisplayPeriod) ? (period as DisplayPeriod) : 'monthly';
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingChanges: Partial<Settings> = {};

interface SettingsState {
  settings: Settings | null;
  loading: boolean;
  error: string | null;
  displayPeriod: DisplayPeriod;
  calcMode: CalcMode;
  periodWindow: PeriodWindow;
  fetch: () => Promise<void>;
  update: (data: Partial<Settings>) => Promise<void>;
  setDisplayPeriod: (period: DisplayPeriod) => void;
  setCalcMode: (mode: CalcMode) => void;
  navigatePeriod: (direction: 1 | -1) => void;
  goToCurrentPeriod: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  loading: true,
  error: null,
  displayPeriod: 'monthly',
  calcMode: 'actual',
  periodWindow: getCurrentPeriodWindow('monthly', 7),

  fetch: async () => {
    try {
      set({ loading: true, error: null });
      const settings = await api.fetchSettings();
      const period = normaliseDisplayPeriod(settings.defaultPeriod);
      const fyMonth = settings.financialYearStartMonth || 7;
      set({
        settings,
        loading: false,
        displayPeriod: period,
        periodWindow: getCurrentPeriodWindow(period, fyMonth),
      });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load settings',
      });
    }
  },

  update: async (data) => {
    const current = get().settings;
    if (!current) return;
    pendingChanges = { ...pendingChanges, ...data };
    if (saveTimer) clearTimeout(saveTimer);
    const toSave = pendingChanges;
    saveTimer = setTimeout(async () => {
      pendingChanges = {};
      try {
        const updated = await api.updateSettings(toSave);
        set({ settings: updated });
        if (toSave.financialYearStartMonth && get().displayPeriod === 'annually') {
          set({
            periodWindow: getCurrentPeriodWindow('annually', updated.financialYearStartMonth),
          });
        }
      } catch (err) {
        set({ error: err instanceof Error ? err.message : 'Failed to save settings' });
      }
    }, 300);
    set({ settings: { ...current, ...data } });
  },

  setDisplayPeriod: (period) => {
    const fyMonth = get().settings?.financialYearStartMonth || 7;
    set({
      displayPeriod: period,
      periodWindow: getCurrentPeriodWindow(period, fyMonth),
    });
  },

  setCalcMode: (mode) => set({ calcMode: mode }),

  navigatePeriod: (direction) => {
    const { periodWindow, displayPeriod } = get();
    set({ periodWindow: shiftPeriod(periodWindow, displayPeriod, direction) });
  },

  goToCurrentPeriod: () => {
    const { displayPeriod, settings } = get();
    const fyMonth = settings?.financialYearStartMonth || 7;
    set({ periodWindow: getCurrentPeriodWindow(displayPeriod, fyMonth) });
  },
}));
