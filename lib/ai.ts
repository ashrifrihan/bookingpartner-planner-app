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
