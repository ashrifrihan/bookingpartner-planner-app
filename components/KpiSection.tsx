'use client';

import { isSupabaseConfigured } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

type WeekBarItem = {
  date: string;
  label: string;
  pct: number;
  isToday: boolean;
  isComplete: boolean;
};

type SparklineCoord = {
  x: number;
  y: number;
  val: number;
  week: number;
};

type KpiSectionProps = {
  overallPercent: number;
  completedCount: number;
  totalCount: number;
  completedDaysCount: number;
  overdueCount: number;
  activeWeekNumber: number;
  activeWeekDone: number;
  activeWeekTotal: number;
  activeWeekPercent: number;
  activeWeekPhase: string;
  weekBarsData: WeekBarItem[];
  daysRemaining: number;
  planStart: string;
  planEnd: string;
  sparklineData: {
    coords: SparklineCoord[];
    pathD: string;
    areaD: string;
  };
  syncing: boolean;
  user: User | null;
  onSyncCloud: () => void;
  onInstallApp: () => void;
};

export function KpiSection({
  overallPercent,
  completedCount,
  totalCount,
  completedDaysCount,
  overdueCount,
  activeWeekNumber,
  activeWeekDone,
  activeWeekTotal,
  activeWeekPercent,
  activeWeekPhase,
  weekBarsData,
  daysRemaining,
  planStart,
  planEnd,
  sparklineData,
  syncing,
  user,
  onSyncCloud,
  onInstallApp,
}: KpiSectionProps) {
  const isBehind = overdueCount > 0;

  return (
    <section className="kpi-grid" aria-label="Key Performance Indicators">
      {/* KPI Card 1: Overall Progress & Schedule Variance */}
      <div className="kpi-card">
        <div className="kpi-head">
          <span className="kpi-title">Overall Progress</span>
          <span className={`kpi-pill ${isBehind ? 'muted' : 'success'}`}>
            <TrendUpIcon />
            <span>{isBehind ? `${overdueCount} Overdue` : 'On Track'}</span>
          </span>
        </div>

        <div className="kpi-value-row">
          <div className="kpi-value">
            {overallPercent}%
            <span className="kpi-unit">completed</span>
          </div>
        </div>

        <div className="wallet-progress-track" style={{ height: 6, margin: '6px 0 10px' }}>
          <span className="wallet-progress-bar" style={{ width: `${overallPercent}%` }} />
        </div>

        <div className="kpi-footer">
          <span className="trend">
            <TrendUpIcon />
            <span>{completedCount} of {totalCount} tasks</span>
          </span>
          <span>{completedDaysCount}/84 days</span>
        </div>
      </div>

      {/* KPI Card 2: Current Sprint with 7-Bar Chart */}
      <div className="kpi-card">
        <div className="kpi-head">
          <span className="kpi-title">Week {activeWeekNumber} Sprint</span>
          <span className="kpi-pill brand">
            <CalendarIcon />
            <span>{activeWeekPercent}%</span>
          </span>
        </div>

        <div className="kpi-value-row">
          <div className="kpi-value">
            {activeWeekDone}
            <span className="kpi-unit">/ {activeWeekTotal} tasks</span>
          </div>
        </div>

        {/* 7-Bar Mini Chart (FINNOVA Card 2) */}
        <div className="kpi-bar-chart" aria-label="Weekly 7-day task distribution">
          {weekBarsData.map((bar) => (
            <div
              key={bar.date}
              className={`kpi-bar-col ${bar.isToday ? 'today' : ''}`}
              title={`${bar.date}: ${bar.pct}% finished`}
            >
              <div className="kpi-bar-track">
                <div
                  className={`kpi-bar-fill ${bar.isToday ? 'active' : bar.isComplete ? 'complete' : ''}`}
                  style={{ height: `${Math.max(14, bar.pct)}%` }}
                />
              </div>
              <span className="kpi-bar-label">{bar.label}</span>
            </div>
          ))}
        </div>

        <div className="kpi-footer">
          <span>{activeWeekPhase}</span>
          <span className="trend">
            <TrendUpIcon />
            <span>Active</span>
          </span>
        </div>
      </div>

      {/* KPI Card 3: Schedule Velocity with Curved Sparkline */}
      <div className="kpi-card">
        <div className="kpi-head">
          <span className="kpi-title">Schedule Velocity</span>
          <span className="kpi-pill muted">
            <span>{isBehind ? `${overdueCount} Lagging` : 'Pace Optimal'}</span>
          </span>
        </div>

        <div className="kpi-value-row">
          <div className="kpi-value">
            {daysRemaining}
            <span className="kpi-unit">days left</span>
          </div>
        </div>

        {/* Curved SVG Sparkline (FINNOVA Card 3) */}
        <div className="kpi-sparkline-wrap">
          <svg className="kpi-sparkline" viewBox="0 0 174 46" fill="none">
            <defs>
              <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d={sparklineData.areaD} fill="url(#sparklineGrad)" />
            <path
              d={sparklineData.pathD}
              stroke="var(--purple-brand)"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {sparklineData.coords.map((pt) => (
              <circle
                key={pt.week}
                cx={pt.x}
                cy={pt.y}
                r={pt.week === activeWeekNumber ? '3.5' : '2'}
                fill={pt.week === activeWeekNumber ? '#38bdf8' : 'var(--purple-brand)'}
                stroke="var(--surface-card)"
                strokeWidth="1.5"
              />
            ))}
          </svg>
        </div>

        <div className="kpi-footer">
          <span>{planStart} to {planEnd}</span>
          <span>12 Weeks</span>
        </div>
      </div>

      {/* KPI Card 4: Cloud Sync & Storage (Zero dots, uses SVG loading icons) */}
      <div className="kpi-card">
        <div className="kpi-head">
          <span className="kpi-title">Storage & Sync</span>
          <span className="kpi-pill brand">
            <CloudStorageIcon />
            <span>{isSupabaseConfigured ? 'Realtime' : 'Local'}</span>
          </span>
        </div>

        <div className="kpi-value-row">
          <div className="kpi-value">
            {isSupabaseConfigured ? 'Supabase' : 'Offline DB'}
          </div>
        </div>

        {/* Synchronized status badge: ZERO DOTS */}
        <div>
          <span className={`synchronized-pill ${syncing ? 'syncing' : isSupabaseConfigured ? '' : 'local'}`}>
            {isSupabaseConfigured ? (
              syncing ? (
                <>
                  <SyncSpinIcon className="spin-icon" />
                  <span>Syncing cloud…</span>
                </>
              ) : (
                <>
                  <CheckBadgeIcon />
                  <span>Synchronized</span>
                </>
              )
            ) : (
              <>
                <HardDriveIcon />
                <span>Local Device Synced</span>
              </>
            )}
          </span>
        </div>

        {/* Quick Action cluster */}
        <div className="kpi-action-row">
          {user ? (
            <button
              type="button"
              className="kpi-action-btn"
              onClick={onSyncCloud}
              disabled={syncing}
              title="Force realtime cloud refresh"
            >
              <RefreshIcon />
              <span>{syncing ? 'Syncing…' : 'Sync now'}</span>
            </button>
          ) : (
            <button
              type="button"
              className="kpi-action-btn"
              onClick={onInstallApp}
              title="Install application locally"
            >
              <DownloadIcon />
              <span>Install</span>
            </button>
          )}

          <a
            className="kpi-action-btn"
            href="/BookingPartner_Backend_12_Week_Plan.pdf"
            target="_blank"
            rel="noreferrer"
            title="View PDF Schedule"
          >
            <ArrowUpRightIcon />
            <span>PDF</span>
          </a>
        </div>
      </div>
    </section>
  );
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function TrendUpIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 18 9 12 9" />
      <polyline points="6 20 18 8" />
    </svg>
  );
}

function CloudStorageIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </svg>
  );
}

function HardDriveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="8" x="2" y="14" rx="2" />
      <path d="M6 18h.01" />
      <path d="M10 18h.01" />
      <path d="M2 14l3.5-9h13L22 14" />
    </svg>
  );
}

function SyncSpinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function CheckBadgeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9" />
      <polyline points="9 12 11.5 14.5 15.5 10.5" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}
