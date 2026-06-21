import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

import type { NetWorthSnapshot } from '../types';
import { formatCurrency } from '../utils/money';

interface NetWorthChartProps {
  history: NetWorthSnapshot[];
  currencySymbol: string;
}

export default function NetWorthChart({ history, currencySymbol }: NetWorthChartProps) {
  if (history.length < 2) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800">
        <p className="text-sm text-slate-400">Not enough data for a trend chart yet.</p>
        <p className="mt-1 text-xs text-slate-300 dark:text-slate-500">
          Net worth is recorded daily when you visit this page. Check back after a few days.
        </p>
      </div>
    );
  }

  const data = history.map((s) => ({
    date: new Date(s.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
    assets: s.totalAssets,
    liabilities: -s.totalLiabilities,
    netWorth: s.netWorth,
  }));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <h3 className="mb-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
        Net Worth Trend
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <YAxis
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickFormatter={(v: number) => formatCurrency(v, currencySymbol)}
            width={90}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: '1px solid #e2e8f0',
            }}
            formatter={(value: number, name: string) => [
              formatCurrency(value, currencySymbol),
              name === 'netWorth' ? 'Net Worth' : name === 'assets' ? 'Assets' : 'Liabilities',
            ]}
          />
          <Area
            type="monotone"
            dataKey="assets"
            stroke="#10b981"
            fill="#ecfdf5"
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            dataKey="liabilities"
            stroke="#ef4444"
            fill="#fef2f2"
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            dataKey="netWorth"
            stroke="#3b82f6"
            fill="#eff6ff"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
