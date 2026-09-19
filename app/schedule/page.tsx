'use client';

import { useState } from 'react';
import { usePlanner, formatDate, itemKey } from '@/context/PlannerContext';
import { plan } from '@/lib/plan';
import { getPhaseMeta, ArrowRightIcon, CheckIcon } from '@/lib/visuals';

export default function SchedulePage() {
  const {
    today,
    states,
    toggleItem,
    setInspectTask,
  } = usePlanner();

  const [scheduleWeekFilter, setScheduleWeekFilter] = useState<number | 'all'>('all');
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  const toggleDayExpanded = (date: string) => {
    setExpandedDays((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  return (
    <div className="ios-schedule-view">
      {/* Header */}
      <div className="ios-page-header">
        <div className="ios-header-left">
          <div className="ios-title-row">
            <h1 className="ios-page-title">Schedule</h1>
            <span className="ios-count-badge">
              84 Days · 12 Weeks
            </span>
          </div>
          <p className="ios-page-subtitle">
            Complete backend roadmap. Tap any day to view deliverables and check off items.
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
          All Weeks (1-12)
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
            const meta = getPhaseMeta(week);

            return (
              <section key={week} className="ios-week-block">
                {/* Week Milestone Header */}
                <div className="ios-week-card-head">
                  <div className="ios-week-meta-col">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <span className="ios-week-kicker">WEEK {week} OF 12</span>
                      <span className="ios-chip" style={{ background: meta.badgeBg, color: meta.color }}>
                        {meta.tag}
                      </span>
                    </div>
                    <h2 className="ios-week-title">{days[0].phase}</h2>
                    <span className="ios-week-dates">
                      {formatDate(days[0].date)} to {formatDate(days[days.length - 1].date)}
                    </span>
                  </div>
                  <div className="ios-week-stat">
                    <span className="ios-week-fraction">{done} / {keys.length} Done</span>
                    <span className={`ios-week-pill-badge ${percent === 100 ? 'done' : ''}`}>
                      {percent}%
                    </span>
                  </div>
                </div>

                {/* Week Progress Bar */}
                <div className="ios-progress-track" style={{ marginBottom: '14px' }}>
                  <div className="ios-progress-fill" style={{ width: `${percent}%` }} />
                </div>

                {/* Days Stack (mobile-first iOS card layout) */}
                <div className="ios-days-stack" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {days.map((day) => {
                    const dayKeys = day.items.map((_, idx) => itemKey(day.date, idx));
                    const dayDoneCount = dayKeys.filter((k) => states[k]).length;
                    const isDayDone = dayDoneCount === day.items.length;
                    const isToday = day.date === today;
                    const isPast = day.date < today;
                    const isOverdue = isPast && !isDayDone;
                    const isExpanded = expandedDays[day.date] ?? (isToday || isOverdue);

                    return (
                      <div
                        className={`ios-task-card ${isDayDone ? 'done' : ''}`}
                        key={day.date}
                        style={{
                          borderLeft: isToday
                            ? '3px solid var(--purple-brand)'
                            : isOverdue
                            ? '3px solid var(--red-accent)'
                            : undefined,
                        }}
                      >
                        {/* Day Card Top Header */}
                        <div
                          className="ios-card-top-row"
                          onClick={() => toggleDayExpanded(day.date)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 600,
                              flexShrink: 0,
                              background: isDayDone
                                ? 'var(--green-surface)'
                                : isToday
                                ? 'var(--purple-surface)'
                                : 'var(--surface-sunken)',
                              color: isDayDone
                                ? 'var(--green-emerald)'
                                : isToday
                                ? 'var(--purple-brand)'
                                : 'var(--ink-secondary)',
                              border: '1px solid var(--line-strong)',
                            }}
                          >
                            {isDayDone ? <CheckIcon size={14} /> : `D${day.dayOffset + 1}`}
                          </div>

                          <div className="ios-card-title-col">
                            <h3 className="ios-task-title" style={{ fontSize: '15px', marginBottom: '2px' }}>
                              {day.title}
                            </h3>
                            <div className="ios-task-meta-row">
                              <span>{formatDate(day.date, true)}</span>
                              <span className="ios-meta-dot">•</span>
                              <span>Day {day.dayInWeek} of 7</span>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <span
                              className="ios-count-badge"
                              style={{
                                background: isDayDone ? 'var(--green-surface)' : undefined,
                                color: isDayDone ? 'var(--green-emerald)' : undefined,
                              }}
                            >
                              {dayDoneCount}/{day.items.length}
                            </span>
                          </div>
                        </div>

                        {/* Collapsible Items & Target Box */}
                        {isExpanded && (
                          <>
                            <div className="ios-card-divider" />

                            {/* Done When Criteria Callout */}
                            <div
                              style={{
                                background: 'var(--surface-sunken)',
                                border: '1px solid var(--line-subtle)',
                                borderRadius: '10px',
                                padding: '8px 12px',
                                fontSize: '12.5px',
                                color: 'var(--ink-secondary)',
                                marginBottom: '10px',
                                lineHeight: 1.4,
                              }}
                            >
                              <strong style={{ color: 'var(--ink-primary)' }}>Target:</strong> {day.doneWhen}
                            </div>

                            {/* Checklist Subtasks */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                              {day.items.map((item, idx) => {
                                const k = itemKey(day.date, idx);
                                const checked = Boolean(states[k]);
                                return (
                                  <div
                                    key={k}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '10px',
                                      padding: '4px 0',
                                    }}
                                  >
                                    <button
                                      type="button"
                                      className={`ios-checkbox-btn ${checked ? 'checked' : ''}`}
                                      onClick={() => toggleItem(day, idx)}
                                      style={{ width: '20px', height: '20px', marginTop: 0 }}
                                      aria-label={checked ? 'Mark incomplete' : 'Mark complete'}
                                    >
                                      {checked && (
                                        <svg viewBox="0 0 16 16" fill="currentColor" width="10" height="10">
                                          <path d="M13.485 3.515a1 1 0 0 1 0 1.414l-6.364 6.364a1 1 0 0 1-1.414 0L2.515 8.1a1 1 0 0 1 1.414-1.414l2.478 2.478 5.657-5.657a1 1 0 0 1 1.414 0z" />
                                        </svg>
                                      )}
                                    </button>
                                    <span
                                      style={{
                                        fontSize: '13px',
                                        color: checked ? 'var(--ink-muted)' : 'var(--ink-primary)',
                                        textDecoration: checked ? 'line-through' : 'none',
                                        flex: 1,
                                      }}
                                    >
                                      {item}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}

                        <div className="ios-card-divider" style={{ margin: '8px 0' }} />

                        {/* Day Card Bottom Row */}
                        <div className="ios-card-bottom-row">
                          <div className="ios-status-indicator">
                            {isDayDone ? (
                              <span className="ios-status-pill completed">
                                <span className="status-dot" />
                                Completed
                              </span>
                            ) : isToday ? (
                              <span className="ios-status-pill pending">
                                <span className="status-dot" />
                                Today
                              </span>
                            ) : isOverdue ? (
                              <span className="ios-status-pill overdue">
                                <span className="status-dot" />
                                Overdue
                              </span>
                            ) : (
                              <span
                                className="ios-status-pill"
                                style={{ background: 'var(--surface-sunken)', color: 'var(--ink-muted)' }}
                              >
                                <span className="status-dot" style={{ background: 'var(--ink-muted)' }} />
                                Upcoming
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              className="ios-card-details-btn"
                              onClick={() => toggleDayExpanded(day.date)}
                              style={{ color: 'var(--ink-secondary)', fontSize: '12px' }}
                            >
                              <span>{isExpanded ? 'Collapse' : `View Tasks (${day.items.length})`}</span>
                            </button>
                            <button
                              type="button"
                              className="ios-card-details-btn"
                              onClick={() => setInspectTask({ day, itemIndex: 0 })}
                            >
                              <span>Details</span>
                              <ArrowRightIcon size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
      </div>
    </div>
  );
}
