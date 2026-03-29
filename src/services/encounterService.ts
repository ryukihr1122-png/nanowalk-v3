/**
 * NanoWalk — エンカウントサービス v2.1
 * エリア別レアリティ出現率 + アイテム/イベント対応
 */

import type { EncounterEvent, MonsterDefinition, AreaId, WeatherType } from "@/types";
import {
  BASE_ENCOUNTER_CHANCE,
  WEATHER_MULTIPLIERS,
  BASE_SCOUT_RATES,
  BALL_CONFIG,
  calcFinalRarityWeights,
  rollRarityFromWeights,
  getActiveEvents,
  type ScoutBoostItem,
  type RarityWeights,
} from "@/constants/game";
import { getStepMultiplier, getTimeMultiplier } from "./pedometerService";
import type { BallType, RarityType } from "@/types";

// ============================================================
// エンカウントトリガー
// ============================================================

export function shouldEncounter(
  todaySteps: number,
  weather: WeatherType = "sunny",
  encounterItemMultiplier = 1.0
): boolean {
  const stepMult    = getStepMultiplier(todaySteps);
  const timeMult    = getTimeMultiplier();
  const weatherMult = WEATHER_MULTIPLIERS[weather] ?? 1.0;
  const chance      = BASE_ENCOUNTER_CHANCE
    * stepMult * timeMult * weatherMult * encounterItemMultiplier;
  return Math.random() < Math.min(chance, 0.30); // 上限30%
}

// ============================================================
// レアリティ決定（エリア + アイテム + イベント統合）
// ============================================================

export function rollRarity(
  area:         AreaId,
  activeBoosts: ScoutBoostItem[] = [],
): RarityType {
  const activeEvents = getActiveEvents();
  const weights      = calcFinalRarityWeights(area, activeBoosts, activeEvents);
  return rollRarityFromWeights(weights);
}

// ============================================================
// モンスター選択
// ============================================================

export function pickMonsterFromPool(
  pool:   MonsterDefinition[],
  rarity: RarityType,
  area:   AreaId,
): MonsterDefinition | null {
  // エリアの favoriteAreas に合うものを優先
  let candidates = pool.filter(
    (m) => m.rarity === rarity && m.favoriteAreas.includes(area)
  );
  // なければ全体から
  if (candidates.length === 0) {
    candidates = pool.filter((m) => m.rarity === rarity);
  }
  // それでもなければ N にフォールバック
  if (candidates.length === 0) {
    candidates = pool.filter((m) => m.rarity === "N");
  }
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// ============================================================
// エンカウントイベント生成
// ============================================================

export function buildEncounterEvent(
  monster: MonsterDefinition,
  area:    AreaId,
  weather: WeatherType = "sunny"
): EncounterEvent {
  return {
    id:                `encounter_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    monsterId:         monster.id,
    area,
    weather,
    timestamp:         new Date(),
    captureMultiplier: WEATHER_MULTIPLIERS[weather] ?? 1.0,
  };
}

// ============================================================
// スカウト確率計算（旧captureChance互換）
// ============================================================

export function calcScoutChance(
  rarity:    RarityType,
  ballType:  BallType,
  itemBonus: number = 0,
): number {
  const base     = BASE_SCOUT_RATES[rarity];
  const ballBonus = BALL_CONFIG[ballType].scoutBonus;
  return Math.min(base + ballBonus + itemBonus, 0.95);
}

// ============================================================
// エリア別出現確率サマリー（UI表示用）
// ============================================================

export function getAreaRaritySummary(
  area:         AreaId,
  activeBoosts: ScoutBoostItem[] = [],
): Record<RarityType, number> {
  const activeEvents = getActiveEvents();
  const weights      = calcFinalRarityWeights(area, activeBoosts, activeEvents);
  const total        = Object.values(weights).reduce((s, w) => s + w, 0);
  const probs: Record<string, number> = {};
  for (const [r, w] of Object.entries(weights)) {
    probs[r] = total > 0 ? w / total : 0;
  }
  return probs as Record<RarityType, number>;
}
