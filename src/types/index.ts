export type AccountType =
  'savings' | 'transaction' | 'credit-card' | 'loan' | 'mortgage' | 'investment' | 'cash';

export interface BalanceEntry {
  date: string;
  balance: number;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  interestRate: number | null;
  monthlyFee: number;
  institution: string | null;
  creditLimit: number | null;
  balanceHistory: BalanceEntry[];
  createdAt: string;
  updatedAt: string;
}

export type Frequency =
  'daily' | 'weekly' | 'fortnightly' | 'monthly' | 'quarterly' | 'annually' | 'one-off';

export interface Income {
  id: string;
  name: string;
  amount: number;
  frequency: Frequency;
  isGross: boolean;
  taxRate: number | null;
  startDate: string;
  endDate: string | null;
  active: boolean;
  createdAt: string;
}

export type EntryMode = 'individual' | 'category-total' | 'quick-estimate';

export interface Expense {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  subcategory: string | null;
  frequency: Frequency;
  entryMode: EntryMode;
  statementPeriod: string | null;
  startDate: string;
  endDate: string | null;
  active: boolean;
  paused: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  subcategories: string[];
  isDefault: boolean;
  sortOrder: number;
}

export interface LoanDetails {
  purchasePrice: number;
  deposit: number;
  interestRate: number;
  termYears: number;
  repaymentFrequency: Frequency;
}

export interface ScenarioExpense {
  name: string;
  amount: number;
  frequency: Frequency;
  categoryId: string;
}

export interface Scenario {
  id: string;
  name: string;
  type: 'loan' | 'general';
  loanDetails: LoanDetails | null;
  removedExpenseIds: string[];
  removedIncomeIds: string[];
  additionalExpenses: ScenarioExpense[];
  createdAt: string;
}

export interface Settings {
  currency: string;
  currencySymbol: string;
  defaultPeriod: DisplayPeriod;
  theme: 'light' | 'dark' | 'system';
  lastVersionCheck: string | null;
  financialYearStartMonth: number;
}

export interface PeriodWindow {
  start: Date;
  end: Date;
}

export type CalcMode = 'run-rate' | 'actual';

export interface NetWorthSnapshot {
  date: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  breakdown: Record<string, number>;
}

export type DisplayPeriod = 'weekly' | 'fortnightly' | 'monthly' | 'annually';

export interface BackupData {
  version: string;
  exportedAt: string;
  accounts: Account[];
  income: Income[];
  expenses: Expense[];
  categories: Category[];
  scenarios: Scenario[];
  settings: Settings;
  networthHistory: NetWorthSnapshot[];
}
