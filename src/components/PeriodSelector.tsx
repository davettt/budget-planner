import type { DisplayPeriod } from '../types';
import { useSettingsStore } from '../stores/settingsStore';
import { formatPeriodLabel } from '../utils/periodCalc';

const periods: { value: DisplayPeriod; label: string }[] = [
  { value: 'weekly', label: 'Week' },
  { value: 'fortnightly', label: 'Fortnight' },
  { value: 'monthly', label: 'Month' },
  { value: 'annually', label: 'Year' },
];

interface PeriodSelectorProps {
  showModeToggle?: boolean;
}

export default function PeriodSelector({ showModeToggle = true }: PeriodSelectorProps) {
  const {
    displayPeriod,
    setDisplayPeriod,
    calcMode,
    setCalcMode,
    periodWindow,
    navigatePeriod,
    goToCurrentPeriod,
  } = useSettingsStore();

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800">
        {periods.map((p) => (
          <button
            key={p.value}
            onClick={() => setDisplayPeriod(p.value)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              displayPeriod === p.value
                ? 'bg-slate-800 text-white dark:bg-slate-600'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {calcMode === 'actual' && (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigatePeriod(-1)}
            className="rounded-md p-1 text-slate-400 transition-colors hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200"
            aria-label="Previous period"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={goToCurrentPeriod}
            className="min-w-[120px] rounded-md px-2 py-1 text-center text-xs font-medium text-slate-600 transition-colors hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100"
            title="Go to current period"
          >
            {formatPeriodLabel(periodWindow, displayPeriod)}
          </button>
          <button
            onClick={() => navigatePeriod(1)}
            className="rounded-md p-1 text-slate-400 transition-colors hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200"
            aria-label="Next period"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}

      {showModeToggle && (
        <div className="inline-flex rounded-md border border-slate-200 p-0.5 dark:border-slate-700">
          {(['actual', 'run-rate'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setCalcMode(mode)}
              className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                calcMode === mode
                  ? 'bg-slate-800 text-white dark:bg-slate-600'
                  : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
              }`}
            >
              {mode === 'actual' ? 'Actual' : 'Run Rate'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
