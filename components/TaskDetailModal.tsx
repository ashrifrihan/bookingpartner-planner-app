'use client';

import { useState } from 'react';
import type { PlanDay } from '@/lib/plan';
import { getTaskDetail } from '@/lib/plan';
import { requestPlanAssist } from '@/lib/ai';
import { renderInlineMarkdown } from './AiAssistant';
import { CloseIcon, CheckIcon } from '@/lib/visuals';

export function TaskDetailModal({
  isOpen,
  onClose,
  day,
  itemIndex,
  isCompleted,
  onToggleComplete,
  notes,
  blocked,
  onSaveNote,
  onSaveBlocked,
}: {
  isOpen: boolean;
  onClose: () => void;
  day: PlanDay | null;
  itemIndex: number;
  isCompleted: boolean;
  onToggleComplete: () => void;
  notes?: string;
  blocked?: string;
  onSaveNote: (val: string) => void;
  onSaveBlocked: (val: string) => void;
}) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);

  if (!isOpen || !day) return null;

  const detail = getTaskDetail(day, itemIndex);
  const taskName = day.items[itemIndex] || day.title;

  const handleExplainTask = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await requestPlanAssist('explain-task', {
        dayDate: day.date,
        dayTitle: day.title,
        itemTitle: taskName,
        itemIndex,
        phase: day.phase,
        why: detail.why,
        doneWhen: detail.doneWhen,
      });

      if (res.success && res.suggestion) {
        setAiExplanation(res.suggestion);
      } else {
        setAiError(res.error || "AI couldn't respond. Please try again.");
      }
    } catch (err: any) {
      setAiError(err.message || "AI couldn't respond. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="task-detail-title">
      <div className="task-detail-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Mobile drag handle indicator */}
        <div className="drawer-drag-pill" />

        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-header-meta">
            <span className="task-phase-badge">{day.phase}</span>
            <span className="task-date-badge">
              Week {day.week} · {day.date}
            </span>
          </div>

          <div className="drawer-header-actions">
            <button
              type="button"
              className={`task-status-toggle-btn ${isCompleted ? 'completed' : ''}`}
              onClick={onToggleComplete}
              aria-label={isCompleted ? 'Mark as pending' : 'Mark as complete'}
            >
              {isCompleted ? <><CheckIcon size={14} style={{marginRight: 4, display: 'inline-block'}}/> Completed</> : 'Mark Complete'}
            </button>
            <button type="button" className="drawer-close-btn" onClick={onClose} aria-label="Close task details">
              ✕
            </button>
          </div>
        </div>

        {/* Title */}
        <h2 id="task-detail-title" className="drawer-task-title">
          {taskName}
        </h2>
        <p className="drawer-parent-title">Parent Deliverable: {day.title}</p>

        {/* Core Detail Sections: What, Why, How, Done When */}
        <div className="task-detail-body">
          {/* Section: What */}
          <div className="detail-section-card">
            <div className="detail-section-label">
              <span className="section-bullet blue">●</span>
              <span>WHAT</span>
            </div>
            <p className="detail-section-text">{detail.what}</p>
          </div>

          {/* Section: Why */}
          <div className="detail-section-card">
            <div className="detail-section-label">
              <span className="section-bullet amber">●</span>
              <span>WHY</span>
            </div>
            <p className="detail-section-text">{detail.why}</p>
          </div>

          {/* Section: How */}
          <div className="detail-section-card">
            <div className="detail-section-label">
              <span className="section-bullet green">●</span>
              <span>HOW (STEP BY STEP)</span>
            </div>
            <ol className="detail-steps-list">
              {detail.how.map((step, idx) => (
                <li key={idx} className={idx === itemIndex ? 'current-step' : ''}>
                  {step} {idx === itemIndex && <span className="current-step-chip">Current item</span>}
                </li>
              ))}
            </ol>
          </div>

          {/* Section: Done When */}
          <div className="detail-section-card">
            <div className="detail-section-label">
              <span className="section-bullet blue">●</span>
              <span>DONE WHEN</span>
            </div>
            <p className="detail-section-text target-highlight">{detail.doneWhen}</p>
          </div>

          {/* Section: Blocked By & Dependencies */}
          <div className="detail-section-card">
            <div className="detail-section-label">
              <span className="section-bullet red">●</span>
              <span>BLOCKED BY & DEPENDENCIES</span>
            </div>
            <p className="detail-section-text">{blocked ? blocked : 'No active blockers reported.'}</p>
            <textarea
              className="detail-input-textarea"
              placeholder="Report or edit any blocker for this task..."
              value={blocked || ''}
              onChange={(e) => onSaveBlocked(e.target.value)}
              rows={2}
            />
          </div>

          {/* Section: Developer Notes */}
          <div className="detail-section-card">
            <div className="detail-section-label">
              <span className="section-bullet gray">●</span>
              <span>DEVELOPER NOTES</span>
            </div>
            <textarea
              className="detail-input-textarea"
              placeholder="Add technical notes, SQL queries, or test endpoints..."
              value={notes || ''}
              onChange={(e) => onSaveNote(e.target.value)}
              rows={3}
            />
          </div>

          {/* AI Assistant Section: Purpose-built Explain Task */}
          <div className="detail-ai-panel">
            <div className="detail-ai-head">
              <div className="ai-badge-label">
                <span>AI ARCHITECTURE INSIGHT</span>
              </div>

              <button
                type="button"
                className="ai-action-btn"
                onClick={handleExplainTask}
                disabled={aiLoading}
              >
                {aiLoading ? 'Thinking…' : 'Explain this task'}
              </button>
            </div>

            {aiLoading && (
              <div className="ai-loading-box">
                <div className="loader mini" />
                <span>Analyzing architecture requirements and dependencies…</span>
              </div>
            )}

            {aiError && (
              <div className="ai-error-box">
                <p>{aiError}</p>
                <button type="button" className="retry-btn" onClick={handleExplainTask}>
                  Try again
                </button>
              </div>
            )}

            {aiExplanation && (
              <div className="ai-result-box">
                <div className={`ai-result-content ${showMore ? 'expanded' : 'collapsed'}`}>
                  {renderInlineMarkdown(aiExplanation)}
                </div>
                {aiExplanation.length > 220 && (
                  <button
                    type="button"
                    className="show-more-btn"
                    onClick={() => setShowMore(!showMore)}
                  >
                    {showMore ? 'Show less ▲' : 'Show more ▼'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="drawer-footer">
          <button type="button" className="secondary-button" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className={`primary-button ${isCompleted ? 'done' : ''}`}
            onClick={() => {
              onToggleComplete();
              onClose();
            }}
          >
            {isCompleted ? 'Mark Pending' : <><CheckIcon size={14} style={{marginRight: 4, display: 'inline-block'}}/> Mark Done & Close</>}
          </button>
        </div>
      </div>
    </div>
  );
}
