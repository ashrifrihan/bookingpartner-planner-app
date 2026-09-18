'use client';

import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import {
  requestPlanAssist,
  type AiResponse,
} from '@/lib/ai';
import {
  getTaskChip,
  TargetCrosshairIcon,
  AlertOctagonIcon,
  GaugeIcon,
  NotebookIcon,
  CheckCircleIcon,
} from '@/lib/visuals';

export function DailyBriefCard({
  todayDate,
  todayTitle,
  todayItems,
  yesterdayNote,
  yesterdayBlocked,
}: {
  todayDate: string;
  todayTitle: string;
  todayItems: string[];
  yesterdayNote?: string;
  yesterdayBlocked?: string;
}) {
  const cacheKey = `bp-ai-brief-${todayDate}`;
  const [brief, setBrief] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(cacheKey) || '';
    }
    return '';
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [expanded, setExpanded] = useState<boolean>(true);

  async function handleGenerateBrief() {
    setLoading(true);
    setErrorMsg('');

    const res = await requestPlanAssist('daily-brief', {
      todayDate,
      todayTitle,
      todayItems,
      yesterdayNote: yesterdayNote || 'None',
      yesterdayBlocked: yesterdayBlocked || 'None',
    });

    if (res.success && res.suggestion) {
      setBrief(res.suggestion);
      if (typeof window !== 'undefined') {
        localStorage.setItem(cacheKey, res.suggestion);
      }
    } else {
      setErrorMsg(res.error || 'Could not generate daily brief. Make sure GEMINI_API_KEY is configured.');
    }
    setLoading(false);
  }

  return (
    <section className="ai-card" aria-label="Daily AI Brief">
      <div className="ai-card-head">
        <div className="ai-card-title-group">
          <SparkleIcon />
          <span className="ai-card-title">DAILY AI BRIEF</span>
        </div>
        <div className="ai-card-actions">
          {brief && (
            <button
              type="button"
              className="ai-text-btn"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Collapse' : 'Expand'}
            </button>
          )}
          <button
            type="button"
            className="ai-pill-btn"
            onClick={handleGenerateBrief}
            disabled={loading}
          >
            {loading ? (
              <>
                <LoadingSpinner />
                <span>Analyzing…</span>
              </>
            ) : brief ? (
              'Regenerate'
            ) : (
              'Generate Brief'
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="ai-error-notice">
          <span>{errorMsg}</span>
        </div>
      )}

      {brief && expanded && (
        <div className="ai-content-body">
          {brief.split('\n\n').map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>
      )}

      {!brief && !loading && !errorMsg && (
        <p className="ai-card-placeholder">
          Start your day with an AI summary of today&apos;s deliverables and unresolved items from yesterday.
        </p>
      )}
    </section>
  );
}

export function BlockerSuggestionWidget({
  taskTitle,
  blockerText,
  doneWhen,
}: {
  taskTitle: string;
  blockerText: string;
  doneWhen: string;
}) {
  const [suggestion, setSuggestion] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [dismissed, setDismissed] = useState<boolean>(false);

  if (!blockerText || !blockerText.trim() || dismissed) {
    return null;
  }

  async function handleGetWorkaround() {
    setLoading(true);
    setErrorMsg('');
    const res = await requestPlanAssist('blocker', {
      task: taskTitle,
      blocker: blockerText,
      doneWhen,
    });

    if (res.success && res.suggestion) {
      setSuggestion(res.suggestion);
    } else {
      setErrorMsg(res.error || 'Failed to get AI workaround.');
    }
    setLoading(false);
  }

  return (
    <div className="ai-inline-suggestion">
      <div className="ai-inline-head">
        <div className="ai-inline-title">
          <BotIcon />
          <span>AI Blocker Advisor</span>
        </div>
        <button
          type="button"
          className="ai-close-btn"
          onClick={() => setDismissed(true)}
          title="Dismiss suggestion"
        >
          ×
        </button>
      </div>

      {suggestion ? (
        <div className="ai-suggestion-text">
          {suggestion.split('\n').map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      ) : (
        <div className="ai-inline-prompt">
          <span>Stuck on this task? Let AI suggest an immediate workaround or mock solution.</span>
          <button
            type="button"
            className="ai-pill-btn brand"
            onClick={handleGetWorkaround}
            disabled={loading}
          >
            {loading ? <LoadingSpinner /> : <SparkleIcon />}
            <span>{loading ? 'Consulting Gemini…' : 'Get Workaround'}</span>
          </button>
        </div>
      )}

      {errorMsg && <p className="ai-error-notice">{errorMsg}</p>}
    </div>
  );
}


export function DriftDetectorModal({
  isOpen,
  onClose,
  stats,
  skippedTasks,
}: {
  isOpen: boolean;
  onClose: () => void;
  stats: {
    expected: number;
    completed: number;
    completionRate: number;
    overdue: number;
  };
  skippedTasks: string[];
}) {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const modalRef = useRef<HTMLDivElement>(null);
  const expRef = useRef<HTMLSpanElement>(null);
  const compRef = useRef<HTMLSpanElement>(null);
  const paceRef = useRef<HTMLSpanElement>(null);
  const overRef = useRef<HTMLSpanElement>(null);

  const isBehind = stats.overdue > 0;
  const isCritical = stats.overdue > 4;

  // GSAP Smooth Number Counter & Staggered Reveal
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const ctx = gsap.context(() => {
      // 1. Modal Card Spring Entrance
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.94, y: 16 },
        { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'back.out(1.4)' }
      );

      // 2. Numbers Count-up
      const tracker = { exp: 0, comp: 0, pace: 0, over: 0 };
      gsap.to(tracker, {
        exp: stats.expected,
        comp: stats.completed,
        pace: stats.completionRate,
        over: stats.overdue,
        duration: 0.8,
        ease: 'power2.out',
        onUpdate: () => {
          if (expRef.current) expRef.current.textContent = `${Math.round(tracker.exp)}`;
          if (compRef.current) compRef.current.textContent = `${Math.round(tracker.comp)}`;
          if (paceRef.current) paceRef.current.textContent = `${Math.round(tracker.pace)}%`;
          if (overRef.current) overRef.current.textContent = `${Math.round(tracker.over)}`;
        },
      });

      // 3. Staggered Task Chips
      gsap.fromTo(
        '.drift-slipped-card',
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out', delay: 0.1 }
      );
    }, modalRef);

    return () => ctx.revert();
  }, [isOpen, stats]);

  if (!isOpen) return null;

  async function handleAnalyze() {
    setLoading(true);
    setErrorMsg('');
    const res = await requestPlanAssist('drift', {
      stats,
      skippedTasks: skippedTasks.slice(0, 10),
    });

    if (res.success && res.suggestion) {
      setAnalysis(res.suggestion);
    } else {
      setErrorMsg(res.error || 'Failed to generate schedule risk analysis.');
    }
    setLoading(false);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div ref={modalRef} className="modal-card drift-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SparkleIcon />
            <h3 style={{ margin: 0 }}>Schedule Drift & Risk Detector</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <p className="muted" style={{ margin: '4px 0 16px', fontSize: '13px' }}>
          Pure JavaScript computes your exact variance. Gemini interprets schedule risk without hallucinations.
        </p>

        {/* Visual Schedule Health Gauge Banner */}
        <div className={`drift-health-banner ${isCritical ? 'critical' : isBehind ? 'warning' : 'healthy'}`}>
          <div className="health-banner-left">
            <div className="health-status-icon">
              {isCritical ? <AlertOctagonIcon /> : isBehind ? <GaugeIcon /> : <CheckCircleIcon />}
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800 }}>
                {isCritical
                  ? 'CRITICAL SCHEDULE RISK'
                  : isBehind
                  ? 'SCHEDULE DRIFT DETECTED'
                  : 'SPRINT PACE OPTIMAL'}
              </h4>
              <p style={{ margin: '2px 0 0', fontSize: '12px', opacity: 0.85 }}>
                {isBehind
                  ? `${stats.overdue} tasks remain unfinished from past schedule dates.`
                  : 'You are completely synchronized with the 84-day engineering plan.'}
              </p>
            </div>
          </div>
          <div className="health-pace-indicator">
            <span>{stats.completionRate}%</span>
            <small>target pace</small>
          </div>
        </div>

        {/* Computed Facts Grid with animated number refs & icons */}
        <div className="drift-stats-grid">
          <div className="drift-stat-card">
            <div className="drift-card-icon">
              <TargetCrosshairIcon />
            </div>
            <span ref={expRef} className="drift-stat-num">
              {stats.expected}
            </span>
            <span className="drift-stat-lbl">Expected Tasks</span>
          </div>

          <div className="drift-stat-card">
            <div className="drift-card-icon" style={{ color: 'var(--green-emerald)' }}>
              <CheckCircleIcon />
            </div>
            <span ref={compRef} className="drift-stat-num">
              {stats.completed}
            </span>
            <span className="drift-stat-lbl">Completed</span>
          </div>

          <div className="drift-stat-card">
            <div className="drift-card-icon" style={{ color: 'var(--purple-brand)' }}>
              <GaugeIcon />
            </div>
            <span ref={paceRef} className="drift-stat-num">
              {stats.completionRate}%
            </span>
            <span className="drift-stat-lbl">Pace</span>
          </div>

          <div className={`drift-stat-card ${isBehind ? 'danger' : 'success'}`}>
            <div className="drift-card-icon">
              <AlertOctagonIcon />
            </div>
            <span ref={overRef} className="drift-stat-num">
              {stats.overdue}
            </span>
            <span className="drift-stat-lbl">{isBehind ? 'Tasks Slipping' : 'On Track'}</span>
          </div>
        </div>

        {/* Visual Slipped Deliverables Board */}
        {skippedTasks.length > 0 && (
          <div className="drift-slipped-section">
            <div className="drift-section-head">
              <span className="section-title-label">UNFINISHED / SLIPPED DELIVERABLES:</span>
              <span className="slipped-count-pill">{skippedTasks.length} PENDING</span>
            </div>

            <div className="drift-slipped-list">
              {skippedTasks.slice(0, 5).map((taskTitle, idx) => {
                const chip = getTaskChip(taskTitle);
                return (
                  <div key={idx} className="drift-slipped-card">
                    <span className={`task-chip chip-${chip.type}`}>{chip.label}</span>
                    <span className="slipped-task-name">{taskTitle}</span>
                    <span className="slipped-priority-tag">NEEDS ACTION</span>
                  </div>
                );
              })}

              {skippedTasks.length > 5 && (
                <div className="slipped-more-banner">
                  +{skippedTasks.length - 5} additional deliverables need attention
                </div>
              )}
            </div>
          </div>
        )}

        {/* Gemini AI Risk Verdict Card */}
        {analysis ? (
          <div className="drift-verdict-box">
            <div className="verdict-box-head">
              <BotIcon />
              <span>Gemini Risk Verdict & Recommended Action</span>
            </div>
            <div className="verdict-bullets">
              {analysis
                .split('\n')
                .filter(Boolean)
                .map((line, idx) => (
                  <div key={idx} className="verdict-bullet-card">
                    <span className="verdict-dot">→</span>
                    <span className="verdict-text">{line.replace(/^[-*•]\s*/, '')}</span>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          !loading && !errorMsg && (
            <div className="drift-ai-placeholder">
              <BotIcon />
              <p>
                Run AI analysis to evaluate bottlenecks, cascading dependencies, and launch date risks.
              </p>
            </div>
          )
        )}

        {errorMsg && <p className="ai-error-notice">{errorMsg}</p>}

        {/* Modal Action Buttons */}
        <div className="modal-actions-row" style={{ marginTop: '20px' }}>
          <button type="button" className="secondary-button" onClick={onClose} style={{ flex: 1 }}>
            Close
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={handleAnalyze}
            disabled={loading}
            style={{ flex: 1.5, marginTop: 0 }}
          >
            {loading ? <LoadingSpinner /> : <SparkleIcon />}
            <span>{loading ? 'Analyzing Pace…' : analysis ? 'Re-Analyze Schedule' : 'Analyze Schedule Risk'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function WeeklyRetroModal({
  isOpen,
  onClose,
  weekNumber,
  weekPhase,
  notes,
  completedTasks,
  pendingTasks,
}: {
  isOpen: boolean;
  onClose: () => void;
  weekNumber: number;
  weekPhase: string;
  notes: string[];
  completedTasks: string[];
  pendingTasks: string[];
}) {
  const [retro, setRetro] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  async function handleGenerateRetro() {
    setLoading(true);
    setErrorMsg('');
    const res = await requestPlanAssist('weekly-retro', {
      weekNumber,
      weekPhase,
      notes: notes.filter(Boolean),
      completedTasks,
      pendingTasks,
    });

    if (res.success && res.suggestion) {
      setRetro(res.suggestion);
    } else {
      setErrorMsg(res.error || 'Failed to generate weekly retro.');
    }
    setLoading(false);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SparkleIcon />
            <h3 style={{ margin: 0 }}>Week {weekNumber} Retro ({weekPhase})</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <p className="muted" style={{ margin: '4px 0 14px', fontSize: '13px' }}>
          Condense 7 days of developer notes and finished items into a 3-bullet sprint review.
        </p>

        {retro ? (
          <div className="ai-content-body" style={{ marginTop: '10px', background: 'var(--surface-sunken)', padding: '14px', borderRadius: '8px' }}>
            {retro.split('\n\n').map((paragraph, idx) => (
              <div key={idx} style={{ marginBottom: '8px', fontSize: '13px', lineHeight: 1.5 }}>
                {paragraph.split('\n').map((l, i) => (
                  <div key={i}>{l}</div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          !loading && (
            <div style={{ padding: '14px', background: 'var(--surface-sunken)', borderRadius: '8px', fontSize: '13px', color: 'var(--ink-secondary)' }}>
              <div><strong>Summary of Week {weekNumber}:</strong></div>
              <div style={{ marginTop: '6px' }}>• {completedTasks.length} tasks completed</div>
              <div>• {pendingTasks.length} tasks in backlog</div>
              <div>• {notes.filter(Boolean).length} day notes recorded</div>
            </div>
          )
        )}

        {errorMsg && <p className="ai-error-notice">{errorMsg}</p>}

        <div className="modal-actions-row">
          <button type="button" className="secondary-button" onClick={onClose} style={{ flex: 1 }}>
            Close
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={handleGenerateRetro}
            disabled={loading}
            style={{ flex: 1.5, marginTop: 0 }}
          >
            {loading ? <LoadingSpinner /> : <SparkleIcon />}
            <span>{loading ? 'Summarizing Week…' : retro ? 'Regenerate Retro' : 'Generate Weekly Retro'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Inline SVGs for AI widgets
export function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

export function BotIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
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
