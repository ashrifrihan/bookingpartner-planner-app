import { NextResponse } from 'next/server';
import dns from 'node:dns';

export const runtime = 'nodejs';

// Ensure fast IPv4 resolution on Windows networks
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

type PlanAssistRequest = {
  type: 'drift' | 'blocker' | 'daily-brief' | 'weekly-retro';
  data: unknown;
};

const PROMPTS: Record<PlanAssistRequest['type'], string> = {
  drift: `
You are a project planning assistant for an engineering backend schedule.

Analyze the provided project progress and variance data.
Identify whether the project is on track, behind schedule, or ahead.
Mention the most important schedule risks and what should be prioritized next to protect the launch date.

Do not invent facts.
Keep the response concise: maximum 3-4 bullet points.
`,

  blocker: `
You are a technical engineering advisor and project assistant.

Analyze the task, the "done when" criteria, and the reported blocker.
Suggest practical, concrete next steps or workarounds (e.g. mocking APIs, isolating dependencies, temporary stubs).
Do not pretend to know information that is not provided.
Do not automatically change the project plan.

Return:
1. Short analysis of what is blocking the task
2. Recommended immediate next step
3. Optional workaround or unblocking tactic
Keep it actionable and concise.
`,

  'daily-brief': `
You are a personal engineering assistant.

Create a short daily morning brief based on today's tasks and yesterday's progress/blockers.

Structure:
- Today's Deliverables: key focus items
- Status from Yesterday: anything completed or still unresolved
- Recommended Focus: what to tackle first

Maximum 3 concise paragraphs.
`,

  'weekly-retro': `
You are a technical project retro assistant.

Review the week's 7 daily notes, blockers, and completed tasks.

Structure:
- What Was Accomplished: major milestones reached
- Recurring Blockers: patterns or roadblocks
- Next Sprint Focus: actionable priorities for the upcoming week

Keep it concise and high-impact.
`,
};

// Candidate Gemini models to try in order of preference (verified from ListModels)
const GEMINI_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
];

async function callGemini(apiKey: string, prompt: string) {
  let lastError = '';

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 600,
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        if (text) return { text, model };
      } else {
        const errText = await response.text();
        lastError = `[${model}] ${response.status}: ${errText}`;
        // If 404, 503, or 429, try the next available model
        if (response.status === 404 || response.status === 503 || response.status === 429) {
          continue;
        }
        // If unauthorized or permission denied, don't repeat invalid key
        if (response.status === 400 || response.status === 401 || response.status === 403) {
          throw new Error(errText);
        }
      }
    } catch (err: any) {
      lastError = err.message || String(err);
      if (err.message && (err.message.includes('API_KEY_INVALID') || err.message.includes('PERMISSION_DENIED'))) {
        throw err;
      }
    }
  }

  throw new Error(lastError || 'All Gemini model endpoints failed.');
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PlanAssistRequest;

    if (!body.type || !PROMPTS[body.type]) {
      return NextResponse.json(
        { error: 'Invalid AI request type. Must be drift, blocker, daily-brief, or weekly-retro.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_api_key_here') {
      return NextResponse.json(
        {
          configured: false,
          error: 'GEMINI_API_KEY is not configured in .env.local',
          hint: 'Add GEMINI_API_KEY=your_key to .env.local and restart the server.',
        },
        { status: 400 }
      );
    }

    const prompt = `${PROMPTS[body.type]}

Here is the current planner data:
\`\`\`json
${JSON.stringify(body.data, null, 2)}
\`\`\`
`;

    const { text, model } = await callGemini(apiKey, prompt);

    return NextResponse.json({
      success: true,
      suggestion: text,
      model,
    });
  } catch (error: any) {
    console.error('[plan-assist route error]:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to process AI request',
        success: false,
      },
      { status: 500 }
    );
  }
}
