import { useState } from 'react';

import type { Frequency } from '../types';
import { formatCurrency } from '../utils/money';
import { calculateLoanRepayment, calculateLVR } from '../utils/calculations';
import { convertAmount } from '../utils/money';

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'fortnightly', label: 'Fortnightly' },
  { value: 'monthly', label: 'Monthly' },
];

interface LoanCalculatorProps {
  currentSurplus: number;
  surplusFrequency: Frequency;
  currencySymbol: string;
  onSaveScenario?: (data: {
    name: string;
    purchasePrice: number;
    deposit: number;
    interestRate: number;
    termYears: number;
    repaymentFrequency: Frequency;
    repaymentAmount: number;
  }) => void;
}

export default function LoanCalculator({
  currentSurplus,
  surplusFrequency,
  currencySymbol,
  onSaveScenario,
}: LoanCalculatorProps) {
  const [purchasePrice, setPurchasePrice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [termYears, setTermYears] = useState('30');
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [scenarioName, setScenarioName] = useState('');
  const [showSave, setShowSave] = useState(false);

  const price = parseFloat(purchasePrice) || 0;
  const dep = parseFloat(deposit) || 0;
  const rate = parseFloat(interestRate) || 0;
  const term = parseInt(termYears) || 30;
  const principal = price - dep;

  const hasInputs = price > 0 && principal > 0 && rate > 0 && term > 0;

  const result = hasInputs ? calculateLoanRepayment(principal, rate, term, frequency) : null;
  const lvr = price > 0 ? calculateLVR(price, dep) : 0;

  const repaymentInSurplusFreq = result
    ? convertAmount(result.repayment, frequency, surplusFrequency)
    : 0;
  const remainingAfterRepayment = currentSurplus - repaymentInSurplusFreq;

  const affordabilityLevel =
    remainingAfterRepayment >= currentSurplus * 0.1
      ? 'green'
      : remainingAfterRepayment >= 0
        ? 'amber'
        : 'red';

  const affordabilityColors = {
    green:
      'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400',
    amber:
      'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400',
    red: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400',
  };

  const affordabilityLabels = {
    green: 'Comfortably Affordable',
    amber: 'Tight but Possible',
    red: 'Not Affordable',
  };

  const handleSave = () => {
    if (!scenarioName.trim() || !result || !onSaveScenario) return;
    onSaveScenario({
      name: scenarioName.trim(),
      purchasePrice: price,
      deposit: dep,
      interestRate: rate,
      termYears: term,
      repaymentFrequency: frequency,
      repaymentAmount: result.repayment,
    });
    setShowSave(false);
    setScenarioName('');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
            Purchase Price
          </label>
          <input
            type="number"
            step="1000"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            placeholder="e.g. 900000"
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
            placeholder="e.g. 180000"
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

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
          Repayment Frequency
        </label>
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
          {FREQUENCIES.map((f) => (
            <button
              key={f.value}
              onClick={() => setFrequency(f.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                frequency === f.value
                  ? 'bg-slate-800 text-white dark:bg-slate-600'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-800">
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                Repayment
              </p>
              <p className="mt-0.5 text-lg font-bold text-slate-800 dark:text-slate-100">
                {formatCurrency(result.repayment, currencySymbol)}
              </p>
              <p className="text-[10px] text-slate-300 dark:text-slate-500">/{frequency}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-800">
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                Total Interest
              </p>
              <p className="mt-0.5 text-lg font-bold text-red-600">
                {formatCurrency(result.totalInterest, currencySymbol)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-800">
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                Total Cost
              </p>
              <p className="mt-0.5 text-lg font-bold text-slate-800 dark:text-slate-100">
                {formatCurrency(result.totalCost, currencySymbol)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-800">
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">LVR</p>
              <p
                className={`mt-0.5 text-lg font-bold ${lvr > 80 ? 'text-red-600' : 'text-slate-800 dark:text-slate-100'}`}
              >
                {lvr.toFixed(1)}%
              </p>
            </div>
          </div>

          <div className={`rounded-xl border p-4 ${affordabilityColors[affordabilityLevel]}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{affordabilityLabels[affordabilityLevel]}</p>
                <p className="mt-0.5 text-xs opacity-80">
                  Current surplus: {formatCurrency(currentSurplus, currencySymbol)}/
                  {surplusFrequency} — Repayment:{' '}
                  {formatCurrency(repaymentInSurplusFreq, currencySymbol)}/{surplusFrequency}
                </p>
              </div>
              <p className="text-lg font-bold">
                {remainingAfterRepayment >= 0 ? '+' : ''}
                {formatCurrency(remainingAfterRepayment, currencySymbol)}
              </p>
            </div>
          </div>

          {onSaveScenario && (
            <div>
              {showSave ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                    placeholder="Scenario name, e.g. 'House in Manly'"
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave();
                    }}
                  />
                  <button
                    onClick={handleSave}
                    disabled={!scenarioName.trim()}
                    className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-40 dark:bg-slate-600 dark:hover:bg-slate-500"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowSave(false)}
                    className="text-sm text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSave(true)}
                  className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Save as scenario
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
