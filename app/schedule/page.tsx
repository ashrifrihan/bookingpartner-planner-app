'use client';

import { useState } from 'react';
import { usePlanner, formatDate, itemKey } from '@/context/PlannerContext';
import { plan } from '@/lib/plan';
import { DayCard } from '@/components/DayCard';

export default function SchedulePage() {
  const {
    today,
    states,
    notes,
    blocked,
    toggleItem,
    saveDayText,
    setInspectTask,
  } = usePlanner();

  const [scheduleWeekFilter, setScheduleWeekFilter] = useState<number | 'all'>('all');

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
  );
}
