/**
 * NanoWalk — Notification Service
 *
 * 担当通知の種類:
 *   1. エンカウント通知   — バックグラウンド中にエンカウントが発生したとき
 *   2. デイリーリセット  — 毎朝6:00「今日も歩こう！」
 *   3. 歩数マイルストーン — 3,000 / 7,000 / 10,000 歩達成
 *   4. ミッション完了     — デイリーミッション達成時
 *   5. 進化可能           — 進化条件を満たしたモンスターがいるとき
 *   6. 絆レベルアップ     — 相棒の絆レベルが上昇したとき
 */

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import type { NotificationType } from "@/types";

// ---- Global handler setup (call once in _layout.tsx) ----

export function setupNotificationHandlers(): void {
  // フォアグラウンド中にバナーを表示する
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// ---- Permission ----

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) {
    // シミュレーターでは常に true を返す
    return true;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function getExpoPushToken(): Promise<string | null> {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return null;

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: "your-expo-project-id", // app.json の extra.eas.projectId に合わせる
    });
    return token.data;
  } catch (e) {
    console.warn("[Notifications] Failed to get push token:", e);
    return null;
  }
}

// ---- Schedule helpers ----

type ScheduleResult = string; // notification identifier

/**
 * 指定秒後にローカル通知を発火する（1回限り）
 */
async function scheduleInSeconds(
  title: string,
  body: string,
  seconds: number,
  data?: Record<string, unknown>
): Promise<ScheduleResult> {
  return Notifications.scheduleNotificationAsync({
    content: { title, body, data: data ?? {}, sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, repeats: false },
  });
}

/**
 * 毎日指定時刻に繰り返す通知をスケジュール
 */
async function scheduleDailyAt(
  title: string,
  body: string,
  hour: number,
  minute: number,
  data?: Record<string, unknown>
): Promise<ScheduleResult> {
  return Notifications.scheduleNotificationAsync({
    content: { title, body, data: data ?? {}, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
    },
  });
}

// ---- 1. エンカウント通知 ----

export async function scheduleEncounterNotification(params: {
  monsterName: string;
  rarity: string;
  delaySeconds?: number;
}): Promise<ScheduleResult> {
  const rarityLabel: Record<string, string> = {
    N: "",
    R: "✨ レア！",
    SR: "🌟 スーパーレア！",
    SSR: "💫 ウルトラレア！！",
    UR: "🌈 伝説の出現！！！",
  };

  const isRare = params.rarity !== "N";
  const label = rarityLabel[params.rarity] ?? "";

  return scheduleInSeconds(
    isRare ? `${label} ${params.monsterName}が現れた！` : `${params.monsterName}が現れた！`,
    "今すぐNanoWalkを開いて捕獲しよう！",
    params.delaySeconds ?? 1,
    { type: "encounter" as NotificationType, monsterName: params.monsterName }
  );
}

// ---- 2. デイリーリセット通知 ----

const DAILY_MESSAGES = [
  { title: "🌅 今日も一緒に歩こう！", body: "新しいナノンが待ってるよ。今日の歩数を稼ごう！" },
  { title: "👟 歩くたびに強くなる！", body: "デイリーミッションをチェックして、ナノエナジーをゲットしよう。" },
  { title: "🌿 森の奥でなにかがうごめいている...", body: "今日はレアなナノンに会えるかも。歩きに行こう！" },
  { title: "⚡ 10,000歩でUR確率2倍！", body: "目標歩数を達成してレアモンスターを引き寄せよう。" },
  { title: "❄️ 今日の天気でモンスターが変わる！", body: "天気ボーナスを活かして珍しいナノンを探そう。" },
];

export async function scheduleDailyReminderNotification(): Promise<ScheduleResult> {
  const msg = DAILY_MESSAGES[Math.floor(Math.random() * DAILY_MESSAGES.length)];
  return scheduleDailyAt(msg.title, msg.body, 6, 0, { type: "daily_reward" as NotificationType });
}

// ---- 3. 歩数マイルストーン通知 ----

interface MilestoneConfig {
  steps: number;
  title: string;
  body: string;
}

const MILESTONES: MilestoneConfig[] = [
  {
    steps: 3_000,
    title: "🎯 3,000歩達成！",
    body: "エンカウント率がアップした！引き続き歩こう。",
  },
  {
    steps: 7_000,
    title: "🔥 7,000歩達成！",
    body: "エンカウント率が1.5倍に。あと3,000歩で最大ボーナス！",
  },
  {
    steps: 10_000,
    title: "🏆 10,000歩達成！",
    body: "今日のNEボーナス獲得！エンカウント率が最大2倍になった！",
  },
  {
    steps: 15_000,
    title: "💪 15,000歩！超ウォーカー！",
    body: "今日は本当によく歩いた。NEボーナス+50を獲得！",
  },
];

/** 未送信のマイルストーン通知を即時スケジュール（1秒後に発火） */
export async function checkAndScheduleMilestone(
  todaySteps: number,
  alreadyNotifiedSteps: Set<number>
): Promise<{ notified: boolean; milestone: number | null }> {
  for (const m of MILESTONES) {
    if (todaySteps >= m.steps && !alreadyNotifiedSteps.has(m.steps)) {
      await scheduleInSeconds(m.title, m.body, 1, {
        type: "daily_reward" as NotificationType,
        milestone: m.steps,
      });
      return { notified: true, milestone: m.steps };
    }
  }
  return { notified: false, milestone: null };
}

// ---- 4. ミッション完了通知 ----

export async function scheduleMissionCompleteNotification(
  missionTitle: string,
  rewardText: string
): Promise<ScheduleResult> {
  return scheduleInSeconds(
    "✅ ミッション完了！",
    `「${missionTitle}」達成！${rewardText}をゲットしよう。`,
    1,
    { type: "mission_complete" as NotificationType }
  );
}

// ---- 5. 進化可能通知 ----

export async function scheduleEvolutionReadyNotification(
  monsterName: string
): Promise<ScheduleResult> {
  return scheduleInSeconds(
    "✨ 進化の予感...！",
    `${monsterName}が進化できる状態になった！`,
    2,
    { type: "evolution_ready" as NotificationType }
  );
}

// ---- 6. 絆レベルアップ通知 ----

export async function scheduleBondLevelUpNotification(
  monsterName: string,
  newLevel: number
): Promise<ScheduleResult> {
  return scheduleInSeconds(
    `💖 ${monsterName}との絆が深まった！`,
    `絆レベルが${newLevel}になった！スペシャルスキルが解放されるかも。`,
    1,
    { type: "bond_level_up" as NotificationType }
  );
}

// ---- Cancel ----

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function cancelNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

// ---- Badge ----

export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

// ---- Scheduled list (debug) ----

export async function getScheduledNotifications(): Promise<
  Notifications.NotificationRequest[]
> {
  return Notifications.getAllScheduledNotificationsAsync();
}
