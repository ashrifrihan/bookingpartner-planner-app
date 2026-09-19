'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ThemeMode } from '@/lib/storage';

export type PlannerNavView = 'home' | 'schedule' | 'tasks' | 'memory' | 'ai';

export function NavigationDock({
  view,
  setView,
  theme,
  toggleTheme,
  overdueCount = 0,
  memoryCount = 0,
  onOpenAction,
}: {
  view?: PlannerNavView;
  setView?: (view: PlannerNavView) => void;
  theme: ThemeMode;
  toggleTheme: () => void;
  overdueCount?: number;
  memoryCount?: number;
  onOpenAction?: () => void;
}) {
  const pathname = usePathname();
  const currentView: PlannerNavView =
    pathname === '/' ? 'home' :
    pathname.startsWith('/schedule') ? 'schedule' :
    pathname.startsWith('/tasks') ? 'tasks' :
    pathname.startsWith('/memory') ? 'memory' :
    pathname.startsWith('/ai') ? 'ai' :
    (view || 'home');

  return (
    <div className="dock-wrapper">
      <nav className="floating-dock" aria-label="Mobile bottom navigation">
        <Link
          href="/"
          className={`dock-item ${currentView === 'home' ? 'active' : ''}`}
          onClick={() => setView?.('home')}
        >
          <HomeIcon />
          <span>Home</span>
        </Link>

        <Link
          href="/schedule"
          className={`dock-item ${currentView === 'schedule' ? 'active' : ''}`}
          onClick={() => setView?.('schedule')}
        >
          <CalendarIcon />
          <span>Schedule</span>
        </Link>

        <Link
          href="/tasks"
          className={`dock-item ${currentView === 'tasks' ? 'active' : ''}`}
          onClick={() => setView?.('tasks')}
        >
          <GridIcon />
          <span>Tasks</span>
          {overdueCount > 0 && <span className="dock-badge alert">{overdueCount}</span>}
        </Link>

        <Link
          href="/memory"
          className={`dock-item ${currentView === 'memory' ? 'active' : ''}`}
          onClick={() => setView?.('memory')}
        >
          <BrainIcon />
          <span>Memory</span>
          {memoryCount > 0 && <span className="dock-badge">{memoryCount}</span>}
        </Link>

        <Link
          href="/ai"
          className={`dock-item ${currentView === 'ai' ? 'active' : ''}`}
          onClick={() => setView?.('ai')}
        >
          <SparkIcon />
          <span>AI</span>
        </Link>

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

      {onOpenAction && (
        <button
          type="button"
          className="dock-fab-btn"
          onClick={onOpenAction}
          aria-label="Quick Daily Standup"
          title="Daily Standup Report"
        >
          <PlusIcon />
        </button>
      )}
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

function BrainIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.54Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.54Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
