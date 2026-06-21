import { useCallback, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const S = 20;

const icons = {
  dashboard: (
    <svg
      width={S}
      height={S}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
    </svg>
  ),
  accounts: (
    <svg
      width={S}
      height={S}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ),
  budget: (
    <svg
      width={S}
      height={S}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  afford: (
    <svg
      width={S}
      height={S}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="16" y1="14" x2="16" y2="18" />
      <line x1="14" y1="16" x2="18" y2="16" />
      <rect x="8" y="10" width="4" height="3" rx="0.5" />
      <rect x="8" y="15" width="4" height="3" rx="0.5" />
    </svg>
  ),
};

const links = [
  {
    to: '/',
    label: 'Dashboard',
    icon: icons.dashboard,
    shortcut: 'd',
    before: '',
    key: 'D',
    after: 'ashboard',
  },
  {
    to: '/accounts',
    label: 'Accounts',
    icon: icons.accounts,
    shortcut: 'a',
    before: '',
    key: 'A',
    after: 'ccounts',
  },
  {
    to: '/budget',
    label: 'Budget',
    icon: icons.budget,
    shortcut: 'b',
    before: '',
    key: 'B',
    after: 'udget',
  },
  {
    to: '/affordability',
    label: 'Afford',
    icon: icons.afford,
    shortcut: 'f',
    before: 'Af',
    key: 'f',
    after: 'ord',
  },
];

export default function Nav() {
  const navigate = useNavigate();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const active = document.activeElement;
      const isTyping = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
      if (isTyping) return;

      const overlay = document.querySelector('[class*="fixed inset-0 z-"]');
      if (overlay) return;

      const link = links.find((l) => l.shortcut === e.key);
      if (link) {
        e.preventDefault();
        (document.activeElement as HTMLElement)?.blur();
        navigate(link.to);
      }
    },
    [navigate],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-10 border-t border-slate-200 bg-white/90 backdrop-blur-[6px] dark:border-slate-700 dark:bg-slate-900/90">
      <div className="mx-auto flex max-w-3xl justify-around py-3">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-[3px] font-sans text-xs transition-colors duration-150 ${
                isActive ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'
              }`
            }
          >
            <span className="flex items-center justify-center leading-none">{link.icon}</span>
            <span>
              {link.before}
              <span className="border-b border-current">{link.key}</span>
              {link.after}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
