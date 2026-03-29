/**
 * useNotifications
 *
 * - 起動時に通知許可を取得
 * - Expo Push Token を取得してストアに保存
 * - デイリーリマインダーを一度だけスケジュール
 * - 歩数の変化を監視してマイルストーン通知を発火
 * - 着信通知のタップをハンドリングして画面遷移
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import {
  requestNotificationPermission,
  getExpoPushToken,
  scheduleDailyReminderNotification,
  checkAndScheduleMilestone,
  scheduleEncounterNotification,
} from "@/services/notificationService";
import { usePlayerStore } from "@/store/playerStore";
import { useNotificationStore } from "@/store/notificationStore";

export function useNotifications() {
  const router = useRouter();
  const { player } = usePlayerStore();
  const {
    pushToken,
    setPushToken,
    dailyReminderScheduled,
    setDailyReminderScheduled,
    notifiedMilestones,
    addNotifiedMilestone,
  } = useNotificationStore();

  const [permissionGranted, setPermissionGranted] = useState(false);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  // ---- 1. Permission + Push Token ----
  useEffect(() => {
    (async () => {
      const granted = await requestNotificationPermission();
      setPermissionGranted(granted);
      if (!granted) return;

      if (!pushToken) {
        const token = await getExpoPushToken();
        if (token) setPushToken(token);
      }
    })();
  }, []);

  // ---- 2. デイリーリマインダー（一度だけ登録） ----
  useEffect(() => {
    if (!permissionGranted || dailyReminderScheduled) return;
    (async () => {
      await scheduleDailyReminderNotification();
      setDailyReminderScheduled(true);
    })();
  }, [permissionGranted]);

  // ---- 3. 歩数マイルストーン監視 ----
  useEffect(() => {
    if (!permissionGranted || !player) return;
    const todaySteps = player.todaySteps;
    const alreadyNotified = new Set(notifiedMilestones);

    (async () => {
      const { notified, milestone } = await checkAndScheduleMilestone(
        todaySteps,
        alreadyNotified
      );
      if (notified && milestone !== null) {
        addNotifiedMilestone(milestone);
      }
    })();
  }, [player?.todaySteps, permissionGranted]);

  // ---- 4. フォアグラウンド通知リスナー ----
  useEffect(() => {
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        const type = notification.request.content.data?.type as string | undefined;
        console.log("[Notifications] Received:", type);
      });

    // ---- 5. 通知タップ → 画面遷移 ----
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as Record<string, unknown>;
        const type = data?.type as string | undefined;

        switch (type) {
          case "encounter":
            // エンカウント画面を開く（アクティブなエンカウントIDが必要な場合は store 経由で取得）
            router.push("/");
            break;
          case "evolution_ready":
            router.push("/(tabs)/monsters");
            break;
          case "bond_level_up":
            router.push("/(tabs)/monsters");
            break;
          case "mission_complete":
          case "daily_reward":
            router.push("/");
            break;
          default:
            router.push("/");
        }
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [router]);

  return { permissionGranted, pushToken };
}

// ---- バックグラウンドエンカウント通知トリガー ----
// useEncounter.ts から呼び出す用のヘルパー
export async function triggerEncounterNotification(params: {
  monsterName: string;
  rarity: string;
}) {
  await scheduleEncounterNotification({
    monsterName: params.monsterName,
    rarity: params.rarity,
    delaySeconds: 1,
  });
}
