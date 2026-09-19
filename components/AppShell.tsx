'use client';

import type { ReactNode } from 'react';
import { usePlanner, itemKey } from '@/context/PlannerContext';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { plan } from '@/lib/plan';
import { TopBar } from './TopBar';
import { NavigationDock } from './NavigationDock';
import { AuthForm } from './AuthForm';
import { TaskDetailModal } from './TaskDetailModal';
import { MissedDayCatchUpModal } from './MissedDayCatchUp';
import { DailyCheckModal } from './DailyCheckModal';
import { WhatsAppReportModal } from './WhatsAppReportModal';
import { DriftDetectorModal, WeeklyRetroModal } from './AiAssistant';
import { ArrowRightIcon, CloseIcon } from '@/lib/visuals';

export function AppShell({ children }: { children: ReactNode }) {
  const {
    authReady,
    setAuthReady,
    slowNotice,
    user,
    theme,
    toggleTheme,
    online,
    activeWeekNumber,
    overdueCount,
    memoryNotes,
    message,
    setMessage,
    today,
    todayPlan,
    states,
    notes,
    blocked,
    toggleItem,
    saveDayText,
    endOfDayLogs,
    saveEndOfDayLog,
    setTaskOverride,
    whatsAppData,
    inspectTask,
    setInspectTask,
    activeCatchUpDay,
    setActiveCatchUpDay,
    eodModalOpen,
    setEodModalOpen,
    whatsappModalOpen,
    setWhatsappModalOpen,
    driftModalOpen,
    setDriftModalOpen,
    retroModalOpen,
    setRetroModalOpen,
    driftStats,
    skippedTasks,
    overallPercent,
  } = usePlanner();

  // Loading Screen
  if (!authReady) {
    return (
      <main className="center-screen" style={{ flexDirection: 'column', gap: 14 }}>
        <div className="loader" />
        <span style={{ color: 'var(--ink-secondary)', fontWeight: 600, fontSize: '14px' }}>
          Loading developer planner...
        </span>
        {slowNotice && (
          <div style={{ marginTop: 8, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <p style={{ color: 'var(--ink-muted)', fontSize: '12px', margin: 0 }}>
              Cloud connection is taking longer than usual.
            </p>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setAuthReady(true)}
              style={{ fontSize: '12px', padding: '7px 16px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <span>Continue to Local Mode</span>
              <ArrowRightIcon size={12} />
            </button>
          </div>
        )}
      </main>
    );
  }

  // Auth Screen
  if (isSupabaseConfigured && !user) {
    return <AuthForm onLoggedIn={() => setAuthReady(true)} />;
  }

  return (
    <div className="app-shell-root">
      {/* Page Content */}
      <main className="app-shell">
        {/* Top Navigation Bar with Quick Actions */}
        <TopBar
          activeWeekNumber={activeWeekNumber}
          online={online}
          theme={theme}
          toggleTheme={toggleTheme}
          user={user}
          onSignOut={() => supabase?.auth.signOut()}
          onOpenEndOfDay={() => setEodModalOpen(true)}
          onOpenWhatsApp={() => setWhatsappModalOpen(true)}
          overdueCount={overdueCount}
        />

        {/* Synchronizing Feedback Notice */}
        {message && (
          <div className="notice">
            <span>{message}</span>
            <button type="button" onClick={() => setMessage('')}><CloseIcon size={14} /></button>
          </div>
        )}

        {children}
      </main>

      {/* Mobile Floating Bottom Dock */}
      <NavigationDock
        theme={theme}
        toggleTheme={toggleTheme}
        overdueCount={overdueCount}
        memoryCount={memoryNotes.length}
        onOpenAction={() => setWhatsappModalOpen(true)}
      />

      {/* Global Modals & Drawers */}

      {/* 1. Task Detail Modal */}
      <TaskDetailModal
        isOpen={Boolean(inspectTask)}
        onClose={() => setInspectTask(null)}
        day={inspectTask ? inspectTask.day : null}
        itemIndex={inspectTask ? inspectTask.itemIndex : 0}
        isCompleted={Boolean(
          inspectTask && states[itemKey(inspectTask.day.date, inspectTask.itemIndex)]
        )}
        onToggleComplete={() => {
          if (inspectTask) toggleItem(inspectTask.day, inspectTask.itemIndex);
        }}
        notes={inspectTask ? notes[inspectTask.day.date] : ''}
        blocked={inspectTask ? blocked[inspectTask.day.date] : ''}
        onSaveNote={(val) => {
          if (inspectTask) saveDayText(inspectTask.day.date, 'note', val);
        }}
        onSaveBlocked={(val) => {
          if (inspectTask) saveDayText(inspectTask.day.date, 'blocked', val);
        }}
      />

      {/* 2. Missed Day Catch-Up Modal */}
      <MissedDayCatchUpModal
        isOpen={Boolean(activeCatchUpDay)}
        onClose={() => setActiveCatchUpDay(null)}
        missedDay={activeCatchUpDay}
        onToggleTask={(date, idx) => {
          const d = plan.find((p) => p.date === date);
          if (d) toggleItem(d, idx);
        }}
        isTaskCompleted={(date, idx) => Boolean(states[itemKey(date, idx)])}
        onSetTaskAction={(key, action, targetDate) => {
          setTaskOverride(key, action, targetDate);
        }}
        todayDate={today}
      />

      {/* 3. Daily Check End-of-Day Modal */}
      <DailyCheckModal
        isOpen={eodModalOpen}
        onClose={() => setEodModalOpen(false)}
        todayDate={today}
        todayPlan={todayPlan || null}
        isTaskDone={(date, idx) => Boolean(states[itemKey(date, idx)])}
        onToggleTask={(date, idx) => {
          const d = plan.find((p) => p.date === date);
          if (d) toggleItem(d, idx);
        }}
        onSaveEndOfDay={saveEndOfDayLog}
        existingLog={endOfDayLogs[today]}
      />

      {/* 4. WhatsApp / Slack Daily Standup Modal */}
      <WhatsAppReportModal
        isOpen={whatsappModalOpen}
        onClose={() => setWhatsappModalOpen(false)}
        data={whatsAppData}
      />

      {/* 5. Drift Detector Modal */}
      <DriftDetectorModal
        isOpen={driftModalOpen}
        onClose={() => setDriftModalOpen(false)}
        stats={driftStats}
        skippedTasks={skippedTasks}
      />

      {/* 6. Weekly Retro Modal */}
      <WeeklyRetroModal
        isOpen={retroModalOpen}
        onClose={() => setRetroModalOpen(false)}
        weekNumber={activeWeekNumber}
        weekPhase={todayPlan?.phase || 'Setup and foundation'}
        notes={todayPlan ? [notes[todayPlan.date] || ''] : []}
        completedTasks={todayPlan ? todayPlan.items.filter((_, idx) => states[itemKey(todayPlan.date, idx)]) : []}
        pendingTasks={todayPlan ? todayPlan.items.filter((_, idx) => !states[itemKey(todayPlan.date, idx)]) : []}
      />
    </div>
  );
}
