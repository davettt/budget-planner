import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState } from 'react';

import { useSettingsStore } from './stores/settingsStore';
import Nav from './components/Nav';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Accounts = lazy(() => import('./pages/Accounts'));
const Budget = lazy(() => import('./pages/Budget'));
const Affordability = lazy(() => import('./pages/Affordability'));
const Settings = lazy(() => import('./pages/Settings'));

declare const __APP_VERSION__: string;

export default function App() {
  const { settings, loading, fetch } = useSettingsStore();
  const [buildStale, setBuildStale] = useState(false);

  useEffect(() => {
    fetch();
    void window
      .fetch('/api/build-status')
      .then((r) => r.json())
      .then((d) => setBuildStale(d.stale === true))
      .catch(() => {});
  }, [fetch]);

  const theme = settings?.theme;
  useEffect(() => {
    if (!theme) return;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    }
  }, [theme]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="mx-auto min-h-screen max-w-3xl px-4 pt-10 pb-[100px]">
        {buildStale && (
          <div className="mb-6 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-900/20 dark:text-amber-300">
            Source files have changed since the last build. Run{' '}
            <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">
              npm run build
            </code>{' '}
            to apply updates.
          </div>
        )}
        <Suspense fallback={<p className="text-center text-slate-400">Loading…</p>}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/affordability" element={<Affordability />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <Nav />
        <Link
          to="/settings"
          className="fixed right-4 bottom-[72px] text-slate-300 transition-colors hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400"
          title="Settings"
          aria-label="Settings"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68 1.65 1.65 0 0 0 9 3.17V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>
      </div>
    </BrowserRouter>
  );
}
