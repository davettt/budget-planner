import { useEffect } from 'react';

import { useAccountStore } from '../stores/accountStore';
import { useIncomeStore } from '../stores/incomeStore';
import { useExpenseStore } from '../stores/expenseStore';
import { useSettingsStore } from '../stores/settingsStore';
import { convertAmount, formatCurrency, isActiveOnDate, periodLabel } from '../utils/money';
import {
  calculatePeriodIncome,
  calculatePeriodExpenses,
  calculatePeriodCategoryTotals,
  formatPeriodLabel,
} from '../utils/periodCalc';
import PeriodSelector from '../components/PeriodSelector';
import BudgetSummary from '../components/BudgetSummary';
import CategoryBreakdown from '../components/CategoryBreakdown';
import CashFlowChart from '../components/CashFlowChart';

const ASSET_TYPES = new Set(['savings', 'transaction', 'investment', 'cash']);
const LIABILITY_TYPES = new Set(['credit-card', 'loan', 'mortgage']);

export default function Dashboard() {
  const { accounts, fetch: fetchAccounts } = useAccountStore();
  const { income, fetch: fetchIncome } = useIncomeStore();
  const { expenses, categories, fetchExpenses, fetchCategories } = useExpenseStore();
  const { settings, displayPeriod, calcMode, periodWindow } = useSettingsStore();

  useEffect(() => {
    fetchAccounts();
    fetchIncome();
    fetchExpenses();
    fetchCategories();
  }, [fetchAccounts, fetchIncome, fetchExpenses, fetchCategories]);

  const currencySymbol = settings?.currencySymbol || '$';

  const isActual = calcMode === 'actual';

  const totalIncome = isActual
    ? calculatePeriodIncome(income, periodWindow)
    : income
        .filter(
          (i) => i.active && i.frequency !== 'one-off' && isActiveOnDate(i.startDate, i.endDate),
        )
        .reduce((sum, i) => {
          const net = i.isGross && i.taxRate ? i.amount * (1 - i.taxRate / 100) : i.amount;
          return sum + convertAmount(net, i.frequency, displayPeriod);
        }, 0);

  const totalExpenses = isActual
    ? calculatePeriodExpenses(expenses, periodWindow)
    : expenses
        .filter(
          (e) =>
            e.active &&
            !e.paused &&
            e.frequency !== 'one-off' &&
            isActiveOnDate(e.startDate, e.endDate),
        )
        .reduce((sum, e) => sum + convertAmount(e.amount, e.frequency, displayPeriod), 0);

  const surplus = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (surplus / totalIncome) * 100 : 0;
  const dailyBurn =
    totalExpenses > 0 ? convertAmount(totalExpenses, displayPeriod, 'weekly') / 7 : 0;

  const totalAssets = accounts
    .filter((a) => ASSET_TYPES.has(a.type))
    .reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = accounts
    .filter((a) => LIABILITY_TYPES.has(a.type))
    .reduce((sum, a) => sum + Math.abs(a.balance), 0);
  const netWorth = totalAssets - totalLiabilities;

  const categoryTotals = isActual
    ? calculatePeriodCategoryTotals(expenses, periodWindow)
    : (() => {
        const totals = new Map<string, number>();
        for (const e of expenses.filter(
          (e) =>
            e.active &&
            !e.paused &&
            e.frequency !== 'one-off' &&
            isActiveOnDate(e.startDate, e.endDate),
        )) {
          const converted = convertAmount(e.amount, e.frequency, displayPeriod);
          totals.set(e.categoryId, (totals.get(e.categoryId) || 0) + converted);
        }
        return totals;
      })();

  let largestCategory = '';
  let largestAmount = 0;
  for (const [id, amount] of categoryTotals) {
    if (amount > largestAmount) {
      largestAmount = amount;
      largestCategory = categories.find((c) => c.id === id)?.name || id;
    }
  }

  const hasData = income.length > 0 || expenses.length > 0 || accounts.length > 0;

  if (!hasData) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Dashboard</h1>
        </div>
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-600 dark:bg-slate-800">
          <p className="text-lg font-medium text-slate-400 dark:text-slate-500">
            Welcome to Budget Planner
          </p>
          <p className="mt-2 text-sm text-slate-300 dark:text-slate-500">
            Start by adding your accounts, income, and expenses to see your budget overview here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Dashboard</h1>
        <PeriodSelector />
      </div>

      {/* Quick stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-800">
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Savings Rate</p>
          <p
            className={`mt-0.5 text-xl font-bold ${savingsRate >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
          >
            {savingsRate.toFixed(0)}%
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-800">
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Daily Burn</p>
          <p className="mt-0.5 text-xl font-bold text-slate-700 dark:text-slate-200">
            {formatCurrency(dailyBurn, currencySymbol)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-800">
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Net Worth</p>
          <p
            className={`mt-0.5 text-xl font-bold ${netWorth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
          >
            {formatCurrency(netWorth, currencySymbol)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-800">
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
            Biggest Expense
          </p>
          <p className="mt-0.5 truncate text-sm font-bold text-slate-700 dark:text-slate-200">
            {largestCategory || '—'}
          </p>
          {largestAmount > 0 && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {formatCurrency(largestAmount, currencySymbol)}
              {isActual
                ? ` (${formatPeriodLabel(periodWindow, displayPeriod)})`
                : periodLabel(displayPeriod)}
            </p>
          )}
        </div>
      </div>

      {/* Budget summary bar chart */}
      {(totalIncome > 0 || totalExpenses > 0) && (
        <div className="mb-6">
          <BudgetSummary
            income={totalIncome}
            expenses={totalExpenses}
            currencySymbol={currencySymbol}
          />
        </div>
      )}

      {/* Charts row */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CategoryBreakdown
          expenses={expenses}
          categories={categories}
          displayPeriod={displayPeriod}
          currencySymbol={currencySymbol}
          calcMode={calcMode}
          periodWindow={periodWindow}
        />
        <CashFlowChart
          accounts={accounts}
          income={income}
          expenses={expenses}
          currencySymbol={currencySymbol}
        />
      </div>

      {/* Accounts overview */}
      {accounts.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
            Accounts
          </h3>
          <div className="space-y-2">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between rounded-lg border border-slate-50 px-3 py-2 dark:border-slate-700"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-700 dark:text-slate-200">{account.name}</span>
                  {account.institution && (
                    <span className="text-[10px] text-slate-300 dark:text-slate-500">
                      {account.institution}
                    </span>
                  )}
                </div>
                <span
                  className={`text-sm font-semibold ${ASSET_TYPES.has(account.type) ? 'text-emerald-600' : 'text-red-600'}`}
                >
                  {formatCurrency(
                    account.type === 'credit-card' ? -Math.abs(account.balance) : account.balance,
                    currencySymbol,
                  )}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-700">
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                Net Worth
              </span>
              <span
                className={`text-sm font-bold ${netWorth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
              >
                {formatCurrency(netWorth, currencySymbol)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
