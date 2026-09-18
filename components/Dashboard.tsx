'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { User } from '@supabase/supabase-js';
import { PLAN_END, PLAN_START, plan, type PlanDay } from '@/lib/plan';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type Tab = 'today' | 'tomorrow' | 'week' | 'all';
type ItemStates = Record<string, boolean>;
type RowIds = Record<string, string>;
type TextMap = Record<string, string>;
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const LOCAL_ITEMS = 'bp-planner-items-v1';
const LOCAL_NOTES = 'bp-planner-notes-v1';
const LOCAL_BLOCKED = 'bp-planner-blocked-v1';
const LOCAL_THEME = 'bp-theme-v1';

function localDateString(value = new Date()) {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(dateString: string, days: number) {
  const value = new Date(`${dateString}T12:00:00`);
  value.setDate(value.getDate() + days);
  return localDateString(value);
}

function formatDate(dateString: string, long = false) {
  const value = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat('en-US', {
    weekday: long ? 'long' : 'short',
    day: 'numeric',
    month: long ? 'long' : 'short',
    year: long ? 'numeric' : undefined,
  }).format(value);
}

function itemKey(date: string, index: number) {
  return `${date}:${index}`;
}

function readObject(key: string): Record<string, any> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(key) || '{}');
  } catch {
    return {};
  }
}

function saveObject(key: string, value: Record<string, any>) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
}

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>('today');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [states, setStates] = useState<ItemStates>({});
  const [rowIds, setRowIds] = useState<RowIds>({});
  const [notes, setNotes] = useState<TextMap>({});
  const [blocked, setBlocked] = useState<TextMap>({});
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [online, setOnline] = useState(true);
  const [slowNotice, setSlowNotice] = useState(false);
  const noteTimers = useRef<Record<string, number>>({});

  const today = localDateString();
  const tomorrow = addDays(today, 1);
  const todayPlan = plan.find((day) => day.date === today);

  // Initialize theme
  useEffect(() => {
    const saved =
      (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') ||
      (localStorage.getItem(LOCAL_THEME) as 'dark' | 'light') ||
      'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem(LOCAL_THEME, next);
    document.documentElement.setAttribute('data-theme', next);
  };

  useEffect(() => {
    setOnline(navigator.onLine);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }

    const handleInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleInstall);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('beforeinstallprompt', handleInstall);
    };
  }, []);

  useEffect(() => {
    // Always load local cached data as immediate baseline
    if (typeof window !== 'undefined') {
      setStates(readObject(LOCAL_ITEMS));
      setNotes(readObject(LOCAL_NOTES));
      setBlocked(readObject(LOCAL_BLOCKED));
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }
    let active = true;

    // Timeout fallback: if Supabase network hangs or is slow, unlock UI after 2.5s
    const timer = setTimeout(() => {
      if (active) {
        setSlowNotice(true);
        // Automatically release loading state at 4 seconds so user is never stuck
        setTimeout(() => {
          if (active) setAuthReady(true);
        }, 1500);
      }
    }, 2500);

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        clearTimeout(timer);
        if (error) console.warn('Supabase auth notice:', error.message);
        setUser(data?.session?.user ?? null);
        setAuthReady(true);
      })
      .catch((err) => {
        if (!active) return;
        clearTimeout(timer);
        console.warn('Supabase auth connection error:', err);
        setAuthReady(true);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setAuthReady(true);
    });

    return () => {
      active = false;
      clearTimeout(timer);
      data.subscription.unsubscribe();
    };
  }, []);

  const loadCloud = useCallback(async () => {
    if (!supabase || !user) return;
    setSyncing(true);
    setMessage('');

    const { data: existing, error: selectError } = await supabase
      .from('planner_items')
      .select('id,task_date,item_index,completed')
      .eq('user_id', user.id);

    if (selectError) {
      setMessage(`Database error: ${selectError.message}`);
      setSyncing(false);
      return;
    }

    const existingKeys = new Set((existing || []).map((row) => itemKey(row.task_date, row.item_index)));
    const missing = plan.flatMap((day) =>
      day.items.map((text, index) => ({
        user_id: user.id,
        task_date: day.date,
        week_number: day.week,
        phase: day.phase,
        day_title: day.title,
        item_index: index,
        item_text: text,
        completed: false,
      }))
    ).filter((row) => !existingKeys.has(itemKey(row.task_date, row.item_index)));

    for (let i = 0; i < missing.length; i += 150) {
      const { error } = await supabase.from('planner_items').upsert(missing.slice(i, i + 150), {
        onConflict: 'user_id,task_date,item_index',
        ignoreDuplicates: true,
      });
      if (error) {
        setMessage(`Could not seed tasks: ${error.message}`);
        setSyncing(false);
        return;
      }
    }

    const { data: allItems, error: refreshError } = await supabase
      .from('planner_items')
      .select('id,task_date,item_index,completed')
      .eq('user_id', user.id);

    if (refreshError) {
      setMessage(`Could not load tasks: ${refreshError.message}`);
      setSyncing(false);
      return;
    }

    const nextStates: ItemStates = {};
    const nextRowIds: RowIds = {};
    (allItems || []).forEach((row) => {
      const key = itemKey(row.task_date, row.item_index);
      nextStates[key] = Boolean(row.completed);
      nextRowIds[key] = row.id;
    });

    setStates(nextStates);
    setRowIds(nextRowIds);

    const { data: noteRows, error: noteError } = await supabase
      .from('planner_notes')
      .select('task_date,note,blocked')
      .eq('user_id', user.id);

    if (!noteError) {
      const nextNotes: TextMap = {};
      const nextBlocked: TextMap = {};
      (noteRows || []).forEach((row) => {
        nextNotes[row.task_date] = row.note || '';
        nextBlocked[row.task_date] = row.blocked || '';
      });
      setNotes(nextNotes);
      setBlocked(nextBlocked);
    }

    setSyncing(false);
  }, [user]);

  useEffect(() => {
    if (!supabase || !user) return;
    loadCloud();

    const channel = supabase
      .channel(`planner-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'planner_items', filter: `user_id=eq.${user.id}` },
        () => loadCloud()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'planner_notes', filter: `user_id=eq.${user.id}` },
        () => loadCloud()
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [user, loadCloud]);

  const allItemKeys = useMemo(
    () => plan.flatMap((day) => day.items.map((_, index) => itemKey(day.date, index))),
    []
  );
  const completedCount = allItemKeys.filter((key) => states[key]).length;
  const totalCount = allItemKeys.length;
  const overallPercent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  const visibleDays = useMemo(() => {
    if (tab === 'today') return plan.filter((day) => day.date === today);
    if (tab === 'tomorrow') return plan.filter((day) => day.date === tomorrow);
    if (tab === 'week') {
      const current = todayPlan || (today < PLAN_START ? plan[0] : plan[plan.length - 1]);
      return plan.filter((day) => day.week === current.week);
    }
    return plan;
  }, [tab, today, tomorrow, todayPlan]);

  async function handleAuth(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setMessage('');

    if (authMode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setMessage(error ? error.message : 'Signed in. Loading your planner…');
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) setMessage(error.message);
      else if (!data.session) setMessage('Account created. Check your email if confirmation is enabled, then sign in.');
      else setMessage('Account created. Loading your planner…');
    }
    setLoading(false);
  }

  async function toggleItem(day: PlanDay, index: number) {
    const key = itemKey(day.date, index);
    const next = !states[key];
    setStates((current) => ({ ...current, [key]: next }));

    if (!supabase || !user) {
      const saved = { ...readObject(LOCAL_ITEMS), [key]: next };
      saveObject(LOCAL_ITEMS, saved);
      return;
    }

    const id = rowIds[key];
    if (!id) {
      setMessage('This task is still syncing. Try again in a moment.');
      return;
    }

    const { error } = await supabase
      .from('planner_items')
      .update({ completed: next, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      setStates((current) => ({ ...current, [key]: !next }));
      setMessage(`Could not save task: ${error.message}`);
    }
  }

  async function saveDayText(dayDate: string, field: 'note' | 'blocked', value: string) {
    const setter = field === 'note' ? setNotes : setBlocked;
    const storageKey = field === 'note' ? LOCAL_NOTES : LOCAL_BLOCKED;
    setter((current) => ({ ...current, [dayDate]: value }));

    if (!supabase || !user) {
      const saved = { ...readObject(storageKey), [dayDate]: value };
      saveObject(storageKey, saved);
      return;
    }

    const timerKey = `${dayDate}:${field}`;
    if (noteTimers.current[timerKey]) window.clearTimeout(noteTimers.current[timerKey]);
    noteTimers.current[timerKey] = window.setTimeout(async () => {
      if (!supabase) return;
      const payload: {
        user_id: string;
        task_date: string;
        updated_at: string;
        note?: string;
        blocked?: string;
      } = {
        user_id: user.id,
        task_date: dayDate,
        updated_at: new Date().toISOString(),
        [field]: value,
      };
      const { error } = await supabase.from('planner_notes').upsert(payload, { onConflict: 'user_id,task_date' });
      if (error) setMessage(`Could not save note: ${error.message}`);
    }, 600);
  }

  async function installApp() {
    if (!installPrompt) {
      setMessage('Install tip: open your browser menu and choose “Install app” or “Add to Home Screen”.');
      return;
    }
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  if (!authReady) {
    return (
      <main className="center-screen" style={{ flexDirection: 'column', gap: 14 }}>
        <div className="loader" />
        <span style={{ color: 'var(--ink-secondary)', fontWeight: 600, fontSize: '14px' }}>Loading planner…</span>
        {slowNotice && (
          <div style={{ marginTop: 8, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <p style={{ color: 'var(--ink-muted)', fontSize: '12px', margin: 0 }}>
              Cloud connection is taking longer than usual.
            </p>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setAuthReady(true)}
              style={{ fontSize: '12px', padding: '7px 16px', borderRadius: '999px' }}
            >
              Continue to Login / Local Mode →
            </button>
          </div>
        )}
      </main>
    );
  }

  // Auth screen
  if (isSupabaseConfigured && !user) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <div className="auth-brand-center">
            <img src="/bookingpartner.png" alt="BookingPartner.lk" className="brand-mark" width={56} height={56} />
          </div>
          <p className="eyebrow">BOOKINGPARTNER.LK</p>
          <h1>Backend Planner</h1>
          <p className="muted">Your 12-week build plan, private to your account and synced in realtime.</p>
          <form onSubmit={handleAuth} className="auth-form">
            <label>
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>
            <label>
              Password
              <div className="password-field-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </label>
            <button className="primary-button" disabled={loading}>
              {loading ? 'Please wait…' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          {message && <p className="message">{message}</p>}
          <button
            className="text-button"
            onClick={() => {
              setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
              setMessage('');
            }}
          >
            {authMode === 'signin' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
          </button>
        </section>
      </main>
    );
  }

  const currentDayNumber = todayPlan ? plan.findIndex((day) => day.date === todayPlan.date) + 1 : null;

  return (
    <main className="app-shell">
      {/* Topbar */}
      <header className="topbar">
        <div className="brand-row">
          <img src="/bookingpartner.png" alt="BookingPartner.lk" className="brand-mark small" width={40} height={40} />
          <div>
            <p className="eyebrow">BOOKINGPARTNER.LK</p>
            <h1>Backend Planner</h1>
          </div>
        </div>
        <div className="top-actions">
          <span className="status-pill">
            <span className={`status-dot ${online ? 'online' : 'offline'}`} />
            {online ? 'Online' : 'Offline'}
          </span>
          <button
            type="button"
            className="icon-pill-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          {supabase && user && (
            <button
              type="button"
              className="icon-pill-btn"
              onClick={() => supabase?.auth.signOut()}
              title="Sign out"
              aria-label="Sign out"
            >
              <SignOutIcon />
            </button>
          )}
        </div>
      </header>

      {/* Hero "Wallet" Card (Inspired by reference UI) */}
      <section className="wallet-hero">
        <div className="wallet-meta-pill">
          <span>{todayPlan ? `Week ${todayPlan.week} · ${todayPlan.phase}` : '12-Week Roadmap'}</span>
        </div>

        <div className="wallet-balance">{overallPercent}%</div>
        <p className="wallet-subtext">
          {todayPlan
            ? `Day ${currentDayNumber} of 84 · ${todayPlan.title}`
            : `${PLAN_START} → ${PLAN_END}`}
        </p>

        {/* Progress line */}
        <div className="wallet-progress-container">
          <div className="wallet-progress-track">
            <span className="wallet-progress-bar" style={{ width: `${overallPercent}%` }} />
          </div>
        </div>

        {/* Action Button Cluster (like Receive / + / Send) */}
        <div className="wallet-actions">
          <button type="button" className="action-pill-btn" onClick={installApp} title="Install as Mobile App">
            <DownloadIcon />
            <span>Install</span>
          </button>
          <a
            className="action-pill-btn"
            href="/BookingPartner_Backend_12_Week_Plan.pdf"
            target="_blank"
            rel="noreferrer"
            title="Download full 12-week schedule PDF"
          >
            <DocumentIcon />
            <span>Schedule PDF</span>
          </a>
          {supabase && user && (
            <button
              type="button"
              className="action-pill-btn"
              onClick={() => loadCloud()}
              disabled={syncing}
              title="Refresh and sync cloud data"
            >
              <RefreshIcon />
              <span>{syncing ? 'Syncing…' : 'Sync'}</span>
            </button>
          )}
        </div>

        {/* Synchronized status indicator badge */}
        <div>
          <span className="synchronized-pill">
            <span className="status-dot online" />
            {isSupabaseConfigured
              ? syncing
                ? 'Syncing with Supabase…'
                : '● Synchronized'
              : 'Local Demo Mode · Synchronized'}
          </span>
        </div>
      </section>

      {message && (
        <div className="notice">
          <span>{message}</span>
          <button onClick={() => setMessage('')}>×</button>
        </div>
      )}

      {/* Section Header */}
      <div className="section-head">
        <div>
          <p className="eyebrow">DELIVERABLES</p>
          <h2>{tab === 'today' ? "Today's Tasks" : tab === 'tomorrow' ? "Tomorrow's Tasks" : tab === 'week' ? "This Week's Sprint" : '12-Week Roadmap'}</h2>
        </div>
        <nav className="tabs-segmented desktop-only" aria-label="Planner views">
          {(['today', 'tomorrow', 'week', 'all'] as Tab[]).map((item) => (
            <button key={item} onClick={() => setTab(item)} className={tab === item ? 'active' : ''}>
              {item === 'today' ? 'Today' : item === 'tomorrow' ? 'Tomorrow' : item === 'week' ? 'Week' : 'All 12W'}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Task Feed */}
      <section className="content">
        {visibleDays.length === 0 ? (
          <div className="empty-card">
            <h2>No scheduled task for this date</h2>
            <p>This project plan runs from {formatDate(PLAN_START, true)} to {formatDate(PLAN_END, true)}.</p>
            <button className="primary-button compact" onClick={() => setTab('all')}>Open full plan</button>
          </div>
        ) : tab === 'all' ? (
          Array.from({ length: 12 }, (_, i) => i + 1).map((week) => {
            const days = visibleDays.filter((day) => day.week === week);
            if (!days.length) return null;
            const keys = days.flatMap((day) => day.items.map((_, index) => itemKey(day.date, index)));
            const done = keys.filter((key) => states[key]).length;
            const percent = Math.round((done / keys.length) * 100);
            return (
              <section key={week} className="week-section">
                <div className="week-heading">
                  <div>
                    <p className="eyebrow">WEEK {week}</p>
                    <h2>{days[0].phase}</h2>
                    <p>{formatDate(days[0].date)} to {formatDate(days[days.length - 1].date)}</p>
                  </div>
                  <strong>{percent}%</strong>
                </div>
                <div className="day-grid">
                  {days.map((day) => (
                    <DayCard
                      key={day.date}
                      day={day}
                      states={states}
                      onToggle={toggleItem}
                      notes={notes}
                      blocked={blocked}
                      onSaveText={saveDayText}
                      compact
                    />
                  ))}
                </div>
              </section>
            );
          })
        ) : (
          <div className="day-grid">
            {visibleDays.map((day) => (
              <DayCard
                key={day.date}
                day={day}
                states={states}
                onToggle={toggleItem}
                notes={notes}
                blocked={blocked}
                onSaveText={saveDayText}
              />
            ))}
          </div>
        )}
      </section>

      {/* Floating Bottom Capsule Navigation Dock (Inspired by reference Image 1) */}
      <div className="dock-wrapper">
        <nav className="floating-dock" aria-label="Quick mobile navigation">
          <button
            type="button"
            className={`dock-item ${tab === 'today' ? 'active' : ''}`}
            onClick={() => setTab('today')}
          >
            <HomeIcon />
            <span>Today</span>
          </button>
          <button
            type="button"
            className={`dock-item ${tab === 'tomorrow' ? 'active' : ''}`}
            onClick={() => setTab('tomorrow')}
          >
            <SparkIcon />
            <span>Tomorrow</span>
          </button>
          <button
            type="button"
            className={`dock-item ${tab === 'week' ? 'active' : ''}`}
            onClick={() => setTab('week')}
          >
            <CalendarIcon />
            <span>Week</span>
          </button>
          <button
            type="button"
            className={`dock-item ${tab === 'all' ? 'active' : ''}`}
            onClick={() => setTab('all')}
          >
            <GridIcon />
            <span>Roadmap</span>
          </button>
          <div className="dock-separator" />
          <button
            type="button"
            className="dock-theme-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </nav>
      </div>

      <footer>
        <span>{isSupabaseConfigured ? 'Supabase mode: private account + realtime updates' : 'Local mode: progress stays in this browser'}</span>
        <span>Plan: 18 Sep to 10 Dec 2026</span>
      </footer>
    </main>
  );
}

function DayCard({
  day,
  states,
  onToggle,
  notes,
  blocked,
  onSaveText,
  compact = false,
}: {
  day: PlanDay;
  states: ItemStates;
  onToggle: (day: PlanDay, index: number) => void;
  notes: TextMap;
  blocked: TextMap;
  onSaveText: (date: string, field: 'note' | 'blocked', value: string) => void;
  compact?: boolean;
}) {
  const done = day.items.filter((_, index) => states[itemKey(day.date, index)]).length;
  const percent = Math.round((done / day.items.length) * 100);

  return (
    <article className={`day-card ${percent === 100 ? 'complete' : ''}`}>
      <div className="day-card-head">
        <div>
          <p className="eyebrow">WEEK {day.week} · {formatDate(day.date)}</p>
          <h3>{day.title}</h3>
          <p>{day.phase}</p>
        </div>
        <div className="ring" style={{ '--progress': `${percent * 3.6}deg` } as CSSProperties}>
          <span>{percent}%</span>
        </div>
      </div>

      <div className="checklist">
        {day.items.map((item, index) => {
          const checked = Boolean(states[itemKey(day.date, index)]);
          return (
            <label className={`check-row ${checked ? 'checked' : ''}`} key={`${day.date}-${index}`}>
              <input type="checkbox" checked={checked} onChange={() => onToggle(day, index)} />
              <span className="fake-check">{checked ? '✓' : ''}</span>
              <span className="check-text">{item}</span>
            </label>
          );
        })}
      </div>

      <div className="done-when">
        <strong>Done when:</strong> {day.doneWhen}
      </div>

      {!compact && (
        <div className="notes-grid">
          <label>
            Notes
            <textarea
              value={notes[day.date] || ''}
              onChange={(e) => onSaveText(day.date, 'note', e.target.value)}
              placeholder="What did you finish?"
            />
          </label>
          <label>
            Blocked by
            <textarea
              value={blocked[day.date] || ''}
              onChange={(e) => onSaveText(day.date, 'blocked', e.target.value)}
              placeholder="Anything stopping you?"
            />
          </label>
        </div>
      )}
    </article>
  );
}

// Crisp inline SVG Icons
function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m13 2-2 10 6-2-8 12 2-10-6 2z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}
