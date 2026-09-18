'use client';

import { useState } from 'react';
import type { AiAssistType } from '@/lib/ai';
import { requestPlanAssist } from '@/lib/ai';
import { renderInlineMarkdown } from './AiAssistant';
import type { DeveloperMemoryItem } from '@/lib/storage';
import type { PlanDay } from '@/lib/plan';

type PurposeAction = {
  type: AiAssistType;
  label: string;
  iconName: string;
  description: string;
};

const PURPOSE_ACTIONS: PurposeAction[] = [
  {
    type: 'make-today-plan',
    label: "Make Today's Plan",
    iconName: 'clipboard',
    description: "Synthesize today's focus, carryovers, and memory rules into a prioritized checklist.",
  },
  {
    type: 'what-did-i-miss',
    label: 'What Did I Miss?',
    iconName: 'history',
    description: "Inspect missed or unfinished tasks from previous days and why they matter.",
  },
  {
    type: 'check-progress',
    label: 'Check Progress',
    iconName: 'trending-up',
    description: 'Evaluate delivery velocity, overdue items, and launch date risk.',
  },
  {
    type: 'replan',
    label: 'Replan',
    iconName: 'refresh',
    description: 'Adjust sequence and scope when tasks get delayed without breaking dependencies.',
  },
  {
    type: 'solve-blocker',
    label: 'Solve Blocker',
    iconName: 'shield-alert',
    description: 'Practical technical workarounds, stubs, and unblocking strategies.',
  },
  {
    type: 'explain-task',
    label: 'Explain Task',
    iconName: 'code',
    description: 'Deep-dive into architecture, purpose, and implementation steps of a task.',
  },
];

export function AiPurposeAssistant({
  todayPlan,
  todayDate,
  missedTasksCount,
  missedTasksList,
  overdueCount,
  overallPercent,
  memoryNotes,
  activeBlocker,
  onOpenTaskModal,
}: {
  todayPlan?: PlanDay;
  todayDate: string;
  missedTasksCount: number;
  missedTasksList: string[];
  overdueCount: number;
  overallPercent: number;
  memoryNotes: DeveloperMemoryItem[];
  activeBlocker?: string;
  onOpenTaskModal?: () => void;
}) {
  const [activeAction, setActiveAction] = useState<AiAssistType | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);

  const executeAction = async (actionType: AiAssistType) => {
    setActiveAction(actionType);
    setLoading(true);
    setErrorMsg(null);
    setShowMore(false);

    try {
      const payload: any = {
        todayDate,
        todayTitle: todayPlan?.title || 'Daily Engineering Tasks',
        todayItems: todayPlan?.items || [],
        missedCount: missedTasksCount,
        missedTasks: missedTasksList,
        overdueCount,
        overallPercent,
        memoryNotes: memoryNotes.map((m) => `[${m.category}] ${m.text}`),
        blockerText: activeBlocker || (todayPlan ? '' : 'No active blockers'),
        why: todayPlan ? `Part of ${todayPlan.phase}` : undefined,
        doneWhen: todayPlan?.doneWhen,
      };

      const res = await requestPlanAssist(actionType, payload);

      if (res.success && res.suggestion) {
        setAiResult(res.suggestion);
      } else {
        setErrorMsg(res.error || "AI couldn't respond. Please try again.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "AI couldn't respond. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-purpose-card">
      {/* Header */}
      <div className="ai-purpose-header">
        <div className="ai-header-title-box">
          <span className="ai-gemini-chip">AI Assistance</span>
          <h3>Developer Assistant & Copilot</h3>
          <p>Direct architectural reasoning. Grounded in your schedule and memory rules.</p>
        </div>

        {activeAction && (
          <button
            type="button"
            className="ai-clear-btn"
            onClick={() => {
              setActiveAction(null);
              setAiResult(null);
              setErrorMsg(null);
            }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Purpose Action Buttons */}
      <div className="ai-buttons-grid">
        {PURPOSE_ACTIONS.map((act) => {
          const isActive = activeAction === act.type;
          return (
            <button
              key={act.type}
              type="button"
              className={`purpose-action-btn ${isActive ? 'active' : ''}`}
              onClick={() => executeAction(act.type)}
              disabled={loading}
            >
              <span className="action-btn-icon">
                <ActionIcon name={act.iconName} />
              </span>
              <span className="action-btn-text">{act.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Status / Output Area */}
      {loading && (
        <div className="ai-status-box thinking">
          <div className="loader mini" />
          <span>Formulating advice from project roadmap and memory rules…</span>
        </div>
      )}

      {errorMsg && (
        <div className="ai-status-box error">
          <p>{errorMsg}</p>
          {activeAction && (
            <button
              type="button"
              className="secondary-button compact"
              onClick={() => executeAction(activeAction)}
            >
              Try again
            </button>
          )}
        </div>
      )}

      {aiResult && !loading && (
        <div className="ai-output-container">
          <div className="ai-output-top-bar">
            <span className="ready-indicator">Suggestion ready</span>
            <span className="action-tag-name">
              {PURPOSE_ACTIONS.find((a) => a.type === activeAction)?.label || 'Analysis'}
            </span>
          </div>

          <div className={`ai-output-content ${showMore ? 'expanded' : 'collapsed'}`}>
            {renderInlineMarkdown(aiResult)}
          </div>

          {aiResult.length > 240 && (
            <button
              type="button"
              className="show-more-toggle-btn"
              onClick={() => setShowMore(!showMore)}
            >
              {showMore ? 'Show less' : 'Show full details'}
            </button>
          )}
        </div>
      )}

      {!activeAction && !loading && (
        <div className="ai-helper-cue">
          <span>Select any action above to generate focused guidance.</span>
        </div>
      )}
    </div>
  );
}

function ActionIcon({ name }: { name: string }) {
  if (name === 'clipboard') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      </svg>
    );
  }
  if (name === 'history') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M12 7v5l4 2" />
      </svg>
    );
  }
  if (name === 'trending-up') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    );
  }
  if (name === 'refresh') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
      </svg>
    );
  }
  if (name === 'shield-alert') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}
