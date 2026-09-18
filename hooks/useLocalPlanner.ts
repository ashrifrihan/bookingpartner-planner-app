'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ItemStates,
  TextMap,
  ThemeMode,
  STORAGE_KEYS,
  parseItemStates,
  parseTextMap,
  parseTheme,
  readStorage,
  writeStorage,
} from '@/lib/storage';

export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function useLocalPlanner() {
  const [states, setStates] = useState<ItemStates>({});
  const [notes, setNotes] = useState<TextMap>({});
  const [blocked, setBlocked] = useState<TextMap>({});
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
    theme,
    toggleTheme,
    online,
    installPrompt,
    installApp,
    updateLocalItem,
    updateLocalText,
  };
}
