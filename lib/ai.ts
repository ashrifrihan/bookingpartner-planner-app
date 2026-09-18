/**
 * AI Assistant Client-side API caller & cache manager
 */

export type AiAssistType = 'drift' | 'blocker' | 'daily-brief' | 'weekly-retro';

export type AiResponse = {
  success?: boolean;
  suggestion?: string;
  error?: string;
  configured?: boolean;
  hint?: string;
  model?: string;
};

export async function requestPlanAssist(
  type: AiAssistType,
  data: unknown
): Promise<AiResponse> {
  try {
    const res = await fetch('/api/plan-assist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, data }),
    });

    const result = (await res.json()) as AiResponse;
    return result;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Network request to AI service failed',
    };
  }
}

/**
 * Format WhatsApp project report string
 */
export function formatWhatsAppReport({
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
}: {
  dateFormatted: string;
  overallPercent: number;
  completedToday: number;
  remainingToday: number;
  overdueCount: number;
  todayTitle: string;
  todayItems: { text: string; done: boolean }[];
  blockersText: string;
  aiSummaryText?: string;
  tomorrowTitle?: string;
}): string {
  const lines: string[] = [
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

/**
 * Format Morning Plan Report (8:00 AM reminder)
 */
export function formatMorningPlanReport({
  dateFormatted,
  taskCount,
  yesterdayCompleted,
  blockersCount,
  focusTitle,
  todayItems,
}: {
  dateFormatted: string;
  taskCount: number;
  yesterdayCompleted: number;
  blockersCount: number;
  focusTitle: string;
  todayItems?: string[];
}): string {
  const lines: string[] = [
    '🔔 *BookingPartner: Today’s Plan*',
    '',
    `📅 ${dateFormatted}`,
    `🎯 ${taskCount} tasks planned today`,
    `✅ ${yesterdayCompleted} completed yesterday`,
    `⚠️ ${blockersCount} active blocker${blockersCount === 1 ? '' : 's'}`,
    '',
    `*Today's focus:* ${focusTitle}`,
  ];

  if (todayItems && todayItems.length > 0) {
    lines.push('');
    lines.push('*Scheduled deliverables:*');
    todayItems.forEach((item) => {
      lines.push(`• ${item}`);
    });
  }

  return lines.join('\n');
}

/**
 * Format Overdue Alert Report
 */
export function formatOverdueAlertReport({
  overdueTasks,
  aiSuggestion,
}: {
  overdueTasks: { title: string; daysOverdue: number }[];
  aiSuggestion?: string;
}): string {
  const lines: string[] = ['⚠️ *Planner Alert: Overdue Tasks*', ''];

  overdueTasks.forEach((t) => {
    lines.push(`🔴 *${t.title}* (${t.daysOverdue} day${t.daysOverdue === 1 ? '' : 's'} overdue)`);
  });

  if (aiSuggestion && aiSuggestion.trim()) {
    lines.push('');
    lines.push('🤖 *Suggested next step:*');
    lines.push(aiSuggestion.trim());
  }

  return lines.join('\n');
}
