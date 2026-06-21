import { useEffect, useState } from 'react';

import { useIncomeStore } from '../stores/incomeStore';
import { useExpenseStore } from '../stores/expenseStore';
import { useScenarioStore } from '../stores/scenarioStore';
import { useSettingsStore } from '../stores/settingsStore';
import type { Frequency, Scenario } from '../types';
import { convertAmount, isActiveOnDate } from '../utils/money';
import LoanCalculator from '../components/LoanCalculator';
import ScenarioBuilder from '../components/ScenarioBuilder';
import ScenarioCompare from '../components/ScenarioCompare';

type Tab = 'loan' | 'scenario' | 'compare';

const TABS: { value: Tab; label: string }[] = [
  { value: 'loan', label: 'Loan Calculator' },
  { value: 'scenario', label: 'Scenario Builder' },
  { value: 'compare', label: 'Saved Scenarios' },
];

export default function Affordability() {
  const { income, fetch: fetchIncome } = useIncomeStore();
  const { expenses, categories, fetchExpenses, fetchCategories } = useExpenseStore();
  const {
    scenarios,
    fetch: fetchScenarios,
    add: addScenario,
    update: updateScenario,
    remove: removeScenario,
  } = useScenarioStore();
  const { settings, displayPeriod } = useSettingsStore();

  const [tab, setTab] = useState<Tab>('loan');
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);

  useEffect(() => {
    fetchIncome();
    fetchExpenses();
    fetchCategories();
    fetchScenarios();
  }, [fetchIncome, fetchExpenses, fetchCategories, fetchScenarios]);

  const currencySymbol = settings?.currencySymbol || '$';

  const surplusFrequency: Frequency = displayPeriod;

  const totalIncome = income
    .filter((i) => i.active && i.frequency !== 'one-off' && isActiveOnDate(i.startDate, i.endDate))
    .reduce((sum, i) => {
      const net = i.isGross && i.taxRate ? i.amount * (1 - i.taxRate / 100) : i.amount;
      return sum + convertAmount(net, i.frequency, surplusFrequency);
    }, 0);

  const totalExpenses = expenses
    .filter(
      (e) =>
        e.active &&
        !e.paused &&
        e.frequency !== 'one-off' &&
        isActiveOnDate(e.startDate, e.endDate),
    )
    .reduce((sum, e) => sum + convertAmount(e.amount, e.frequency, surplusFrequency), 0);

  const currentSurplus = totalIncome - totalExpenses;

  const handleSaveLoanScenario = async (data: {
    name: string;
    purchasePrice: number;
    deposit: number;
    interestRate: number;
    termYears: number;
    repaymentFrequency: Frequency;
  }) => {
    await addScenario({
      name: data.name,
      type: 'loan',
      loanDetails: {
        purchasePrice: data.purchasePrice,
        deposit: data.deposit,
        interestRate: data.interestRate,
        termYears: data.termYears,
        repaymentFrequency: data.repaymentFrequency,
      },
      removedExpenseIds: [],
      removedIncomeIds: [],
      additionalExpenses: [],
    });
    setTab('compare');
  };

  const handleSaveScenario = async (scenarioData: Omit<Scenario, 'id' | 'createdAt'>) => {
    if (editingScenario) {
      await updateScenario(editingScenario.id, scenarioData);
      setEditingScenario(null);
    } else {
      await addScenario(scenarioData);
    }
    setTab('compare');
  };

  const handleEdit = (scenario: Scenario) => {
    setEditingScenario(scenario);
    setTab('scenario');
  };

  const handleDelete = async (id: string) => {
    await removeScenario(id);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Affordability</h1>
      </div>

      <div className="mb-6 flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800/50">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => {
              if (t.value === 'scenario' && tab !== 'scenario') {
                setEditingScenario(null);
              }
              setTab(t.value);
            }}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.value
                ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-800 dark:text-slate-100 dark:shadow-none'
                : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
            }`}
          >
            {t.label}
            {t.value === 'compare' && scenarios.length > 0 && (
              <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-600 dark:bg-slate-600 dark:text-slate-300">
                {scenarios.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className={tab !== 'loan' ? 'hidden' : undefined}>
        <LoanCalculator
          currentSurplus={currentSurplus}
          surplusFrequency={surplusFrequency}
          currencySymbol={currencySymbol}
          onSaveScenario={handleSaveLoanScenario}
        />
      </div>

      <div className={tab !== 'scenario' ? 'hidden' : undefined}>
        <ScenarioBuilder
          key={editingScenario?.id || 'new'}
          currentSurplus={currentSurplus}
          surplusFrequency={surplusFrequency}
          categories={categories}
          expenses={expenses}
          income={income}
          currencySymbol={currencySymbol}
          editScenario={editingScenario}
          onSave={handleSaveScenario}
        />
      </div>

      <div className={tab !== 'compare' ? 'hidden' : undefined}>
        <ScenarioCompare
          scenarios={scenarios}
          expenses={expenses}
          income={income}
          currentSurplus={currentSurplus}
          surplusFrequency={surplusFrequency}
          currencySymbol={currencySymbol}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
