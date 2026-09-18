'use client';

import { useCallback, useMemo, useState } from 'react';
import { PLAN_END, PLAN_START, plan, type PlanDay } from '@/lib/plan';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { ItemStates, TextMap } from '@/lib/storage';
import { useLocalPlanner } from '@/hooks/useLocalPlanner';
import { usePlannerSync } from '@/hooks/usePlannerSync';
import { TopBar } from './TopBar';
import { AuthForm } from './AuthForm';
import { KpiSection } from './KpiSection';
import { DayCard } from './DayCard';
import { NavigationDock } from './NavigationDock';
import { ErrorBoundary } from './ErrorBoundary';
import {
  DailyBriefCard,
  DriftDetectorModal,
  WeeklyRetroModal,
  WhatsAppModal,
  SparkleIcon,
  WhatsAppIcon,
} from './AiAssistant';

type Tab = 'today' | 'tomorrow' | 'week' | 'all' | 'overdue';

function localDateString(value = new Date()): string {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(dateString: string, days: number): string {
  const value = new Date(`${dateString}T12:00:00`);
  value.setDate(value.getDate() + days);
  return localDateString(value);
}

function itemKey(date: string, index: number): string {
  return `${date}:${index}`;
}

function formatDate(dateString: string, long = false): string {
  const value = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat('en-US', {
    weekday: long ? 'long' : 'short',
    day: 'numeric',
    month: long ? 'long' : 'short',
    year: long ? 'numeric' : undefined,
  }).format(value);
}

export default function Dashboard() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}

function DashboardContent() {
  const [tab, setTab] = useState<Tab>('today');
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [driftModalOpen, setDriftModalOpen] = useState(false);
  const [retroModalOpen, setRetroModalOpen] = useState(false);

  const today = localDateString();
  const tomorrow = addDays(today, 1);
  const todayPlan = plan.find((day) => day.date === today);

  // Local storage & offline state hook
  const {
    states,
    setStates,
    notes,
    setNotes,
    blocked,
    setBlocked,
    theme,
    toggleTheme,
    online,
    installPrompt,
    installApp,
    updateLocalItem,
    updateLocalText,
  } = useLocalPlanner();

  // Cloud sync handler
  const handleCloudLoaded = useCallback(
    ({ states: s, notes: n, blocked: b }: { states: ItemStates; notes: TextMap; blocked: TextMap }) => {
      setStates((prev) => ({ ...prev, ...s }));
      setNotes((prev) => ({ ...prev, ...n }));
      setBlocked((prev) => ({ ...prev, ...b }));
    },
    [setStates, setNotes, setBlocked]
  );

  // Supabase sync & realtime hook
  const {
    user,
    authReady,
    setAuthReady,
    slowNotice,
    syncing,
    message,
    setMessage,
    loadCloud,
    updateCloudItem,
    updateCloudText,
  } = usePlannerSync({ onCloudLoaded: handleCloudLoaded });

  // 1. Overall Progress Calculations
  const allItemKeys = useMemo(
    () => plan.flatMap((day) => day.items.map((_, index) => itemKey(day.date, index))),
    []
  );
  const completedCount = allItemKeys.filter((key) => states[key]).length;
  const totalCount = allItemKeys.length;
  const overallPercent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  const completedDaysCount = useMemo(() => {
    return plan.filter((day) => day.items.every((_, idx) => states[itemKey(day.date, idx)])).length;
  }, [states]);

  // 2. Schedule Variance & Overdue Tracking
  const overdueCount = useMemo(() => {
    return plan.reduce((acc, day) => {
      if (day.date >= today) return acc;
      const uncompleted = day.items.filter((_, idx) => !states[itemKey(day.date, idx)]).length;
      return acc + uncompleted;
    }, 0);
  }, [today, states]);

  // 3. Current Sprint Metrics (Week 1..12)
  const activeWeekNumber = todayPlan?.week ?? (today < PLAN_START ? 1 : 12);
  const activeWeekDays = useMemo(() => plan.filter((day) => day.week === activeWeekNumber), [activeWeekNumber]);
  const activeWeekKeys = useMemo(
    () => activeWeekDays.flatMap((day) => day.items.map((_, idx) => itemKey(day.date, idx))),
    [activeWeekDays]
  );
  const activeWeekDone = useMemo(
    () => activeWeekKeys.filter((key) => states[key]).length,
    [activeWeekKeys, states]
  );
  const activeWeekPercent = activeWeekKeys.length
    ? Math.round((activeWeekDone / activeWeekKeys.length) * 100)
    : 0;

  const daysRemaining = Math.max(0, plan.length - completedDaysCount);

  // 4. 7-Bar Chart Data
  const weekBarsData = useMemo(() => {
    return activeWeekDays.map((day) => {
      const keys = day.items.map((_, idx) => itemKey(day.date, idx));
      const done = keys.filter((k) => states[k]).length;
      const pct = keys.length ? Math.round((done / keys.length) * 100) : 0;
      const dateObj = new Date(`${day.date}T12:00:00`);
      const label = new Intl.DateTimeFormat('en-US', { weekday: 'narrow' }).format(dateObj);
      return {
        date: day.date,
        label,
        pct,
        isToday: day.date === today,
        isComplete: pct === 100,
      };
    });
  }, [activeWeekDays, states, today]);

  // 5. 12-Week Sparkline Data
  const sparklineData = useMemo(() => {
    const pts = Array.from({ length: 12 }, (_, i) => {
      const w = i + 1;
      const wDays = plan.filter((d) => d.week === w);
      const wKeys = wDays.flatMap((d) => d.items.map((_, idx) => itemKey(d.date, idx)));
      const done = wKeys.filter((k) => states[k]).length;
      return wKeys.length ? Math.round((done / wKeys.length) * 100) : 0;
    });

    const coords = pts.map((val, i) => {
      const x = 10 + i * 14;
      const y = Math.round(36 - (val / 100) * 26);
      return { x, y, val, week: i + 1 };
    });

    const pathD = coords.reduce((acc, pt, idx, arr) => {
      if (idx === 0) return `M ${pt.x} ${pt.y}`;
      const prev = arr[idx - 1];
      const cx = (prev.x + pt.x) / 2;
      return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`;
    }, '');

    const areaD = `${pathD} L ${coords[coords.length - 1].x} 44 L ${coords[0].x} 44 Z`;
    return { coords, pathD, areaD };
  }, [states]);

  // 6. Visible Days based on Tab selection
  const visibleDays = useMemo(() => {
    if (tab === 'today') return plan.filter((day) => day.date === today);
    if (tab === 'tomorrow') return plan.filter((day) => day.date === tomorrow);
    if (tab === 'week') {
      const current = todayPlan || (today < PLAN_START ? plan[0] : plan[plan.length - 1]);
      return plan.filter((day) => day.week === current.week);
    }
    if (tab === 'overdue') {
      return plan.filter((day) => day.date < today && day.items.some((_, idx) => !states[itemKey(day.date, idx)]));
    }
    return plan;
  }, [tab, today, tomorrow, todayPlan, states]);

  // 7. Drift Detector Stats (Expected vs Completed by date)
  const driftStats = useMemo(() => {
    const elapsedDays = plan.filter((d) => d.date <= today);
    const expected = elapsedDays.reduce((acc, d) => acc + d.items.length, 0);
    const completed = elapsedDays.reduce((acc, d) => {
      return acc + d.items.filter((_, idx) => states[itemKey(d.date, idx)]).length;
    }, 0);
    const completionRate = expected > 0 ? Math.round((completed / expected) * 100) : 100;
    return {
      expected,
      completed,
      completionRate,
      overdue: overdueCount,
    };
  }, [today, states, overdueCount]);

  const skippedTasks = useMemo(() => {
    return plan
      .filter((d) => d.date <= today)
      .flatMap((d) =>
        d.items
          .map((item, idx) => ({ item, done: Boolean(states[itemKey(d.date, idx)]) }))
          .filter((x) => !x.done)
          .map((x) => x.item)
      );
  }, [today, states]);

  const yesterdayDate = useMemo(() => addDays(today, -1), [today]);
  const yesterdayPlan = useMemo(() => plan.find((d) => d.date === yesterdayDate), [yesterdayDate]);
  const yesterdayNote = notes[yesterdayDate] || '';
  const yesterdayBlocked = blocked[yesterdayDate] || '';

  const yesterdayCompletedCount = useMemo(() => {
    if (!yesterdayPlan) return 0;
    return yesterdayPlan.items.filter((_, idx) => states[itemKey(yesterdayDate, idx)]).length;
  }, [yesterdayPlan, yesterdayDate, states]);

  const overdueTasksList = useMemo(() => {
    return plan
      .filter((d) => d.date < today)
      .flatMap((d) => {
        const uncompleted = d.items
          .map((item, idx) => ({ item, done: Boolean(states[itemKey(d.date, idx)]) }))
          .filter((x) => !x.done);
        if (!uncompleted.length) return [];
        const diffMs = new Date(`${today}T12:00:00`).getTime() - new Date(`${d.date}T12:00:00`).getTime();
        const daysOverdue = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
        return uncompleted.map((x) => ({ title: `${d.title}: ${x.item}`, daysOverdue }));
      });
  }, [today, states]);

  const completedTodayCount = useMemo(() => {
    if (!todayPlan) return 0;
    return todayPlan.items.filter((_, idx) => states[itemKey(today, idx)]).length;
  }, [todayPlan, today, states]);

  const remainingTodayCount = todayPlan ? todayPlan.items.length - completedTodayCount : 0;
  const tomorrowPlan = useMemo(() => plan.find((d) => d.date === tomorrow), [tomorrow]);

  // Week Retro data
  const weekNotes = useMemo(() => {
    return activeWeekDays.map((d) => notes[d.date] || '');
  }, [activeWeekDays, notes]);

  const weekCompletedTasks = useMemo(() => {
    return activeWeekDays.flatMap((d) =>
      d.items.filter((_, idx) => states[itemKey(d.date, idx)])
    );
  }, [activeWeekDays, states]);

  const weekPendingTasks = useMemo(() => {
    return activeWeekDays.flatMap((d) =>
      d.items.filter((_, idx) => !states[itemKey(d.date, idx)])
    );
  }, [activeWeekDays, states]);

  // Handlers for toggling items & notes
  const toggleItem = useCallback(
    (day: PlanDay, index: number) => {
      const key = itemKey(day.date, index);
      const next = !states[key];
      updateLocalItem(key, next);
      if (supabase && user) {
        updateCloudItem(day.date, index, next);
      }
    },
    [states, updateLocalItem, user, updateCloudItem]
  );

  const saveDayText = useCallback(
    (dayDate: string, field: 'note' | 'blocked', value: string) => {
      updateLocalText(dayDate, field, value);
      if (supabase && user) {
        updateCloudText(dayDate, field, value);
      }
    },
    [updateLocalText, user, updateCloudText]
  );

  // Loading Screen
  if (!authReady) {
    return (
      <main className="center-screen" style={{ flexDirection: 'column', gap: 14 }}>
        <div className="loader" />
        <span style={{ color: 'var(--ink-secondary)', fontWeight: 600, fontSize: '14px' }}>
          Loading planner…
        </span>
        {slowNotice && (
          <div style={{ marginTop: 8, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <p style={{ color: 'var(--ink-muted)', fontSize: '12px', margin: 0 }}>
              Cloud connection is taking longer than usual.
            </p>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setAuthReady(true)}
              style={{ fontSize: '12px', padding: '7px 16px', borderRadius: '999px' }}
            >
              Continue to Login / Local Mode →
            </button>
          </div>
        )}
      </main>
    );
  }

  // Auth Screen
  if (isSupabaseConfigured && !user) {
    return <AuthForm onLoggedIn={() => setAuthReady(true)} />;
  }

  return (
    <main className="app-shell">
      <TopBar
        tab={tab}
        setTab={setTab}
        activeWeekNumber={activeWeekNumber}
        online={online}
        theme={theme}
        toggleTheme={toggleTheme}
        user={user}
        onSignOut={() => supabase?.auth.signOut()}
      />

      {/* Page Title & Action Bar */}
      <div className="page-title-row">
        <div className="page-title-left">
          <h2>Deliverables & Roadmap</h2>
          <p>Manage and track all 84 engineering tasks in one place.</p>
        </div>
        <div className="page-actions-right">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setDriftModalOpen(true)}
            title="Analyze schedule drift and launch risk using Gemini"
          >
            <SparkleIcon />
            <span>Schedule Risk</span>
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setWhatsAppModalOpen(true)}
            title="Format and share daily project status to WhatsApp"
          >
            <WhatsAppIcon />
            <span>WhatsApp Update</span>
          </button>
          <a
            className="secondary-button"
            href="/BookingPartner_Backend_12_Week_Plan.pdf"
            target="_blank"
            rel="noreferrer"
            title="Download complete 12-week schedule PDF"
          >
            <DocumentIcon />
            <span>Schedule PDF</span>
          </a>
          {installPrompt && (
            <button type="button" className="secondary-button" onClick={installApp} title="Install as Web App">
              <DownloadIcon />
              <span>Install App</span>
            </button>
          )}
        </div>
      </div>

      {/* FINNOVA 4-Column KPI Cards Grid with Overdue & Schedule Variance Tracking */}
      <KpiSection
        overallPercent={overallPercent}
        completedCount={completedCount}
        totalCount={totalCount}
        completedDaysCount={completedDaysCount}
        overdueCount={overdueCount}
        activeWeekNumber={activeWeekNumber}
        activeWeekDone={activeWeekDone}
        activeWeekTotal={activeWeekKeys.length}
        activeWeekPercent={activeWeekPercent}
        activeWeekPhase={activeWeekDays[0]?.phase || 'Foundation'}
        weekBarsData={weekBarsData}
        daysRemaining={daysRemaining}
        planStart={formatDate(PLAN_START)}
        planEnd={formatDate(PLAN_END)}
        sparklineData={sparklineData}
        syncing={syncing}
        user={user}
        onSyncCloud={loadCloud}
        onInstallApp={installApp}
      />

      {message && (
        <div className="notice">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage('')}>×</button>
        </div>
      )}

      {/* Filter Row with Overdue counter */}
      <div className="filter-strip">
        <div className="filter-pills-group">
          <div className="filter-label-chip">
            <span>Active view</span>
            <span className="filter-chip-counter">
              {visibleDays.length}
            </span>
          </div>

          <nav className="tabs-segmented" aria-label="Planner views">
            {(['today', 'tomorrow', 'week', 'all', 'overdue'] as Tab[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={tab === item ? 'active' : ''}
              >
                {item === 'today'
                  ? 'Today'
                  : item === 'tomorrow'
                  ? 'Tomorrow'
                  : item === 'week'
                  ? `Week ${activeWeekNumber}`
                  : item === 'overdue'
                  ? `Overdue (${overdueCount})`
                  : 'All 12W'}
              </button>
            ))}
          </nav>
        </div>

        <div className="eyebrow" style={{ margin: 0 }}>
          {tab === 'today'
            ? `${formatDate(today, true)}`
            : tab === 'tomorrow'
            ? `${formatDate(tomorrow, true)}`
            : tab === 'week'
            ? `Sprint: ${activeWeekDays[0]?.phase || 'Foundation'}`
            : tab === 'overdue'
            ? `${overdueCount} Pending Overdue Tasks`
            : '84 Days · 12 Weeks Plan'}
        </div>
      </div>

      {/* Main Task Feed */}
      <section className="content">
        {tab === 'today' && todayPlan && (
          <DailyBriefCard
            todayDate={today}
            todayTitle={todayPlan.title}
            todayItems={todayPlan.items}
            yesterdayNote={yesterdayNote}
            yesterdayBlocked={yesterdayBlocked}
          />
        )}

        {tab === 'week' && (
          <div className="week-retro-strip">
            <div className="week-retro-info">
              <span className="eyebrow">Sprint Summary</span>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink-secondary)' }}>
                Review Week {activeWeekNumber} ({activeWeekDays[0]?.phase || 'Foundation'}) achievements and recurring blockers with Gemini AI.
              </p>
            </div>
            <button
              type="button"
              className="ai-pill-btn brand"
              onClick={() => setRetroModalOpen(true)}
            >
              <SparkleIcon />
              <span>Weekly Retro</span>
            </button>
          </div>
        )}

        {visibleDays.length === 0 ? (
          <div className="empty-card">
            <h2>{tab === 'overdue' ? 'No overdue tasks!' : 'No scheduled task for this date'}</h2>
            <p>
              {tab === 'overdue'
                ? 'Great job! You are completely on track with the planned schedule.'
                : `This project plan runs from ${formatDate(PLAN_START, true)} to ${formatDate(PLAN_END, true)}.`}
            </p>
            <button type="button" className="primary-button compact" onClick={() => setTab('all')}>
              Open full plan
            </button>
          </div>
        ) : tab === 'all' ? (
          Array.from({ length: 12 }, (_, i) => i + 1).map((week) => {
            const days = visibleDays.filter((day) => day.week === week);
            if (!days.length) return null;
            const keys = days.flatMap((day) => day.items.map((_, index) => itemKey(day.date, index)));
            const done = keys.filter((key) => states[key]).length;
            const percent = Math.round((done / keys.length) * 100);
            return (
              <section key={week} className="week-section">
                <div className="week-heading">
                  <div>
                    <p className="eyebrow">WEEK {week}</p>
                    <h2>{days[0].phase}</h2>
                    <p>{formatDate(days[0].date)} to {formatDate(days[days.length - 1].date)}</p>
                  </div>
                  <strong>{percent}%</strong>
                </div>
                <div className="day-grid multi-col">
                  {days.map((day) => (
                    <DayCard
                      key={day.date}
                      day={day}
                      states={states}
                      onToggle={toggleItem}
                      notes={notes}
                      blocked={blocked}
                      onSaveText={saveDayText}
                      compact
                    />
                  ))}
                </div>
              </section>
            );
          })
        ) : tab === 'week' || tab === 'overdue' ? (
          <div className="day-grid multi-col">
            {visibleDays.map((day) => (
              <DayCard
                key={day.date}
                day={day}
                states={states}
                onToggle={toggleItem}
                notes={notes}
                blocked={blocked}
                onSaveText={saveDayText}
              />
            ))}
          </div>
        ) : (
          /* Focused Today or Tomorrow: Desktop Split Panel */
          <div className="day-grid">
            {visibleDays.map((day) => (
              <DayCard
                key={day.date}
                day={day}
                states={states}
                onToggle={toggleItem}
                notes={notes}
                blocked={blocked}
                onSaveText={saveDayText}
                split={true}
              />
            ))}
          </div>
        )}
      </section>

      {/* Floating Bottom Capsule Navigation Dock for Mobile */}
      <NavigationDock tab={tab} setTab={setTab} theme={theme} toggleTheme={toggleTheme} />

      {/* AI & Sharing Modals */}
      <DriftDetectorModal
        isOpen={driftModalOpen}
        onClose={() => setDriftModalOpen(false)}
        stats={driftStats}
        skippedTasks={skippedTasks}
      />

      <WhatsAppModal
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
        reportData={{
          dateFormatted: formatDate(today, true),
          overallPercent,
          completedToday: completedTodayCount,
          remainingToday: remainingTodayCount,
          overdueCount,
          todayTitle: todayPlan?.title || 'No scheduled tasks',
          todayItems: todayPlan
            ? todayPlan.items.map((it, idx) => ({
                text: it,
                done: Boolean(states[itemKey(today, idx)]),
              }))
            : [],
          blockersText: blocked[today] || '',
          tomorrowTitle: tomorrowPlan?.title,
          yesterdayCompletedCount,
          overdueTasksList,
        }}
      />

      <WeeklyRetroModal
        isOpen={retroModalOpen}
        onClose={() => setRetroModalOpen(false)}
        weekNumber={activeWeekNumber}
        weekPhase={activeWeekDays[0]?.phase || 'Foundation'}
        notes={weekNotes}
        completedTasks={weekCompletedTasks}
        pendingTasks={weekPendingTasks}
      />

      <footer>
        <span>
          {isSupabaseConfigured
            ? 'Supabase mode: private account + realtime updates'
            : 'Local mode: progress stays in this browser'}
        </span>
        <span>Plan: 18 Sep to 10 Dec 2026</span>
      </footer>
    </main>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" y2="3" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
