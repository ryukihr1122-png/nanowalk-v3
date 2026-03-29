/**
 * useAuth
 * - 認証状態の管理
 * - サインイン / サインアウト
 * - プロフィール初期化
 */

import { useEffect, useState, useCallback } from "react";
import {
  signInWithApple,
  signOut as authSignOut,
  getCurrentUser,
  onAuthStateChange,
  ensureProfile,
} from "@/services/authService";
import { syncAll } from "@/services/syncService";
import { usePlayerStore } from "@/store/playerStore";

interface UseAuthReturn {
  userId:    string | null;
  isLoading: boolean;
  isSignedIn: boolean;
  signIn:    () => Promise<boolean>;
  signOut:   () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [userId, setUserId]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { player, initPlayer } = usePlayerStore();

  // ---- 初期化 ----
  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      setUserId(user?.id ?? null);
      setIsLoading(false);
    })();

    const unsubscribe = onAuthStateChange((id) => {
      setUserId(id);
    });
    return unsubscribe;
  }, []);

  // ---- サインイン後の初期化 ----
  useEffect(() => {
    if (!userId) return;
    (async () => {
      // プレイヤーが未初期化の場合は初期化
      if (!player) {
        const username = `ウォーカー_${userId.slice(0, 6)}`;
        initPlayer(userId, username);
        await ensureProfile(userId, username);
      }
      // クラウドから最新データを取得
      await syncAll();
    })();
  }, [userId]);

  const signIn = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await signInWithApple();
      return result.success;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    await authSignOut();
    setUserId(null);
  }, []);

  return {
    userId,
    isLoading,
    isSignedIn: !!userId,
    signIn,
    signOut,
  };
}
