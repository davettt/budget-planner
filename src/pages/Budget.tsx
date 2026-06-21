import { useEffect, useState, useMemo } from 'react';

import { useIncomeStore } from '../stores/incomeStore';
import { useExpenseStore } from '../stores/expenseStore';
import { useSettingsStore } from '../stores/settingsStore';
import type { Income, Expense } from '../types';
import { convertAmount, formatCurrency, isActiveOnDate, periodLabel } from '../utils/money';
import {
  calculatePeriodIncome,
  calculatePeriodExpenses,
  calculateProratedAmount,
  formatPeriodLabel,
} from '../utils/periodCalc';
import PeriodSelector from '../components/PeriodSelector';
import IncomeForm from '../components/IncomeForm';
import ExpenseForm from '../components/ExpenseForm';
import CategoryManager from '../components/CategoryManager';

type SortField = 'name' | 'amount' | 'category' | 'frequency';
type SortDir = 'asc' | 'desc';

export default function Budget() {
  const {
    income,
    loading: incomeLoading,
    fetch: fetchIncome,
    add: addIncome,
    update: updateIncome,
    remove: removeIncome,
  } = useIncomeStore();
  const {
    expenses,
    categories,
    loading: expenseLoading,
    fetchExpenses,
    fetchCategories,
    addExpense,
    updateExpense,
    removeExpense,
    addCategory,
    updateCategory,
    removeCategory,
  } = useExpenseStore();
  const { settings, displayPeriod, calcMode, periodWindow } = useSettingsStore();

  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showCategories, setShowCategories] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  useEffect(() => {
    fetchIncome();
    fetchExpenses();
    fetchCategories();
  }, [fetchIncome, fetchExpenses, fetchCategories]);

  const currencySymbol = settings?.currencySymbol || '$';
  const isActual = calcMode === 'actual';

  const activeIncome = income.filter((i) => i.active);
  const runRateIncome = activeIncome.filter(
    (i) => i.frequency !== 'one-off' && isActiveOnDate(i.startDate, i.endDate),
  );
  const totalIncome = isActual
    ? calculatePeriodIncome(income, periodWindow)
    : runRateIncome.reduce((sum, i) => {
        const net = i.isGross && i.taxRate ? i.amount * (1 - i.taxRate / 100) : i.amount;
        return sum + convertAmount(net, i.frequency, displayPeriod);
      }, 0);

  const activeExpenses = expenses.filter((e) => e.active && !e.paused);
  const runRateExpenses = activeExpenses.filter(
    (e) => e.frequency !== 'one-off' && isActiveOnDate(e.startDate, e.endDate),
  );
  const totalExpenses = isActual
    ? calculatePeriodExpenses(expenses, periodWindow)
    : runRateExpenses.reduce(
        (sum, e) => sum + convertAmount(e.amount, e.frequency, displayPeriod),
        0,
      );

  const visibleIncome = isActual
    ? activeIncome.filter(
        (i) =>
          calculateProratedAmount(i.amount, i.frequency, i.startDate, i.endDate, periodWindow) > 0,
      )
    : runRateIncome;

  const surplus = totalIncome - totalExpenses;

  const getDisplayAmount = (e: Expense): number => {
    if (e.frequency === 'one-off') return e.amount;
    return convertAmount(e.amount, e.frequency, displayPeriod);
  };

  const getIncomeDisplayAmount = (i: Income): number => {
    const net = i.isGross && i.taxRate ? i.amount * (1 - i.taxRate / 100) : i.amount;
    if (i.frequency === 'one-off') return net;
    return convertAmount(net, i.frequency, displayPeriod);
  };

  const filteredExpenses = useMemo(() => {
    let filtered = [...expenses];
    if (isActual) {
      filtered = filtered.filter(
        (e) =>
          e.paused ||
          calculateProratedAmount(e.amount, e.frequency, e.startDate, e.endDate, periodWindow) > 0,
      );
    } else {
      filtered = filtered.filter(
        (e) =>
          e.active &&
          !e.paused &&
          e.frequency !== 'one-off' &&
          isActiveOnDate(e.startDate, e.endDate),
      );
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((e) => e.categoryId === categoryFilter);
    }

    filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'amount':
          cmp = getDisplayAmount(a) - getDisplayAmount(b);
          break;
        case 'category':
          cmp = a.categoryId.localeCompare(b.categoryId);
          break;
        case 'frequency':
          cmp = a.frequency.localeCompare(b.frequency);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return filtered;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, categoryFilter, sortField, sortDir, displayPeriod, calcMode, periodWindow]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name || id;
  const getCategoryColor = (id: string) => categories.find((c) => c.id === id)?.color || '#94A3B8';

  const handleSaveIncome = async (data: Partial<Income>) => {
    if (editingIncome) {
      await updateIncome(editingIncome.id, data);
    } else {
      await addIncome(data);
    }
    setShowIncomeForm(false);
    setEditingIncome(null);
  };

  const handleDeleteIncome = async () => {
    if (editingIncome) {
      await removeIncome(editingIncome.id);
      setShowIncomeForm(false);
      setEditingIncome(null);
    }
  };

  const handleSaveExpense = async (data: Partial<Expense>) => {
    if (editingExpense) {
      await updateExpense(editingExpense.id, data);
    } else {
      await addExpense(data);
    }
    setShowExpenseForm(false);
    setEditingExpense(null);
  };

  const handleDeleteExpense = async () => {
    if (editingExpense) {
      await removeExpense(editingExpense.id);
      setShowExpenseForm(false);
      setEditingExpense(null);
    }
  };

  if (incomeLoading || expenseLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-slate-400 dark:text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Budget</h1>
        <PeriodSelector />
      </div>

      {/* Summary bar */}
      {(income.length > 0 || expenses.length > 0) && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Income</p>
            <p className="mt-1 text-lg font-bold text-emerald-600">
              {formatCurrency(totalIncome, currencySymbol)}
            </p>
            <p className="text-[10px] text-slate-300 dark:text-slate-500">
              {isActual
                ? formatPeriodLabel(periodWindow, displayPeriod)
                : periodLabel(displayPeriod)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Expenses</p>
            <p className="mt-1 text-lg font-bold text-red-600">
              {formatCurrency(totalExpenses, currencySymbol)}
            </p>
            <p className="text-[10px] text-slate-300 dark:text-slate-500">
              {isActual
                ? formatPeriodLabel(periodWindow, displayPeriod)
                : periodLabel(displayPeriod)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
              {surplus >= 0 ? 'Surplus' : 'Deficit'}
            </p>
            <p
              className={`mt-1 text-lg font-bold ${surplus >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
            >
              {formatCurrency(surplus, currencySymbol)}
            </p>
            <p className="text-[10px] text-slate-300 dark:text-slate-500">
              {isActual
                ? formatPeriodLabel(periodWindow, displayPeriod)
                : periodLabel(displayPeriod)}
            </p>
          </div>
        </div>
      )}

      {/* Income section */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Income</h2>
          <button
            onClick={() => {
              setEditingIncome(null);
              setShowIncomeForm(true);
            }}
            className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            + Add
          </button>
        </div>

        {visibleIncome.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {isActual && activeIncome.length > 0
                ? 'No income in this period.'
                : 'No income streams yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleIncome.map((item) => {
              const converted = getIncomeDisplayAmount(item);
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setEditingIncome(item);
                    setShowIncomeForm(true);
                  }}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-left transition-shadow hover:shadow-sm dark:border-slate-700 dark:bg-slate-800"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {formatCurrency(item.amount, currencySymbol)} {item.frequency}
                      {item.isGross && item.taxRate ? ` (${item.taxRate}% tax)` : ''}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-emerald-600">
                    {formatCurrency(converted, currencySymbol)}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Expenses section */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Expenses</h2>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded border border-slate-200 px-2 py-0.5 text-xs text-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCategories(true)}
              className="text-xs text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            >
              Categories
            </button>
            <button
              onClick={() => {
                setEditingExpense(null);
                setShowExpenseForm(true);
              }}
              className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              + Add
            </button>
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {categoryFilter !== 'all'
                ? 'No expenses in this category.'
                : isActual && expenses.length > 0
                  ? 'No expenses in this period.'
                  : 'No expenses yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] font-medium text-slate-400 dark:border-slate-700 dark:text-slate-500">
                  <th
                    className="cursor-pointer px-4 py-2 hover:text-slate-600 dark:hover:text-slate-300"
                    onClick={() => toggleSort('name')}
                  >
                    Name {sortField === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="cursor-pointer px-4 py-2 hover:text-slate-600 dark:hover:text-slate-300"
                    onClick={() => toggleSort('category')}
                  >
                    Category {sortField === 'category' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="cursor-pointer px-4 py-2 text-right hover:text-slate-600 dark:hover:text-slate-300"
                    onClick={() => toggleSort('amount')}
                  >
                    Amount {sortField === 'amount' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => {
                  const converted = getDisplayAmount(expense);
                  return (
                    <tr
                      key={expense.id}
                      onClick={() => {
                        setEditingExpense(expense);
                        setShowExpenseForm(true);
                      }}
                      className={`cursor-pointer border-b border-slate-50 transition-colors hover:bg-slate-50 dark:border-slate-700/50 dark:hover:bg-slate-700/50 ${
                        expense.paused || !expense.active ? 'opacity-50' : ''
                      }`}
                    >
                      <td className="px-4 py-2.5">
                        <p className="text-sm text-slate-700 dark:text-slate-200">{expense.name}</p>
                        <p className="text-[10px] text-slate-300 dark:text-slate-500">
                          {formatCurrency(expense.amount, currencySymbol)} {expense.frequency}
                          {expense.entryMode !== 'individual' && ` · ${expense.entryMode}`}
                        </p>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: getCategoryColor(expense.categoryId) }}
                          />
                          {getCategoryName(expense.categoryId)}
                          {expense.subcategory && (
                            <span className="text-slate-300 dark:text-slate-600">
                              ({expense.subcategory})
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm font-medium text-red-600">
                        {formatCurrency(converted, currencySymbol)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {expense.paused ? (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:bg-amber-900/20">
                            Paused
                          </span>
                        ) : !expense.active ? (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400 dark:bg-slate-700 dark:text-slate-500">
                            Ended
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:bg-emerald-900/20">
                            Active
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showIncomeForm && (
        <IncomeForm
          income={editingIncome}
          onSave={handleSaveIncome}
          onDelete={editingIncome ? handleDeleteIncome : undefined}
          onClose={() => {
            setShowIncomeForm(false);
            setEditingIncome(null);
          }}
        />
      )}

      {showExpenseForm && (
        <ExpenseForm
          expense={editingExpense}
          categories={categories}
          currencySymbol={currencySymbol}
          onSave={handleSaveExpense}
          onDelete={editingExpense ? handleDeleteExpense : undefined}
          onClose={() => {
            setShowExpenseForm(false);
            setEditingExpense(null);
          }}
        />
      )}

      {showCategories && (
        <CategoryManager
          categories={categories}
          onAdd={addCategory}
          onUpdate={updateCategory}
          onDelete={removeCategory}
          onClose={() => setShowCategories(false)}
        />
      )}
    </div>
  );
}
