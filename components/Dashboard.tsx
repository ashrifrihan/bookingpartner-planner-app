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
import { ArrowRightIcon, getTaskChip } from '@/lib/visuals';

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
  const [scheduleWeekFilter, setScheduleWeekFilter] = useState<number | 'all'>(1);
  const [tasksFilter, setTasksFilter] = useState<'all' | 'active' | 'overdue' | 'completed'>('all');
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryPhaseFilter, setDirectoryPhaseFilter] = useState<string>('all');
  const [directoryLimit, setDirectoryLimit] = useState(30);
  const [todayTaskSearch, setTodayTaskSearch] = useState('');
  const [todayTaskFilter, setTodayTaskFilter] = useState<'all' | 'pending' | 'completed'>('all');

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

  // Today's task items and filtered subset for iOS cards
  const todayTasks = useMemo(() => {
    if (!todayPlan) return [];
    return todayPlan.items.map((item, idx) => {
      const isDone = Boolean(states[itemKey(todayPlan.date, idx)]);
      const chip = getTaskChip(item);
      return {
        item,
        idx,
        isDone,
        chip,
        key: itemKey(todayPlan.date, idx),
      };
    });
  }, [todayPlan, states]);

  const filteredTodayTasks = useMemo(() => {
    return todayTasks.filter((task) => {
      if (todayTaskFilter === 'pending' && task.isDone) return false;
      if (todayTaskFilter === 'completed' && !task.isDone) return false;
      if (todayTaskSearch.trim()) {
        const q = todayTaskSearch.toLowerCase();
        return (
          task.item.toLowerCase().includes(q) ||
          task.chip.label.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [todayTasks, todayTaskFilter, todayTaskSearch]);

  // Engineering Directory flattened list of tasks
  const allDirectoryTasks = useMemo(() => {
    return plan.flatMap((day) => {
      const dayNum = (day.week - 1) * 6 + day.dayInWeek;
      const formattedDate = formatDate(day.date, false);
      return day.items.map((item, itemIndex) => {
        const key = itemKey(day.date, itemIndex);
        const isDone = Boolean(states[key]);
        const isOverdue = !isDone && day.date < today && taskOverrides[key]?.action !== 'unnecessary';
        const chip = getTaskChip(item);
        return {
          key,
          day,
          itemIndex,
          title: item,
          isDone,
          isOverdue,
          chip,
          dayNum,
          formattedDate,
        };
      });
    });
  }, [states, today, taskOverrides]);

  const directoryPhases = useMemo(() => {
    return Array.from(new Set(plan.map((d) => d.phase)));
  }, []);

  const filteredDirectoryTasks = useMemo(() => {
    const q = directorySearch.trim().toLowerCase();
    return allDirectoryTasks.filter((task) => {
      if (tasksFilter === 'active' && task.isDone) return false;
      if (tasksFilter === 'completed' && !task.isDone) return false;
      if (tasksFilter === 'overdue' && !task.isOverdue) return false;

      if (directoryPhaseFilter !== 'all' && task.day.phase !== directoryPhaseFilter) {
        return false;
      }

      if (q) {
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesPhase = task.day.phase.toLowerCase().includes(q);
        const matchesChip = task.chip.label.toLowerCase().includes(q);
        const matchesDayTitle = task.day.title.toLowerCase().includes(q);
        return matchesTitle || matchesPhase || matchesChip || matchesDayTitle;
      }

      return true;
    });
  }, [allDirectoryTasks, tasksFilter, directoryPhaseFilter, directorySearch]);

  const directoryCounts = useMemo(() => {
    const total = allDirectoryTasks.length;
    const active = allDirectoryTasks.filter((t) => !t.isDone).length;
    const overdue = allDirectoryTasks.filter((t) => t.isOverdue).length;
    const completed = allDirectoryTasks.filter((t) => t.isDone).length;
    return { total, active, overdue, completed };
  }, [allDirectoryTasks]);

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

          {/* iOS-Style Clean Page Header (Matching Reference Design) */}
          <div className="ios-page-header">
            <div className="ios-header-left">
              <div className="ios-title-row">
                <h1 className="ios-page-title">Today</h1>
                <span className="ios-count-badge">
                  {todayCompletedCount} of {todayTasks.length} Done
                </span>
              </div>
              <p className="ios-page-subtitle">
                {todayPlan?.phase || 'Foundation'} · Sprint Day {todayPlan ? (todayPlan.week - 1) * 6 + todayPlan.dayInWeek : 1} of 30
              </p>
            </div>
            <div className="ios-header-right">
              <span className="ios-date-badge">{formatDate(today, false)}</span>
            </div>
          </div>

          {/* Search Bar with Magnifying Glass & Clear */}
          <div className="ios-search-bar">
            <svg className="ios-search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 19l-4.35-4.35M17 9A8 8 0 1 1 1 9a8 8 0 0 1 16 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search today's tasks..."
              value={todayTaskSearch}
              onChange={(e) => setTodayTaskSearch(e.target.value)}
              className="ios-search-input"
            />
            {todayTaskSearch && (
              <button
                type="button"
                className="ios-search-clear"
                onClick={() => setTodayTaskSearch('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Pills (All / Pending / Completed / Standup Report) */}
          <div className="ios-filter-pills-row">
            <button
              type="button"
              className={`ios-filter-pill ${todayTaskFilter === 'all' ? 'active' : ''}`}
              onClick={() => setTodayTaskFilter('all')}
            >
              All ({todayTasks.length})
            </button>
            <button
              type="button"
              className={`ios-filter-pill ${todayTaskFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setTodayTaskFilter('pending')}
            >
              Pending ({todayTasks.length - todayCompletedCount})
            </button>
            <button
              type="button"
              className={`ios-filter-pill ${todayTaskFilter === 'completed' ? 'active' : ''}`}
              onClick={() => setTodayTaskFilter('completed')}
            >
              Completed ({todayCompletedCount})
            </button>
            <button
              type="button"
              className="ios-filter-pill action-pill"
              onClick={() => setWhatsappModalOpen(true)}
            >
              Standup Report
            </button>
          </div>

          {/* Deliverable Progress Card */}
          <div className="ios-deliverable-card">
            <div className="ios-deliverable-top">
              <div>
                <span className="ios-deliverable-kicker">TODAY&apos;S MAIN DELIVERABLE</span>
                <h2 className="ios-deliverable-title">{todayPlan?.title}</h2>
              </div>
              <div className="ios-progress-percent">
                {todayTasks.length > 0 ? Math.round((todayCompletedCount / todayTasks.length) * 100) : 0}%
              </div>
            </div>
            <div className="ios-progress-track">
              <div
                className="ios-progress-fill"
                style={{
                  width: `${todayTasks.length > 0 ? (todayCompletedCount / todayTasks.length) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="ios-deliverable-actions">
              <button
                type="button"
                className="ios-mini-action-btn primary"
                onClick={() => setWhatsappModalOpen(true)}
              >
                Standup Report
              </button>
              <button
                type="button"
                className="ios-mini-action-btn"
                onClick={() => setEodModalOpen(true)}
              >
                End Day Review
              </button>
              <button
                type="button"
                className="ios-mini-action-btn"
                onClick={() => setView('memory')}
              >
                Memory ({memoryNotes.length})
              </button>
              {yesterdayMissed && yesterdayIncompleteTasks.length > 0 && (
                <button
                  type="button"
                  className="ios-mini-action-btn warning"
                  onClick={() => setActiveCatchUpDay(yesterdayMissed)}
                >
                  Catch Up ({yesterdayIncompleteTasks.length})
                </button>
              )}
            </div>
          </div>

          {/* Today's Tasks List (matching reference invoice cards from uploaded image) */}
          <div className="ios-task-list">
            {filteredTodayTasks.map((task) => (
              <div className={`ios-task-card ${task.isDone ? 'done' : ''}`} key={task.key}>
                <div className="ios-card-top-row">
                  <button
                    type="button"
                    className={`ios-checkbox-btn ${task.isDone ? 'checked' : ''}`}
                    onClick={() => todayPlan && toggleItem(todayPlan, task.idx)}
                    aria-label={task.isDone ? 'Mark task as incomplete' : 'Mark task as complete'}
                  >
                    {task.isDone && (
                      <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
                        <path d="M13.485 3.515a1 1 0 0 1 0 1.414l-6.364 6.364a1 1 0 0 1-1.414 0L2.515 8.1a1 1 0 0 1 1.414-1.414l2.478 2.478 5.657-5.657a1 1 0 0 1 1.414 0z" />
                      </svg>
                    )}
                  </button>

                  <div className="ios-card-title-col">
                    <h3 className="ios-task-title">{task.item}</h3>
                    <div className="ios-task-meta-row">
                      <span className={`ios-chip ${task.chip.type}`}>{task.chip.label}</span>
                      <span className="ios-meta-dot">•</span>
                      <span className="ios-task-step">Task {task.idx + 1} of {todayTasks.length}</span>
                    </div>
                  </div>

                  <div className="ios-card-index-badge">#{task.idx + 1}</div>
                </div>

                <div className="ios-card-divider" />

                <div className="ios-card-bottom-row">
                  <div className="ios-status-indicator">
                    {task.isDone ? (
                      <span className="ios-status-pill completed">
                        <span className="status-dot" />
                        Completed
                      </span>
                    ) : (
                      <span className="ios-status-pill pending">
                        <span className="status-dot" />
                        Pending
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="ios-card-details-btn"
                    onClick={() => todayPlan && setInspectTask({ day: todayPlan, itemIndex: task.idx })}
                  >
                    <span>Details</span>
                    <ArrowRightIcon size={12} />
                  </button>
                </div>
              </div>
            ))}

            {filteredTodayTasks.length === 0 && (
              <div className="ios-empty-state">
                <p>No tasks match your search or filter.</p>
                <button
                  type="button"
                  className="ios-empty-reset"
                  onClick={() => {
                    setTodayTaskSearch('');
                    setTodayTaskFilter('all');
                  }}
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>

          {/* Contextual AI Schedule Guidance */}
          <div className="ios-ai-guidance-card">
            <div className="ios-ai-head">
              <div className="ios-ai-title-wrap">
                <span className="ios-ai-pulse" />
                <strong>AI Schedule Guidance</strong>
              </div>
              <button
                type="button"
                className="ios-ai-open-btn"
                onClick={() => setView('ai')}
              >
                <span>Open Assistant</span>
                <ArrowRightIcon size={11} />
              </button>
            </div>
            <div className="ios-ai-body">
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
                  <strong>{todayPlan?.title}</strong> to keep the {todayPlan?.phase} roadmap on schedule.
                </p>
              )}
            </div>
          </div>

          {/* Developer Memory Snapshot */}
          <div className="ios-memory-preview-card">
            <div className="ios-memory-head">
              <div>
                <span className="ios-deliverable-kicker">DEVELOPER MEMORY</span>
                <strong>Rules &amp; Decisions ({memoryNotes.length})</strong>
              </div>
              <button
                type="button"
                className="ios-card-details-btn"
                onClick={() => setView('memory')}
              >
                <span>Manage</span>
                <ArrowRightIcon size={11} />
              </button>
            </div>
            <div className="ios-memory-list">
              {memoryNotes.slice(0, 3).map((note) => (
                <div key={note.id} className="ios-memory-row">
                  <span className={`ios-memory-tag ${note.category}`}>{note.category}</span>
                  <span className="ios-memory-text">{note.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Full KPI Section (Finnova Overview) */}
          <div className="desktop-kpi-wrap" style={{ marginTop: '28px' }}>
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
      {/* ========================================================================= */}
      {/* VIEW 2: SCHEDULE (Clean, Mobile-Optimized Complete Development Plan)      */}
      {/* ========================================================================= */}
      {view === 'schedule' && (
        <div className="ios-schedule-view">
          {/* Header */}
          <div className="ios-page-header">
            <div className="ios-header-left">
              <div className="ios-title-row">
                <h1 className="ios-page-title">Schedule</h1>
                <span className="ios-count-badge">
                  30 Days · 12 Weeks
                </span>
              </div>
              <p className="ios-page-subtitle">
                Complete development plan. Select any week to focus or view all.
              </p>
            </div>
            <div className="ios-header-right">
              <span className="ios-date-badge">Today: {formatDate(today, false)}</span>
            </div>
          </div>

          {/* Week Selector Pills (Horizontal Scroll Strip) */}
          <div className="ios-week-selector-strip">
            <button
              type="button"
              className={`ios-week-pill ${scheduleWeekFilter === 'all' ? 'active' : ''}`}
              onClick={() => setScheduleWeekFilter('all')}
            >
              All Weeks
            </button>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
              <button
                key={w}
                type="button"
                className={`ios-week-pill ${scheduleWeekFilter === w ? 'active' : ''}`}
                onClick={() => setScheduleWeekFilter(w)}
              >
                Week {w}
              </button>
            ))}
          </div>

          {/* Weeks List */}
          <div className="ios-weeks-list">
            {Array.from({ length: 12 }, (_, i) => i + 1)
              .filter((w) => scheduleWeekFilter === 'all' || scheduleWeekFilter === w)
              .map((week) => {
                const days = plan.filter((day) => day.week === week);
                if (!days.length) return null;
                const keys = days.flatMap((day) => day.items.map((_, index) => itemKey(day.date, index)));
                const done = keys.filter((key) => states[key]).length;
                const percent = keys.length ? Math.round((done / keys.length) * 100) : 0;

                return (
                  <section key={week} className="ios-week-block">
                    {/* Week Milestone Header */}
                    <div className="ios-week-card-head">
                      <div className="ios-week-meta-col">
                        <span className="ios-week-kicker">WEEK {week} OF 12</span>
                        <h2 className="ios-week-title">{days[0].phase}</h2>
                        <span className="ios-week-dates">
                          {formatDate(days[0].date)} to {formatDate(days[days.length - 1].date)}
                        </span>
                      </div>
                      <div className="ios-week-stat">
                        <span className="ios-week-fraction">{done} / {keys.length}</span>
                        <span className={`ios-week-pill-badge ${percent === 100 ? 'done' : ''}`}>
                          {percent}%
                        </span>
                      </div>
                    </div>

                    {/* Week Progress Bar */}
                    <div className="ios-progress-track" style={{ marginBottom: '16px' }}>
                      <div className="ios-progress-fill" style={{ width: `${percent}%` }} />
                    </div>

                    {/* Days Stack (1 column, mobile-perfect) */}
                    <div className="ios-days-stack">
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
                          compact={true}
                          split={false}
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
      {/* VIEW 3: TASKS (Clean Engineering Tasks Directory)                         */}
      {/* ========================================================================= */}
      {view === 'tasks' && (
        <div className="tasks-directory-view">
          {/* Header */}
          <div className="ios-page-header">
            <div className="ios-header-left">
              <div className="ios-title-row">
                <h1 className="ios-page-title">Tasks Directory</h1>
                <span className="ios-count-badge">
                  {directoryCounts.completed} of {directoryCounts.total} Done
                </span>
              </div>
              <p className="ios-page-subtitle">
                Search, filter, and inspect all 170 sprint deliverables
              </p>
            </div>
            <div className="ios-header-right">
              <span className="ios-date-badge">Sprint: 30 Days</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="ios-search-bar">
            <svg className="ios-search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 19l-4.35-4.35M17 9A8 8 0 1 1 1 9a8 8 0 0 1 16 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by task title, API, schema, or phase..."
              value={directorySearch}
              onChange={(e) => {
                setDirectorySearch(e.target.value);
                setDirectoryLimit(30);
              }}
              className="ios-search-input"
            />
            {directorySearch && (
              <button
                type="button"
                className="ios-search-clear"
                onClick={() => setDirectorySearch('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Filter Pills Row */}
          <div className="ios-filter-pills-row">
            <button
              type="button"
              className={`ios-filter-pill ${tasksFilter === 'all' ? 'active' : ''}`}
              onClick={() => {
                setTasksFilter('all');
                setDirectoryLimit(30);
              }}
            >
              All ({directoryCounts.total})
            </button>
            <button
              type="button"
              className={`ios-filter-pill ${tasksFilter === 'active' ? 'active' : ''}`}
              onClick={() => {
                setTasksFilter('active');
                setDirectoryLimit(30);
              }}
            >
              Active ({directoryCounts.active})
            </button>
            <button
              type="button"
              className={`ios-filter-pill ${tasksFilter === 'overdue' ? 'active' : ''}`}
              onClick={() => {
                setTasksFilter('overdue');
                setDirectoryLimit(30);
              }}
            >
              Overdue ({directoryCounts.overdue})
            </button>
            <button
              type="button"
              className={`ios-filter-pill ${tasksFilter === 'completed' ? 'active' : ''}`}
              onClick={() => {
                setTasksFilter('completed');
                setDirectoryLimit(30);
              }}
            >
              Completed ({directoryCounts.completed})
            </button>
          </div>

          {/* Phase Filter Row (scrollable horizontal pills) */}
          <div className="directory-phase-pills-row">
            <button
              type="button"
              className={`phase-filter-pill ${directoryPhaseFilter === 'all' ? 'active' : ''}`}
              onClick={() => {
                setDirectoryPhaseFilter('all');
                setDirectoryLimit(30);
              }}
            >
              All Phases
            </button>
            {directoryPhases.map((phase) => (
              <button
                type="button"
                key={phase}
                className={`phase-filter-pill ${directoryPhaseFilter === phase ? 'active' : ''}`}
                onClick={() => {
                  setDirectoryPhaseFilter(phase);
                  setDirectoryLimit(30);
                }}
              >
                {phase}
              </button>
            ))}
          </div>

          {/* Filter Status Summary */}
          <div className="directory-results-meta">
            <span>
              Showing {Math.min(directoryLimit, filteredDirectoryTasks.length)} of {filteredDirectoryTasks.length} task{filteredDirectoryTasks.length === 1 ? '' : 's'}
            </span>
            {(directorySearch || tasksFilter !== 'all' || directoryPhaseFilter !== 'all') && (
              <button
                type="button"
                className="directory-reset-link"
                onClick={() => {
                  setDirectorySearch('');
                  setTasksFilter('all');
                  setDirectoryPhaseFilter('all');
                  setDirectoryLimit(30);
                }}
              >
                Reset filters
              </button>
            )}
          </div>

          {/* Individual Task Cards (matching reference image media_1789766927628.png) */}
          <div className="ios-task-list">
            {filteredDirectoryTasks.slice(0, directoryLimit).map((task) => (
              <div className={`ios-task-card ${task.isDone ? 'done' : ''}`} key={task.key}>
                <div className="ios-card-top-row">
                  <button
                    type="button"
                    className={`ios-checkbox-btn ${task.isDone ? 'checked' : ''}`}
                    onClick={() => toggleItem(task.day, task.itemIndex)}
                    aria-label={task.isDone ? 'Mark task as incomplete' : 'Mark task as complete'}
                  >
                    {task.isDone && (
                      <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
                        <path d="M13.485 3.515a1 1 0 0 1 0 1.414l-6.364 6.364a1 1 0 0 1-1.414 0L2.515 8.1a1 1 0 0 1 1.414-1.414l2.478 2.478 5.657-5.657a1 1 0 0 1 1.414 0z" />
                      </svg>
                    )}
                  </button>

                  <div className="ios-card-title-col">
                    <h3 className="ios-task-title">{task.title}</h3>
                    <div className="ios-task-meta-row">
                      <span className={`ios-chip ${task.chip.type}`}>{task.chip.label}</span>
                      <span className="ios-meta-dot">•</span>
                      <span className="ios-task-step">{task.day.phase} · Day {task.dayNum}</span>
                    </div>
                  </div>

                  <div className="ios-card-index-badge">{task.formattedDate}</div>
                </div>

                <div className="ios-card-divider" />

                <div className="ios-card-bottom-row">
                  <div className="ios-status-indicator">
                    {task.isDone ? (
                      <span className="ios-status-pill completed">
                        <span className="status-dot" />
                        Completed
                      </span>
                    ) : task.isOverdue ? (
                      <span className="ios-status-pill overdue">
                        <span className="status-dot" />
                        Overdue
                      </span>
                    ) : (
                      <span className="ios-status-pill pending">
                        <span className="status-dot" />
                        Pending
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="ios-card-details-btn"
                    onClick={() => setInspectTask({ day: task.day, itemIndex: task.itemIndex })}
                  >
                    <span>Details</span>
                    <ArrowRightIcon size={12} />
                  </button>
                </div>
              </div>
            ))}

            {filteredDirectoryTasks.length === 0 && (
              <div className="ios-empty-state">
                <p>No tasks match your search or filter.</p>
                <button
                  type="button"
                  className="ios-empty-reset"
                  onClick={() => {
                    setDirectorySearch('');
                    setTasksFilter('all');
                    setDirectoryPhaseFilter('all');
                    setDirectoryLimit(30);
                  }}
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>

          {/* Load More Pagination */}
          {filteredDirectoryTasks.length > directoryLimit && (
            <div className="directory-load-more-row">
              <button
                type="button"
                className="directory-load-more-btn"
                onClick={() => setDirectoryLimit((prev) => prev + 30)}
              >
                <span>Load More Tasks ({filteredDirectoryTasks.length - directoryLimit} remaining)</span>
                <ArrowRightIcon size={12} />
              </button>
              <button
                type="button"
                className="directory-show-all-btn"
                onClick={() => setDirectoryLimit(filteredDirectoryTasks.length)}
              >
                Show All ({filteredDirectoryTasks.length})
              </button>
            </div>
          )}
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
        onOpenAction={() => setWhatsappModalOpen(true)}
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
