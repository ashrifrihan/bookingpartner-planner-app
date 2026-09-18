'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getPhaseMeta } from '@/lib/visuals';
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
  const phaseMeta = getPhaseMeta(activeWeekNumber);

  // GSAP animated count-up refs
  const percentTextRef = useRef<HTMLSpanElement>(null);
  const tasksCountRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const tracker = { pct: 0, done: 0 };
    gsap.to(tracker, {
      pct: overallPercent,
      done: completedCount,
      duration: 0.85,
      ease: 'power2.out',
      onUpdate: () => {
        if (percentTextRef.current) {
          percentTextRef.current.textContent = `${Math.round(tracker.pct)}%`;
        }
        if (tasksCountRef.current) {
          tasksCountRef.current.textContent = `${Math.round(tracker.done)}`;
        }
      },
    });
  }, [overallPercent, completedCount]);

  return (
    <section className="kpi-grid" aria-label="Key Performance Indicators">
      {/* KPI Card 1: Overall Progress & Schedule Variance */}
      <div className="kpi-card">
        <div className="kpi-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RocketIcon />
            <span className="kpi-title">Overall Progress</span>
          </div>
          <span className={`kpi-pill ${isBehind ? 'muted' : 'success'}`}>
            <TrendUpIcon />
            <span>{isBehind ? `${overdueCount} Overdue` : 'On Track'}</span>
          </span>
        </div>

        <div className="kpi-value-row">
          <div className="kpi-value">
            <span ref={percentTextRef}>{overallPercent}%</span>
            <span className="kpi-unit">completed</span>
          </div>
        </div>

        {/* Visual Progress Bar with gradient fill */}
        <div className="wallet-progress-track" style={{ height: 7, margin: '8px 0 10px' }}>
          <span
            className="wallet-progress-bar"
            style={{
              width: `${overallPercent}%`,
              transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />
        </div>

        <div className="kpi-footer">
          <span className="trend">
            <TrendUpIcon />
            <span>
              <strong ref={tasksCountRef}>{completedCount}</strong> of {totalCount} tasks
            </span>
          </span>
          <span>{completedDaysCount}/84 days</span>
        </div>
      </div>

      {/* KPI Card 2: Current Sprint with 7-Bar Chart & Phase Badge */}
      <div className="kpi-card">
        <div className="kpi-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: phaseMeta.color }}>{phaseMeta.icon}</span>
            <span className="kpi-title">Week {activeWeekNumber} Sprint</span>
          </div>
          <span className="kpi-pill brand" style={{ background: phaseMeta.badgeBg, color: phaseMeta.color }}>
            <span>{activeWeekPercent}%</span>
          </span>
        </div>

        <div className="kpi-value-row">
          <div className="kpi-value">
            {activeWeekDone}
            <span className="kpi-unit">/ {activeWeekTotal} tasks</span>
          </div>
        </div>

        {/* 7-Bar Mini Chart */}
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
          <span style={{ color: phaseMeta.color, fontWeight: 700 }}>{activeWeekPhase}</span>
          <span className="trend">
            <TrendUpIcon />
            <span>Sprint Active</span>
          </span>
        </div>
      </div>

      {/* KPI Card 3: Schedule Velocity with Curved Sparkline & Roadmap */}
      <div className="kpi-card">
        <div className="kpi-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <GaugeIcon />
            <span className="kpi-title">Schedule Velocity</span>
          </div>
          <span className={`kpi-pill ${isBehind ? 'danger' : 'success'}`}>
            <span>{isBehind ? `${overdueCount} Lagging` : 'Pace Optimal'}</span>
          </span>
        </div>

        <div className="kpi-value-row">
          <div className="kpi-value">
            {daysRemaining}
            <span className="kpi-unit">days left</span>
          </div>
        </div>

        {/* Curved SVG Sparkline */}
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
                r={pt.week === activeWeekNumber ? '4' : '2'}
                fill={pt.week === activeWeekNumber ? '#38bdf8' : 'var(--purple-brand)'}
                stroke="var(--surface-card)"
                strokeWidth="1.5"
              />
            ))}
          </svg>
        </div>

        <div className="kpi-footer">
          <span>{planStart} to {planEnd}</span>
          <span>12 Weeks Roadmap</span>
        </div>
      </div>

      {/* KPI Card 4: Cloud Sync & Storage */}
      <div className="kpi-card">
        <div className="kpi-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CloudIcon />
            <span className="kpi-title">Cloud Sync & Storage</span>
          </div>
          <span className={`synchronized-pill ${syncing ? 'syncing' : user ? 'cloud' : 'local'}`}>
            {syncing ? (
              <>
                <LoadingSpinner />
                <span>Syncing…</span>
              </>
            ) : user ? (
              <>
                <CloudCheckIcon />
                <span>Realtime Active</span>
              </>
            ) : (
              <>
                <DatabaseIcon />
                <span>Local Storage</span>
              </>
            )}
          </span>
        </div>

        <div className="kpi-value-row">
          <div className="kpi-value" style={{ fontSize: '15px', fontWeight: 600, marginTop: '4px' }}>
            {user ? (
              <span style={{ color: 'var(--ink-primary)' }}>{user.email}</span>
            ) : (
              <span style={{ color: 'var(--ink-secondary)' }}>Guest / Offline Account</span>
            )}
          </div>
        </div>

        <p className="kpi-desc">
          {isSupabaseConfigured
            ? user
              ? 'Realtime PostgreSQL synchronization active. All tasks and blockers sync instantly.'
              : 'Supabase configured. Sign in to sync across devices.'
            : 'Running offline with typed browser storage and automatic data protection.'}
        </p>

        <div className="kpi-actions">
          {isSupabaseConfigured && user ? (
            <button
              type="button"
              className="kpi-action-btn"
              onClick={onSyncCloud}
              disabled={syncing}
              title="Force reload latest changes from Supabase"
            >
              <RefreshIcon spinning={syncing} />
              <span>{syncing ? 'Syncing…' : 'Sync Cloud Now'}</span>
            </button>
          ) : (
            <button
              type="button"
              className="kpi-action-btn"
              onClick={onInstallApp}
              title="Install progressive web application"
            >
              <DownloadIcon />
              <span>Install Offline PWA</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

// Crisp Vector Icons for KPI Cards
function TrendUpIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

function GaugeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 14 4-4" />
      <path d="M3.34 19a10 10 0 1 1 17.32 0" />
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </svg>
  );
}

function CloudCheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg className="spin-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      className={spinning ? 'spin-icon' : ''}
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 21h5v-5" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" y2="3" />
    </svg>
  );
}
