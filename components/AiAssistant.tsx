'use client';

import { useState } from 'react';
import { requestPlanAssist, formatWhatsAppReport, type AiResponse } from '@/lib/ai';

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

export function WhatsAppModal({
  isOpen,
  onClose,
  reportData,
}: {
  isOpen: boolean;
  onClose: () => void;
  reportData: Parameters<typeof formatWhatsAppReport>[0];
}) {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const messageText = formatWhatsAppReport(reportData);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <WhatsAppIcon />
            <h3 style={{ margin: 0 }}>Share Daily Progress to WhatsApp</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <p className="muted" style={{ margin: '4px 0 14px', fontSize: '13px' }}>
          Formatted for WhatsApp chats and project groups.
        </p>

        <textarea
          readOnly
          value={messageText}
          className="whatsapp-preview-area"
          rows={12}
        />

        <div className="modal-actions-row">
          <button
            type="button"
            className="secondary-button"
            onClick={handleCopy}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            {copied ? '✓ Copied to Clipboard' : 'Copy Message'}
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="primary-button"
            style={{
              flex: 1,
              marginTop: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              textDecoration: 'none',
              background: '#25D366',
              color: '#000000',
              fontWeight: 800,
            }}
          >
            <WhatsAppIcon />
            <span>Open WhatsApp</span>
          </a>
        </div>
      </div>
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

  const isBehind = stats.overdue > 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
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

        {/* Computed Facts Grid */}
        <div className="drift-stats-grid">
          <div className="drift-stat-card">
            <span className="drift-stat-num">{stats.expected}</span>
            <span className="drift-stat-lbl">Expected Tasks</span>
          </div>
          <div className="drift-stat-card">
            <span className="drift-stat-num">{stats.completed}</span>
            <span className="drift-stat-lbl">Completed</span>
          </div>
          <div className="drift-stat-card">
            <span className="drift-stat-num">{stats.completionRate}%</span>
            <span className="drift-stat-lbl">Pace</span>
          </div>
          <div className={`drift-stat-card ${isBehind ? 'danger' : 'success'}`}>
            <span className="drift-stat-num">{stats.overdue}</span>
            <span className="drift-stat-lbl">{isBehind ? 'Tasks Slipping' : 'On Track'}</span>
          </div>
        </div>

        {skippedTasks.length > 0 && (
          <div style={{ marginTop: '14px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
              Unfinished / Slipped Tasks:
            </span>
            <div className="skipped-tags-list">
              {skippedTasks.slice(0, 5).map((t, idx) => (
                <span key={idx} className="skipped-tag">
                  {t}
                </span>
              ))}
              {skippedTasks.length > 5 && (
                <span className="skipped-tag muted">+{skippedTasks.length - 5} more</span>
              )}
            </div>
          </div>
        )}

        {analysis ? (
          <div className="ai-content-body" style={{ marginTop: '16px', background: 'var(--surface-sunken)', padding: '12px 14px', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BotIcon /> Gemini Risk Verdict:
            </h4>
            {analysis.split('\n').filter(Boolean).map((line, idx) => (
              <p key={idx} style={{ margin: '4px 0', fontSize: '13px', lineHeight: 1.5 }}>
                {line}
              </p>
            ))}
          </div>
        ) : (
          !loading && !errorMsg && (
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <p style={{ fontSize: '13px', color: 'var(--ink-secondary)', margin: '0 0 12px' }}>
                Run AI analysis to flag bottlenecks, cascading dependencies, and launch date risks.
              </p>
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

export function WhatsAppIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
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
