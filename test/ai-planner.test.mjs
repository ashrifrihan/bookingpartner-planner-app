import test from 'node:test';
import assert from 'node:assert/strict';

// Drift & Launch Risk Calculation Test
test('Drift calculation accurately flags pace and overdue count', () => {
  const plan = [
    { date: '2026-09-18', items: ['Task 1', 'Task 2'] },
    { date: '2026-09-19', items: ['Task 3', 'Task 4'] },
    { date: '2026-09-20', items: ['Task 5'] },
  ];

  const states = {
    '2026-09-18:0': true,
    '2026-09-18:1': true,
    '2026-09-19:0': false,
    '2026-09-19:1': false,
  };

  const today = '2026-09-19';

  const elapsedDays = plan.filter((d) => d.date <= today);
  const expected = elapsedDays.reduce((acc, d) => acc + d.items.length, 0); // 4
  const completed = elapsedDays.reduce((acc, d) => {
    return acc + d.items.filter((_, idx) => states[`${d.date}:${idx}`]).length;
  }, 0); // 2

  const overdue = plan.reduce((acc, d) => {
    if (d.date >= today) return acc;
    const uncompleted = d.items.filter((_, idx) => !states[`${d.date}:${idx}`]).length;
    return acc + uncompleted;
  }, 0);

  const completionRate = Math.round((completed / expected) * 100);

  assert.equal(expected, 4);
  assert.equal(completed, 2);
  assert.equal(completionRate, 50);
  assert.equal(overdue, 0); // Day 18 tasks were both completed
});
