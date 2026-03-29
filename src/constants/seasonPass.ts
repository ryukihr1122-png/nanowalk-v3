/**
 * NanoWalk — シーズンパス定義
 * Season 1: 「ナノの目覚め」
 */

import type { SeasonPass, SeasonPassTier } from "@/types/monetization";

// 30段階のティア報酬を生成
function buildTiers(): SeasonPassTier[] {
  const tiers: SeasonPassTier[] = [];

  for (let lv = 1; lv <= 30; lv++) {
    // 無料報酬パターン（5段階ごとに豪華）
    const isMilestone = lv % 5 === 0;

    const freeReward = isMilestone
      ? { type: "stone" as const, value: "glow", label: "グローストーン×3", emoji: "💎" }
      : { type: "gems" as const, value: 20, label: "20ジェム", emoji: "💎" };

    // プレミアム報酬（無料の上位互換）
    let premiumReward;
    if (lv === 5)  premiumReward = { type: "stone" as const, value: "bright", label: "ブライトストーン×1", emoji: "✨" };
    else if (lv === 10) premiumReward = { type: "ticket" as const, value: "SR", label: "SR確定チケット×1",  emoji: "🎟" };
    else if (lv === 15) premiumReward = { type: "skin" as const,   value: "spring_skin", label: "限定スキン「春風」", emoji: "🌸" };
    else if (lv === 20) premiumReward = { type: "gems" as const,   value: 300,  label: "300ジェム",          emoji: "💎" };
    else if (lv === 25) premiumReward = { type: "ticket" as const, value: "SSR", label: "SSR確定チケット×1", emoji: "🎟" };
    else if (lv === 30) premiumReward = { type: "ticket" as const, value: "UR",  label: "UR確定チケット×1",  emoji: "🌈" };
    else if (lv % 2 === 0) {
      premiumReward = { type: "gems" as const, value: 50, label: "50ジェム", emoji: "💎" };
    } else {
      premiumReward = { type: "stone" as const, value: "glow", label: "グローストーン×1", emoji: "💎" };
    }

    tiers.push({
      level: lv,
      requiredPoints: lv * 100,   // 1段階 = 100ポイント（歩数・ミッション達成で獲得）
      freeReward,
      premiumReward,
    });
  }

  return tiers;
}

export const SEASON_1: SeasonPass = {
  id: "season_1",
  title: "Season 1 — ナノの目覚め",
  seasonNumber: 1,
  startAt: new Date("2026-04-01"),
  endAt:   new Date("2026-04-30"),
  tiers: buildTiers(),
  priceMonthlyJpy: 480,
  priceYearlyJpy:  3980,
};

// ---- シーズンポイント獲得ルール ----

export const SEASON_POINT_RULES = [
  { trigger: "steps_1000",   points: 5,  label: "1,000歩ごと" },
  { trigger: "daily_10k",    points: 50, label: "10,000歩達成" },
  { trigger: "capture",      points: 10, label: "モンスター捕獲" },
  { trigger: "battle_win",   points: 8,  label: "バトル勝利" },
  { trigger: "daily_mission",points: 30, label: "デイリーミッション完了" },
  { trigger: "weekly_mission",points:100, label: "ウィークリーミッション完了" },
];

export type SeasonPointTrigger = typeof SEASON_POINT_RULES[number]["trigger"];

export function calcPointsForTrigger(trigger: SeasonPointTrigger): number {
  return SEASON_POINT_RULES.find((r) => r.trigger === trigger)?.points ?? 0;
}
