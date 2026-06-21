import { useState, useMemo } from 'react';

import type {
  Frequency,
  Category,
  ScenarioExpense,
  Scenario,
  Expense,
  Income,
  LoanDetails,
} from '../types';
import { formatCurrency, convertAmount, isActiveOnDate } from '../utils/money';
import { calculateLoanRepayment } from '../utils/calculations';

type KeyedExpense = ScenarioExpense & { _key: string };

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'fortnightly', label: 'Fortnightly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
];

interface ScenarioBuilderProps {
  currentSurplus: number;
  surplusFrequency: Frequency;
  categories: Category[];
  expenses: Expense[];
  income: Income[];
  currencySymbol: string;
  editScenario?: Scenario | null;
  onSave: (scenario: Omit<Scenario, 'id' | 'createdAt'>) => void;
}

export default function ScenarioBuilder({
  currentSurplus,
  surplusFrequency,
  categories,
  expenses,
  income,
  currencySymbol,
  editScenario,
  onSave,
}: ScenarioBuilderProps) {
  const [scenarioName, setScenarioName] = useState(editScenario?.name || '');

  // Loan section
  const editLoan = editScenario?.loanDetails;
  const [showLoan, setShowLoan] = useState(!!editLoan);
  const [purchasePrice, setPurchasePrice] = useState(
    editLoan ? String(editLoan.purchasePrice) : '',
  );
  const [deposit, setDeposit] = useState(editLoan ? String(editLoan.deposit) : '');
  const [interestRate, setInterestRate] = useState(editLoan ? String(editLoan.interestRate) : '');
  const [termYears, setTermYears] = useState(editLoan ? String(editLoan.termYears) : '30');
  const [loanFrequency, setLoanFrequency] = useState<Frequency>(
    editLoan?.repaymentFrequency || 'monthly',
  );

  // Removed expenses/income
  const [removedExpenseIds, setRemovedExpenseIds] = useState<Set<string>>(
    new Set(editScenario?.removedExpenseIds || []),
  );
  const [removedIncomeIds, setRemovedIncomeIds] = useState<Set<string>>(
    new Set(editScenario?.removedIncomeIds || []),
  );
  const [budgetSearch, setBudgetSearch] = useState('');

  // New expenses (recurring + one-off)
  const [keyCounter, setKeyCounter] = useState(0);
  const nextKey = () => {
    setKeyCounter((c) => c + 1);
    return String(Date.now()) + '-' + String(keyCounter);
  };

  const editExpenses = editScenario?.additionalExpenses || [];
  const [newExpenses, setNewExpenses] = useState<KeyedExpense[]>(() =>
    editExpenses
      .filter((e) => e.frequency !== 'one-off')
      .map((e, i) => ({ ...e, _key: `init-${i}` })),
  );
  const [oneOffCosts, setOneOffCosts] = useState<KeyedExpense[]>(() =>
    editExpenses
      .filter((e) => e.frequency === 'one-off')
      .map((e, i) => ({ ...e, _key: `init-o-${i}` })),
  );

  // Form state for adding new recurring expense
  const [expName, setExpName] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expFrequency, setExpFrequency] = useState<Frequency>('monthly');
  const [expCategoryId, setExpCategoryId] = useState(categories[0]?.id || '');

  // Form state for adding one-off cost
  const [oneOffName, setOneOffName] = useState('');
  const [oneOffAmount, setOneOffAmount] = useState('');

  // Active budget items that can be removed
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

  const filteredBudgetItems = useMemo(() => {
    const q = budgetSearch.toLowerCase();
    const matchingExpenses = activeExpenses.filter((e) => e.name.toLowerCase().includes(q));
    const matchingIncome = activeIncome.filter((i) => i.name.toLowerCase().includes(q));
    return { expenses: matchingExpenses, income: matchingIncome };
  }, [activeExpenses, activeIncome, budgetSearch]);

  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name || '';

  // Loan calculations
  const price = parseFloat(purchasePrice) || 0;
  const dep = parseFloat(deposit) || 0;
  const rate = parseFloat(interestRate) || 0;
  const term = parseInt(termYears) || 30;
  const principal = price - dep;
  const hasLoan = showLoan && price > 0 && principal > 0 && rate > 0 && term > 0;
  const loanResult = hasLoan ? calculateLoanRepayment(principal, rate, term, loanFrequency) : null;

  // Projection calculations
  const savingsFromRemovedExpenses = activeExpenses
    .filter((e) => removedExpenseIds.has(e.id))
    .reduce((sum, e) => sum + convertAmount(e.amount, e.frequency, surplusFrequency), 0);

  const lostIncome = activeIncome
    .filter((i) => removedIncomeIds.has(i.id))
    .reduce((sum, i) => {
      const net = i.isGross && i.taxRate ? i.amount * (1 - i.taxRate / 100) : i.amount;
      return sum + convertAmount(net, i.frequency, surplusFrequency);
    }, 0);

  const loanCost = loanResult
    ? convertAmount(loanResult.repayment, loanFrequency, surplusFrequency)
    : 0;

  const newRecurringCost = newExpenses.reduce(
    (sum, e) => sum + convertAmount(e.amount, e.frequency, surplusFrequency),
    0,
  );

  const totalOneOffCosts = oneOffCosts.reduce((sum, e) => sum + e.amount, 0);

  const newSurplus =
    currentSurplus + savingsFromRemovedExpenses - lostIncome - loanCost - newRecurringCost;

  const hasChanges =
    removedExpenseIds.size > 0 ||
    removedIncomeIds.size > 0 ||
    hasLoan ||
    newExpenses.length > 0 ||
    oneOffCosts.length > 0;

  const affordabilityLevel =
    newSurplus >= currentSurplus * 0.1 ? 'green' : newSurplus >= 0 ? 'amber' : 'red';

  const affordabilityColors = {
    green: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800',
    amber: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
    red: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
  };

  const addExpense = () => {
    if (!expName.trim() || !expAmount) return;
    setNewExpenses([
      ...newExpenses,
      {
        _key: nextKey(),
        name: expName.trim(),
        amount: parseFloat(expAmount),
        frequency: expFrequency,
        categoryId: expCategoryId,
      },
    ]);
    setExpName('');
    setExpAmount('');
  };

  const addOneOff = () => {
    if (!oneOffName.trim() || !oneOffAmount) return;
    setOneOffCosts([
      ...oneOffCosts,
      {
        _key: nextKey(),
        name: oneOffName.trim(),
        amount: parseFloat(oneOffAmount),
        frequency: 'one-off' as Frequency,
        categoryId: '',
      },
    ]);
    setOneOffName('');
    setOneOffAmount('');
  };

  const toggleExpense = (id: string) => {
    const next = new Set(removedExpenseIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setRemovedExpenseIds(next);
  };

  const toggleIncome = (id: string) => {
    const next = new Set(removedIncomeIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setRemovedIncomeIds(next);
  };

  const isEditing = !!editScenario;

  const handleSave = () => {
    if (!scenarioName.trim() || !hasChanges) return;

    const loanDetails: LoanDetails | null = hasLoan
      ? {
          purchasePrice: price,
          deposit: dep,
          interestRate: rate,
          termYears: term,
          repaymentFrequency: loanFrequency,
        }
      : null;

    onSave({
      name: scenarioName.trim(),
      type: loanDetails ? 'loan' : 'general',
      loanDetails,
      removedExpenseIds: [...removedExpenseIds],
      removedIncomeIds: [...removedIncomeIds],
      additionalExpenses: [...newExpenses, ...oneOffCosts].map(({ _key, ...rest }) => rest),
    });
  };

  return (
    <div className="space-y-6">
      {/* Scenario name */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
          Scenario Name
        </label>
        <input
          type="text"
          value={scenarioName}
          onChange={(e) => setScenarioName(e.target.value)}
          placeholder="e.g. New home purchase"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />
      </div>

      {/* Loan section */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <button
          onClick={() => setShowLoan(!showLoan)}
          className="flex w-full items-center justify-between px-4 py-3"
        >
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Loan / Mortgage
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {showLoan ? 'collapse' : 'optional'}
          </span>
        </button>

        {showLoan && (
          <div className="border-t border-slate-100 px-4 pt-3 pb-4 dark:border-slate-700">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                  Purchase Price
                </label>
                <input
                  type="number"
                  step="1000"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="e.g. 750000"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                  Deposit
                </label>
                <input
                  type="number"
                  step="1000"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  placeholder="e.g. 150000"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                  Interest Rate (% p.a.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  placeholder="e.g. 6.2"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                  Term (years)
                </label>
                <input
                  type="number"
                  value={termYears}
                  onChange={(e) => setTermYears(e.target.value)}
                  placeholder="30"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                Repayment Frequency
              </label>
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
                {FREQUENCIES.slice(0, 3).map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setLoanFrequency(f.value)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      loanFrequency === f.value
                        ? 'bg-slate-800 text-white dark:bg-slate-600'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            {loanResult && (
              <div className="mt-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Repayment</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {formatCurrency(loanResult.repayment, currencySymbol)}/{loanFrequency}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                  <span>
                    Total interest: {formatCurrency(loanResult.totalInterest, currencySymbol)}
                  </span>
                  <span>LVR: {((principal / price) * 100).toFixed(1)}%</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Budget changes — expenses/income that would stop */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="px-4 py-3">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Budget Items That Would Change
          </p>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            Select expenses or income that would stop under this scenario
          </p>
        </div>
        <div className="border-t border-slate-100 px-4 pt-3 pb-4 dark:border-slate-700">
          <input
            type="text"
            value={budgetSearch}
            onChange={(e) => setBudgetSearch(e.target.value)}
            placeholder="Search expenses and income..."
            className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          />

          {/* Selected items shown first */}
          {(removedExpenseIds.size > 0 || removedIncomeIds.size > 0) && (
            <div className="mb-3 space-y-1">
              <p className="text-[10px] font-medium tracking-wide text-slate-400 uppercase dark:text-slate-500">
                Would stop
              </p>
              {activeExpenses
                .filter((e) => removedExpenseIds.has(e.id))
                .map((e) => (
                  <button
                    key={e.id}
                    onClick={() => toggleExpense(e.id)}
                    className="flex w-full items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-left dark:bg-emerald-900/20"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-4 w-4 items-center justify-center rounded border border-emerald-400 bg-emerald-500 text-[10px] text-white">
                        ✓
                      </span>
                      <div>
                        <span className="text-sm text-slate-700 dark:text-slate-200">{e.name}</span>
                        <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">
                          {getCategoryName(e.categoryId)}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-emerald-600">
                      +
                      {formatCurrency(
                        convertAmount(e.amount, e.frequency, surplusFrequency),
                        currencySymbol,
                      )}
                      /{surplusFrequency}
                    </span>
                  </button>
                ))}
              {activeIncome
                .filter((i) => removedIncomeIds.has(i.id))
                .map((i) => {
                  const net = i.isGross && i.taxRate ? i.amount * (1 - i.taxRate / 100) : i.amount;
                  return (
                    <button
                      key={i.id}
                      onClick={() => toggleIncome(i.id)}
                      className="flex w-full items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-left dark:bg-red-900/20"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-4 w-4 items-center justify-center rounded border border-red-400 bg-red-500 text-[10px] text-white">
                          ✓
                        </span>
                        <div>
                          <span className="text-sm text-slate-700 dark:text-slate-200">
                            {i.name}
                          </span>
                          <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">
                            Income
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-red-600">
                        -
                        {formatCurrency(
                          convertAmount(net, i.frequency, surplusFrequency),
                          currencySymbol,
                        )}
                        /{surplusFrequency}
                      </span>
                    </button>
                  );
                })}
            </div>
          )}

          {/* Expense list */}
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {filteredBudgetItems.expenses
              .filter((e) => !removedExpenseIds.has(e.id))
              .map((e) => (
                <button
                  key={e.id}
                  onClick={() => toggleExpense(e.id)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-4 w-4 items-center justify-center rounded border border-slate-300 dark:border-slate-600" />
                    <div>
                      <span className="text-sm text-slate-700 dark:text-slate-200">{e.name}</span>
                      <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">
                        {getCategoryName(e.categoryId)}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {formatCurrency(e.amount, currencySymbol)}/{e.frequency}
                  </span>
                </button>
              ))}

            {/* Income list */}
            {filteredBudgetItems.income
              .filter((i) => !removedIncomeIds.has(i.id))
              .map((i) => (
                <button
                  key={i.id}
                  onClick={() => toggleIncome(i.id)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-4 w-4 items-center justify-center rounded border border-slate-300 dark:border-slate-600" />
                    <div>
                      <span className="text-sm text-slate-700 dark:text-slate-200">{i.name}</span>
                      <span className="ml-2 text-xs text-emerald-500">Income</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {formatCurrency(i.amount, currencySymbol)}/{i.frequency}
                  </span>
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* New recurring expenses */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="px-4 py-3">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            New Recurring Expenses
          </p>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            Ongoing costs that would start under this scenario
          </p>
        </div>
        <div className="border-t border-slate-100 px-4 pt-3 pb-4 dark:border-slate-700">
          {(loanResult || newExpenses.length > 0) && (
            <div className="mb-3 space-y-1">
              {loanResult && (
                <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 dark:bg-blue-900/20">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium tracking-wide text-blue-400 uppercase dark:text-blue-500">
                      Auto
                    </span>
                    <span className="text-sm text-slate-700 dark:text-slate-200">
                      Loan Repayment
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {formatCurrency(loanResult.repayment, currencySymbol)}/{loanFrequency}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-red-600">
                    -
                    {formatCurrency(
                      convertAmount(loanResult.repayment, loanFrequency, surplusFrequency),
                      currencySymbol,
                    )}
                    /{surplusFrequency}
                  </span>
                </div>
              )}
              {newExpenses.map((item) => (
                <div
                  key={item._key}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50"
                >
                  <div>
                    <span className="text-sm text-slate-700 dark:text-slate-200">{item.name}</span>
                    <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">
                      {formatCurrency(item.amount, currencySymbol)}/{item.frequency}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-red-600">
                      -
                      {formatCurrency(
                        convertAmount(item.amount, item.frequency, surplusFrequency),
                        currencySymbol,
                      )}
                      /{surplusFrequency}
                    </span>
                    <button
                      onClick={() =>
                        setNewExpenses(newExpenses.filter((e) => e._key !== item._key))
                      }
                      className="text-slate-300 transition-colors hover:text-red-500 dark:text-slate-500"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={expName}
              onChange={(e) => setExpName(e.target.value)}
              placeholder="Expense name"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            />
            <input
              type="number"
              step="0.01"
              value={expAmount}
              onChange={(e) => setExpAmount(e.target.value)}
              placeholder="Amount"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            />
            <select
              value={expFrequency}
              onChange={(e) => setExpFrequency(e.target.value as Frequency)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            >
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <select
              value={expCategoryId}
              onChange={(e) => setExpCategoryId(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={addExpense}
            disabled={!expName.trim() || !expAmount}
            className="mt-2 rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-40 dark:bg-slate-600 dark:hover:bg-slate-500"
          >
            + Add Expense
          </button>
        </div>
      </div>

      {/* One-off / upfront costs */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="px-4 py-3">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Upfront / One-Off Costs
          </p>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            One-time costs like application fees, moving costs, setup costs, etc.
          </p>
        </div>
        <div className="border-t border-slate-100 px-4 pt-3 pb-4 dark:border-slate-700">
          {oneOffCosts.length > 0 && (
            <div className="mb-3 space-y-1">
              {oneOffCosts.map((item) => (
                <div
                  key={item._key}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50"
                >
                  <span className="text-sm text-slate-700 dark:text-slate-200">{item.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-red-600">
                      {formatCurrency(item.amount, currencySymbol)}
                    </span>
                    <button
                      onClick={() =>
                        setOneOffCosts(oneOffCosts.filter((e) => e._key !== item._key))
                      }
                      className="text-slate-300 transition-colors hover:text-red-500 dark:text-slate-500"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={oneOffName}
              onChange={(e) => setOneOffName(e.target.value)}
              placeholder="e.g. Application fee"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            />
            <input
              type="number"
              step="100"
              value={oneOffAmount}
              onChange={(e) => setOneOffAmount(e.target.value)}
              placeholder="Amount"
              className="w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            />
            <button
              onClick={addOneOff}
              disabled={!oneOffName.trim() || !oneOffAmount}
              className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-40 dark:bg-slate-600 dark:hover:bg-slate-500"
            >
              + Add
            </button>
          </div>
        </div>
      </div>

      {/* Projection */}
      {hasChanges && (
        <div className={`rounded-xl border p-4 ${affordabilityColors[affordabilityLevel]}`}>
          <h4 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
            Projection
          </h4>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-300">Current surplus</span>
              <span className="font-medium text-slate-800 dark:text-slate-100">
                {formatCurrency(currentSurplus, currencySymbol)}/{surplusFrequency}
              </span>
            </div>

            {savingsFromRemovedExpenses > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">
                  Stopped expenses ({removedExpenseIds.size})
                </span>
                <span className="font-medium text-emerald-600">
                  +{formatCurrency(savingsFromRemovedExpenses, currencySymbol)}
                </span>
              </div>
            )}

            {lostIncome > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">
                  Lost income ({removedIncomeIds.size})
                </span>
                <span className="font-medium text-red-600">
                  -{formatCurrency(lostIncome, currencySymbol)}
                </span>
              </div>
            )}

            {loanCost > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">Loan repayment</span>
                <span className="font-medium text-red-600">
                  -{formatCurrency(loanCost, currencySymbol)}
                </span>
              </div>
            )}

            {newRecurringCost > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">
                  New expenses ({newExpenses.length})
                </span>
                <span className="font-medium text-red-600">
                  -{formatCurrency(newRecurringCost, currencySymbol)}
                </span>
              </div>
            )}

            <div className="border-t border-current/10 pt-2">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  New ongoing surplus
                </span>
                <span
                  className={`text-lg font-bold ${newSurplus >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                >
                  {formatCurrency(newSurplus, currencySymbol)}/{surplusFrequency}
                </span>
              </div>
            </div>

            {totalOneOffCosts > 0 && (
              <div className="border-t border-current/10 pt-2">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">Total upfront costs</span>
                  <span className="font-bold text-red-600">
                    {formatCurrency(totalOneOffCosts, currencySymbol)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save */}
      {hasChanges && (
        <button
          onClick={handleSave}
          disabled={!scenarioName.trim()}
          className="w-full rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-40 dark:bg-slate-600 dark:hover:bg-slate-500"
        >
          {isEditing ? 'Update Scenario' : 'Save Scenario'}
        </button>
      )}
    </div>
  );
}
