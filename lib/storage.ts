/**
 * Type-Safe Local Storage Utilities
 * Provides resilient schema validation, fallback defaults, and error boundaries
 * preventing corrupted localStorage strings from crashing the application.
 */

export type ItemStates = Record<string, boolean>;
export type RowIds = Record<string, string>;
export type TextMap = Record<string, string>;
export type ThemeMode = 'dark' | 'light';

export const STORAGE_KEYS = {
  ITEMS: 'bp-planner-items-v1',
  NOTES: 'bp-planner-notes-v1',
  BLOCKED: 'bp-planner-blocked-v1',
  THEME: 'bp-theme-v1',
  PLAN_START: 'bp-plan-start-v1',
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
