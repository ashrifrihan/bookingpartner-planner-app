'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePlanner, formatDate, itemKey } from '@/context/PlannerContext';
import { MorningGreetingBanner } from '@/components/DailyCheckModal';
import { KpiSection } from '@/components/KpiSection';
import { ArrowRightIcon } from '@/lib/visuals';
import { PLAN_START, PLAN_END } from '@/lib/plan';

export default function HomePage() {
  const {
    today,
    yesterday,
    todayPlan,
    yesterdayPlan,
    yesterdayMissed,
    yesterdayIncompleteTasks,
    endOfDayLogs,
    todayTasks,
    todayCompletedCount,
    states,
    toggleItem,
    setInspectTask,
    setActiveCatchUpDay,
    memoryNotes,
    overallPercent,
    completedCount,
    totalCount,
    completedDaysCount,
    overdueCount,
    activeWeekNumber,
    activeWeekDone,
    activeWeekKeys,
    activeWeekPercent,
    activeWeekDays,
    weekBarsData,
    daysRemaining,
    sparklineData,
    syncing,
    user,
    loadCloud,
    installApp,
  } = usePlanner();

  const [todayTaskSearch, setTodayTaskSearch] = useState('');
  const [todayTaskFilter, setTodayTaskFilter] = useState<'all' | 'pending' | 'completed'>('all');

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

  const sprintDayNum = todayPlan ? todayPlan.dayOffset + 1 : 1;

  return (
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
            <span>Review &amp; Catch Up</span>
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

      {/* iOS-Style Clean Page Header */}
      <div className="ios-page-header">
        <div className="ios-header-left">
          <div className="ios-title-row">
            <h1 className="ios-page-title">Today</h1>
            <span className="ios-count-badge">
              {todayCompletedCount} of {todayTasks.length} Done
            </span>
          </div>
          <p className="ios-page-subtitle">
            {todayPlan?.phase || 'Setup and foundation'} · Sprint Day {sprintDayNum} of 84
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

      {/* Filter Segmented Control (Pills) */}
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
      </div>

      {/* Deliverable Focus Header */}
      {todayPlan && (
        <div className="ios-deliverable-banner">
          <span className="ios-deliverable-kicker">TODAY&apos;S PRIMARY DELIVERABLE</span>
          <h2 className="ios-deliverable-title">{todayPlan.title}</h2>
          <p className="ios-deliverable-done-when">
            <strong>Target:</strong> {todayPlan.doneWhen}
          </p>
        </div>
      )}

      {/* Today's Tasks Cards */}
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
          <Link href="/ai" className="ios-ai-open-btn" style={{ textDecoration: 'none' }}>
            <span>Open Assistant</span>
            <ArrowRightIcon size={11} />
          </Link>
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
          <Link href="/memory" className="ios-card-details-btn" style={{ textDecoration: 'none' }}>
            <span>Manage</span>
            <ArrowRightIcon size={11} />
          </Link>
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
  );
}
