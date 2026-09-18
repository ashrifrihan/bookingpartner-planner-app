'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ItemStates,
  TextMap,
  ThemeMode,
  DeveloperMemoryItem,
  EndOfDayMap,
  EndOfDayLog,
  TaskOverridesMap,
  TaskAction,
  STORAGE_KEYS,
  parseItemStates,
  parseTextMap,
  parseTheme,
  parseDeveloperMemory,
  parseEndOfDayMap,
  parseTaskOverrides,
  readStorage,
  writeStorage,
} from '@/lib/storage';

export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const DEFAULT_MEMORY_ITEMS: DeveloperMemoryItem[] = [
  {
    id: 'mem-1',
    text: 'Payment API credentials pending sandbox approval from PayHere',
    category: 'credential',
    createdAt: '2026-09-18T10:00:00.000Z',
  },
  {
    id: 'mem-2',
    text: 'Do not deploy to staging until Row Level Security (RLS) policies are verified',
    category: 'rule',
    createdAt: '2026-09-18T11:00:00.000Z',
  },
  {
    id: 'mem-3',
    text: 'Seat locking requires atomic PostgreSQL transaction with 10-minute expiry',
    category: 'architecture',
    createdAt: '2026-09-18T12:00:00.000Z',
  },
  {
    id: 'mem-4',
    text: 'Finish core REST and Cron backend before spending time on UI animations',
    category: 'decision',
    createdAt: '2026-09-18T13:00:00.000Z',
  },
];

export function useLocalPlanner() {
  const [states, setStates] = useState<ItemStates>({});
  const [notes, setNotes] = useState<TextMap>({});
  const [blocked, setBlocked] = useState<TextMap>({});
  const [memoryNotes, setMemoryNotes] = useState<DeveloperMemoryItem[]>(DEFAULT_MEMORY_ITEMS);
  const [endOfDayLogs, setEndOfDayLogs] = useState<EndOfDayMap>({});
  const [taskOverrides, setTaskOverrides] = useState<TaskOverridesMap>({});
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [online, setOnline] = useState<boolean>(true);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);

  // Initialize theme from DOM attribute or storage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const initialTheme = parseTheme(
      document.documentElement.getAttribute('data-theme') ||
        localStorage.getItem(STORAGE_KEYS.THEME)
    );
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      writeStorage(STORAGE_KEYS.THEME, next);
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', next);
      }
      return next;
    });
  }, []);

  // Online / Offline & PWA install listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setOnline(navigator.onLine);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as InstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // Initialize planner data with typed schema validation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setStates(readStorage(STORAGE_KEYS.ITEMS, parseItemStates, {}));
    setNotes(readStorage(STORAGE_KEYS.NOTES, parseTextMap, {}));
    setBlocked(readStorage(STORAGE_KEYS.BLOCKED, parseTextMap, {}));
    setMemoryNotes(readStorage(STORAGE_KEYS.MEMORY, parseDeveloperMemory, DEFAULT_MEMORY_ITEMS));
    setEndOfDayLogs(readStorage(STORAGE_KEYS.END_OF_DAY, parseEndOfDayMap, {}));
    setTaskOverrides(readStorage(STORAGE_KEYS.TASK_OVERRIDES, parseTaskOverrides, {}));
  }, []);

  // Save local items
  const updateLocalItem = useCallback((key: string, completed: boolean) => {
    setStates((current) => {
      const updated = { ...current, [key]: completed };
      writeStorage(STORAGE_KEYS.ITEMS, updated);
      return updated;
    });
  }, []);

  // Save local text (notes / blocked)
  const updateLocalText = useCallback((dayDate: string, field: 'note' | 'blocked', value: string) => {
    const key = field === 'note' ? STORAGE_KEYS.NOTES : STORAGE_KEYS.BLOCKED;
    const setter = field === 'note' ? setNotes : setBlocked;
    setter((current) => {
      const updated = { ...current, [dayDate]: value };
      writeStorage(key, updated);
      return updated;
    });
  }, []);

  // Memory operations
  const addMemoryNote = useCallback((text: string, category: import('@/lib/storage').MemoryCategory = 'general') => {
    const newItem: DeveloperMemoryItem = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      text: text.trim(),
      category,
      createdAt: new Date().toISOString(),
    };
    setMemoryNotes((current) => {
      const updated = [newItem, ...current];
      writeStorage(STORAGE_KEYS.MEMORY, updated);
      return updated;
    });
    return newItem;
  }, []);

  const deleteMemoryNote = useCallback((id: string) => {
    setMemoryNotes((current) => {
      const updated = current.filter((item) => item.id !== id);
      writeStorage(STORAGE_KEYS.MEMORY, updated);
      return updated;
    });
  }, []);

  // End-of-Day operations
  const saveEndOfDayLog = useCallback((log: EndOfDayLog) => {
    setEndOfDayLogs((current) => {
      const updated = { ...current, [log.date]: log };
      writeStorage(STORAGE_KEYS.END_OF_DAY, updated);
      return updated;
    });
  }, []);

  // Task overrides operations (Keep, Move to today, Reschedule, Unnecessary)
  const setTaskOverride = useCallback((key: string, action: TaskAction, targetDate?: string) => {
    setTaskOverrides((current) => {
      const updated = {
        ...current,
        [key]: {
          action,
          targetDate,
          updatedAt: new Date().toISOString(),
        },
      };
      writeStorage(STORAGE_KEYS.TASK_OVERRIDES, updated);
      return updated;
    });
  }, []);

  const installApp = useCallback(async () => {
    if (!installPrompt) return false;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
    return true;
  }, [installPrompt]);

  return {
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
  };
}
