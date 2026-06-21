import { create } from 'zustand';

import type { Scenario } from '../types';
import * as api from '../services/api';

interface ScenarioState {
  scenarios: Scenario[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  add: (data: Partial<Scenario>) => Promise<void>;
  update: (id: string, data: Partial<Scenario>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useScenarioStore = create<ScenarioState>((set) => ({
  scenarios: [],
  loading: true,
  error: null,

  fetch: async () => {
    try {
      set({ loading: true, error: null });
      const scenarios = await api.fetchScenarios();
      set({ scenarios, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load scenarios',
      });
    }
  },

  add: async (data) => {
    const scenario = await api.createScenario(data);
    set((s) => ({ scenarios: [...s.scenarios, scenario] }));
  },

  update: async (id, data) => {
    const updated = await api.updateScenario(id, data);
    set((s) => ({ scenarios: s.scenarios.map((sc) => (sc.id === id ? updated : sc)) }));
  },

  remove: async (id) => {
    await api.deleteScenario(id);
    set((s) => ({ scenarios: s.scenarios.filter((sc) => sc.id !== id) }));
  },
}));
