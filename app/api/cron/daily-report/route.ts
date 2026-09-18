import { NextResponse } from 'next/server';
import { plan } from '@/lib/plan';
import { formatMorningPlanReport, formatWhatsAppReport } from '@/lib/ai';

export const runtime = 'nodejs';

function localDateString(value = new Date()): string {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(dateString: string, days: number): string {
  const value = new Date(`${dateString}T12:00:00`);
  value.setDate(value.getDate() + days);
  return localDateString(value);
}

function formatDate(dateString: string): string {
  const value = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(value);
}

export async function GET(request: Request) {
  return handleSchedule(request);
}

export async function POST(request: Request) {
  return handleSchedule(request);
}

async function handleSchedule(request: Request) {
  const { searchParams } = new URL(request.url);
  const authHeader = request.headers.get('authorization');

  // Optional bearer secret check for cron security
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized cron request.' }, { status: 401 });
  }

  const today = localDateString();
  const todayPlan = plan.find((d) => d.date === today);
  const tomorrow = addDays(today, 1);
  const tomorrowPlan = plan.find((d) => d.date === tomorrow);

  const mode = searchParams.get('mode') || (new Date().getHours() < 14 ? 'morning' : 'evening');
  const targetPhone = searchParams.get('phone') || process.env.WHATSAPP_TARGET_PHONE;

  let reportText = '';

  if (mode === 'morning') {
    reportText = formatMorningPlanReport({
      dateFormatted: formatDate(today),
      taskCount: todayPlan ? todayPlan.items.length : 0,
      yesterdayCompleted: 0,
      blockersCount: 0,
      focusTitle: todayPlan ? todayPlan.title : 'Engineering Tasks',
      todayItems: todayPlan ? todayPlan.items : [],
    });
  } else {
    reportText = formatWhatsAppReport({
      dateFormatted: formatDate(today),
      overallPercent: 0,
      completedToday: 0,
      remainingToday: todayPlan ? todayPlan.items.length : 0,
      overdueCount: 0,
      todayTitle: todayPlan ? todayPlan.title : 'No tasks scheduled today',
      todayItems: todayPlan ? todayPlan.items.map((t) => ({ text: t, done: false })) : [],
      blockersText: '',
      tomorrowTitle: tomorrowPlan ? tomorrowPlan.title : undefined,
    });
  }

  // If a target phone and automated provider is configured, dispatch it
  let dispatchResult: any = { status: 'skipped_no_phone_or_provider' };

  if (targetPhone) {
    try {
      const sendRes = await fetch(`${new URL(request.url).origin}/api/whatsapp-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: targetPhone, message: reportText }),
      });
      dispatchResult = await sendRes.json();
    } catch (e: any) {
      dispatchResult = { error: e.message };
    }
  }

  return NextResponse.json({
    success: true,
    mode,
    date: today,
    targetPhone: targetPhone || 'Not set (configure in app UI or WHATSAPP_TARGET_PHONE)',
    dispatchResult,
    messageContent: reportText,
  });
}
