/**
 * NanoWalk — Background Task Service
 *
 * expo-task-manager + expo-background-fetch を使い、
 * アプリがバックグラウンドにあるときも15分ごとに歩数を取得し、
 * エンカウントが発生したらプッシュ通知を送る。
 */

import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { fetchTodaySteps, calculateNanoEnergy, isAnomalousStepCount } from "@/services/pedometerService";
import { shouldEncounter, rollRarity, pickMonsterFromPool, buildEncounterEvent } from "@/services/encounterService";
import { scheduleEncounterNotification } from "@/services/notificationService";
import { checkAndScheduleMilestone } from "@/services/notificationService";
import { MONSTER_POOL } from "@/constants/monsters";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const BACKGROUND_STEP_TASK = "NANOWALK_BACKGROUND_STEP_TASK";

// ---- Task Definition ----
// TaskManager.defineTask は モジュールのトップレベルで定義する必要がある
// Expo Go では background-fetch / task-manager が非対応のため try-catch で保護する

try {
  TaskManager.defineTask(BACKGROUND_STEP_TASK, async () => {
    try {
      // 1. 歩数取得
      const steps = await fetchTodaySteps();
      if (isAnomalousStepCount(steps)) {
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }

      // 2. 前回のステップ数と比較
      const prevStr = await AsyncStorage.getItem("bg_last_steps");
      const prevSteps = prevStr ? parseInt(prevStr, 10) : 0;
      await AsyncStorage.setItem("bg_last_steps", String(steps));

      // 3. マイルストーン通知チェック
      const notifiedStr = await AsyncStorage.getItem("bg_notified_milestones");
      const notifiedMilestones = new Set<number>(
        notifiedStr ? JSON.parse(notifiedStr) : []
      );
      const { notified, milestone } = await checkAndScheduleMilestone(
        steps,
        notifiedMilestones
      );
      if (notified && milestone) {
        notifiedMilestones.add(milestone);
        await AsyncStorage.setItem(
          "bg_notified_milestones",
          JSON.stringify([...notifiedMilestones])
        );
      }

      // 4. エンカウント判定（前回より歩数が増えていた場合のみ）
      if (steps > prevSteps) {
        const weather = "sunny"; // TODO: OpenWeatherAPI連携
        if (shouldEncounter(steps, weather)) {
          const rarity = rollRarity();
          const monster = pickMonsterFromPool(MONSTER_POOL, rarity);
          if (monster) {
            // バックグラウンドエンカウントIDをストレージに保存
            const encounter = buildEncounterEvent(monster, "nano_plains", weather);
            await AsyncStorage.setItem(
              "bg_pending_encounter",
              JSON.stringify({ monsterId: monster.id, encounterId: encounter.id })
            );

            // プッシュ通知を送る
            await scheduleEncounterNotification({
              monsterName: monster.name,
              rarity: monster.rarity,
              delaySeconds: 1,
            });
          }
        }
      }

      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (e) {
      console.error("[BackgroundTask]", e);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
} catch (e) {
  console.warn("[BackgroundTask] defineTask failed (Expo Go non-supported):", e);
}

// ---- Register / Unregister ----

export async function registerBackgroundTask(): Promise<void> {
  try {
    const status = await BackgroundFetch.getStatusAsync();

    if (
      status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
      status === BackgroundFetch.BackgroundFetchStatus.Denied
    ) {
      console.warn("[BackgroundTask] Background fetch is not available.");
      return;
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_STEP_TASK);
    if (isRegistered) return;

    await BackgroundFetch.registerTaskAsync(BACKGROUND_STEP_TASK, {
      minimumInterval: 15 * 60, // 15分（iOS最短間隔）
      stopOnTerminate: false,   // アプリ終了後も継続
      startOnBoot: false,
    });

    console.log("[BackgroundTask] Registered:", BACKGROUND_STEP_TASK);
  } catch (e) {
    console.warn("[BackgroundTask] registerBackgroundTask failed (Expo Go non-supported):", e);
  }
}

export async function unregisterBackgroundTask(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_STEP_TASK);
    if (!isRegistered) return;
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_STEP_TASK);
  } catch (e) {
    console.warn("[BackgroundTask] unregisterBackgroundTask failed:", e);
  }
}

// ---- Pending encounter from background ----

export async function consumePendingBackgroundEncounter(): Promise<{
  monsterId: number;
  encounterId: string;
} | null> {
  const raw = await AsyncStorage.getItem("bg_pending_encounter");
  if (!raw) return null;
  await AsyncStorage.removeItem("bg_pending_encounter");
  return JSON.parse(raw);
}

// ---- Daily milestone reset (call on app start each day) ----

export async function resetDailyBackgroundState(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const lastReset = await AsyncStorage.getItem("bg_last_reset_date");
  if (lastReset !== today) {
    await AsyncStorage.multiRemove(["bg_last_steps", "bg_notified_milestones"]);
    await AsyncStorage.setItem("bg_last_reset_date", today);
  }
}
