'use client';

import type { ThemeMode } from '@/lib/storage';

type Tab = 'today' | 'tomorrow' | 'week' | 'all' | 'overdue';

export function NavigationDock({
  tab,
  setTab,
  theme,
  toggleTheme,
}: {
  tab: Tab;
  setTab: (tab: Tab) => void;
  theme: ThemeMode;
  toggleTheme: () => void;
}) {
  return (
    <div className="dock-wrapper">
      <nav className="floating-dock" aria-label="Mobile bottom navigation">
        <button
          type="button"
          className={`dock-item ${tab === 'today' ? 'active' : ''}`}
          onClick={() => setTab('today')}
        >
          <HomeIcon />
          <span>Today</span>
        </button>

        <button
          type="button"
          className={`dock-item ${tab === 'tomorrow' ? 'active' : ''}`}
          onClick={() => setTab('tomorrow')}
        >
          <SparkIcon />
          <span>Tomorrow</span>
        </button>

        <button
          type="button"
          className={`dock-item ${tab === 'week' ? 'active' : ''}`}
          onClick={() => setTab('week')}
        >
          <CalendarIcon />
          <span>Week</span>
        </button>

        <button
          type="button"
          className={`dock-item ${tab === 'all' ? 'active' : ''}`}
          onClick={() => setTab('all')}
        >
          <GridIcon />
          <span>Roadmap</span>
        </button>

        <button
          type="button"
          className={`dock-item ${tab === 'overdue' ? 'active' : ''}`}
          onClick={() => setTab('overdue')}
        >
          <AlertCircleIcon />
          <span>Overdue</span>
        </button>

        <div className="dock-separator" />

        <button
          type="button"
          className="dock-theme-btn"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
      </nav>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m13 2-2 10 6-2-8 12 2-10-6 2z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}

function AlertCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}
