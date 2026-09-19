'use client';

import { useState } from 'react';
import { usePlanner } from '@/context/PlannerContext';
import { requestPlanAssist, type AiAssistType } from '@/lib/ai';
import { renderInlineMarkdown } from '@/components/AiAssistant';
import { IdeaIcon, CheckIcon, NotebookIcon, TargetCrosshairIcon, BarChartIcon, ClockIcon, ShieldIcon, AlertOctagonIcon } from '@/lib/visuals';

type PurposeAction = {
  type: AiAssistType;
  label: string;
  icon: React.ReactNode;
  description: string;
};

const PURPOSE_ACTIONS: PurposeAction[] = [
  {
    type: 'make-today-plan',
    label: "Make Today's Plan",
    icon: <NotebookIcon size={14} />,
    description: "Synthesize today's focus, carryovers, and memory rules into a prioritized checklist.",
  },
  {
    type: 'what-did-i-miss',
    label: 'What Did I Miss?',
    icon: <TargetCrosshairIcon size={14} />,
    description: "Inspect missed or unfinished tasks from previous days and why they matter.",
  },
  {
    type: 'check-progress',
    label: 'Check Progress',
    icon: <BarChartIcon size={14} />,
    description: 'Evaluate delivery velocity, overdue items, and launch date risk.',
  },
  {
    type: 'replan',
    label: 'Replan',
    icon: <ClockIcon size={14} />,
    description: 'Adjust sequence and scope when tasks get delayed without breaking dependencies.',
  },
  {
    type: 'solve-blocker',
    label: 'Solve Blocker',
    icon: <ShieldIcon size={14} />,
    description: 'Practical technical workarounds, stubs, and unblocking strategies.',
  },
  {
    type: 'explain-task',
    label: 'Explain Architecture',
    icon: <IdeaIcon size={14} />,
    description: 'Deep-dive into architecture, purpose, and implementation steps of a task.',
  },
];

export default function AiPage() {
  const {
    todayPlan,
    today,
    yesterdayIncompleteTasks,
    overdueCount,
    overallPercent,
    memoryNotes,
    blocked,
  } = usePlanner();

  const [activeAction, setActiveAction] = useState<AiAssistType | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  const executeAction = async (actionType: AiAssistType, customQuery?: string) => {
    setActiveAction(actionType);
    setLoading(true);
    setErrorMsg(null);
    setCopied(false);

    try {
      const payload: any = {
        todayDate: today,
        todayTitle: todayPlan?.title || 'Daily Engineering Tasks',
        todayItems: todayPlan?.items || [],
        missedCount: yesterdayIncompleteTasks.length,
        missedTasks: yesterdayIncompleteTasks.map((t) => t.item),
        overdueCount,
        overallPercent,
        memoryNotes: memoryNotes.map((m) => `[${m.category}] ${m.text}`),
        blockerText: blocked[today] || customQuery || (todayPlan ? '' : 'No active blockers'),
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

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    executeAction('solve-blocker', customPrompt.trim());
    setCustomPrompt('');
  };

  const handleCopy = () => {
    if (aiResult) {
      navigator.clipboard.writeText(aiResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="ai-view">
      {/* Header */}
      <div className="ios-page-header">
        <div className="ios-header-left">
          <div className="ios-title-row">
            <h1 className="ios-page-title">AI Assistant</h1>
            <span className="ios-count-badge">
              BookingPartner V1
            </span>
          </div>
          <p className="ios-page-subtitle">
            Context-aware copilot paired with your 84-day schedule and architecture rules.
          </p>
        </div>
        <div className="ios-header-right">
          <span className="ios-date-badge">Roadmap: {overallPercent}%</span>
        </div>
      </div>

      {/* Live Roadmap Context Banner */}
      <div className="ios-deliverable-card" style={{ marginBottom: '16px' }}>
        <div className="ios-deliverable-top" style={{ marginBottom: '8px' }}>
          <div>
            <span className="ios-deliverable-kicker">ACTIVE SCHEDULE CONTEXT</span>
            <h2 className="ios-deliverable-title" style={{ fontSize: '15px' }}>
              {todayPlan?.title || 'Daily Engineering Tasks'}
            </h2>
          </div>
          <div className="ios-progress-percent" style={{ fontSize: '14px' }}>
            Day {todayPlan ? todayPlan.dayOffset + 1 : 1}/84
          </div>
        </div>

        <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ink-secondary)', lineHeight: 1.4 }}>
          {yesterdayIncompleteTasks.length > 0
            ? <><AlertOctagonIcon size={14} style={{marginRight: 4, display: 'inline-block'}}/> {yesterdayIncompleteTasks.length} task unfinished from yesterday.</>
            : <><CheckIcon size={14} style={{marginRight: 4, display: 'inline-block'}}/> Yesterday completed cleanly. Roadmap on track.</>}
          {blocked[today] && ` Blocker: ${blocked[today]}`}
        </p>
      </div>

      {/* 6 Quick Action Grid Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '10px',
          marginBottom: '16px',
        }}
      >
        {PURPOSE_ACTIONS.map((act) => {
          const isActive = activeAction === act.type;
          return (
            <button
              key={act.type}
              type="button"
              className={`ios-task-card ${isActive ? 'done' : ''}`}
              onClick={() => executeAction(act.type)}
              disabled={loading}
              style={{
                textAlign: 'left',
                padding: '12px 14px',
                cursor: 'pointer',
                borderColor: isActive ? 'var(--purple-brand)' : undefined,
                background: isActive ? 'var(--purple-surface)' : 'var(--surface-card)',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '16px' }}>{act.icon}</span>
                <strong style={{ fontSize: '13px', color: 'var(--ink-primary)' }}>{act.label}</strong>
              </div>
              <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--ink-muted)', lineHeight: 1.35 }}>
                {act.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Custom Ask Bar */}
      <form onSubmit={handleCustomSubmit} className="ios-search-bar" style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Ask assistant about architecture, bugs, or code..."
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          className="ios-search-input"
        />
        <button
          type="submit"
          disabled={loading || !customPrompt.trim()}
          className="ios-mini-action-btn primary"
          style={{ padding: '6px 14px', fontSize: '12.5px' }}
        >
          {loading ? 'Thinking...' : 'Ask'}
        </button>
      </form>

      {/* AI Status / Output Box */}
      {loading && (
        <div className="ios-deliverable-card" style={{ textAlign: 'center', padding: '24px 16px' }}>
          <div className="loader mini" style={{ margin: '0 auto 10px' }} />
          <span style={{ fontSize: '13px', color: 'var(--ink-secondary)', fontWeight: 600 }}>
            Consulting 84-day engineering plan &amp; developer memory...
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="ios-deliverable-card" style={{ borderColor: 'var(--red-accent)', background: 'rgba(244, 63, 94, 0.08)' }}>
          <p style={{ margin: 0, color: 'var(--red-accent)', fontSize: '13px' }}>{errorMsg}</p>
        </div>
      )}

      {aiResult && !loading && (
        <div className="ios-deliverable-card" style={{ marginBottom: '24px' }}>
          <div className="ios-deliverable-top" style={{ borderBottom: '1px dashed var(--line-subtle)', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="ios-ai-pulse" />
              <strong style={{ fontSize: '13.5px', color: 'var(--ink-primary)' }}>
                {PURPOSE_ACTIONS.find((a) => a.type === activeAction)?.label || 'Assistant Response'}
              </strong>
            </div>
            <button
              type="button"
              className="ios-mini-action-btn"
              onClick={handleCopy}
              style={{ fontSize: '11.5px', padding: '4px 10px' }}
            >
              {copied ? <><CheckIcon size={14} style={{marginRight: 4, display: 'inline-block'}}/> Copied</> : 'Copy'}
            </button>
          </div>

          <div
            style={{
              marginTop: '12px',
              fontSize: '13.5px',
              lineHeight: 1.6,
              color: 'var(--ink-primary)',
            }}
          >
            {renderInlineMarkdown(aiResult)}
          </div>
        </div>
      )}

      {!activeAction && !loading && !aiResult && (
        <div className="ios-empty-state">
          <p style={{ margin: 0 }}>Select any action above or type a question to receive architectural guidance.</p>
        </div>
      )}
    </div>
  );
}
