/**
 * NanoWalk — ログインボーナス
 *
 * 7日サイクルで繰り返す。
 * 連続7日達成で最終日に特別報酬（SSRチケット）。
 * 1日でも途切れると Day1 からリスタート（ただし連続日数は保持）。
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ---- 7日分の報酬定義 ----

export interface LoginReward {
  day: number;
  label: string;
  emoji: string;
  type: "gems" | "item" | "stone" | "ticket" | "ne";
  value: number | string;
  quantity: number;
  isSpecial?: boolean;   // 7日目の特別報酬
}

// デイリーボール配布（毎日ログイン時に追加で付与）
export const DAILY_BALL_LOGIN_BONUS = {
  normal: 5,   // 毎日5個
};

export const LOGIN_REWARDS: LoginReward[] = [
  { day: 1, label: "30ジェム",           emoji: "💎", type: "gems",   value: 30,               quantity: 1 },
  { day: 2, label: "おやつ（小）×2",     emoji: "🍪", type: "item",   value: "stay_extend_s",  quantity: 2 },
  { day: 3, label: "グローストーン×3",   emoji: "⚫", type: "stone",   value: "silver",          quantity: 3 },
  { day: 4, label: "なでなでブラシ×2",   emoji: "🪮", type: "item",   value: "scout_brush",     quantity: 2 },
  { day: 5, label: "80ジェム",           emoji: "💎", type: "gems",   value: 80,               quantity: 1 },
  { day: 6, label: "ナノビーコン×1",     emoji: "🔦", type: "item",   value: "encounter_up_m", quantity: 1 },
  {
    day: 7,
    label: "SR確定チケット×1",
    emoji: "🎟",
    type: "ticket",
    value: "SR",
    quantity: 1,
    isSpecial: true,
  },
];

// ---- Store ----

interface LoginBonusStore {
  lastLoginDate: string | null;  // "YYYY-MM-DD"
  currentStreak: number;         // 連続ログイン日数
  currentDay: number;            // 現在のサイクル内の日 (1〜7)
  longestStreak: number;
  todayClaimed: boolean;

  // Actions
  claimLoginBonus: () => LoginReward | null;
  getTodayReward: () => LoginReward;
  isStreakBroken: () => boolean;
}

function toDateStr(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const msA = new Date(a).getTime();
  const msB = new Date(b).getTime();
  return Math.round(Math.abs(msA - msB) / (1000 * 60 * 60 * 24));
}

export const useLoginBonusStore = create<LoginBonusStore>()(
  persist(
    (set, get) => ({
      lastLoginDate: null,
      currentStreak: 0,
      currentDay: 1,
      longestStreak: 0,
      todayClaimed: false,

      claimLoginBonus: () => {
        const today = toDateStr();
        const { lastLoginDate, currentStreak, currentDay, longestStreak } = get();

        // すでに今日受け取り済み
        if (lastLoginDate === today) return null;

        let newStreak = currentStreak;
        let newDay    = currentDay;

        if (lastLoginDate === null) {
          // 初回
          newStreak = 1;
          newDay    = 1;
        } else {
          const diff = daysBetween(lastLoginDate, today);
          if (diff === 1) {
            // 連続
            newStreak += 1;
            newDay = ((currentDay - 1 + 1) % 7) + 1;
          } else {
            // 途切れ: ストリークリセット
            newStreak = 1;
            newDay    = 1;
          }
        }

        const reward = LOGIN_REWARDS.find((r) => r.day === newDay)!;

        set({
          lastLoginDate: today,
          currentStreak: newStreak,
          currentDay: newDay,
          longestStreak: Math.max(longestStreak, newStreak),
          todayClaimed: true,
        });

        // デイリーボール付与フラグをrewardに埋め込む
        const rewardWithBall = {
          ...reward,
          dailyBallBonus: DAILY_BALL_LOGIN_BONUS,
        };
        return rewardWithBall;
      },

      getTodayReward: () => {
        const { currentDay, lastLoginDate } = get();
        const today = toDateStr();

        if (lastLoginDate === today) {
          // 今日の分はすでに受け取り済み → 次の日報酬をプレビュー
          const nextDay = (currentDay % 7) + 1;
          return LOGIN_REWARDS.find((r) => r.day === nextDay)!;
        }

        const { currentStreak, lastLoginDate: ld } = get();
        const isConsecutive = ld && daysBetween(ld, today) === 1;
        const nextDay = isConsecutive ? (currentDay % 7) + 1 : 1;
        return LOGIN_REWARDS.find((r) => r.day === nextDay)!;
      },

      isStreakBroken: () => {
        const { lastLoginDate } = get();
        if (!lastLoginDate) return false;
        const today = toDateStr();
        return daysBetween(lastLoginDate, today) > 1;
      },
    }),
    {
      name: "nanowalk-login-bonus",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
