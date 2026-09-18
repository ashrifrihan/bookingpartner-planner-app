'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  PLAN_END,
  PLAN_START,
  plan,
  type PlanDay,
  getMissedDays,
  type MissedDaySummary,
  type WhatsAppReportData,
} from '@/lib/plan';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { ItemStates, TextMap, TaskAction, EndOfDayLog } from '@/lib/storage';
import { useLocalPlanner } from '@/hooks/useLocalPlanner';
import { usePlannerSync } from '@/hooks/usePlannerSync';
import { TopBar } from './TopBar';
import { AuthForm } from './AuthForm';
import { KpiSection } from './KpiSection';
import { DayCard } from './DayCard';
import { NavigationDock, type PlannerNavView } from './NavigationDock';
import { ErrorBoundary } from './ErrorBoundary';
import { TaskDetailModal } from './TaskDetailModal';
import { MissedDayCatchUpModal } from './MissedDayCatchUp';
import { DailyCheckModal, MorningGreetingBanner } from './DailyCheckModal';
import { DeveloperMemorySection } from './DeveloperMemory';
import { AiPurposeAssistant } from './AiPurposeAssistant';
import { WhatsAppReportModal } from './WhatsAppReportModal';
import { DriftDetectorModal, WeeklyRetroModal, SparkleIcon } from './AiAssistant';
import { ArrowRightIcon } from '@/lib/visuals';

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
  // Navigation View: Home | Schedule | Tasks | Memory | AI
  const [view, setView] = useState<PlannerNavView>('home');
  const [scheduleWeekFilter, setScheduleWeekFilter] = useState<number | 'all'>('all');
  const [tasksFilter, setTasksFilter] = useState<'active' | 'completed' | 'overdue'>('active');

  // Modals & Panels State
  const [inspectTask, setInspectTask] = useState<{ day: PlanDay; itemIndex: number } | null>(null);
  const [activeCatchUpDay, setActiveCatchUpDay] = useState<MissedDaySummary | null>(null);
  const [eodModalOpen, setEodModalOpen] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [driftModalOpen, setDriftModalOpen] = useState(false);
  const [retroModalOpen, setRetroModalOpen] = useState(false);

  const today = localDateString();
  const tomorrow = addDays(today, 1);
  const yesterday = addDays(today, -1);
  const todayPlan = plan.find((day) => day.date === today) || plan[1]; // defaults to Day 2 if outside
  const tomorrowPlan = plan.find((day) => day.date === tomorrow);
  const yesterdayPlan = plan.find((day) => day.date === yesterday) || plan[0];

  // Local storage & offline state hook
  const {
    states,
    setStates,
    notes,
    setNotes,
    blocked,
    setBlocked,
    memoryNotes,
    addMemoryNote,
    deleteMemoryNote,
    endOfDayLogs,
    saveEndOfDayLog,
    taskOverrides,
    setTaskOverride,
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

  // 2. Overdue & Schedule Variance Tracking
  const overdueCount = useMemo(() => {
    return plan.reduce((acc, day) => {
      if (day.date >= today) return acc;
      const uncompleted = day.items.filter((_, idx) => {
        const k = itemKey(day.date, idx);
        const override = taskOverrides[k];
        return !states[k] && override?.action !== 'unnecessary';
      }).length;
      return acc + uncompleted;
    }, 0);
  }, [today, states, taskOverrides]);

  // 3. Active sprint calculations
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

  // 4. Missed Days Detection (A-to-Z catch-up calculation)
  const missedDaysList = useMemo(() => {
    return getMissedDays(today, states, taskOverrides, endOfDayLogs, blocked, notes);
  }, [today, states, taskOverrides, endOfDayLogs, blocked, notes]);

  const yesterdayMissed = useMemo(() => {
    return missedDaysList.find((m) => m.date === yesterday) || missedDaysList[0] || null;
  }, [missedDaysList, yesterday]);

  const yesterdayIncompleteTasks = useMemo(() => {
    if (!yesterdayPlan) return [];
    return yesterdayPlan.items
      .map((item, index) => ({ item, index, key: itemKey(yesterdayPlan.date, index) }))
      .filter((t) => !states[t.key] && taskOverrides[t.key]?.action !== 'unnecessary');
  }, [yesterdayPlan, states, taskOverrides]);

  // Today's task counts
  const todayCompletedCount = useMemo(() => {
    if (!todayPlan) return 0;
    return todayPlan.items.filter((_, idx) => states[itemKey(todayPlan.date, idx)]).length;
  }, [todayPlan, states]);

  const todayRemainingCount = todayPlan ? todayPlan.items.length - todayCompletedCount : 0;

  // Blocked tasks count
  const blockedCount = useMemo(() => {
    return Object.values(blocked).filter((text) => Boolean(text && text.trim())).length;
  }, [blocked]);

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

  // 7-Bar Chart Data & Sparklines for KPI
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

  // Drift Stats
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

  // WhatsApp data
  const whatsAppData: WhatsAppReportData = useMemo(() => {
    const completedList = todayPlan
      ? todayPlan.items.filter((_, idx) => states[itemKey(todayPlan.date, idx)])
      : [];
    const pendingList = todayPlan
      ? todayPlan.items.filter((_, idx) => !states[itemKey(todayPlan.date, idx)])
      : [];
    const blockedList = blocked[today] ? [blocked[today]] : [];
    const tomorrowList = tomorrowPlan ? tomorrowPlan.items.slice(0, 3) : [];

    return {
      date: today,
      completedTasks: completedList,
      pendingTasks: pendingList,
      blockedTasks: blockedList,
      tomorrowTasks: tomorrowList,
    };
  }, [todayPlan, states, blocked, today, tomorrowPlan]);

  // Loading Screen
  if (!authReady) {
    return (
      <main className="center-screen" style={{ flexDirection: 'column', gap: 14 }}>
        <div className="loader" />
        <span style={{ color: 'var(--ink-secondary)', fontWeight: 600, fontSize: '14px' }}>
          Loading developer planner…
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
              style={{ fontSize: '12px', padding: '7px 16px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <span>Continue to Local Mode</span>
              <ArrowRightIcon size={12} />
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
      {/* Top Navigation Bar with Quick Actions */}
      <TopBar
        view={view}
        setView={setView}
        activeWeekNumber={activeWeekNumber}
        online={online}
        theme={theme}
        toggleTheme={toggleTheme}
        user={user}
        onSignOut={() => supabase?.auth.signOut()}
        onOpenEndOfDay={() => setEodModalOpen(true)}
        onOpenWhatsApp={() => setWhatsappModalOpen(true)}
        overdueCount={overdueCount}
      />

      {/* Synchronizing Feedback Notice */}
      {message && (
        <div className="notice">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage('')}>✕</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: HOME (Answers the 5 core developer questions immediately)        */}
      {/* ========================================================================= */}
      {view === 'home' && (
        <div className="home-dashboard-view">
          {/* Missed Day Banner if yesterday had incomplete tasks */}
          {yesterdayMissed && yesterdayIncompleteTasks.length > 0 && (
            <div className="missed-day-warning-banner">
              <div className="missed-warning-left">
                <div>
                  <strong>You missed {formatDate(yesterdayMissed.date, true)}</strong>
                  <p>
                    {yesterdayIncompleteTasks.length} task{yesterdayIncompleteTasks.length > 1 ? 's were' : ' was'} not completed.
                    Your today&apos;s schedule depends on this.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="catchup-trigger-btn"
                onClick={() => setActiveCatchUpDay(yesterdayMissed)}
              >
                <span>Review & Catch Up</span>
                <ArrowRightIcon size={12} />
              </button>
            </div>
          )}

          {/* Morning Greeting Banner if End of Day recorded reasons */}
          <MorningGreetingBanner
            yesterdayDate={yesterday}
            yesterdayPlan={yesterdayPlan}
            yesterdayLog={endOfDayLogs[yesterday]}
            yesterdayIncompleteTasks={yesterdayIncompleteTasks}
            onOpenCatchUp={() => setActiveCatchUpDay(yesterdayMissed)}
          />

          {/* Flow Canvas: Top Project Pill & Connector */}
          <div className="flow-canvas-top">
            <div className="flow-client-pill">
              <span className="client-indicator-dot" />
              <span className="client-title">Project: <strong>BookingPartner</strong></span>
              <span className="flow-pill-separator">•</span>
              <span className="client-phase">Phase: <strong>{todayPlan?.phase || 'Foundation'}</strong></span>
              <span className="flow-pill-separator">•</span>
              <span className="client-timeline">{formatDate(today, true)}</span>
            </div>
            <div className="flow-stem-connector" />
          </div>

          {/* Central Task Node Card (matching reference design) */}
          <div className="flow-node-card central-task-node">
            <div className="flow-card-header">
              <div className="flow-header-left">
                <div className="flow-node-badge">
                  <span>TODAY&apos;S MAIN DELIVERABLE</span>
                </div>
                <h2 className="flow-deliverable-title">{todayPlan?.title}</h2>
                <div className="flow-assignee-meta">
                  <span className="meta-avatar">DV</span>
                  <span className="meta-text">Assigned to: <strong>Lead Developer</strong></span>
                  <span className="meta-separator">•</span>
                  <span className="meta-text">Sprint Day {todayPlan ? (todayPlan.week - 1) * 6 + todayPlan.dayInWeek : 1} of 30</span>
                </div>
              </div>

              {/* Progress Fraction & Remaining Metric */}
              <div className="flow-header-right">
                <div className="flow-progress-cluster">
                  <div className="progress-fraction-badge">
                    <span className="fraction-label">Progress:</span>
                    <strong>{todayCompletedCount} / {todayPlan ? todayPlan.items.length : 0}</strong>
                  </div>
                  {todayRemainingCount > 0 ? (
                    <span className="remaining-alert-pill">
                      {todayRemainingCount} remaining
                    </span>
                  ) : (
                    <span className="all-completed-pill">
                      All completed for today
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tech-Stack Mini Badge Row (matching reference image) */}
            <div className="flow-techstack-bar">
              <span className="techstack-title">Tech-Stack</span>
              <div className="techstack-pills-list">
                <span className="flow-tech-chip">Next.js 15</span>
                <span className="flow-tech-chip">Prisma</span>
                <span className="flow-tech-chip">NextAuth</span>
                <span className="flow-tech-chip">PostgreSQL</span>
                <span className="flow-tech-chip">TypeScript</span>
                <span className="flow-tech-chip">Tailwind</span>
              </div>
            </div>

            {/* Quick Action Pills Strip */}
            <div className="flow-action-pills-row">
              <button
                type="button"
                className="flow-pill-action primary"
                onClick={() => setWhatsappModalOpen(true)}
              >
                Standup Report
              </button>
              <button
                type="button"
                className="flow-pill-action"
                onClick={() => setEodModalOpen(true)}
              >
                End Day Review
              </button>
              <button
                type="button"
                className="flow-pill-action"
                onClick={() => setView('memory')}
              >
                Developer Memory ({memoryNotes.length})
              </button>
              {yesterdayMissed && yesterdayIncompleteTasks.length > 0 && (
                <button
                  type="button"
                  className="flow-pill-action warning"
                  onClick={() => setActiveCatchUpDay(yesterdayMissed)}
                >
                  Catch Up ({yesterdayIncompleteTasks.length})
                </button>
              )}
            </div>
          </div>

          {/* Bento Grid: Today's Tasks + AI Suggestion */}
          <div className="dashboard-main-grid">
            {/* Left Column: Today's Active Tasks */}
            <div className="dashboard-tasks-col">
              <div className="section-head-bar flow-subtasks-head">
                <div>
                  <span className="flow-subtasks-badge">SUBTASKS: LIST BELOW</span>
                  <h3>Today&apos;s Implementation</h3>
                </div>
                <span className="section-meta-chip">
                  Select subtask to inspect What, Why, and Guidance
                </span>
              </div>

              {todayPlan && (
                <DayCard
                  day={todayPlan}
                  states={states}
                  onToggle={toggleItem}
                  notes={notes}
                  blocked={blocked}
                  onSaveText={saveDayText}
                  onOpenTaskDetail={(day, idx) => setInspectTask({ day, itemIndex: idx })}
                  split={false}
                />
              )}
            </div>

            {/* Right Column: Contextual AI Suggestion + Memory Rules */}
            <div className="dashboard-sidebar-col">
              {/* Contextual AI Suggestion Card */}
              <div className="ai-context-card">
                <div className="ai-context-head">
                  <strong style={{ fontSize: '13px', letterSpacing: '0.02em' }}>AI Schedule Guidance</strong>
                  <span className="ai-realtime-badge">ACTIVE</span>
                </div>

                <div className="ai-context-body">
                  {yesterdayIncompleteTasks.length > 0 ? (
                    <p>
                      You have {yesterdayIncompleteTasks.length} unfinished task
                      {yesterdayIncompleteTasks.length > 1 ? 's' : ''} from yesterday.
                      Finish <strong>{yesterdayIncompleteTasks[0]?.item}</strong> first because today&apos;s{' '}
                      <strong>{todayPlan?.title}</strong> depends on it.
                    </p>
                  ) : (
                    <p>
                      Yesterday&apos;s milestones were completed cleanly. Focus today on{' '}
                      <strong>{todayPlan?.title}</strong> to keep the {todayPlan?.phase} roadmap on track.
                    </p>
                  )}
                </div>

                <div className="ai-context-actions">
                  <button
                    type="button"
                    className="ai-tiny-btn"
                    onClick={() => setView('ai')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <span>Open AI Copilot</span>
                    <ArrowRightIcon size={11} />
                  </button>
                </div>
              </div>

              {/* High-Impact Developer Memory Widget */}
              <div className="memory-widget-card">
                <div className="memory-widget-head">
                  <strong>Developer Memory</strong>
                  <button
                    type="button"
                    className="widget-link-btn"
                    onClick={() => setView('memory')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <span>Manage ({memoryNotes.length})</span>
                    <ArrowRightIcon size={11} />
                  </button>
                </div>

                <ul className="memory-bullets-list">
                  {memoryNotes.slice(0, 4).map((m) => (
                    <li key={m.id}>
                      <span className={`memory-bullet-cat ${m.category}`}>•</span>
                      <span>{m.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Progress Summary Card */}
              <div className="progress-summary-card">
                <div className="progress-card-title">
                  <span>Overall Delivery Progress</span>
                  <strong style={{ color: 'var(--purple-brand)', fontSize: '16px' }}>{overallPercent}%</strong>
                </div>

                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${overallPercent}%` }} />
                </div>

                <div className="progress-numbers-grid">
                  <div className="metric-box">
                    <span>Completed</span>
                    <strong>{completedCount}</strong>
                  </div>
                  <div className="metric-box">
                    <span>Remaining</span>
                    <strong>{totalCount - completedCount}</strong>
                  </div>
                  <div className="metric-box alert">
                    <span>Overdue</span>
                    <strong>{overdueCount}</strong>
                  </div>
                  <div className="metric-box warn">
                    <span>Blocked</span>
                    <strong>{blockedCount}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Full KPI Section (Finnova Overview) */}
          <div style={{ marginTop: '28px' }}>
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
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: SCHEDULE (Complete development plan with previous & future days)   */}
      {/* ========================================================================= */}
      {view === 'schedule' && (
        <div className="schedule-view">
          <div className="schedule-view-header">
            <div>
              <h2>Complete Development Plan</h2>
              <p>84 Days · 12 Weeks · Open any previous or future day.</p>
            </div>

            {/* Week Jumper */}
            <div className="week-jumper-pills">
              <button
                type="button"
                className={scheduleWeekFilter === 'all' ? 'active' : ''}
                onClick={() => setScheduleWeekFilter('all')}
              >
                All 12 Weeks
              </button>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
                <button
                  key={w}
                  type="button"
                  className={scheduleWeekFilter === w ? 'active' : ''}
                  onClick={() => setScheduleWeekFilter(w)}
                >
                  W{w}
                </button>
              ))}
            </div>
          </div>

          <div className="schedule-weeks-container">
            {Array.from({ length: 12 }, (_, i) => i + 1)
              .filter((w) => scheduleWeekFilter === 'all' || scheduleWeekFilter === w)
              .map((week) => {
                const days = plan.filter((day) => day.week === week);
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
                          onOpenTaskDetail={(d, idx) => setInspectTask({ day: d, itemIndex: idx })}
                          compact
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: TASKS (Active, Completed, Overdue task breakdown)                 */}
      {/* ========================================================================= */}
      {view === 'tasks' && (
        <div className="tasks-view">
          <div className="tasks-view-header">
            <div>
              <h2>Engineering Tasks Directory</h2>
              <p>Filter active, completed, or overdue tasks with progressive disclosure.</p>
            </div>

            <div className="tasks-filter-pills">
              <button
                type="button"
                className={tasksFilter === 'active' ? 'active' : ''}
                onClick={() => setTasksFilter('active')}
              >
                Active Tasks
              </button>
              <button
                type="button"
                className={tasksFilter === 'overdue' ? 'active' : ''}
                onClick={() => setTasksFilter('overdue')}
              >
                Overdue ({overdueCount})
              </button>
              <button
                type="button"
                className={tasksFilter === 'completed' ? 'active' : ''}
                onClick={() => setTasksFilter('completed')}
              >
                Completed ({completedCount})
              </button>
            </div>
          </div>

          <div className="tasks-feed-container">
            {plan
              .filter((day) => {
                if (tasksFilter === 'active') return day.items.some((_, idx) => !states[itemKey(day.date, idx)]);
                if (tasksFilter === 'completed') return day.items.every((_, idx) => states[itemKey(day.date, idx)]);
                if (tasksFilter === 'overdue') {
                  return day.date < today && day.items.some((_, idx) => !states[itemKey(day.date, idx)]);
                }
                return true;
              })
              .map((day) => (
                <DayCard
                  key={day.date}
                  day={day}
                  states={states}
                  onToggle={toggleItem}
                  notes={notes}
                  blocked={blocked}
                  onSaveText={saveDayText}
                  onOpenTaskDetail={(d, idx) => setInspectTask({ day: d, itemIndex: idx })}
                />
              ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: MEMORY (Developer Memory Board)                                  */}
      {/* ========================================================================= */}
      {view === 'memory' && (
        <div className="memory-view">
          <DeveloperMemorySection
            memoryNotes={memoryNotes}
            onAddNote={addMemoryNote}
            onDeleteNote={deleteMemoryNote}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 5: AI ASSISTANT (Purpose-Built Assistant with 6 buttons)             */}
      {/* ========================================================================= */}
      {view === 'ai' && (
        <div className="ai-view">
          <AiPurposeAssistant
            todayPlan={todayPlan}
            todayDate={today}
            missedTasksCount={yesterdayIncompleteTasks.length}
            missedTasksList={yesterdayIncompleteTasks.map((t) => t.item)}
            overdueCount={overdueCount}
            overallPercent={overallPercent}
            memoryNotes={memoryNotes}
            activeBlocker={blocked[today]}
            onOpenTaskModal={() => todayPlan && setInspectTask({ day: todayPlan, itemIndex: 0 })}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS & DRAWERS                                                          */}
      {/* ========================================================================= */}

      {/* 1. Task Detail Modal (What, Why, How, Done When, AI Explain) */}
      <TaskDetailModal
        isOpen={Boolean(inspectTask)}
        onClose={() => setInspectTask(null)}
        day={inspectTask ? inspectTask.day : null}
        itemIndex={inspectTask ? inspectTask.itemIndex : 0}
        isCompleted={Boolean(
          inspectTask && states[itemKey(inspectTask.day.date, inspectTask.itemIndex)]
        )}
        onToggleComplete={() => {
          if (inspectTask) toggleItem(inspectTask.day, inspectTask.itemIndex);
        }}
        notes={inspectTask ? notes[inspectTask.day.date] : ''}
        blocked={inspectTask ? blocked[inspectTask.day.date] : ''}
        onSaveNote={(val) => {
          if (inspectTask) saveDayText(inspectTask.day.date, 'note', val);
        }}
        onSaveBlocked={(val) => {
          if (inspectTask) saveDayText(inspectTask.day.date, 'blocked', val);
        }}
      />

      {/* 2. Missed Day Catch-Up Modal (A-to-Z Review & Decision Actions) */}
      <MissedDayCatchUpModal
        isOpen={Boolean(activeCatchUpDay)}
        onClose={() => setActiveCatchUpDay(null)}
        missedDay={activeCatchUpDay}
        onToggleTask={(date, idx) => {
          const d = plan.find((p) => p.date === date);
          if (d) toggleItem(d, idx);
        }}
        isTaskCompleted={(date, idx) => Boolean(states[itemKey(date, idx)])}
        onSetTaskAction={(key, action, targetDate) => {
          setTaskOverride(key, action, targetDate);
        }}
        todayDate={today}
      />

      {/* 3. Daily Check End-of-Day Modal */}
      <DailyCheckModal
        isOpen={eodModalOpen}
        onClose={() => setEodModalOpen(false)}
        todayDate={today}
        todayPlan={todayPlan || null}
        isTaskDone={(date, idx) => Boolean(states[itemKey(date, idx)])}
        onToggleTask={(date, idx) => {
          const d = plan.find((p) => p.date === date);
          if (d) toggleItem(d, idx);
        }}
        onSaveEndOfDay={saveEndOfDayLog}
        existingLog={endOfDayLogs[today]}
      />

      {/* 4. WhatsApp / Slack Daily Standup Modal */}
      <WhatsAppReportModal
        isOpen={whatsappModalOpen}
        onClose={() => setWhatsappModalOpen(false)}
        data={whatsAppData}
      />

      {/* 5. Schedule Drift Modal */}
      <DriftDetectorModal
        isOpen={driftModalOpen}
        onClose={() => setDriftModalOpen(false)}
        stats={driftStats}
        skippedTasks={skippedTasks}
      />

      {/* 6. Weekly Retro Modal */}
      <WeeklyRetroModal
        isOpen={retroModalOpen}
        onClose={() => setRetroModalOpen(false)}
        weekNumber={activeWeekNumber}
        weekPhase={activeWeekDays[0]?.phase || 'Foundation'}
        notes={activeWeekDays.map((d) => notes[d.date] || '')}
        completedTasks={activeWeekDays.flatMap((d) =>
          d.items.filter((_, idx) => states[itemKey(d.date, idx)])
        )}
        pendingTasks={activeWeekDays.flatMap((d) =>
          d.items.filter((_, idx) => !states[itemKey(d.date, idx)])
        )}
      />

      {/* Mobile Persistent Floating Bottom Capsule Dock */}
      <NavigationDock
        view={view}
        setView={setView}
        theme={theme}
        toggleTheme={toggleTheme}
        overdueCount={overdueCount}
        memoryCount={memoryNotes.length}
      />

      <footer>
        <span>
          {isSupabaseConfigured
            ? 'Supabase mode: private account + realtime updates'
            : 'Local mode: progress & memory stay in this browser'}
        </span>
        <span>Plan: 18 Sep to 10 Dec 2026 · Developer Memory & Schedule Assistant</span>
      </footer>
    </main>
  );
}
