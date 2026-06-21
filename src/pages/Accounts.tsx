import { useEffect, useState } from 'react';

import { useAccountStore } from '../stores/accountStore';
import { useNetWorthStore } from '../stores/networthStore';
import { useSettingsStore } from '../stores/settingsStore';
import type { Account } from '../types';
import { formatCurrency } from '../utils/money';
import AccountCard from '../components/AccountCard';
import AccountForm from '../components/AccountForm';
import BalanceHistory from '../components/BalanceHistory';
import NetWorthChart from '../components/NetWorthChart';

const ASSET_TYPES = new Set(['savings', 'transaction', 'investment', 'cash']);
const LIABILITY_TYPES = new Set(['credit-card', 'loan', 'mortgage']);

export default function Accounts() {
  const { accounts, loading, fetch, add, update, remove } = useAccountStore();
  const { history: networthHistory, fetch: fetchNetWorth, snapshot } = useNetWorthStore();
  const { settings } = useSettingsStore();
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [historyAccount, setHistoryAccount] = useState<Account | null>(null);

  useEffect(() => {
    fetch();
    fetchNetWorth();
  }, [fetch, fetchNetWorth]);

  const balanceFingerprint = accounts.map((a) => `${a.id}:${a.balance}`).join(',');

  useEffect(() => {
    if (accounts.length > 0) {
      snapshot();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- snapshot triggers on balance changes via fingerprint, not just count
  }, [balanceFingerprint, snapshot]);

  const currencySymbol = settings?.currencySymbol || '$';

  const totalAssets = accounts
    .filter((a) => ASSET_TYPES.has(a.type))
    .reduce((sum, a) => sum + a.balance, 0);

  const totalLiabilities = accounts
    .filter((a) => LIABILITY_TYPES.has(a.type))
    .reduce((sum, a) => sum + Math.abs(a.balance), 0);

  const netWorth = totalAssets - totalLiabilities;

  const handleSave = async (data: Partial<Account>) => {
    if (editingAccount) {
      await update(editingAccount.id, data);
    } else {
      await add(data);
    }
    setShowForm(false);
    setEditingAccount(null);
  };

  const handleDelete = async () => {
    if (editingAccount) {
      await remove(editingAccount.id);
      setShowForm(false);
      setEditingAccount(null);
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingAccount(null);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-slate-400 dark:text-slate-500">Loading accounts...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Accounts</h1>
        <button
          onClick={handleAdd}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          + Add Account
        </button>
      </div>

      {accounts.length > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Assets</p>
            <p className="mt-1 text-lg font-bold text-emerald-600">
              {formatCurrency(totalAssets, currencySymbol)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Liabilities</p>
            <p className="mt-1 text-lg font-bold text-red-600">
              {formatCurrency(totalLiabilities, currencySymbol)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Net Worth</p>
            <p
              className={`mt-1 text-lg font-bold ${netWorth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
            >
              {formatCurrency(netWorth, currencySymbol)}
            </p>
          </div>
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-600 dark:bg-slate-800">
          <p className="text-slate-400 dark:text-slate-500">No accounts yet.</p>
          <p className="mt-1 text-sm text-slate-300 dark:text-slate-500">
            Add your bank accounts, credit cards, and loans to start tracking.
          </p>
          <button
            onClick={handleAdd}
            className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            + Add Your First Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              currencySymbol={currencySymbol}
              onClick={() => handleEdit(account)}
              onHistory={() => setHistoryAccount(account)}
            />
          ))}
        </div>
      )}

      {accounts.length > 0 && (
        <div className="mt-6">
          <NetWorthChart history={networthHistory} currencySymbol={currencySymbol} />
        </div>
      )}

      {showForm && (
        <AccountForm
          account={editingAccount}
          onSave={handleSave}
          onDelete={editingAccount ? handleDelete : undefined}
          onClose={() => {
            setShowForm(false);
            setEditingAccount(null);
          }}
        />
      )}

      {historyAccount && (
        <BalanceHistory
          account={historyAccount}
          currencySymbol={currencySymbol}
          onClose={() => setHistoryAccount(null)}
        />
      )}
    </div>
  );
}
