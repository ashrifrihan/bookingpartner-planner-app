'use client';

import type { User } from '@supabase/supabase-js';
import type { ThemeMode } from '@/lib/storage';

type Tab = 'today' | 'tomorrow' | 'week' | 'all' | 'overdue';

type TopBarProps = {
  tab: Tab;
  setTab: (tab: Tab) => void;
  activeWeekNumber: number;
  online: boolean;
  theme: ThemeMode;
  toggleTheme: () => void;
  user: User | null;
  onSignOut?: () => void;
};

export function TopBar({
  tab,
  setTab,
  activeWeekNumber,
  online,
  theme,
  toggleTheme,
  user,
  onSignOut,
}: TopBarProps) {
  return (
    <header className="topbar">
      <div className="brand-row">
        <img
          src="/bookingpartner.png"
          alt="BookingPartner.lk"
          className="brand-mark small"
          width={40}
          height={40}
        />
        <div>
          <p className="eyebrow">BOOKINGPARTNER.LK</p>
          <h1>Backend Planner</h1>
        </div>
      </div>

      {/* Desktop Center Navigation Capsule */}
      <nav className="header-nav-capsule" aria-label="Main views">
        <button
          type="button"
          onClick={() => setTab('today')}
          className={tab === 'today' ? 'active' : ''}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => setTab('tomorrow')}
          className={tab === 'tomorrow' ? 'active' : ''}
        >
          Tomorrow
        </button>
        <button
          type="button"
          onClick={() => setTab('week')}
          className={tab === 'week' ? 'active' : ''}
        >
          Week {activeWeekNumber}
        </button>
        <button
          type="button"
          onClick={() => setTab('all')}
          className={tab === 'all' ? 'active' : ''}
        >
          Roadmap
        </button>
        <button
          type="button"
          onClick={() => setTab('overdue')}
          className={tab === 'overdue' ? 'active' : ''}
          title="Filter overdue tasks"
        >
          Overdue
        </button>
        <span className="header-nav-badge" title="84 days total schedule">
          84
        </span>
      </nav>

      {/* Right Utility Actions */}
      <div className="top-actions">
        <span
          className={`status-pill ${online ? 'online' : 'offline'}`}
          title={online ? 'Internet Connected' : 'Offline Mode'}
        >
          {online ? <OnlineWifiIcon /> : <OfflineWifiIcon />}
          <span>{online ? 'Online' : 'Offline'}</span>
        </span>

        <button
          type="button"
          className="icon-pill-btn"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        {user && onSignOut && (
          <button
            type="button"
            className="icon-pill-btn"
            onClick={onSignOut}
            title="Sign out"
            aria-label="Sign out"
          >
            <SignOutIcon />
          </button>
        )}
      </div>
    </header>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}

function OnlineWifiIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <path d="M12 20h.01" strokeWidth="3" />
    </svg>
  );
}

function OfflineWifiIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
      <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
      <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="3" />
    </svg>
  );
}
