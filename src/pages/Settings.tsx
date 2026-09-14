import { useSettingsStore } from '../stores/settingsStore';
import ThemeToggle from '../components/ThemeToggle';
import BackupRestore from '../components/BackupRestore';
import type { DisplayPeriod } from '../types';

declare const __APP_VERSION__: string;

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const FY_PRESETS: { label: string; month: number }[] = [
  { label: 'Australia (July)', month: 7 },
  { label: 'UK (April)', month: 4 },
  { label: 'US (January)', month: 1 },
];

const periodOptions: { value: DisplayPeriod; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'fortnightly', label: 'Fortnightly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'annually', label: 'Annually' },
];

export default function Settings() {
  const { settings, update } = useSettingsStore();

  if (!settings) return null;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-800 dark:text-slate-100">Settings</h1>

      <div className="space-y-8">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300">Currency</h3>
          <div className="flex items-center gap-3">
            <input
              aria-label="Currency code"
              type="text"
              value={settings.currency}
              onChange={(e) => update({ currency: e.target.value })}
              className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              maxLength={5}
            />
            <input
              aria-label="Currency symbol"
              type="text"
              value={settings.currencySymbol}
              onChange={(e) => update({ currencySymbol: e.target.value })}
              className="w-16 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              maxLength={3}
            />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Default Display Period
          </h3>
          <select
            aria-label="Default display period"
            value={settings.defaultPeriod}
            onChange={(e) => update({ defaultPeriod: e.target.value as DisplayPeriod })}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          >
            {periodOptions.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Financial Year Starts
          </h3>
          <select
            aria-label="Financial year start month"
            value={settings.financialYearStartMonth}
            onChange={(e) => update({ financialYearStartMonth: parseInt(e.target.value, 10) })}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            {FY_PRESETS.map((p) => (
              <button
                key={p.month}
                onClick={() => update({ financialYearStartMonth: p.month })}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  settings.financialYearStartMonth === p.month
                    ? 'bg-slate-800 text-white dark:bg-slate-600'
                    : 'border border-slate-200 text-slate-500 hover:text-slate-700 dark:border-slate-600 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <ThemeToggle />

        <BackupRestore />

        <div className="border-t border-slate-100 pt-6 text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500">
          Budget Planner v{__APP_VERSION__}
        </div>
      </div>
    </div>
  );
}
