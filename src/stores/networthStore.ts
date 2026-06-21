import { create } from 'zustand';

import type { NetWorthSnapshot } from '../types';
import { fetchNetWorth, createNetWorthSnapshot } from '../services/api';

interface NetWorthState {
  history: NetWorthSnapshot[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  snapshot: () => Promise<void>;
}

export const useNetWorthStore = create<NetWorthState>((set, get) => ({
  history: [],
  loading: true,
  error: null,

  fetch: async () => {
    try {
      set({ loading: true, error: null });
      const history = await fetchNetWorth();
      set({ history, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load net worth',
      });
    }
  },

  snapshot: async () => {
    await get().fetch();
    const history = get().history;
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;
    const lastSnapshot = history[history.length - 1];
    if (lastSnapshot && lastSnapshot.date === todayStr) return;
    await createNetWorthSnapshot();
    await get().fetch();
  },
}));
