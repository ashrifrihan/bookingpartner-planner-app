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
  ClockIcon,
  ZapIcon,
} from '@/lib/visuals';

// Inline Markdown Parser: parses **bold** and `code` tokens
export function renderInlineMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="ai-strong">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="ai-code">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

type BriefSections = {
  deliverables: string;
  yesterday: string;
  focus: string;
  other: string[];
};

export function parseBriefSections(text: string): BriefSections {
  const sections: BriefSections = {
    deliverables: '',
    yesterday: '',
    focus: '',
    other: [],
  };

  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  for (const para of paragraphs) {
    const headingMatch = /^\*\*(.*?)\*\*:?\s*([\s\S]*)$/.exec(para);
    if (headingMatch) {
      const heading = headingMatch[1].toLowerCase();
      const content = headingMatch[2].trim();

      if (heading.includes('deliverable') || heading.includes('today')) {
        sections.deliverables = content;
      } else if (heading.includes('yesterday') || heading.includes('status') || heading.includes('blocker')) {
        sections.yesterday = content;
      } else if (heading.includes('focus') || heading.includes('recommend') || heading.includes('priority')) {
        sections.focus = content;
      } else {
        sections.other.push(para);
      }
    } else {
      const lower = para.toLowerCase();
      if (lower.startsWith("today's deliverables") || lower.startsWith("deliverables")) {
        sections.deliverables = para.replace(/^[^:]+:\s*/i, '');
      } else if (lower.startsWith("status from yesterday") || lower.startsWith("yesterday")) {
        sections.yesterday = para.replace(/^[^:]+:\s*/i, '');
      } else if (lower.startsWith("recommended focus") || lower.startsWith("focus")) {
        sections.focus = para.replace(/^[^:]+:\s*/i, '');
      } else {
        sections.other.push(para);
      }
    }
  }

  return sections;
}

// Bento Intelligence Grid Component for Daily Brief
export function DailyBriefBento({ text }: { text: string }) {
  const sections = parseBriefSections(text);
  const hasStructuredSections = sections.deliverables || sections.yesterday || sections.focus;

  if (!hasStructuredSections) {
    return <FormattedAiText text={text} />;
  }

  const isCleanSlate =
    !sections.yesterday ||
    sections.yesterday.toLowerCase().includes('no carryover') ||
    sections.yesterday.toLowerCase().includes('clean slate') ||
    sections.yesterday.toLowerCase().includes('none');

  return (
    <div className="brief-bento-container">
      <div className="brief-bento-grid">
        {/* Card 1: Today's Deliverables */}
        <div className="bento-card bento-deliverables">
          <div className="bento-card-head">
            <div className="bento-icon-badge target">
              <TargetCrosshairIcon />
            </div>
            <div className="bento-title-group">
              <span className="bento-title">Today&apos;s Deliverables</span>
              <span className="bento-tag tag-primary">PRIMARY FOCUS</span>
            </div>
          </div>
          <div className="bento-card-body">
            {sections.deliverables ? (
              <div className="bento-text">{renderInlineMarkdown(sections.deliverables)}</div>
            ) : (
              <div className="bento-text muted">Synchronizing scheduled items for today.</div>
            )}
          </div>
        </div>

        {/* Card 2: Status from Yesterday */}
        <div className="bento-card bento-yesterday">
          <div className="bento-card-head">
            <div className="bento-icon-badge history">
              <ClockIcon />
            </div>
            <div className="bento-title-group">
              <span className="bento-title">Yesterday&apos;s Velocity</span>
              <span className={`bento-tag ${isCleanSlate ? 'tag-clean' : 'tag-warn'}`}>
                {isCleanSlate ? 'CLEAN SLATE' : 'ATTENTION'}
              </span>
            </div>
          </div>
          <div className="bento-card-body">
            {sections.yesterday ? (
              <div className="bento-text">{renderInlineMarkdown(sections.yesterday)}</div>
            ) : (
              <div className="bento-text muted">No unresolved tasks from yesterday.</div>
            )}
          </div>
        </div>

        {/* Card 3: Recommended Focus */}
        <div className="bento-card bento-action">
          <div className="bento-card-head">
            <div className="bento-icon-badge focus">
              <ZapIcon />
            </div>
            <div className="bento-title-group">
              <span className="bento-title">Recommended Action</span>
              <span className="bento-tag tag-action">STEP 1</span>
            </div>
          </div>
          <div className="bento-card-body">
            {sections.focus ? (
              <div className="bento-text">{renderInlineMarkdown(sections.focus)}</div>
            ) : (
              <div className="bento-text muted">Follow sequential task checklist.</div>
            )}
          </div>
        </div>
      </div>

      {sections.other.length > 0 && (
        <div className="brief-bento-other">
          {sections.other.map((para, i) => (
            <div key={i} className="bento-other-item">
              {renderInlineMarkdown(para)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Formatted AI Text Component: fallback for general markdown text
export function FormattedAiText({ text }: { text: string }) {
  if (!text) return null;

  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="ai-formatted-content">
      {paragraphs.map((para, pIdx) => {
        const headingMatch = /^\*\*(.*?)\*\*:?\s*([\s\S]*)$/.exec(para);
        if (headingMatch) {
          const headingTitle = headingMatch[1].replace(/:$/, '').trim();
          const bodyText = headingMatch[2].trim();

          return (
            <div key={pIdx} className="ai-brief-section-card">
              <div className="ai-brief-section-head">
                <span className="ai-section-badge">{headingTitle}</span>
              </div>
              <div className="ai-brief-section-body">
                {bodyText ? renderInlineMarkdown(bodyText) : null}
              </div>
            </div>
          );
        }

        const lines = para.split('\n').map((l) => l.trim()).filter(Boolean);
        const isBulletList =
          lines.length > 1 &&
          lines.every(
            (l) => l.startsWith('- ') || l.startsWith('* ') || /^\d+\.\s/.test(l)
          );

        if (isBulletList) {
          return (
            <ul key={pIdx} className="ai-brief-list">
              {lines.map((line, lIdx) => (
                <li key={lIdx} className="ai-brief-list-item">
                  <span className="ai-list-bullet">▪</span>
                  <span className="ai-list-text">
                    {renderInlineMarkdown(line.replace(/^[-*•]\s+|\d+\.\s+/, ''))}
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={pIdx} className="ai-brief-para">
            {renderInlineMarkdown(para)}
          </p>
        );
      })}
    </div>
  );
}

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
    <section className="daily-intel-card" aria-label="Daily AI Brief">
      {/* Sleek Command Center Header */}
      <div className="intel-card-header">
        <div className="intel-header-meta">
          <div className="intel-live-pill">
            <span className="live-dot-pulse" />
            <span>AI COPILOT</span>
          </div>
          <span className="intel-date-badge">{todayDate}</span>
          <span className="intel-context-badge">DAY BRIEFING</span>
        </div>

        <div className="intel-header-actions">
          {brief && (
            <button
              type="button"
              className="intel-text-action"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Collapse' : 'Expand'}
            </button>
          )}
          <button
            type="button"
            className="intel-action-btn"
            onClick={handleGenerateBrief}
            disabled={loading}
          >
            {loading ? (
              <>
                <LoadingSpinner />
                <span>Synthesizing…</span>
              </>
            ) : (
              <>
                <SparkleIcon />
                <span>{brief ? 'Regenerate Brief' : 'Generate Morning Brief'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="intel-headline-row">
        <h3 className="intel-headline">Morning Intelligence & Execution Brief</h3>
        <p className="intel-subheadline">
          Synthesized priorities, carryover dependency triage, and tactical sequence for {todayTitle || 'today'}.
        </p>
      </div>

      {errorMsg && (
        <div className="ai-error-notice">
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Bento Grid Body */}
      {brief && expanded && (
        <DailyBriefBento text={brief} />
      )}

      {!brief && !loading && !errorMsg && (
        <div className="intel-placeholder-box" onClick={handleGenerateBrief}>
          <div className="intel-placeholder-icon">
            <SparkleIcon />
          </div>
          <div>
            <h4 style={{ margin: '0 0 3px', fontSize: '13.5px', fontWeight: 850 }}>Ready for Today&apos;s Engineering Briefing</h4>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink-muted)' }}>
              Click to generate an instant executive summary of deliverables, carryover items, and first action.
            </p>
          </div>
        </div>
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
          <FormattedAiText text={suggestion} />
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
            <div className="drift-card-icon">
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
                    <span className="verdict-text">{renderInlineMarkdown(line.replace(/^[-*•]\s*/, ''))}</span>
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
        <div className="modal-actions-row">
          <button type="button" className="secondary-button modal-btn" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="primary-button modal-btn"
            onClick={handleAnalyze}
            disabled={loading}
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
            <h3 style={{ margin: 0 }}>Week {weekNumber} Retrospective</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <p className="muted" style={{ margin: '4px 0 14px', fontSize: '13px' }}>
          Condense 7 days of developer notes and finished items into a 3-bullet sprint review.
        </p>

        {retro ? (
          <div className="ai-content-body" style={{ marginTop: '10px' }}>
            <FormattedAiText text={retro} />
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
          <button type="button" className="secondary-button modal-btn" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="primary-button modal-btn"
            onClick={handleGenerateRetro}
            disabled={loading}
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
