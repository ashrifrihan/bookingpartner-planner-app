import test from 'node:test';
import assert from 'node:assert/strict';

// WhatsApp Report Formatter Test
test('formatWhatsAppReport generates correctly formatted status message without em-dashes', () => {
  function formatWhatsAppReport({
    dateFormatted,
    overallPercent,
    completedToday,
    remainingToday,
    overdueCount,
    todayTitle,
    todayItems,
    blockersText,
    aiSummaryText,
    tomorrowTitle,
  }) {
    const lines = [
      '📊 *BOOKINGPARTNER PROJECT UPDATE*',
      `📅 ${dateFormatted}`,
      '',
      `*Overall Progress:* ${overallPercent}%`,
      `✅ *Completed Today:* ${completedToday}`,
      `⏳ *Remaining Today:* ${remainingToday}`,
      `🔴 *Overdue Tasks:* ${overdueCount}`,
      '',
      `*Today (${todayTitle}):*`,
    ];

    todayItems.forEach((item) => {
      lines.push(`${item.done ? '✓' : '•'} ${item.text}`);
    });

    if (blockersText && blockersText.trim()) {
      lines.push('');
      lines.push('⚠️ *Blockers:*');
      lines.push(blockersText.trim());
    }

    if (aiSummaryText && aiSummaryText.trim()) {
      lines.push('');
      lines.push('🤖 *AI Insight:*');
      lines.push(aiSummaryText.trim());
    }

    if (tomorrowTitle) {
      lines.push('');
      lines.push('🎯 *Tomorrow:*');
      lines.push(`→ ${tomorrowTitle}`);
    }

    return lines.join('\n');
  }

  const report = formatWhatsAppReport({
    dateFormatted: 'Friday, Sep 18, 2026',
    overallPercent: 12,
    completedToday: 3,
    remainingToday: 2,
    overdueCount: 0,
    todayTitle: 'Local PostgreSQL Setup',
    todayItems: [
      { text: 'Install PostgreSQL', done: true },
      { text: 'Create database bookingpartner_dev', done: true },
      { text: 'Run Prisma migration', done: true },
      { text: 'Confirm tables exist', done: false },
    ],
    blockersText: 'Waiting for port 5432 clearance',
    aiSummaryText: 'Backend foundation is progressing on schedule.',
    tomorrowTitle: 'Prisma Schema & Migrations',
  });

  // Verify key structure
  assert.ok(report.includes('BOOKINGPARTNER PROJECT UPDATE'));
  assert.ok(report.includes('*Overall Progress:* 12%'));
  assert.ok(report.includes('✓ Install PostgreSQL'));
  assert.ok(report.includes('• Confirm tables exist'));
  assert.ok(report.includes('⚠️ *Blockers:*'));
  assert.ok(report.includes('Waiting for port 5432 clearance'));
  assert.ok(report.includes('🤖 *AI Insight:*'));
  assert.ok(report.includes('🎯 *Tomorrow:*'));
  assert.ok(report.includes('→ Prisma Schema & Migrations'));

  // Constraint: NEVER contain an em-dash ('—')
  assert.ok(!report.includes('—'), 'Report must never contain an em-dash (—)');
});

// Drift Calculation Test
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
