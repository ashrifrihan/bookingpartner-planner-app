/**
 * Type-Safe Local Storage Utilities
 * Provides resilient schema validation, fallback defaults, and error boundaries
 * preventing corrupted localStorage strings from crashing the application.
 */

export type ItemStates = Record<string, boolean>;
export type RowIds = Record<string, string>;
export type TextMap = Record<string, string>;
export type ThemeMode = 'dark' | 'light';

export type MemoryCategory = 'rule' | 'credential' | 'decision' | 'architecture' | 'general';

export type DeveloperMemoryItem = {
  id: string;
  text: string;
  category: MemoryCategory;
  createdAt: string;
};

export type TaskStatusReason = 'not_started' | 'blocked' | 'need_more_time' | 'no_longer_needed' | 'custom';

export type TaskReason = {
  status: TaskStatusReason;
  reasonText: string;
};

export type EndOfDayLog = {
  date: string;
  taskReasons: Record<string, TaskReason>;
  completedAt: string;
  note?: string;
};

export type EndOfDayMap = Record<string, EndOfDayLog>;

export type TaskAction = 'keep' | 'move_today' | 'rescheduled' | 'unnecessary';

export type TaskOverride = {
  action: TaskAction;
  targetDate?: string;
  updatedAt: string;
};

export type TaskOverridesMap = Record<string, TaskOverride>;

export const STORAGE_KEYS = {
  ITEMS: 'bp-planner-items-v1',
  NOTES: 'bp-planner-notes-v1',
  BLOCKED: 'bp-planner-blocked-v1',
  THEME: 'bp-theme-v1',
  PLAN_START: 'bp-plan-start-v1',
  MEMORY: 'bp-dev-memory-v1',
  END_OF_DAY: 'bp-end-of-day-v1',
  TASK_OVERRIDES: 'bp-task-overrides-v1',
} as const;

/**
 * Validates and safely parses boolean item completion states.
 * Filters out invalid keys or corrupted values.
 */
export function parseItemStates(raw: unknown): ItemStates {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }
  const clean: ItemStates = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof key === 'string' && key.includes(':')) {
      clean[key] = Boolean(value);
    }
  }
  return clean;
}

/**
 * Validates and safely parses daily notes and blockers.
 */
export function parseTextMap(raw: unknown): TextMap {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }
  const clean: TextMap = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof key === 'string' && typeof value === 'string') {
      clean[key] = value;
    }
  }
  return clean;
}

/**
 * Validates theme mode.
 */
export function parseTheme(raw: unknown, fallback: ThemeMode = 'dark'): ThemeMode {
  if (raw === 'light' || raw === 'dark') {
    return raw;
  }
  return fallback;
}

/**
 * Validates and parses Developer Memory notes list.
 */
export function parseDeveloperMemory(raw: unknown): DeveloperMemoryItem[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const validCategories = new Set(['rule', 'credential', 'decision', 'architecture', 'general']);
  return raw
    .filter((item): item is DeveloperMemoryItem => {
      return (
        item &&
        typeof item === 'object' &&
        typeof (item as any).id === 'string' &&
        typeof (item as any).text === 'string' &&
        validCategories.has((item as any).category)
      );
    })
    .map((item) => ({
      id: item.id,
      text: item.text.trim(),
      category: item.category as MemoryCategory,
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
    }));
}

/**
 * Validates and parses End of Day logs map.
 */
export function parseEndOfDayMap(raw: unknown): EndOfDayMap {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }
  const clean: EndOfDayMap = {};
  for (const [dateKey, val] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof dateKey === 'string' && val && typeof val === 'object') {
      const obj = val as Record<string, unknown>;
      const reasonsClean: Record<string, TaskReason> = {};
      if (obj.taskReasons && typeof obj.taskReasons === 'object') {
        for (const [tKey, reasonObj] of Object.entries(obj.taskReasons as Record<string, unknown>)) {
          if (reasonObj && typeof reasonObj === 'object') {
            reasonsClean[tKey] = {
              status: (reasonObj as any).status || 'not_started',
              reasonText: String((reasonObj as any).reasonText || ''),
            };
          }
        }
      }
      clean[dateKey] = {
        date: typeof obj.date === 'string' ? obj.date : dateKey,
        taskReasons: reasonsClean,
        completedAt: typeof obj.completedAt === 'string' ? obj.completedAt : new Date().toISOString(),
        note: typeof obj.note === 'string' ? obj.note : undefined,
      };
    }
  }
  return clean;
}

/**
 * Validates and parses Task Overrides (Keep, Move to Today, Reschedule, Unnecessary).
 */
export function parseTaskOverrides(raw: unknown): TaskOverridesMap {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }
  const clean: TaskOverridesMap = {};
  const validActions = new Set(['keep', 'move_today', 'rescheduled', 'unnecessary']);
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof key === 'string' && val && typeof val === 'object') {
      const action = (val as any).action;
      if (validActions.has(action)) {
        clean[key] = {
          action,
          targetDate: typeof (val as any).targetDate === 'string' ? (val as any).targetDate : undefined,
          updatedAt: typeof (val as any).updatedAt === 'string' ? (val as any).updatedAt : new Date().toISOString(),
        };
      }
    }
  }
  return clean;
}

/**
 * Generic safe JSON reader with schema parser fallback.
 */
export function readStorage<T>(
  key: string,
  parser: (data: unknown) => T,
  fallback: T
): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parser(parsed);
  } catch (error) {
    console.warn(`[Storage] Failed to parse key "${key}", falling back to defaults:`, error);
    return fallback;
  }
}

/**
 * Generic safe JSON writer.
 */
export function writeStorage<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`[Storage] Failed to write key "${key}":`, error);
    return false;
  }
}
