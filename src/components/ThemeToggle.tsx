import { useSettingsStore } from '../stores/settingsStore';

const themes = [
  { value: 'light' as const, label: 'Light' },
  { value: 'dark' as const, label: 'Dark' },
  { value: 'system' as const, label: 'System' },
];

export default function ThemeToggle() {
  const { settings, update } = useSettingsStore();

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300">Theme</h3>
      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800">
        {themes.map((t) => (
          <button
            key={t.value}
            onClick={() => update({ theme: t.value })}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              settings?.theme === t.value
                ? 'bg-slate-800 text-white dark:bg-slate-600'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
