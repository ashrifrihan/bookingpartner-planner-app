'use client';

import { type CSSProperties, useEffect, useRef } from 'react';
import gsap from 'gsap';
import type { PlanDay } from '@/lib/plan';
import type { ItemStates, TextMap } from '@/lib/storage';
import {
  getPhaseMeta,
  getTaskChip,
  TargetCrosshairIcon,
  NotebookIcon,
  AlertOctagonIcon,
} from '@/lib/visuals';
import { BlockerSuggestionWidget } from './AiAssistant';

function formatDate(dateString: string) {
  const value = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(value);
}

function itemKey(date: string, index: number): string {
  return `${date}:${index}`;
}

export function DayCard({
  day,
  states,
  onToggle,
  notes,
  blocked,
  onSaveText,
  compact = false,
  split = false,
}: {
  day: PlanDay;
  states: ItemStates;
  onToggle: (day: PlanDay, index: number) => void;
  notes: TextMap;
  blocked: TextMap;
  onSaveText: (date: string, field: 'note' | 'blocked', value: string) => void;
  compact?: boolean;
  split?: boolean;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const done = day.items.filter((_, index) => states[itemKey(day.date, index)]).length;
  const percent = Math.round((done / day.items.length) * 100);
  const phaseMeta = getPhaseMeta(day.week);
  const isComplete = percent === 100;

  // Fluid entrance animation using GSAP
  useEffect(() => {
    if (!cardRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }
      );
    }, cardRef);

    return () => ctx.revert();
  }, [day.date]);

  return (
    <article
      ref={cardRef}
      className={`day-card ${isComplete ? 'complete' : ''} ${split ? 'split-card' : ''}`}
    >
      <div className="day-card-head">
        <div>
          <div className="day-card-top-meta">
            <span className="phase-pill" style={{ color: phaseMeta.color, background: phaseMeta.badgeBg }}>
              {phaseMeta.icon}
              <span>{phaseMeta.label}</span>
            </span>
            <span className="eyebrow-date">
              WEEK {day.week} · Day {day.dayInWeek} · {formatDate(day.date)}
            </span>
          </div>

          <h3 className="day-card-heading">{day.title}</h3>
        </div>

        {/* Circular Progress Ring with Percentage */}
        <div className="ring-wrapper">
          <div className="ring" style={{ '--progress': `${percent * 3.6}deg` } as CSSProperties}>
            <span>{percent}%</span>
          </div>
          {isComplete && <span className="complete-badge-chip">DONE</span>}
        </div>
      </div>

      <div className="checklist-col">
        {/* Visual Checklist with categorized chips */}
        <div className="checklist">
          {day.items.map((item, index) => {
            const checked = Boolean(states[itemKey(day.date, index)]);
            const chip = getTaskChip(item);
            return (
              <label
                className={`check-row ${checked ? 'checked' : ''}`}
                key={`${day.date}-${index}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(day, index)}
                />
                <span className="fake-check">{checked ? '✓' : ''}</span>
                <span className={`task-chip chip-${chip.type}`}>{chip.label}</span>
                <span className="check-text">{item}</span>
              </label>
            );
          })}
        </div>

        {/* Human-Centered Acceptance Target Card */}
        <div className="acceptance-target-card">
          <div className="target-card-header">
            <TargetCrosshairIcon />
            <span>ACCEPTANCE TARGET</span>
          </div>
          <p className="target-card-body">{day.doneWhen}</p>
        </div>
      </div>

      {!compact && (
        <div className="notes-col">
          <div className="notes-grid">
            {/* Developer Log Notes */}
            <div className="log-field-card">
              <div className="log-field-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <NotebookIcon />
                  <span>Developer Log</span>
                </div>
                {notes[day.date] && <span className="autosave-tag">✓ Saved</span>}
              </div>
              <textarea
                value={notes[day.date] || ''}
                onChange={(e) => onSaveText(day.date, 'note', e.target.value)}
                placeholder="What did you build or test today?"
              />
            </div>

            {/* Blocker Alert Field */}
            <div className={`log-field-card ${blocked[day.date] ? 'has-blocker' : ''}`}>
              <div className="log-field-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertOctagonIcon />
                  <span>Blockers & Dependencies</span>
                </div>
                {blocked[day.date] && <span className="blocker-warning-badge">Attention</span>}
              </div>
              <textarea
                value={blocked[day.date] || ''}
                onChange={(e) => onSaveText(day.date, 'blocked', e.target.value)}
                placeholder="Anything slowing you down or pending credentials?"
              />
              <BlockerSuggestionWidget
                taskTitle={day.title}
                blockerText={blocked[day.date] || ''}
                doneWhen={day.doneWhen}
              />
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
