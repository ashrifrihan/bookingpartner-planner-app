import { NextResponse } from 'next/server';
import dns from 'node:dns';

export const runtime = 'nodejs';

// Ensure fast IPv4 resolution on Windows networks
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

export type AiActionType =
  | 'explain-task'
  | 'what-did-i-miss'
  | 'make-today-plan'
  | 'check-progress'
  | 'replan'
  | 'solve-blocker'
  | 'morning-catchup'
  | 'drift'
  | 'blocker'
  | 'daily-brief'
  | 'weekly-retro';

type PlanAssistRequest = {
  type: AiActionType;
  data: any;
};

const PROMPTS: Record<AiActionType, string> = {
  'explain-task': `
You are an expert software architect and engineering mentor.
Explain the specified backend engineering task clearly and concisely.

Structure your response with these exact markdown sections:
**Problem**
What real-world problem or system requirement does this task solve?

**Explanation**
How it works technically, why it is necessary, and what downstream features (auth, seats, payments) depend on it.

**Suggested Action**
Concrete 2-3 step guide on how to build, wire, and test it successfully.
Keep it practical, sharp, and directly applicable.
`,

  'what-did-i-miss': `
You are a developer schedule and memory assistant.
Review the missed tasks, yesterday's logs, and reported blockers.

Structure your response with these exact markdown sections:
**Problem**
Summary of what tasks were left uncompleted or blocked from previous days.

**Explanation**
Why these missed tasks matter, what dependencies they block, and the risk of skipping them.

**Suggested Action**
Clear prioritized catch-up sequence (e.g. 1. Unblock X, 2. Complete Y, 3. Proceed with today).
`,

  'make-today-plan': `
You are an engineering schedule assistant.
Create an optimal, realistic plan for today based on:
1. Today's scheduled tasks
2. Unfinished tasks from yesterday / missed days
3. Developer Memory rules & constraints (e.g. pending credentials, deployment rules, testing guidelines)

Structure your response with these exact markdown sections:
**Problem**
Key focus or potential bottleneck for today.

**Explanation**
Rationale for ordering (which dependencies come first, incorporating Developer Memory constraints).

**Suggested Action**
Numbered 1-2-3 daily checklist of what to do first, second, and next.
`,

  'check-progress': `
You are an engineering delivery lead.
Analyze the current completion percentage, overdue count, and schedule velocity.

Structure your response with these exact markdown sections:
**Problem**
Current velocity assessment (on track, behind, or critical drift).

**Explanation**
Why the project is in this state based on completed vs overdue tasks and blockers.

**Suggested Action**
Concrete actions to protect the launch target date.
`,

  'replan': `
You are a technical delivery manager.
Provide a realistic re-plan when tasks are delayed or blocked.

Structure your response with these exact markdown sections:
**Problem**
Impact of accumulated delays or blockers on the schedule.

**Explanation**
What can be kept, safely rescheduled, or decoupled to maintain momentum.

**Suggested Action**
The recommended re-planned sequence for today and tomorrow.
`,

  'solve-blocker': `
You are a senior backend engineer and debugger.
Provide concrete technical solutions or workarounds for the reported blocker.

Structure your response with these exact markdown sections:
**Problem**
Technical diagnosis of the blocking issue.

**Explanation**
Root causes, missing prerequisites, or environment constraints.

**Suggested Action**
Specific unblocking steps (e.g. mocking third-party APIs, sandbox test stubs, database isolation).
`,

  'morning-catchup': `
You are an engineering morning assistant.
Explain yesterday's missed deliverables and provide a seamless catch-up path.

Structure your response with these exact markdown sections:
**Problem**
What was left unfinished yesterday and why.

**Explanation**
Why completing these items is critical for today's work.

**Suggested Action**
1-2-3 Catch-up plan before starting today's schedule.
`,

  drift: `
You are a project planning assistant for an engineering backend schedule.
Analyze the project progress and variance data.
Return concise bullet points covering: Status, Schedule Risks, and Prioritized Next Actions.
`,

  blocker: `
You are a technical engineering advisor.
Analyze the blocker and return:
1. Short analysis
2. Recommended immediate next step
3. Workaround or unblocking tactic.
`,

  'daily-brief': `
You are a personal engineering assistant.
Create a short daily brief based on today's tasks and yesterday's progress.
Highlight: Today's Deliverables, Status from Yesterday, Recommended Focus.
`,

  'weekly-retro': `
You are a technical project retro assistant.
Review the week's notes and blockers.
Highlight: Accomplished, Recurring Blockers, and Next Sprint Focus.
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

function generateLocalFallback(type: AiActionType, data: any): string {
  switch (type) {
    case 'explain-task': {
      const task = data?.itemTitle || data?.taskTitle || 'Scheduled Task';
      const why = data?.why || 'Foundational architectural requirement';
      return `**Problem**
This task delivers "${task}", which solves an essential architectural requirement in the platform.

**Explanation**
${why}. Completing this ensures downstream booking, payment, and security layers operate with verified schemas and contracts.

**Suggested Action**
1. Implement the core logic and validate input and error states.
2. Wire tests to verify happy paths and boundary conditions.
3. Confirm acceptance criteria ("${data?.doneWhen || 'acceptance test passes'}") before completing.`;
    }
    case 'what-did-i-miss': {
      const count = data?.missedCount || (Array.isArray(data?.missedTasks) ? data.missedTasks.length : 0);
      return `**Problem**
You have ${count ? count : 'several'} unfinished tasks carrying over from previous days.

**Explanation**
Unfinished foundational tasks directly block subsequent booking API and seat-locking flows. Skipping them causes cascading bugs later in the sprint.

**Suggested Action**
1. Review the missed day checklist and resolve blocker issues first.
2. Decide whether to Move to Today, Reschedule, or Keep in Yesterday.
3. Finish the core dependency before starting today's new schedule.`;
    }
    case 'make-today-plan': {
      const todayTitle = data?.todayTitle || "Today's Deliverables";
      const memCount = Array.isArray(data?.memoryNotes) ? data.memoryNotes.length : 0;
      return `**Problem**
Balancing today's focus ("${todayTitle}") with carryover items and ${memCount} project memory rules.

**Explanation**
Sequence dependencies strictly: unblock carryover work first, then execute today's main deliverable, respecting Developer Memory constraints.

**Suggested Action**
1. Review carryover items and resolve blockers.
2. Execute "${todayTitle}" step by step according to plan checklist.
3. Verify test coverage and complete the End-of-Day review before closing.`;
    }
    case 'check-progress': {
      const pct = data?.overallPercent ?? 0;
      const overdue = data?.overdueCount ?? 0;
      return `**Problem**
Overall roadmap progress is at ${pct}%, with ${overdue} tasks currently flagged as overdue or pending attention.

**Explanation**
Schedule velocity depends on keeping daily burn-down steady. Unresolved blockers accumulate and risk the 12-week release milestone.

**Suggested Action**
1. Clear the ${overdue} overdue items as first priority.
2. Avoid starting auxiliary features until core deliverables pass acceptance.
3. Log daily reasons in End-of-Day check to eliminate recurring bottlenecks.`;
    }
    case 'replan': {
      return `**Problem**
Task variance or blockers are putting pressure on upcoming milestones.

**Explanation**
Pushing deadlines blindly leads to end-of-sprint technical debt. Instead, decouple non-critical UI polish from essential transaction and security mechanisms.

**Suggested Action**
1. Keep core API and database tasks strictly in order.
2. Defer cosmetic polish to the dedicated stabilization phase.
3. Apply a 3-hour timebox for pending blockers before selecting mock workarounds.`;
    }
    case 'solve-blocker': {
      const blocker = data?.blockerText || 'Unresolved dependency or environment issue';
      return `**Problem**
Reported blocker: "${blocker}".

**Explanation**
External dependencies, credentials, or schema changes often stall execution. Waiting idle halts overall sprint momentum.

**Suggested Action**
1. Mock the external dependency with an in-memory test stub.
2. Continue developing and unit testing against the contract interface.
3. Swap the stub for the production provider once credentials/services arrive.`;
    }
    case 'morning-catchup': {
      const dayDate = data?.missedDate || 'Yesterday';
      return `**Problem**
Unfinished deliverables remain from ${dayDate}.

**Explanation**
Yesterday's work forms the operational foundation for today's tasks. Leaving them incomplete introduces instability into today's testing.

**Suggested Action**
1. Complete yesterday's highest priority task first.
2. Transition to today's scheduled tasks once baseline acceptance passes.
3. Update Developer Memory if you discover a recurring environment obstacle.`;
    }
    default:
      return `**Problem**\nAnalysis requested for ${type}.\n\n**Explanation**\nEnsure all daily tasks and acceptance criteria are up to date.\n\n**Suggested Action**\nReview the sprint roadmap and proceed with prioritized tasks.`;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PlanAssistRequest;

    if (!body.type || !PROMPTS[body.type]) {
      return NextResponse.json(
        { error: 'Invalid AI request type.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_api_key_here') {
      const fallback = generateLocalFallback(body.type, body.data);
      return NextResponse.json({
        success: true,
        suggestion: fallback,
        model: 'local-assistant-heuristic',
        isFallback: true,
      });
    }

    const prompt = `${PROMPTS[body.type]}

Here is the current planner data:
\`\`\`json
${JSON.stringify(body.data, null, 2)}
\`\`\`
`;

    try {
      const { text, model } = await callGemini(apiKey, prompt);
      return NextResponse.json({
        success: true,
        suggestion: text,
        model,
      });
    } catch (geminiError: any) {
      console.warn('[Gemini call failed, using heuristic fallback]:', geminiError.message);
      const fallback = generateLocalFallback(body.type, body.data);
      return NextResponse.json({
        success: true,
        suggestion: fallback,
        model: 'local-assistant-heuristic',
        isFallback: true,
      });
    }
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
