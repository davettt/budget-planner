import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import type { Account, Income, Expense } from '../types';
import { formatCurrency } from '../utils/money';
import {
  getMonthWindow,
  calculatePeriodIncome,
  calculatePeriodExpenses,
} from '../utils/periodCalc';

const ASSET_TYPES = new Set(['savings', 'transaction', 'investment', 'cash']);

interface CashFlowChartProps {
  accounts: Account[];
  income: Income[];
  expenses: Expense[];
  currencySymbol: string;
}

export default function CashFlowChart({
  accounts,
  income,
  expenses,
  currencySymbol,
}: CashFlowChartProps) {
  const [months, setMonths] = useState(6);

  const data = useMemo(() => {
    const startingBalance = accounts
      .filter((a) => ASSET_TYPES.has(a.type))
      .reduce((sum, a) => sum + a.balance, 0);

    const now = new Date();
    let runningBalance = startingBalance;

    const points = [];
    for (let i = 0; i <= months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const label = date.toLocaleDateString('en-AU', { month: 'short', year: '2-digit' });

      if (i === 0) {
        points.push({ date: label, balance: runningBalance });
      } else {
        const monthWindow = getMonthWindow(date);
        const monthIncome = calculatePeriodIncome(income, monthWindow);
        const monthExpenses = calculatePeriodExpenses(expenses, monthWindow);
        runningBalance += monthIncome - monthExpenses;
        points.push({ date: label, balance: runningBalance });
      }
    }

    return points;
  }, [accounts, income, expenses, months]);

  const minBalance = Math.min(...data.map((d) => d.balance));
  const allPositive = minBalance >= 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          Cash Flow Projection
        </h3>
        <div className="inline-flex rounded-md border border-slate-200 p-0.5 dark:border-slate-700">
          {[3, 6, 12].map((m) => (
            <button
              key={m}
              onClick={() => setMonths(m)}
              className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                months === m
                  ? 'bg-slate-800 text-white dark:bg-slate-600'
                  : 'text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {m}m
            </button>
          ))}
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 10 }}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={allPositive ? '#10b981' : '#3b82f6'}
                  stopOpacity={0.15}
                />
                <stop
                  offset="100%"
                  stopColor={allPositive ? '#10b981' : '#3b82f6'}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => formatCurrency(v, currencySymbol)}
              width={80}
            />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value, currencySymbol), 'Balance']}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '12px',
              }}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke={allPositive ? '#10b981' : '#3b82f6'}
              strokeWidth={2}
              fill="url(#balanceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
