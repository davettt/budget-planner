import { useState } from 'react';

import type { Income, Frequency } from '../types';
import { useDialog } from '../utils/useDialog';

import ConfirmDialog from './ConfirmDialog';

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'fortnightly', label: 'Fortnightly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
];

interface IncomeFormProps {
  income: Income | null;
  onSave: (data: Partial<Income>) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export default function IncomeForm({ income, onSave, onDelete, onClose }: IncomeFormProps) {
  const [name, setName] = useState(income?.name || '');
  const [amount, setAmount] = useState(income ? String(income.amount) : '');
  const [frequency, setFrequency] = useState<Frequency>(income?.frequency || 'monthly');
  const [isGross, setIsGross] = useState(income?.isGross ?? false);
  const [taxRate, setTaxRate] = useState(income?.taxRate != null ? String(income.taxRate) : '');
  const [startDate, setStartDate] = useState(
    income?.startDate || new Date().toISOString().split('T')[0],
  );
  const [endDate, setEndDate] = useState(income?.endDate || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { dialogRef, titleId } = useDialog(onClose);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!name.trim() || !parsedAmount || parsedAmount < 0) return;

    onSave({
      name: name.trim(),
      amount: parseFloat(amount),
      frequency,
      isGross,
      taxRate: isGross && taxRate ? parseFloat(taxRate) : null,
      startDate,
      endDate: endDate || null,
      active: income?.active ?? true,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="mb-5 text-lg font-semibold text-slate-800 dark:text-slate-100">
          {income ? 'Edit Income' : 'Add Income'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="income-name"
              className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              Name
            </label>
            <input
              id="income-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Salary, Freelance, Rental Income"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="income-amount"
                className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
              >
                Amount
              </label>
              <input
                id="income-amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
            <div>
              <label
                htmlFor="income-frequency"
                className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
              >
                Frequency
              </label>
              <select
                id="income-frequency"
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
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={isGross}
                onChange={(e) => setIsGross(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600"
              />
              This is gross (before tax)
            </label>
            {isGross && (
              <div className="flex items-center gap-1">
                <input
                  aria-label="Tax rate percent"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  placeholder="30"
                  className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
                <span className="text-xs text-slate-400 dark:text-slate-500">% tax</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="income-start-date"
                className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
              >
                Start Date
              </label>
              <input
                id="income-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
            <div>
              <label
                htmlFor="income-end-date"
                className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
              >
                End Date (optional)
              </label>
              <input
                id="income-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              {income && onDelete && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-xs text-red-400 transition-colors hover:text-red-600"
                >
                  Delete
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
                {income ? 'Save' : 'Add Income'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {showDeleteConfirm && income && onDelete && (
        <ConfirmDialog
          title="Delete Income"
          message={`Are you sure you want to delete "${income.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={onDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
