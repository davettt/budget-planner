import { create } from 'zustand';

import type { Account } from '../types';
import * as api from '../services/api';

interface AccountState {
  accounts: Account[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  add: (data: Partial<Account>) => Promise<void>;
  update: (id: string, data: Partial<Account>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useAccountStore = create<AccountState>((set) => ({
  accounts: [],
  loading: true,
  error: null,

  fetch: async () => {
    try {
      set({ loading: true, error: null });
      const accounts = await api.fetchAccounts();
      set({ accounts, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load accounts',
      });
    }
  },

  add: async (data) => {
    const account = await api.createAccount(data);
    set((s) => ({ accounts: [...s.accounts, account] }));
  },

  update: async (id, data) => {
    const updated = await api.updateAccount(id, data);
    set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? updated : a)) }));
  },

  remove: async (id) => {
    await api.deleteAccount(id);
    set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) }));
  },
}));
