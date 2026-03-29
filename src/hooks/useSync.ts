/**
 * useSync
 * - アプリ起動時・フォアグラウンド復帰時に自動同期
 * - 手動同期トリガー
 * - 同期状態のUI表示用
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import {
  syncAll,
  getLastSyncAt,
  isSyncing,
  type SyncResult,
} from "@/services/syncService";
import { useAuth } from "./useAuth";

const AUTO_SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5分ごとに自動同期

interface UseSyncReturn {
  lastSyncAt:   Date | null;
  syncing:      boolean;
  lastResult:   SyncResult | null;
  triggerSync:  () => Promise<void>;
}

export function useSync(): UseSyncReturn {
  const { isSignedIn } = useAuth();
  const [syncing, setSyncing]       = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(getLastSyncAt());

  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const triggerSync = useCallback(async () => {
    if (!isSignedIn || isSyncing()) return;

    setSyncing(true);
    try {
      const result = await syncAll();
      setLastResult(result);
      setLastSyncAt(getLastSyncAt());
    } finally {
      setSyncing(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) return;

    // 初回同期
    triggerSync();

    // 定期同期
    timerRef.current = setInterval(triggerSync, AUTO_SYNC_INTERVAL_MS);

    // フォアグラウンド復帰時に同期
    const sub = AppState.addEventListener("change", (nextState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === "active"
      ) {
        triggerSync();
      }
      appStateRef.current = nextState;
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      sub.remove();
    };
  }, [isSignedIn, triggerSync]);

  return { lastSyncAt, syncing, lastResult, triggerSync };
}
