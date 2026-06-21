import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import type { Account } from '../types';
import { formatCurrency } from '../utils/money';

interface BalanceHistoryProps {
  account: Account;
  currencySymbol: string;
  onClose: () => void;
}

export default function BalanceHistory({ account, currencySymbol, onClose }: BalanceHistoryProps) {
  const data = (account.balanceHistory || []).map((entry) => ({
    date: new Date(entry.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
    balance: entry.balance,
  }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="mx-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {account.name}
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">Balance History</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 transition-colors hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-300"
          >
            <svg
              width="20"
              height="20"
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

        {data.length < 2 ? (
          <div className="py-12 text-center text-sm text-slate-400 dark:text-slate-500">
            Update the balance a few times to see a trend chart here.
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 10 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
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
                    fontSize: '13px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
