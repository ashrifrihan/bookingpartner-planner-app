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

