import { useState } from 'react';

import type { Expense, Category, Frequency, EntryMode } from '../types';

import ConfirmDialog from './ConfirmDialog';

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'one-off', label: 'One-off' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'fortnightly', label: 'Fortnightly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
];

const MODES: { value: EntryMode; label: string; description: string }[] = [
  { value: 'individual', label: 'Individual', description: 'A specific expense item' },
  {
    value: 'category-total',
    label: 'Category Total',
    description: 'Total for a category from a statement',
  },
  { value: 'quick-estimate', label: 'Quick Estimate', description: 'Rough daily/weekly spend' },
];

interface ExpenseFormProps {
  expense: Expense | null;
  categories: Category[];
  currencySymbol?: string;
  onSave: (data: Partial<Expense>) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export default function ExpenseForm({
  expense,
  categories,
  currencySymbol = '$',
  onSave,
  onDelete,
  onClose,
}: ExpenseFormProps) {
  const [mode, setMode] = useState<EntryMode>(expense?.entryMode || 'individual');
  const [name, setName] = useState(expense?.name || '');
  const [amount, setAmount] = useState(expense ? String(expense.amount) : '');
  const [categoryId, setCategoryId] = useState(expense?.categoryId || categories[0]?.id || '');
  const [subcategory, setSubcategory] = useState(expense?.subcategory || '');
  const [frequency, setFrequency] = useState<Frequency>(expense?.frequency || 'monthly');
  const todayStr = new Date().toISOString().split('T')[0]!;
  const patternDefault = `${new Date().getFullYear() - 3}-01-01`;
  const [startDate, setStartDate] = useState(
    expense?.startDate ||
      (mode === 'quick-estimate' || mode === 'category-total' ? patternDefault : todayStr),
  );
  const [endDate, setEndDate] = useState(expense?.endDate || '');
  const [statementPeriod, setStatementPeriod] = useState(expense?.statementPeriod || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleModeChange = (newMode: EntryMode) => {
    setMode(newMode);
    if (!expense) {
      setStartDate(
        newMode === 'quick-estimate' || newMode === 'category-total' ? patternDefault : todayStr,
      );
    }
  };

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount < 0) return;

    const expenseName =
      mode === 'category-total'
        ? name.trim() ||
          `${selectedCategory?.name || categoryId} - ${statementPeriod || 'Statement'}`
        : mode === 'quick-estimate'
          ? name.trim() || `${selectedCategory?.name || categoryId} (estimate)`
          : name.trim();

    if (!expenseName) return;

    onSave({
      name: expenseName,
      amount: parsedAmount,
      categoryId,
      subcategory: subcategory || null,
      frequency: mode === 'category-total' ? 'one-off' : frequency,
      entryMode: mode,
      statementPeriod: mode === 'category-total' ? statementPeriod || null : null,
      startDate: mode === 'category-total' && statementPeriod ? `${statementPeriod}-01` : startDate,
      endDate: mode === 'category-total' ? null : endDate || null,
      active: expense?.active ?? true,
      paused: expense?.paused ?? false,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
          {expense ? 'Edit Expense' : 'Add Expense'}
        </h2>

        {!expense && (
          <div className="mb-4 flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800/50">
            {MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => handleModeChange(m.value)}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                  mode === m.value
                    ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                    : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                }`}
                title={m.description}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setSubcategory('');
              }}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {selectedCategory && selectedCategory.subcategories.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                Subcategory (optional)
              </label>
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              >
                <option value="">None</option>
                {selectedCategory.subcategories.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              {mode === 'category-total'
                ? 'Description (optional)'
                : mode === 'quick-estimate'
                  ? 'Name (optional)'
                  : 'Name'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                mode === 'category-total'
                  ? 'e.g. Credit card groceries'
                  : mode === 'quick-estimate'
                    ? 'e.g. Coffee, Lunch, Snacks'
                    : 'e.g. Rent, Netflix, Gym membership'
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              autoFocus={mode === 'individual'}
            />
          </div>

          {mode === 'category-total' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                Statement Period
              </label>
              <input
                type="month"
                value={statementPeriod}
                onChange={(e) => setStatementPeriod(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                {mode === 'category-total'
                  ? 'Total Amount'
                  : mode === 'quick-estimate'
                    ? 'Estimated Amount'
                    : 'Amount'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                autoFocus={mode !== 'individual'}
              />
            </div>
            {mode !== 'category-total' && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                  Frequency
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as Frequency)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                >
                  {FREQUENCIES.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {mode === 'quick-estimate' && (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              &quot;I spend about {currencySymbol}
              {amount || '0'} {frequency}&quot; — this will be normalised to your display period
              automatically.
            </p>
          )}

          {mode !== 'category-total' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                  End Date (optional)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-3">
              {expense && onDelete && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-xs text-red-400 transition-colors hover:text-red-600"
                >
                  Delete
                </button>
              )}
              {expense && !expense.paused && (
                <button
                  type="button"
                  onClick={() => {
                    const parsedAmount = parseFloat(amount);
                    onSave({
                      name: name.trim() || expense.name,
                      amount: parsedAmount > 0 ? parsedAmount : expense.amount,
                      categoryId,
                      subcategory: subcategory || null,
                      frequency: mode === 'category-total' ? 'one-off' : frequency,
                      paused: true,
                    });
                  }}
                  className="text-xs text-amber-500 transition-colors hover:text-amber-700"
                >
                  Pause
                </button>
              )}
              {expense?.paused && (
                <button
                  type="button"
                  onClick={() => {
                    const parsedAmount = parseFloat(amount);
                    onSave({
                      name: name.trim() || expense.name,
                      amount: parsedAmount > 0 ? parsedAmount : expense.amount,
                      categoryId,
                      subcategory: subcategory || null,
                      frequency: mode === 'category-total' ? 'one-off' : frequency,
                      paused: false,
                    });
                  }}
                  className="text-xs text-emerald-500 transition-colors hover:text-emerald-700"
                >
                  Resume
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
              >
                {expense ? 'Save' : 'Add Expense'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {showDeleteConfirm && expense && onDelete && (
        <ConfirmDialog
          title="Delete Expense"
          message={`Are you sure you want to delete "${expense.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={onDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
