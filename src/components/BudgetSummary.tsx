import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

import { formatCurrency } from '../utils/money';

interface BudgetSummaryProps {
  income: number;
  expenses: number;
  currencySymbol: string;
}

export default function BudgetSummary({ income, expenses, currencySymbol }: BudgetSummaryProps) {
  const surplus = income - expenses;

  const data = [
    { name: 'Income', value: income, fill: '#10b981' },
    { name: 'Expenses', value: expenses, fill: '#ef4444' },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          Income vs Expenses
        </h3>
        <div className="text-right">
          <p className={`text-lg font-bold ${surplus >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {surplus >= 0 ? '+' : ''}
            {formatCurrency(surplus, currencySymbol)}
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            {surplus >= 0 ? 'surplus' : 'deficit'}
          </p>
        </div>
      </div>

      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickFormatter={(v: number) => formatCurrency(v, currencySymbol)}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              width={70}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value, currencySymbol)}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '13px',
              }}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
