'use client';

import type { CSSProperties } from 'react';
import type { PlanDay } from '@/lib/plan';
import type { ItemStates, TextMap } from '@/lib/storage';

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
  const done = day.items.filter((_, index) => states[itemKey(day.date, index)]).length;
  const percent = Math.round((done / day.items.length) * 100);

  return (
    <article className={`day-card ${percent === 100 ? 'complete' : ''} ${split ? 'split-card' : ''}`}>
      <div className="day-card-head">
        <div>
          <p className="eyebrow">WEEK {day.week} · {formatDate(day.date)}</p>
          <h3>{day.title}</h3>
          <p>{day.phase}</p>
        </div>
        <div className="ring" style={{ '--progress': `${percent * 3.6}deg` } as CSSProperties}>
          <span>{percent}%</span>
        </div>
      </div>

      <div className="checklist-col">
        <div className="checklist">
          {day.items.map((item, index) => {
            const checked = Boolean(states[itemKey(day.date, index)]);
            return (
              <label className={`check-row ${checked ? 'checked' : ''}`} key={`${day.date}-${index}`}>
                <input type="checkbox" checked={checked} onChange={() => onToggle(day, index)} />
                <span className="fake-check">{checked ? '✓' : ''}</span>
                <span className="check-text">{item}</span>
              </label>
            );
          })}
        </div>

        <div className="done-when">
          <strong>Done when:</strong> {day.doneWhen}
        </div>
      </div>

      {!compact && (
        <div className="notes-col">
          <div className="notes-grid">
            <label>
              Notes
              <textarea
                value={notes[day.date] || ''}
                onChange={(e) => onSaveText(day.date, 'note', e.target.value)}
                placeholder="What did you finish?"
              />
            </label>
            <div>
              <label>
                Blocked by
                <textarea
                  value={blocked[day.date] || ''}
                  onChange={(e) => onSaveText(day.date, 'blocked', e.target.value)}
                  placeholder="Anything stopping you?"
                />
              </label>
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
