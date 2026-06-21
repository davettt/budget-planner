import { useState, useMemo } from 'react';

import type { Scenario, Frequency, Expense, Income } from '../types';
import { formatCurrency, convertAmount, isActiveOnDate } from '../utils/money';
import { calculateLoanRepayment } from '../utils/calculations';

import ConfirmDialog from './ConfirmDialog';

interface ScenarioCompareProps {
  scenarios: Scenario[];
  expenses: Expense[];
  income: Income[];
  currentSurplus: number;
  surplusFrequency: Frequency;
  currencySymbol: string;
  onEdit: (scenario: Scenario) => void;
  onDelete: (id: string) => void;
}

export default function ScenarioCompare({
  scenarios,
  expenses,
  income,
  currentSurplus,
  surplusFrequency,
  currencySymbol,
  onEdit,
  onDelete,
}: ScenarioCompareProps) {
  const [confirmDelete, setConfirmDelete] = useState<Scenario | null>(null);

  const activeExpenses = useMemo(
    () =>
      expenses.filter(
        (e) =>
          e.active &&
          !e.paused &&
          e.frequency !== 'one-off' &&
          isActiveOnDate(e.startDate, e.endDate),
      ),
    [expenses],
  );

  const activeIncome = useMemo(
    () =>
      income.filter(
        (i) => i.active && i.frequency !== 'one-off' && isActiveOnDate(i.startDate, i.endDate),
      ),
    [income],
  );

  if (scenarios.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center dark:border-slate-600 dark:bg-slate-800">
        <p className="text-sm text-slate-400 dark:text-slate-500">No saved scenarios yet.</p>
        <p className="mt-1 text-xs text-slate-300 dark:text-slate-500">
          Use the Loan Calculator or Scenario Builder to create scenarios, then compare them here.
        </p>
      </div>
    );
  }

  const getScenarioBreakdown = (scenario: Scenario) => {
    const removedExpenseIds = new Set(scenario.removedExpenseIds || []);
    const removedIncomeIds = new Set(scenario.removedIncomeIds || []);

    const savings = activeExpenses
      .filter((e) => removedExpenseIds.has(e.id))
      .reduce((sum, e) => sum + convertAmount(e.amount, e.frequency, surplusFrequency), 0);

    const lostIncome = activeIncome
      .filter((i) => removedIncomeIds.has(i.id))
      .reduce((sum, i) => {
        const net = i.isGross && i.taxRate ? i.amount * (1 - i.taxRate / 100) : i.amount;
        return sum + convertAmount(net, i.frequency, surplusFrequency);
      }, 0);

    let loanCost = 0;
    if (scenario.loanDetails) {
      const ld = scenario.loanDetails;
      const principal = ld.purchasePrice - ld.deposit;
      const result = calculateLoanRepayment(
        principal,
        ld.interestRate,
        ld.termYears,
        ld.repaymentFrequency,
      );
      loanCost = convertAmount(result.repayment, ld.repaymentFrequency, surplusFrequency);
    }

    const recurring = (scenario.additionalExpenses || []).filter((e) => e.frequency !== 'one-off');
    const oneOffs = (scenario.additionalExpenses || []).filter((e) => e.frequency === 'one-off');

    const newRecurringCost = recurring.reduce(
      (sum, e) => sum + convertAmount(e.amount, e.frequency, surplusFrequency),
      0,
    );

    const totalOneOff = oneOffs.reduce((sum, e) => sum + e.amount, 0);

    const newSurplus = currentSurplus + savings - lostIncome - loanCost - newRecurringCost;

    return {
      savings,
      lostIncome,
      loanCost,
      recurring,
      oneOffs,
      newRecurringCost,
      totalOneOff,
      newSurplus,
      removedExpenseCount: removedExpenseIds.size,
      removedIncomeCount: removedIncomeIds.size,
    };
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Current Budget</p>
          <p
            className={`text-lg font-bold ${currentSurplus >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
          >
            {formatCurrency(currentSurplus, currencySymbol)}/{surplusFrequency}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {confirmDelete && (
          <ConfirmDialog
            title="Delete Scenario"
            message={`Are you sure you want to delete "${confirmDelete.name}"? This cannot be undone.`}
            confirmLabel="Delete"
            confirmVariant="danger"
            onConfirm={() => {
              onDelete(confirmDelete.id);
              setConfirmDelete(null);
            }}
            onCancel={() => setConfirmDelete(null)}
          />
        )}

        {scenarios.map((scenario) => {
          const b = getScenarioBreakdown(scenario);
          const level =
            b.newSurplus >= currentSurplus * 0.1 ? 'green' : b.newSurplus >= 0 ? 'amber' : 'red';

          const borderColors = {
            green: 'border-emerald-200 dark:border-emerald-800',
            amber: 'border-amber-200 dark:border-amber-800',
            red: 'border-red-200 dark:border-red-800',
          };

          const dotColors = {
            green: 'bg-emerald-500',
            amber: 'bg-amber-500',
            red: 'bg-red-500',
          };

          return (
            <div
              key={scenario.id}
              className={`rounded-xl border-2 bg-white p-4 dark:bg-slate-800 ${borderColors[level]}`}
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${dotColors[level]}`} />
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {scenario.name}
                    </h4>
                  </div>
                  <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                    {new Date(scenario.createdAt).toLocaleDateString('en-AU')}
                  </p>
                </div>
              </div>

              {/* Breakdown */}
              <div className="mb-3 space-y-1.5 text-xs">
                {scenario.loanDetails && (
                  <div className="text-slate-500 dark:text-slate-400">
                    <p>
                      Loan: {formatCurrency(scenario.loanDetails.purchasePrice, currencySymbol)} −{' '}
                      {formatCurrency(scenario.loanDetails.deposit, currencySymbol)} deposit
                    </p>
                    <p className="text-[10px]">
                      {scenario.loanDetails.interestRate}% over {scenario.loanDetails.termYears}yrs
                    </p>
                  </div>
                )}

                {b.savings > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Stopped expenses ({b.removedExpenseCount})</span>
                    <span>+{formatCurrency(b.savings, currencySymbol)}</span>
                  </div>
                )}

                {b.lostIncome > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Lost income ({b.removedIncomeCount})</span>
                    <span>-{formatCurrency(b.lostIncome, currencySymbol)}</span>
                  </div>
                )}

                {b.loanCost > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Loan repayment</span>
                    <span>-{formatCurrency(b.loanCost, currencySymbol)}</span>
                  </div>
                )}

                {b.newRecurringCost > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>New expenses ({b.recurring.length})</span>
                    <span>-{formatCurrency(b.newRecurringCost, currencySymbol)}</span>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="mb-3 rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">New Surplus</p>
                    <p
                      className={`text-sm font-bold ${b.newSurplus >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                    >
                      {formatCurrency(b.newSurplus, currencySymbol)}/{surplusFrequency}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      {b.totalOneOff > 0 ? 'Upfront Costs' : 'Change'}
                    </p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {b.totalOneOff > 0
                        ? formatCurrency(b.totalOneOff, currencySymbol)
                        : `${b.newSurplus >= currentSurplus ? '+' : ''}${formatCurrency(b.newSurplus - currentSurplus, currencySymbol)}`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(scenario)}
                  className="flex-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500"
                >
                  Edit
                </button>
                <button
                  onClick={() => setConfirmDelete(scenario)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:text-red-500 dark:border-slate-600 dark:text-slate-500"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
