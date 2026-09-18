'use client';

import type { User } from '@supabase/supabase-js';
import type { ThemeMode } from '@/lib/storage';
import type { PlannerNavView } from './NavigationDock';

type TopBarProps = {
  view: PlannerNavView;
  setView: (view: PlannerNavView) => void;
  activeWeekNumber: number;
  online: boolean;
  theme: ThemeMode;
  toggleTheme: () => void;
  user: User | null;
  onSignOut?: () => void;
  onOpenEndOfDay: () => void;
  onOpenWhatsApp: () => void;
  overdueCount?: number;
};

export function TopBar({
  view,
  setView,
  activeWeekNumber,
  online,
  theme,
  toggleTheme,
  user,
  onSignOut,
  onOpenEndOfDay,
  onOpenWhatsApp,
  overdueCount = 0,
}: TopBarProps) {
  return (
    <header className="topbar">
      <div className="brand-row" onClick={() => setView('home')} style={{ cursor: 'pointer' }}>
        <img
          src="/bookingpartner.png"
          alt="BookingPartner.lk"
          className="brand-mark small"
          width={40}
          height={40}
        />
        <div>
          <p className="eyebrow">BOOKINGPARTNER.LK</p>
          <h1>Dev Assistant & Memory</h1>
        </div>
      </div>

      {/* Desktop Center Navigation Capsule */}
      <nav className="header-nav-capsule" aria-label="Main views">
        <button
          type="button"
          onClick={() => setView('home')}
          className={view === 'home' ? 'active' : ''}
        >
          Home
        </button>
        <button
          type="button"
          onClick={() => setView('schedule')}
          className={view === 'schedule' ? 'active' : ''}
        >
          Schedule
        </button>
        <button
          type="button"
          onClick={() => setView('tasks')}
          className={view === 'tasks' ? 'active' : ''}
        >
          Tasks {overdueCount > 0 && <span className="nav-count-badge alert">{overdueCount}</span>}
        </button>
        <button
          type="button"
          onClick={() => setView('memory')}
          className={view === 'memory' ? 'active' : ''}
        >
          Memory
        </button>
        <button
          type="button"
          onClick={() => setView('ai')}
          className={view === 'ai' ? 'active' : ''}
        >
          AI Assistant
        </button>
      </nav>

      {/* Right Utility Actions */}
      <div className="top-actions">
        <button
          type="button"
          className="top-quick-btn eod"
          onClick={onOpenEndOfDay}
          title="Daily Check: Wrap up and store incomplete task reasons"
        >
          <ClockCheckIcon />
          <span className="hide-mobile-sm">End Day</span>
        </button>

        <button
          type="button"
          className="top-quick-btn wa"
          onClick={onOpenWhatsApp}
          title="Generate WhatsApp/Slack Daily Standup"
        >
          <SendIcon />
          <span className="hide-mobile-sm">Report</span>
        </button>
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

function ClockCheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
