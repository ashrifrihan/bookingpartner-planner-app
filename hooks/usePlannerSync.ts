'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { ItemStates, RowIds, TextMap } from '@/lib/storage';

function itemKey(date: string, index: number): string {
  return `${date}:${index}`;
}

export function usePlannerSync({
  onCloudLoaded,
}: {
  onCloudLoaded?: (data: { states: ItemStates; rowIds: RowIds; notes: TextMap; blocked: TextMap }) => void;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(!isSupabaseConfigured);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [slowNotice, setSlowNotice] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [rowIds, setRowIds] = useState<RowIds>({});
  
  // Track last modified timestamps per key to resolve sync conflicts (Last-Write-Wins)
  const localTimestamps = useRef<Record<string, number>>({});
  const noteTimers = useRef<Record<string, number>>({});

  // Initialize Supabase Auth Session with timeout safeguard
  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }
    let active = true;

    const timer = setTimeout(() => {
      if (active) {
        setSlowNotice(true);
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
        console.warn('Supabase connection error:', err);
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

  // Fetch full cloud dataset
  const loadCloud = useCallback(async () => {
    if (!supabase || !user) return;
    setSyncing(true);

    try {
      const { data: existingItems, error: itemsError } = await supabase
        .from('planner_items')
        .select('id,task_date,item_index,completed,updated_at')
        .eq('user_id', user.id);

      if (itemsError) {
        setMessage(`Sync error: ${itemsError.message}`);
        setSyncing(false);
        return;
      }

      const nextStates: ItemStates = {};
      const nextRowIds: RowIds = {};
      (existingItems || []).forEach((row) => {
        const key = itemKey(row.task_date, row.item_index);
        const remoteTime = row.updated_at ? new Date(row.updated_at).getTime() : 0;
        const localTime = localTimestamps.current[key] || 0;

        // Last-Write-Wins: only accept remote if it is newer or equal to our local timestamp
        if (remoteTime >= localTime) {
          nextStates[key] = Boolean(row.completed);
          localTimestamps.current[key] = remoteTime;
        }
        nextRowIds[key] = row.id;
      });

      const { data: noteRows, error: noteError } = await supabase
        .from('planner_notes')
        .select('task_date,note,blocked,updated_at')
        .eq('user_id', user.id);

      const nextNotes: TextMap = {};
      const nextBlocked: TextMap = {};

      if (!noteError && noteRows) {
        noteRows.forEach((row) => {
          nextNotes[row.task_date] = row.note || '';
          nextBlocked[row.task_date] = row.blocked || '';
        });
      }

      setRowIds(nextRowIds);
      if (onCloudLoaded) {
        onCloudLoaded({
          states: nextStates,
          rowIds: nextRowIds,
          notes: nextNotes,
          blocked: nextBlocked,
        });
      }
    } catch (err: any) {
      console.error('Failed to sync cloud:', err);
      setMessage('Failed to synchronize with cloud database.');
    } finally {
      setSyncing(false);
    }
  }, [user, onCloudLoaded]);

  // Realtime subscription
  useEffect(() => {
    if (!supabase || !user) return;
    loadCloud();

    const channel = supabase
      .channel(`planner-sync-${user.id}`)
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

  // Update cloud item with conflict timestamp tracking
  const updateCloudItem = useCallback(
    async (taskDate: string, index: number, completed: boolean) => {
      if (!supabase || !user) return;
      const key = itemKey(taskDate, index);
      const now = Date.now();
      localTimestamps.current[key] = now;

      const id = rowIds[key];
      if (!id) {
        // Upsert if not yet tracked
        const { data, error } = await supabase
          .from('planner_items')
          .upsert(
            {
              user_id: user.id,
              task_date: taskDate,
              item_index: index,
              completed,
              updated_at: new Date(now).toISOString(),
            },
            { onConflict: 'user_id,task_date,item_index' }
          )
          .select('id')
          .single();

        if (!error && data) {
          setRowIds((prev) => ({ ...prev, [key]: data.id }));
        }
        return;
      }

      const { error } = await supabase
        .from('planner_items')
        .update({
          completed,
          updated_at: new Date(now).toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        setMessage(`Could not save task: ${error.message}`);
      }
    },
    [user, rowIds]
  );

  // Debounced cloud note/blocker saving
  const updateCloudText = useCallback(
    (dayDate: string, field: 'note' | 'blocked', value: string) => {
      if (!supabase || !user) return;
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

        const { error } = await supabase
          .from('planner_notes')
          .upsert(payload, { onConflict: 'user_id,task_date' });

        if (error) setMessage(`Could not save note: ${error.message}`);
      }, 600);
    },
    [user]
  );

  return {
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
  };
}
