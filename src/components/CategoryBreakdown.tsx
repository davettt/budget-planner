import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

import type { Expense, Category, DisplayPeriod, CalcMode, PeriodWindow } from '../types';
import { convertAmount, formatCurrency, isActiveOnDate } from '../utils/money';
import { calculatePeriodCategoryTotals } from '../utils/periodCalc';

interface CategoryBreakdownProps {
  expenses: Expense[];
  categories: Category[];
  displayPeriod: DisplayPeriod;
  currencySymbol: string;
  calcMode?: CalcMode;
  periodWindow?: PeriodWindow;
}

export default function CategoryBreakdown({
  expenses,
  categories,
  displayPeriod,
  currencySymbol,
  calcMode = 'run-rate',
  periodWindow,
}: CategoryBreakdownProps) {
  const categoryTotals =
    calcMode === 'actual' && periodWindow
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

  const data = Array.from(categoryTotals.entries())
    .map(([id, value]) => {
      const cat = categories.find((c) => c.id === id);
      return {
        name: cat?.name || id,
        value,
        color: cat?.color || '#94A3B8',
      };
    })
    .sort((a, b) => b.value - a.value);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
          Spending by Category
        </h3>
        <p className="py-8 text-center text-sm text-slate-300 dark:text-slate-500">
          Add expenses to see your category breakdown.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <h3 className="mb-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
        Spending by Category
      </h3>

      <div className="flex gap-4">
        <div className="h-44 w-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={70}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value, currencySymbol)}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-1.5 overflow-y-auto">
          {data.map((item) => {
            const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : '0';
            return (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 dark:text-slate-500">{pct}%</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    {formatCurrency(item.value, currencySymbol)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
