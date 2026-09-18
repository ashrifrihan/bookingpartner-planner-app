import test from 'node:test';
import assert from 'node:assert/strict';

// Test 1: Day Offsets & Dynamic Schedule Generator
test('Dynamic Date Computation across month boundaries', () => {
  function computeDateForOffset(startDate, offsetDays) {
    const d = new Date(`${startDate}T12:00:00`);
    d.setDate(d.getDate() + offsetDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  assert.equal(computeDateForOffset('2026-09-18', 0), '2026-09-18');
  assert.equal(computeDateForOffset('2026-09-18', 13), '2026-10-01'); // Month boundary
  assert.equal(computeDateForOffset('2026-09-18', 83), '2026-12-10'); // Final 84th day
  
  // Shifting schedule forward by 7 days
  assert.equal(computeDateForOffset('2026-09-25', 0), '2026-09-25');
  assert.equal(computeDateForOffset('2026-09-25', 83), '2026-12-17');
});

// Test 2: Typed Storage Schema Parsing Resilience
test('Typed storage parsers safely sanitize corrupted data', () => {
  function parseItemStates(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    const clean = {};
    for (const [key, value] of Object.entries(raw)) {
      if (typeof key === 'string' && key.includes(':')) {
        clean[key] = Boolean(value);
      }
    }
    return clean;
  }

  function parseTextMap(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    const clean = {};
    for (const [key, value] of Object.entries(raw)) {
      if (typeof key === 'string' && typeof value === 'string') {
        clean[key] = value;
      }
    }
    return clean;
  }

  function parseTheme(raw, fallback = 'dark') {
    if (raw === 'light' || raw === 'dark') return raw;
    return fallback;
  }

  // Corrupted / malformed storage inputs
  assert.deepEqual(parseItemStates(null), {});
  assert.deepEqual(parseItemStates([1, 2, 3]), {});
  assert.deepEqual(parseItemStates('invalid-json'), {});
  assert.deepEqual(parseItemStates({ 'invalidkey': true, '2026-09-18:0': 1 }), { '2026-09-18:0': true });

  assert.deepEqual(parseTextMap(null), {});
  assert.deepEqual(parseTextMap({ '2026-09-18': 12345, '2026-09-19': 'Finished setup' }), {
    '2026-09-19': 'Finished setup',
  });

  assert.equal(parseTheme('corrupted-theme', 'dark'), 'dark');
  assert.equal(parseTheme('light'), 'light');
});

// Test 3: Last-Write-Wins Sync Conflict Resolution
test('Sync conflict resolution preserves newer changes (Last-Write-Wins)', () => {
  const localTimestamps = {
    '2026-09-18:0': 1000, // modified at t=1000
    '2026-09-18:1': 2000, // modified at t=2000
  };

  const incomingRemoteItems = [
    { task_date: '2026-09-18', item_index: 0, completed: true, updated_at: new Date(1500).toISOString() }, // NEWER (1500 > 1000) -> should accept
    { task_date: '2026-09-18', item_index: 1, completed: false, updated_at: new Date(1800).toISOString() }, // OLDER (1800 < 2000) -> should reject
  ];

  const resolvedStates = {
    '2026-09-18:0': false,
    '2026-09-18:1': true,
  };

  incomingRemoteItems.forEach((row) => {
    const key = `${row.task_date}:${row.item_index}`;
    const remoteTime = new Date(row.updated_at).getTime();
    const localTime = localTimestamps[key] || 0;

    if (remoteTime >= localTime) {
      resolvedStates[key] = Boolean(row.completed);
      localTimestamps[key] = remoteTime;
    }
  });

  // Item 0 accepted remote update (true)
  assert.equal(resolvedStates['2026-09-18:0'], true);
  // Item 1 preserved local update (true) because remote was older
  assert.equal(resolvedStates['2026-09-18:1'], true);
});

// Test 4: Schedule Variance & Overdue Calculation
test('Schedule variance accurately identifies overdue tasks', () => {
  const mockToday = '2026-09-20';
  const mockPlan = [
    { date: '2026-09-18', items: ['Task 1', 'Task 2'] }, // Past
    { date: '2026-09-19', items: ['Task 3', 'Task 4'] }, // Past
    { date: '2026-09-20', items: ['Task 5'] },           // Today
    { date: '2026-09-21', items: ['Task 6'] },           // Future
  ];

  const states = {
    '2026-09-18:0': true,  // Done
    '2026-09-18:1': true,  // Done
    '2026-09-19:0': true,  // Done
    '2026-09-19:1': false, // OVERDUE!
    '2026-09-20:0': false, // Today (not overdue yet)
    '2026-09-21:0': false, // Future (not overdue)
  };

  const overdueCount = mockPlan.reduce((acc, day) => {
    if (day.date >= mockToday) return acc;
    const uncompleted = day.items.filter((_, idx) => !states[`${day.date}:${idx}`]).length;
    return acc + uncompleted;
  }, 0);

  assert.equal(overdueCount, 1);
});
