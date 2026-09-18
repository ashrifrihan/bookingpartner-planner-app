import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatWhatsAppReport,
  getTaskDetail,
  getMissedDays,
  plan,
} from '../lib/plan.ts';

import {
  parseDeveloperMemory,
  parseEndOfDayMap,
  parseTaskOverrides,
} from '../lib/storage.ts';

test('formatWhatsAppReport accurately outputs expected standup format', () => {
  const data = {
    date: '2026-09-19',
    completedTasks: ['Authentication setup', 'Database schema'],
    pendingTasks: ['Booking API testing'],
    blockedTasks: ['Payment API credentials pending'],
    tomorrowTasks: ['Seat locking transactions'],
  };

  const report = formatWhatsAppReport(data);

  assert.match(report, /\[Developer Progress\]/);
  assert.match(report, /Today: 2\/3 completed/);
  assert.match(report, /Completed:/);
  assert.match(report, /• Authentication setup/);
  assert.match(report, /• Database schema/);
  assert.match(report, /Pending:/);
  assert.match(report, /• Booking API testing/);
  assert.match(report, /Blocked:/);
  assert.match(report, /• Payment API credentials pending/);
  assert.match(report, /Tomorrow:/);
  assert.match(report, /• Seat locking transactions/);
});

test('getTaskDetail returns technical What, Why, How, and DoneWhen metadata', () => {
  const day1 = plan[0];
  const detail = getTaskDetail(day1, 0);

  assert.ok(detail.what.length > 5);
  assert.ok(detail.why.length > 5);
  assert.ok(detail.how.length > 0);
  assert.ok(detail.doneWhen.length > 5);
  assert.equal(detail.phase, day1.phase);
});

test('getMissedDays correctly flags incomplete past tasks and respects unnecessary overrides', () => {
  const testStates = {
    '2026-09-18:0': true,
    '2026-09-18:1': true,
    // 2026-09-18:2 is not done
  };

  const missedInitial = getMissedDays('2026-09-19', testStates, {}, {});
  assert.ok(missedInitial.length > 0);
  assert.equal(missedInitial[0].date, '2026-09-18');
  assert.ok(missedInitial[0].missedTasks.length > 0);

  // When marked unnecessary by developer override:
  const testOverrides = {
    '2026-09-18:2': { action: 'unnecessary', updatedAt: new Date().toISOString() },
    '2026-09-18:3': { action: 'unnecessary', updatedAt: new Date().toISOString() },
    '2026-09-18:4': { action: 'unnecessary', updatedAt: new Date().toISOString() },
  };
  const missedAfterOverride = getMissedDays('2026-09-19', testStates, testOverrides, {});
  const sep18 = missedAfterOverride.find((d) => d.date === '2026-09-18');
  assert.equal(sep18, undefined);
});

test('parseDeveloperMemory safely parses and filters categories', () => {
  const raw = [
    { id: '1', text: 'Never deploy without RLS', category: 'rule', createdAt: '2026-09-18T10:00:00Z' },
    { id: '2', text: 'PayHere sandbox credentials pending', category: 'credential' },
    { id: '3', text: 'Invalid category', category: 'unknown-category' },
    null,
    123,
  ];

  const parsed = parseDeveloperMemory(raw);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].category, 'rule');
  assert.equal(parsed[1].category, 'credential');
});

test('parseEndOfDayMap handles recorded reasons and missing fields gracefully', () => {
  const raw = {
    '2026-09-18': {
      date: '2026-09-18',
      taskReasons: {
        '2026-09-18:2': { status: 'blocked', reasonText: 'Waiting on PayHere credentials' },
      },
      completedAt: '2026-09-18T22:00:00Z',
    },
    corrupted: 'invalid',
  };

  const parsed = parseEndOfDayMap(raw);
  assert.ok(parsed['2026-09-18']);
  assert.equal(parsed['2026-09-18'].taskReasons['2026-09-18:2'].status, 'blocked');
  assert.equal(parsed['2026-09-18'].taskReasons['2026-09-18:2'].reasonText, 'Waiting on PayHere credentials');
  assert.equal(parsed['corrupted'], undefined);
});

test('parseTaskOverrides validates actions (keep, move_today, rescheduled, unnecessary)', () => {
  const raw = {
    '2026-09-18:0': { action: 'move_today' },
    '2026-09-18:1': { action: 'rescheduled', targetDate: '2026-09-22' },
    '2026-09-18:2': { action: 'invalid_action' },
  };

  const parsed = parseTaskOverrides(raw);
  assert.equal(parsed['2026-09-18:0'].action, 'move_today');
  assert.equal(parsed['2026-09-18:1'].action, 'rescheduled');
  assert.equal(parsed['2026-09-18:1'].targetDate, '2026-09-22');
  assert.equal(parsed['2026-09-18:2'], undefined);
});
