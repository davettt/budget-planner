import { useState } from 'react';

import type { Account, AccountType } from '../types';
import { useDialog } from '../utils/useDialog';

import ConfirmDialog from './ConfirmDialog';

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'transaction', label: 'Transaction / Cheque' },
  { value: 'savings', label: 'Savings' },
  { value: 'credit-card', label: 'Credit Card' },
  { value: 'loan', label: 'Loan' },
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'investment', label: 'Investment' },
  { value: 'cash', label: 'Cash' },
];

interface AccountFormProps {
  account: Account | null;
  onSave: (data: Partial<Account>) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export default function AccountForm({ account, onSave, onDelete, onClose }: AccountFormProps) {
  const [name, setName] = useState(account?.name || '');
  const [type, setType] = useState<AccountType>(account?.type || 'transaction');
  const [balance, setBalance] = useState(account ? String(account.balance) : '');
  const [interestRate, setInterestRate] = useState(
    account?.interestRate != null ? String(account.interestRate) : '',
  );
  const [monthlyFee, setMonthlyFee] = useState(
    account?.monthlyFee ? String(account.monthlyFee) : '',
  );
  const [institution, setInstitution] = useState(account?.institution || '');
  const [creditLimit, setCreditLimit] = useState(
    account?.creditLimit != null ? String(account.creditLimit) : '',
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { dialogRef, titleId } = useDialog(onClose);

  const showInterestRate =
    type === 'savings' || type === 'loan' || type === 'mortgage' || type === 'investment';
  const showCreditLimit = type === 'credit-card';
  const showMonthlyFee = type === 'transaction' || type === 'savings' || type === 'credit-card';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      type,
      balance: parseFloat(balance) || 0,
      interestRate: showInterestRate && interestRate ? parseFloat(interestRate) : null,
      monthlyFee: showMonthlyFee && monthlyFee ? parseFloat(monthlyFee) : 0,
      institution: institution.trim() || null,
      creditLimit: showCreditLimit && creditLimit ? parseFloat(creditLimit) : null,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="mb-5 text-lg font-semibold text-slate-800 dark:text-slate-100">
          {account ? 'Edit Account' : 'Add Account'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="account-name"
              className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              Account Name
            </label>
            <input
              id="account-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Everyday Account"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="account-type"
              className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              Type
            </label>
            <select
              id="account-type"
              value={type}
              onChange={(e) => setType(e.target.value as AccountType)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="account-balance"
              className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              {type === 'credit-card' ? 'Current Balance Owing' : 'Current Balance'}
            </label>
            <input
              id="account-balance"
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="account-institution"
              className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              Institution (optional)
            </label>
            <input
              id="account-institution"
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g. Bank name"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            />
          </div>

          {showInterestRate && (
            <div>
              <label
                htmlFor="account-interest-rate"
                className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
              >
                Interest Rate % (annual)
              </label>
              <input
                id="account-interest-rate"
                type="number"
                step="0.01"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="e.g. 5.25"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
          )}

          {showCreditLimit && (
            <div>
              <label
                htmlFor="account-credit-limit"
                className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
              >
                Credit Limit
              </label>
              <input
                id="account-credit-limit"
                type="number"
                step="0.01"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                placeholder="e.g. 10000"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
          )}

          {showMonthlyFee && (
            <div>
              <label
                htmlFor="account-monthly-fee"
                className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
              >
                Monthly Fee (optional)
              </label>
              <input
                id="account-monthly-fee"
                type="number"
                step="0.01"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div>
              {account && onDelete && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-xs text-red-400 transition-colors hover:text-red-600"
                >
                  Delete account
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
              >
                {account ? 'Save' : 'Add Account'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {showDeleteConfirm && account && onDelete && (
        <ConfirmDialog
          title="Delete Account"
          message={`Are you sure you want to delete "${account.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={onDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
