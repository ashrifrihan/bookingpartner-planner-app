'use client';

import { useState, useEffect } from 'react';
import type { MissedDaySummary } from '@/lib/plan';
import type { TaskAction } from '@/lib/storage';
import { requestPlanAssist } from '@/lib/ai';
import { renderInlineMarkdown } from './AiAssistant';
import { CloseIcon, CheckIcon } from '@/lib/visuals';

export function MissedDayCatchUpModal({
  isOpen,
  onClose,
  missedDay,
  onToggleTask,
  isTaskCompleted,
  onSetTaskAction,
  todayDate,
}: {
  isOpen: boolean;
  onClose: () => void;
  missedDay: MissedDaySummary | null;
  onToggleTask: (date: string, index: number) => void;
  isTaskCompleted: (date: string, index: number) => boolean;
  onSetTaskAction: (key: string, action: TaskAction, targetDate?: string) => void;
  todayDate: string;
}) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCatchUpPlan, setAiCatchUpPlan] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [reschedulePromptKey, setReschedulePromptKey] = useState<string | null>(null);
  const [targetDateInput, setTargetDateInput] = useState<string>(todayDate);

  useEffect(() => {
    if (isOpen && missedDay) {
      const fetchCatchUp = async () => {
        setAiLoading(true);
        setAiError(null);
        try {
          const res = await requestPlanAssist('morning-catchup', {
            missedDate: missedDay.date,
            missedTitle: missedDay.day.title,
            missedTasks: missedDay.missedTasks.map((t) => t.item),
            completedTasks: missedDay.completedTasks,
            blocked: missedDay.blockedText,
            notes: missedDay.noteText,
            whyItMatters: missedDay.whyItMatters,
          });

          if (res.success && res.suggestion) {
            setAiCatchUpPlan(res.suggestion);
          } else {
            setAiError(res.error || "AI couldn't generate a catch-up brief.");
          }
        } catch (err: any) {
          setAiError(err.message || 'AI request failed');
        } finally {
          setAiLoading(false);
        }
      };

      fetchCatchUp();
    }
  }, [isOpen, missedDay]);

  if (!isOpen || !missedDay) return null;

  const incompleteCount = missedDay.missedTasks.filter(
    (t) => !isTaskCompleted(missedDay.date, t.index) && t.override?.action !== 'unnecessary'
  ).length;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="catchup-title">
      <div className="catchup-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="catchup-modal-header">
          <div className="catchup-header-title-group">
            <span className="catchup-alert-chip">
              Missed Day Review
            </span>
            <h2 id="catchup-title" className="catchup-modal-title">
              {missedDay.date} · {missedDay.day.title}
            </h2>
            <p className="catchup-modal-subtitle">
              {incompleteCount === 0
                ? 'All missed tasks resolved or rescheduled.'
                : `${incompleteCount} task${incompleteCount > 1 ? 's were' : ' was'} not completed.`}
            </p>
          </div>

          <button type="button" className="drawer-close-btn" onClick={onClose} aria-label="Close review">
            ✕
          </button>
        </div>

        {/* Catch-Up Body: A-to-Z Review */}
        <div className="catchup-modal-body">
          {/* 1. Tasks List & Granular Resolution Controls */}
          <section className="catchup-section">
            <h3 className="catchup-section-title">
              <span>Missed Tasks & Action Decisions</span>
              <span className="catchup-count-badge">{missedDay.missedTasks.length} total</span>
            </h3>
            <p className="catchup-help-text">
              Decide what to do with each missed task. Tasks are never moved automatically without your decision.
            </p>

            <div className="catchup-tasks-list">
              {missedDay.missedTasks.map((t) => {
                const checked = isTaskCompleted(missedDay.date, t.index);
                const currentAction = t.override?.action;

                return (
                  <div key={t.itemKey} className={`catchup-task-card ${checked ? 'completed' : ''}`}>
                    <div className="catchup-task-top">
                      <label className="catchup-checkbox-label">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggleTask(missedDay.date, t.index)}
                        />
                        <span className="fake-check">{checked ? <CheckIcon size={14} /> : ''}</span>
                        <span className="catchup-task-text">{t.item}</span>
                      </label>

                      {currentAction && (
                        <span className={`catchup-action-tag action-${currentAction}`}>
                          {currentAction === 'move_today'
                            ? 'Moved to Today'
                            : currentAction === 'rescheduled'
                            ? `Rescheduled (${t.override?.targetDate || 'Later'})`
                            : currentAction === 'unnecessary'
                            ? 'Not Needed'
                            : 'Kept in Yesterday'}
                        </span>
                      )}
                    </div>

                    {/* Reported reason if End-of-Day recorded one */}
                    {t.reason && (
                      <div className="catchup-reason-box">
                        <span className="reason-chip-status">{t.reason.status.replace(/_/g, ' ')}:</span>{' '}
                        <span>{t.reason.reasonText || 'No extra notes provided'}</span>
                      </div>
                    )}

                    {/* User Control & Freedom Actions */}
                    <div className="catchup-decision-actions">
                      <button
                        type="button"
                        className={`catchup-btn ${currentAction === 'keep' || !currentAction ? 'active' : ''}`}
                        onClick={() => onSetTaskAction(t.itemKey, 'keep')}
                        title="Keep task assigned to yesterday for accurate historical logging"
                      >
                        Keep in Yesterday
                      </button>

                      <button
                        type="button"
                        className={`catchup-btn ${currentAction === 'move_today' ? 'active' : ''}`}
                        onClick={() => onSetTaskAction(t.itemKey, 'move_today')}
                        title="Bring this task to today's priority worklist"
                      >
                        Move to Today
                      </button>

                      <button
                        type="button"
                        className={`catchup-btn ${currentAction === 'rescheduled' ? 'active' : ''}`}
                        onClick={() => setReschedulePromptKey(t.itemKey)}
                        title="Pick a future date for this task"
                      >
                        Reschedule
                      </button>

                      <button
                        type="button"
                        className={`catchup-btn ${currentAction === 'unnecessary' ? 'active' : ''}`}
                        onClick={() => onSetTaskAction(t.itemKey, 'unnecessary')}
                        title="Mark as obsolete or no longer necessary"
                      >
                        Mark Unnecessary
                      </button>
                    </div>

                    {reschedulePromptKey === t.itemKey && (
                      <div className="reschedule-picker-row">
                        <span>Reschedule to date:</span>
                        <input
                          type="date"
                          value={targetDateInput}
                          onChange={(e) => setTargetDateInput(e.target.value)}
                        />
                        <button
                          type="button"
                          className="primary-button compact"
                          onClick={() => {
                            onSetTaskAction(t.itemKey, 'rescheduled', targetDateInput);
                            setReschedulePromptKey(null);
                          }}
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          className="secondary-button compact"
                          onClick={() => setReschedulePromptKey(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 2. What you planned to do vs What was completed */}
          <div className="catchup-grid-two">
            <div className="catchup-info-card">
              <h4 className="info-card-title green">What You Completed</h4>
              {missedDay.completedTasks.length > 0 ? (
                <ul className="info-list">
                  {missedDay.completedTasks.map((item, idx) => (
                    <li key={idx}><CheckIcon size={12} style={{marginRight: 4, display: 'inline-block'}}/> {item}</li>
                  ))}
                </ul>
              ) : (
                <p className="empty-notice">No tasks were checked off yesterday.</p>
              )}
            </div>

            <div className="catchup-info-card">
              <h4 className="info-card-title red">What Was Blocked</h4>
              <p className="info-body-text">
                {missedDay.blockedText ? missedDay.blockedText : 'No blocker was logged yesterday.'}
              </p>
            </div>
          </div>

          {/* 3. Developer Notes */}
          {missedDay.noteText && (
            <div className="catchup-info-card">
              <h4 className="info-card-title">Developer Notes</h4>
              <p className="info-body-text">{missedDay.noteText}</p>
            </div>
          )}

          {/* 4. Why It Matters & Downstream Dependencies */}
          <div className="catchup-grid-two">
            <div className="catchup-info-card">
              <h4 className="info-card-title amber">Why It Matters</h4>
              <p className="info-body-text">{missedDay.whyItMatters}</p>
            </div>

            <div className="catchup-info-card">
              <h4 className="info-card-title blue">Dependencies</h4>
              <p className="info-body-text">{missedDay.dependencies}</p>
            </div>
          </div>

          {/* 5. Immediate Next Action */}
          <div className="catchup-callout-card">
            <span className="callout-badge">NEXT ACTION</span>
            <p className="callout-text">{missedDay.nextAction}</p>
          </div>

          {/* 6. AI Explanation & Structured Catch-Up Plan */}
          <div className="catchup-ai-card">
            <div className="ai-card-top">
              <div className="ai-badge-label">
                <span>AI EXPLANATION & CATCH-UP PLAN</span>
              </div>
              {aiLoading && <span className="ai-thinking-pill">Thinking…</span>}
            </div>

            {aiLoading && (
              <div className="ai-loading-box">
                <div className="loader mini" />
                <span>Formulating personalized catch-up sequence from your deliverables…</span>
              </div>
            )}

            {aiError && (
              <div className="ai-error-box">
                <p>{aiError}</p>
              </div>
            )}

            {aiCatchUpPlan && !aiLoading && (
              <div className="ai-result-box expanded">
                {renderInlineMarkdown(aiCatchUpPlan)}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="catchup-modal-footer">
          <button type="button" className="secondary-button" onClick={onClose}>
            Back to Dashboard
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={onClose}
          >
            Done Reviewing
          </button>
        </div>
      </div>
    </div>
  );
}
