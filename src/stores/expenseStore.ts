import { create } from 'zustand';

import type { Expense, Category } from '../types';
import * as api from '../services/api';

interface ExpenseState {
  expenses: Expense[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  fetchExpenses: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  addExpense: (data: Partial<Expense>) => Promise<void>;
  updateExpense: (id: string, data: Partial<Expense>) => Promise<void>;
  removeExpense: (id: string) => Promise<void>;
  addCategory: (data: Partial<Category>) => Promise<void>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
}

export const useExpenseStore = create<ExpenseState>((set) => ({
  expenses: [],
  categories: [],
  loading: true,
  error: null,

  fetchExpenses: async () => {
    try {
      set({ loading: true, error: null });
      const expenses = await api.fetchExpenses();
      set({ expenses, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load expenses',
      });
    }
  },

  fetchCategories: async () => {
    try {
      const categories = await api.fetchCategories();
      set({ categories });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load categories' });
    }
  },

  addExpense: async (data) => {
    const entry = await api.createExpense(data);
    set((s) => ({ expenses: [...s.expenses, entry] }));
  },

  updateExpense: async (id, data) => {
    const updated = await api.updateExpense(id, data);
    set((s) => ({ expenses: s.expenses.map((e) => (e.id === id ? updated : e)) }));
  },

  removeExpense: async (id) => {
    await api.deleteExpense(id);
    set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) }));
  },

  addCategory: async (data) => {
    const category = await api.createCategory(data);
    set((s) => ({ categories: [...s.categories, category] }));
  },

  updateCategory: async (id, data) => {
    const updated = await api.updateCategory(id, data);
    set((s) => ({ categories: s.categories.map((c) => (c.id === id ? updated : c)) }));
  },

  removeCategory: async (id) => {
    await api.deleteCategory(id);
    set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
  },
}));
