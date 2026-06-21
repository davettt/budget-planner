import type {
  Account,
  Income,
  Expense,
  Category,
  Scenario,
  Settings,
  NetWorthSnapshot,
  BackupData,
} from '../types';

const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error((err as { error?: string }).error || 'Request failed');
  }
  return res.json() as Promise<T>;
}

// Accounts
export const fetchAccounts = () => request<Account[]>('/accounts');
export const createAccount = (data: Partial<Account>) =>
  request<Account>('/accounts', { method: 'POST', body: JSON.stringify(data) });
export const updateAccount = (id: string, data: Partial<Account>) =>
  request<Account>(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteAccount = (id: string) =>
  request<{ success: boolean }>(`/accounts/${id}`, { method: 'DELETE' });

// Income
export const fetchIncome = () => request<Income[]>('/income');
export const createIncome = (data: Partial<Income>) =>
  request<Income>('/income', { method: 'POST', body: JSON.stringify(data) });
export const updateIncome = (id: string, data: Partial<Income>) =>
  request<Income>(`/income/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteIncome = (id: string) =>
  request<{ success: boolean }>(`/income/${id}`, { method: 'DELETE' });

// Expenses
export const fetchExpenses = () => request<Expense[]>('/expenses');
export const createExpense = (data: Partial<Expense>) =>
  request<Expense>('/expenses', { method: 'POST', body: JSON.stringify(data) });
export const updateExpense = (id: string, data: Partial<Expense>) =>
  request<Expense>(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteExpense = (id: string) =>
  request<{ success: boolean }>(`/expenses/${id}`, { method: 'DELETE' });

// Categories
export const fetchCategories = () => request<Category[]>('/categories');
export const createCategory = (data: Partial<Category>) =>
  request<Category>('/categories', { method: 'POST', body: JSON.stringify(data) });
export const updateCategory = (id: string, data: Partial<Category>) =>
  request<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCategory = (id: string) =>
  request<{ success: boolean }>(`/categories/${id}`, { method: 'DELETE' });

// Scenarios
export const fetchScenarios = () => request<Scenario[]>('/scenarios');
export const createScenario = (data: Partial<Scenario>) =>
  request<Scenario>('/scenarios', { method: 'POST', body: JSON.stringify(data) });
export const updateScenario = (id: string, data: Partial<Scenario>) =>
  request<Scenario>(`/scenarios/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteScenario = (id: string) =>
  request<{ success: boolean }>(`/scenarios/${id}`, { method: 'DELETE' });

// Net Worth
export const fetchNetWorth = () => request<NetWorthSnapshot[]>('/networth');
export const createNetWorthSnapshot = () =>
  request<NetWorthSnapshot>('/networth/snapshot', { method: 'POST' });

// Settings
export const fetchSettings = () => request<Settings>('/settings');
export const updateSettings = (data: Partial<Settings>) =>
  request<Settings>('/settings', { method: 'PUT', body: JSON.stringify(data) });

// Backup / Restore
export const fetchBackup = () => request<BackupData>('/backup');
export const restoreBackup = (data: BackupData) =>
  request<{ success: boolean }>('/restore', { method: 'POST', body: JSON.stringify(data) });
