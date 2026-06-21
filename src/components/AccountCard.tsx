import type { Account } from '../types';
import { formatCurrency } from '../utils/money';

const TYPE_LABELS: Record<string, string> = {
  savings: 'Savings',
  transaction: 'Transaction',
  'credit-card': 'Credit Card',
  loan: 'Loan',
  mortgage: 'Mortgage',
  investment: 'Investment',
  cash: 'Cash',
};

const TYPE_COLORS: Record<string, string> = {
  savings: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  transaction: 'bg-blue-50 text-blue-700 border-blue-200',
  'credit-card': 'bg-amber-50 text-amber-700 border-amber-200',
  loan: 'bg-red-50 text-red-700 border-red-200',
  mortgage: 'bg-red-50 text-red-700 border-red-200',
  investment: 'bg-violet-50 text-violet-700 border-violet-200',
  cash: 'bg-slate-50 text-slate-600 border-slate-200',
};

const ASSET_TYPES = new Set(['savings', 'transaction', 'investment', 'cash']);

interface AccountCardProps {
  account: Account;
  currencySymbol: string;
  onClick: () => void;
  onHistory: () => void;
}

export default function AccountCard({
  account,
  currencySymbol,
  onClick,
  onHistory,
}: AccountCardProps) {
  const isAsset = ASSET_TYPES.has(account.type);
  const balanceColor = isAsset ? 'text-emerald-600' : 'text-red-600';
  const displayBalance =
    account.type === 'credit-card' ? -Math.abs(account.balance) : account.balance;

  const updatedDate = account.updatedAt
    ? new Date(account.updatedAt).toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'short',
      })
    : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-3 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
            {account.name}
          </h3>
          {account.institution && (
            <p className="truncate text-xs text-slate-400 dark:text-slate-500">
              {account.institution}
            </p>
          )}
        </div>
        <span
          className={`ml-2 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${TYPE_COLORS[account.type] || TYPE_COLORS.cash}`}
        >
          {TYPE_LABELS[account.type] || account.type}
        </span>
      </div>

      <p className={`text-2xl font-bold ${balanceColor}`}>
        {formatCurrency(displayBalance, currencySymbol)}
      </p>

      {account.type === 'credit-card' && account.creditLimit != null && (
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          {formatCurrency(account.creditLimit - Math.abs(account.balance), currencySymbol)}{' '}
          available of {formatCurrency(account.creditLimit, currencySymbol)} limit
        </p>
      )}

      {(account.type === 'loan' || account.type === 'mortgage') && account.interestRate != null && (
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          {account.interestRate}% interest
        </p>
      )}

      {account.type === 'savings' && account.interestRate != null && account.interestRate > 0 && (
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          {account.interestRate}% p.a.
        </p>
      )}

      <div className="mt-4 flex items-center justify-between">
        {updatedDate && (
          <span className="text-[10px] text-slate-300 dark:text-slate-500">
            Updated {updatedDate}
          </span>
        )}
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onHistory();
            }}
            className="text-xs text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
          >
            History
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="text-xs text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
