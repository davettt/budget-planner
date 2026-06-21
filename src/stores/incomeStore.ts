import { create } from 'zustand';

import type { Income } from '../types';
import * as api from '../services/api';

interface IncomeState {
  income: Income[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  add: (data: Partial<Income>) => Promise<void>;
  update: (id: string, data: Partial<Income>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useIncomeStore = create<IncomeState>((set) => ({
  income: [],
  loading: true,
  error: null,

  fetch: async () => {
    try {
      set({ loading: true, error: null });
      const income = await api.fetchIncome();
      set({ income, loading: false });
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : 'Failed to load income' });
    }
  },

  add: async (data) => {
    const entry = await api.createIncome(data);
    set((s) => ({ income: [...s.income, entry] }));
  },

  update: async (id, data) => {
    const updated = await api.updateIncome(id, data);
    set((s) => ({ income: s.income.map((i) => (i.id === id ? updated : i)) }));
  },

  remove: async (id) => {
    await api.deleteIncome(id);
    set((s) => ({ income: s.income.filter((i) => i.id !== id) }));
  },
}));
