'use client';

import { useState } from 'react';
import type { PlanDay } from '@/lib/plan';
import type { TaskReason, TaskStatusReason, EndOfDayLog } from '@/lib/storage';
import { ArrowRightIcon } from '@/lib/visuals';

const REASON_OPTIONS: { id: TaskStatusReason; label: string }[] = [
  { id: 'not_started', label: 'Not started' },
  { id: 'blocked', label: 'Blocked by dependency' },
  { id: 'need_more_time', label: 'Need more time' },
  { id: 'no_longer_needed', label: 'No longer needed' },
  { id: 'custom', label: 'Custom note' },
];

export function DailyCheckModal({
  isOpen,
  onClose,
  todayDate,
  todayPlan,
  isTaskDone,
  onToggleTask,
  onSaveEndOfDay,
  existingLog,
}: {
  isOpen: boolean;
  onClose: () => void;
  todayDate: string;
  todayPlan: PlanDay | null;
  isTaskDone: (date: string, index: number) => boolean;
  onToggleTask: (date: string, index: number) => void;
  onSaveEndOfDay: (log: EndOfDayLog) => void;
  existingLog?: EndOfDayLog;
}) {
  const [taskReasons, setTaskReasons] = useState<Record<string, TaskReason>>(
    existingLog?.taskReasons || {}
  );
  const [dayNote, setDayNote] = useState<string>(existingLog?.note || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen || !todayPlan) return null;

  const incompleteTasks = todayPlan.items
    .map((item, index) => ({ item, index, key: `${todayDate}:${index}` }))
    .filter((t) => !isTaskDone(todayDate, t.index));

  const completedCount = todayPlan.items.length - incompleteTasks.length;

  const handleSetReasonStatus = (taskKey: string, status: TaskStatusReason) => {
    setTaskReasons((prev) => ({
      ...prev,
      [taskKey]: {
        status,
        reasonText: prev[taskKey]?.reasonText || '',
      },
    }));
  };

  const handleSetReasonText = (taskKey: string, text: string) => {
    setTaskReasons((prev) => ({
      ...prev,
      [taskKey]: {
        status: prev[taskKey]?.status || 'need_more_time',
        reasonText: text,
      },
    }));
  };

  const handleFinishDay = () => {
    const log: EndOfDayLog = {
      date: todayDate,
      taskReasons,
      completedAt: new Date().toISOString(),
      note: dayNote,
    };
    onSaveEndOfDay(log);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="eod-title">
      <div className="eod-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="eod-header">
          <div>
            <div className="eod-badge">
              <span>End-of-Day Review</span>
            </div>
            <h2 id="eod-title" className="eod-title">
              {todayDate} · Wrap Up & Log Progress
            </h2>
            <p className="eod-subtitle">
              Today: {completedCount} / {todayPlan.items.length} completed
              {incompleteTasks.length > 0 && ` · ${incompleteTasks.length} remaining`}
            </p>
          </div>

          <button type="button" className="drawer-close-btn" onClick={onClose} aria-label="Close review">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="eod-body">
          {/* Section: Today's Tasks status */}
          <div className="eod-section">
            <h3 className="eod-section-heading">Today&apos;s Deliverables Review</h3>
            <div className="eod-tasks-checklist">
              {todayPlan.items.map((item, idx) => {
                const done = isTaskDone(todayDate, idx);
                return (
                  <label key={idx} className={`eod-task-row ${done ? 'done' : ''}`}>
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={() => onToggleTask(todayDate, idx)}
                    />
                    <span className="fake-check">{done ? '✓' : ''}</span>
                    <span className="task-name-label">{item}</span>
                    <span className="task-status-pill">{done ? 'Completed' : 'Pending'}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section: Why wasn't incomplete task completed? */}
          {incompleteTasks.length > 0 ? (
            <div className="eod-section">
              <h3 className="eod-section-heading">
                <span>Why wasn&apos;t work completed?</span>
                <span className="eod-hint">Stored for tomorrow morning&apos;s priority briefing</span>
              </h3>

              <div className="eod-reasons-container">
                {incompleteTasks.map(({ item, key }) => {
                  const currentReason = taskReasons[key];
                  const selectedStatus = currentReason?.status || 'not_started';

                  return (
                    <div key={key} className="eod-reason-card">
                      <div className="reason-card-task-header">
                        <span className="incomplete-dot">●</span>
                        <strong className="task-bold-name">{item}</strong>
                      </div>

                      {/* Status chips */}
                      <div className="reason-chips-row">
                        {REASON_OPTIONS.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            className={`reason-chip-btn ${selectedStatus === opt.id ? 'active' : ''}`}
                            onClick={() => handleSetReasonStatus(key, opt.id)}
                          >
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Reason text explanation */}
                      <input
                        type="text"
                        className="reason-text-input"
                        placeholder="Add reason note (e.g. schema migration pending, waiting on sandbox key)..."
                        value={currentReason?.reasonText || ''}
                        onChange={(e) => handleSetReasonText(key, e.target.value)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="eod-all-done-banner">
              <div>
                <strong>All tasks completed for today</strong>
                <p>Tomorrow will begin with a clean slate.</p>
              </div>
            </div>
          )}

          {/* Section: Optional Day Note */}
          <div className="eod-section">
            <h3 className="eod-section-heading">Daily Closing Note</h3>
            <textarea
              className="eod-closing-textarea"
              placeholder="Any key reflections, commits, or thoughts before signing off for the day?"
              value={dayNote}
              onChange={(e) => setDayNote(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="eod-footer">
          {savedSuccess && <span className="save-success-pill">Saved & Finished</span>}
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="primary-button" onClick={handleFinishDay}>
            Finish Day
          </button>
        </div>
      </div>
    </div>
  );
}

export function MorningGreetingBanner({
  yesterdayDate,
  yesterdayPlan,
  yesterdayLog,
  yesterdayIncompleteTasks,
  onOpenCatchUp,
}: {
  yesterdayDate: string;
  yesterdayPlan?: PlanDay;
  yesterdayLog?: EndOfDayLog;
  yesterdayIncompleteTasks: { item: string; key: string }[];
  onOpenCatchUp: () => void;
}) {
  if (yesterdayIncompleteTasks.length === 0) return null;

  return (
    <div className="morning-greeting-card">
      <div className="greeting-top-row">
        <div className="greeting-text">
          <h3>Good Morning · Unfinished Work from Yesterday</h3>
          <p>
            {yesterdayIncompleteTasks.length} task{yesterdayIncompleteTasks.length > 1 ? 's' : ''} on{' '}
            {yesterdayPlan?.title || yesterdayDate} were not finished.
          </p>
        </div>
        <button type="button" className="primary-button compact" onClick={onOpenCatchUp} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span>Review & Catch Up</span>
          <ArrowRightIcon size={12} />
        </button>
      </div>

      <div className="greeting-reasons-list">
        {yesterdayIncompleteTasks.map((t, idx) => {
          const reason = yesterdayLog?.taskReasons?.[t.key];
          return (
            <div key={idx} className="greeting-reason-item">
              <span className="task-bullet">
                <ArrowRightIcon size={11} />
              </span>
              <span className="task-title-text">{t.item}</span>
              {reason && (
                <span className="stored-reason-pill">
                  Reason: {reason.reasonText || reason.status.replace(/_/g, ' ')}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
