'use client';

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import {
  PLAN_END,
  PLAN_START,
  plan,
  type PlanDay,
  getMissedDays,
  type MissedDaySummary,
  type WhatsAppReportData,
} from '@/lib/plan';
import { supabase } from '@/lib/supabase';
import type {
  ItemStates,
  TextMap,
  TaskAction,
  EndOfDayLog,
  MemoryNote,
  ThemeMode,
  TaskOverride,
} from '@/lib/storage';
import { useLocalPlanner } from '@/hooks/useLocalPlanner';
import { usePlannerSync } from '@/hooks/usePlannerSync';
import { getTaskChip, type TaskChip } from '@/lib/visuals';

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

export function itemKey(date: string, index: number): string {
  return `${date}:${index}`;
}

export function formatDate(dateString: string, long = false): string {
  const value = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat('en-US', {
    weekday: long ? 'long' : 'short',
    day: 'numeric',
    month: long ? 'long' : 'short',
    year: long ? 'numeric' : undefined,
  }).format(value);
}

export type TodayTaskItem = {
  item: string;
  idx: number;
  isDone: boolean;
  chip: TaskChip;
  key: string;
};

export type DirectoryTaskItem = {
  key: string;
  day: PlanDay;
  itemIndex: number;
  title: string;
  isDone: boolean;
  isOverdue: boolean;
  chip: TaskChip;
  dayNum: number;
  formattedDate: string;
};

export type WeekBarData = {
  date: string;
  label: string;
  pct: number;
  isToday: boolean;
  isComplete: boolean;
};

export type SparklinePoint = {
  x: number;
  y: number;
  val: number;
  week: number;
};

export type SparklineData = {
  coords: SparklinePoint[];
  pathD: string;
  areaD: string;
};

export type DriftStats = {
  expected: number;
  completed: number;
  completionRate: number;
  overdue: number;
};

type PlannerContextType = {
  // Dates & Plans
  today: string;
  tomorrow: string;
  yesterday: string;
  todayPlan: PlanDay | undefined;
  tomorrowPlan: PlanDay | undefined;
  yesterdayPlan: PlanDay | undefined;

  // Local state
  states: ItemStates;
  notes: TextMap;
  blocked: TextMap;
  memoryNotes: MemoryNote[];
  endOfDayLogs: Record<string, EndOfDayLog>;
  taskOverrides: Record<string, TaskOverride>;
  theme: ThemeMode;
  online: boolean;
  installPrompt: boolean;

  // Auth & Sync
  user: User | null;
  authReady: boolean;
  setAuthReady: (val: boolean) => void;
  slowNotice: boolean;
  syncing: boolean;
  message: string;
  setMessage: (msg: string) => void;

  // Computed metrics
  overallPercent: number;
  completedCount: number;
  totalCount: number;
  completedDaysCount: number;
  overdueCount: number;
  activeWeekNumber: number;
  activeWeekDays: PlanDay[];
  activeWeekKeys: string[];
  activeWeekDone: number;
  activeWeekPercent: number;
  daysRemaining: number;
  blockedCount: number;

  // Missed days & alerts
  missedDaysList: MissedDaySummary[];
  yesterdayMissed: MissedDaySummary | null;
  yesterdayIncompleteTasks: { item: string; index: number; key: string }[];

  // Task lists
  todayTasks: TodayTaskItem[];
  todayCompletedCount: number;
  todayRemainingCount: number;
  allDirectoryTasks: DirectoryTaskItem[];
  directoryPhases: string[];
  directoryCounts: { total: number; active: number; overdue: number; completed: number };

  // Chart data
  weekBarsData: WeekBarData[];
  sparklineData: SparklineData;
  driftStats: DriftStats;
  skippedTasks: string[];
  whatsAppData: WhatsAppReportData;

  // Actions
  toggleItem: (day: PlanDay, index: number) => void;
  saveDayText: (dayDate: string, field: 'note' | 'blocked', value: string) => void;
  addMemoryNote: (text: string, category: MemoryNote['category']) => void;
  deleteMemoryNote: (id: string) => void;
  saveEndOfDayLog: (log: EndOfDayLog) => void;
  setTaskOverride: (key: string, action: TaskAction, targetDate?: string) => void;
  toggleTheme: () => void;
  installApp: () => void;
  loadCloud: () => void;

  // Modals state
  inspectTask: { day: PlanDay; itemIndex: number } | null;
  setInspectTask: (val: { day: PlanDay; itemIndex: number } | null) => void;
  activeCatchUpDay: MissedDaySummary | null;
  setActiveCatchUpDay: (val: MissedDaySummary | null) => void;
  eodModalOpen: boolean;
  setEodModalOpen: (val: boolean) => void;
  whatsappModalOpen: boolean;
  setWhatsappModalOpen: (val: boolean) => void;
  driftModalOpen: boolean;
  setDriftModalOpen: (val: boolean) => void;
  retroModalOpen: boolean;
  setRetroModalOpen: (val: boolean) => void;
};

const PlannerContext = createContext<PlannerContextType | null>(null);

export function PlannerProvider({ children }: { children: ReactNode }) {
  const [inspectTask, setInspectTask] = useState<{ day: PlanDay; itemIndex: number } | null>(null);
  const [activeCatchUpDay, setActiveCatchUpDay] = useState<MissedDaySummary | null>(null);
  const [eodModalOpen, setEodModalOpen] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [driftModalOpen, setDriftModalOpen] = useState(false);
  const [retroModalOpen, setRetroModalOpen] = useState(false);

  const today = localDateString();
  const tomorrow = addDays(today, 1);
  const yesterday = addDays(today, -1);
  const todayPlan = plan.find((day) => day.date === today) || plan[0];
  const tomorrowPlan = plan.find((day) => day.date === tomorrow);
  const yesterdayPlan = plan.find((day) => day.date === yesterday) || plan[0];

  const {
    states,
    setStates,
    notes,
    setNotes,
    blocked,
    setBlocked,
    memoryNotes,
    addMemoryNote,
    deleteMemoryNote,
    endOfDayLogs,
    saveEndOfDayLog,
    taskOverrides,
    setTaskOverride,
    theme,
    toggleTheme,
    online,
    installPrompt,
    installApp,
    updateLocalItem,
    updateLocalText,
  } = useLocalPlanner();

  const handleCloudLoaded = useCallback(
    ({ states: s, notes: n, blocked: b }: { states: ItemStates; notes: TextMap; blocked: TextMap }) => {
      setStates((prev) => ({ ...prev, ...s }));
      setNotes((prev) => ({ ...prev, ...n }));
      setBlocked((prev) => ({ ...prev, ...b }));
    },
    [setStates, setNotes, setBlocked]
  );

  const {
    user,
    authReady,
    setAuthReady,
    slowNotice,
    syncing,
    message,
    setMessage,
    loadCloud,
    updateCloudItem,
    updateCloudText,
  } = usePlannerSync({ onCloudLoaded: handleCloudLoaded });

  const allItemKeys = useMemo(
    () => plan.flatMap((day) => day.items.map((_, index) => itemKey(day.date, index))),
    []
  );
  const completedCount = allItemKeys.filter((key) => states[key]).length;
  const totalCount = allItemKeys.length;
  const overallPercent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  const completedDaysCount = useMemo(() => {
    return plan.filter((day) => day.items.every((_, idx) => states[itemKey(day.date, idx)])).length;
  }, [states]);

  const overdueCount = useMemo(() => {
    return plan.reduce((acc, day) => {
      if (day.date >= today) return acc;
      const uncompleted = day.items.filter((_, idx) => {
        const k = itemKey(day.date, idx);
        const override = taskOverrides[k];
        return !states[k] && override?.action !== 'unnecessary';
      }).length;
      return acc + uncompleted;
    }, 0);
  }, [today, states, taskOverrides]);

  const activeWeekNumber = todayPlan?.week ?? (today < PLAN_START ? 1 : 12);
  const activeWeekDays = useMemo(() => plan.filter((day) => day.week === activeWeekNumber), [activeWeekNumber]);
  const activeWeekKeys = useMemo(
    () => activeWeekDays.flatMap((day) => day.items.map((_, idx) => itemKey(day.date, idx))),
    [activeWeekDays]
  );
  const activeWeekDone = useMemo(
    () => activeWeekKeys.filter((key) => states[key]).length,
    [activeWeekKeys, states]
  );
  const activeWeekPercent = activeWeekKeys.length
    ? Math.round((activeWeekDone / activeWeekKeys.length) * 100)
    : 0;
  const daysRemaining = Math.max(0, plan.length - completedDaysCount);

  const missedDaysList = useMemo(() => {
    return getMissedDays(today, states, taskOverrides, endOfDayLogs, blocked, notes);
  }, [today, states, taskOverrides, endOfDayLogs, blocked, notes]);

  const yesterdayMissed = useMemo(() => {
    return missedDaysList.find((m) => m.date === yesterday) || missedDaysList[0] || null;
  }, [missedDaysList, yesterday]);

  const yesterdayIncompleteTasks = useMemo(() => {
    if (!yesterdayPlan) return [];
    return yesterdayPlan.items
      .map((item, index) => ({ item, index, key: itemKey(yesterdayPlan.date, index) }))
      .filter((t) => !states[t.key] && taskOverrides[t.key]?.action !== 'unnecessary');
  }, [yesterdayPlan, states, taskOverrides]);

  const todayCompletedCount = useMemo(() => {
    if (!todayPlan) return 0;
    return todayPlan.items.filter((_, idx) => states[itemKey(todayPlan.date, idx)]).length;
  }, [todayPlan, states]);

  const todayRemainingCount = todayPlan ? todayPlan.items.length - todayCompletedCount : 0;

  const todayTasks = useMemo(() => {
    if (!todayPlan) return [];
    return todayPlan.items.map((item, idx) => {
      const isDone = Boolean(states[itemKey(todayPlan.date, idx)]);
      const chip = getTaskChip(item);
      return {
        item,
        idx,
        isDone,
        chip,
        key: itemKey(todayPlan.date, idx),
      };
    });
  }, [todayPlan, states]);

  const allDirectoryTasks = useMemo(() => {
    return plan.flatMap((day) => {
      const dayNum = day.dayOffset + 1;
      const formattedDate = formatDate(day.date, false);
      return day.items.map((item, itemIndex) => {
        const key = itemKey(day.date, itemIndex);
        const isDone = Boolean(states[key]);
        const isOverdue = !isDone && day.date < today && taskOverrides[key]?.action !== 'unnecessary';
        const chip = getTaskChip(item);
        return {
          key,
          day,
          itemIndex,
          title: item,
          isDone,
          isOverdue,
          chip,
          dayNum,
          formattedDate,
        };
      });
    });
  }, [states, today, taskOverrides]);

  const directoryPhases = useMemo(() => {
    return Array.from(new Set(plan.map((d) => d.phase)));
  }, []);

  const directoryCounts = useMemo(() => {
    const total = allDirectoryTasks.length;
    const active = allDirectoryTasks.filter((t) => !t.isDone).length;
    const overdue = allDirectoryTasks.filter((t) => t.isOverdue).length;
    const completed = allDirectoryTasks.filter((t) => t.isDone).length;
    return { total, active, overdue, completed };
  }, [allDirectoryTasks]);

  const blockedCount = useMemo(() => {
    return Object.values(blocked).filter((text) => Boolean(text && text.trim())).length;
  }, [blocked]);

  const toggleItem = useCallback(
    (day: PlanDay, index: number) => {
      const key = itemKey(day.date, index);
      const next = !states[key];
      updateLocalItem(key, next);
      if (supabase && user) {
        updateCloudItem(day.date, index, next);
      }
    },
    [states, updateLocalItem, user, updateCloudItem]
  );

  const saveDayText = useCallback(
    (dayDate: string, field: 'note' | 'blocked', value: string) => {
      updateLocalText(dayDate, field, value);
      if (supabase && user) {
        updateCloudText(dayDate, field, value);
      }
    },
    [updateLocalText, user, updateCloudText]
  );

  const weekBarsData = useMemo(() => {
    return activeWeekDays.map((day) => {
      const keys = day.items.map((_, idx) => itemKey(day.date, idx));
      const done = keys.filter((k) => states[k]).length;
      const pct = keys.length ? Math.round((done / keys.length) * 100) : 0;
      const dateObj = new Date(`${day.date}T12:00:00`);
      const label = new Intl.DateTimeFormat('en-US', { weekday: 'narrow' }).format(dateObj);
      return {
        date: day.date,
        label,
        pct,
        isToday: day.date === today,
        isComplete: pct === 100,
      };
    });
  }, [activeWeekDays, states, today]);

  const sparklineData = useMemo(() => {
    const pts = Array.from({ length: 12 }, (_, i) => {
      const w = i + 1;
      const wDays = plan.filter((d) => d.week === w);
      const wKeys = wDays.flatMap((d) => d.items.map((_, idx) => itemKey(d.date, idx)));
      const done = wKeys.filter((k) => states[k]).length;
      return wKeys.length ? Math.round((done / wKeys.length) * 100) : 0;
    });

    const coords = pts.map((val, i) => {
      const x = 10 + i * 14;
      const y = Math.round(36 - (val / 100) * 26);
      return { x, y, val, week: i + 1 };
    });

    const pathD = coords.reduce((acc, pt, idx, arr) => {
      if (idx === 0) return `M ${pt.x} ${pt.y}`;
      const prev = arr[idx - 1];
      const cx = (prev.x + pt.x) / 2;
      return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`;
    }, '');

    const areaD = `${pathD} L ${coords[coords.length - 1].x} 44 L ${coords[0].x} 44 Z`;
    return { coords, pathD, areaD };
  }, [states]);

  const driftStats = useMemo(() => {
    const elapsedDays = plan.filter((d) => d.date <= today);
    const expected = elapsedDays.reduce((acc, d) => acc + d.items.length, 0);
    const completed = elapsedDays.reduce((acc, d) => {
      return acc + d.items.filter((_, idx) => states[itemKey(d.date, idx)]).length;
    }, 0);
    const completionRate = expected > 0 ? Math.round((completed / expected) * 100) : 100;
    return {
      expected,
      completed,
      completionRate,
      overdue: overdueCount,
    };
  }, [today, states, overdueCount]);

  const skippedTasks = useMemo(() => {
    return plan
      .filter((d) => d.date <= today)
      .flatMap((d) =>
        d.items
          .map((item, idx) => ({ item, done: Boolean(states[itemKey(d.date, idx)]) }))
          .filter((x) => !x.done)
          .map((x) => x.item)
      );
  }, [today, states]);

  const whatsAppData: WhatsAppReportData = useMemo(() => {
    const completedList = todayPlan
      ? todayPlan.items.filter((_, idx) => states[itemKey(todayPlan.date, idx)])
      : [];
    const pendingList = todayPlan
      ? todayPlan.items.filter((_, idx) => !states[itemKey(todayPlan.date, idx)])
      : [];
    const blockedList = blocked[today] ? [blocked[today]] : [];
    const tomorrowList = tomorrowPlan ? tomorrowPlan.items.slice(0, 3) : [];

    return {
      date: today,
      completedTasks: completedList,
      pendingTasks: pendingList,
      blockedTasks: blockedList,
      tomorrowTasks: tomorrowList,
    };
  }, [todayPlan, states, blocked, today, tomorrowPlan]);

  const value: PlannerContextType = {
    today,
    tomorrow,
    yesterday,
    todayPlan,
    tomorrowPlan,
    yesterdayPlan,
    states,
    notes,
    blocked,
    memoryNotes,
    endOfDayLogs,
    taskOverrides,
    theme,
    online,
    installPrompt: Boolean(installPrompt),
    user,
    authReady,
    setAuthReady,
    slowNotice,
    syncing,
    message,
    setMessage,
    overallPercent,
    completedCount,
    totalCount,
    completedDaysCount,
    overdueCount,
    activeWeekNumber,
    activeWeekDays,
    activeWeekKeys,
    activeWeekDone,
    activeWeekPercent,
    daysRemaining,
    blockedCount,
    missedDaysList,
    yesterdayMissed,
    yesterdayIncompleteTasks,
    todayTasks,
    todayCompletedCount,
    todayRemainingCount,
    allDirectoryTasks,
    directoryPhases,
    directoryCounts,
    weekBarsData,
    sparklineData,
    driftStats,
    skippedTasks,
    whatsAppData,
    toggleItem,
    saveDayText,
    addMemoryNote,
    deleteMemoryNote,
    saveEndOfDayLog,
    setTaskOverride,
    toggleTheme,
    installApp,
    loadCloud,
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
  };

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner(): PlannerContextType {
  const ctx = useContext(PlannerContext);
  if (!ctx) {
    throw new Error('usePlanner must be used within a PlannerProvider');
  }
  return ctx;
}
