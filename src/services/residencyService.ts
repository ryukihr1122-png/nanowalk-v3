/**
 * NanoWalk — Residency Service
 *
 * 「滞在モンスター」システム
 *
 * 滞在時間（レアリティ別）:
 *   N:   20時間
 *   R:   20時間
 *   SR:   8時間
 *   SSR:  3時間
 *   UR:   1時間
 *
 * 同時滞在上限: 5体
 * 期限切れは自動的に「逃げた」扱いで削除
 */

import type { RarityType, AreaId, ElementType } from "@/types";
import type { ResidentMonster } from "@/types";
import type { MonsterDefinition } from "@/types";

// ---- Stay Duration ----

export const STAY_DURATION_MS: Record<RarityType, number> = {
  N:   20 * 60 * 60 * 1000,   // 20時間
  R:   20 * 60 * 60 * 1000,   // 20時間
  SR:   8 * 60 * 60 * 1000,   //  8時間
  SSR:  3 * 60 * 60 * 1000,   //  3時間
  UR:   1 * 60 * 60 * 1000,   //  1時間
};

export const MAX_RESIDENTS = 5;

// ---- Build ResidentMonster from MonsterDefinition ----

export function buildResident(
  encounterId: string,
  monster: MonsterDefinition,
  area: AreaId,
  captureMultiplier: number
): ResidentMonster {
  const now = new Date();
  const duration = STAY_DURATION_MS[monster.rarity];
  const expiresAt = new Date(now.getTime() + duration);

  return {
    id: encounterId,
    monsterId: monster.id,
    monsterName: monster.name,
    rarity: monster.rarity,
    element: monster.element,
    area,
    arrivedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    captureMultiplier,
  };
}

// ---- Time Helpers ----

/** 残り時間をミリ秒で返す（期限切れは 0） */
export function getTimeRemainingMs(resident: ResidentMonster): number {
  const expires = new Date(resident.expiresAt).getTime();
  const now = Date.now();
  return Math.max(0, expires - now);
}

/** 期限切れかどうか */
export function isExpired(resident: ResidentMonster): boolean {
  return getTimeRemainingMs(resident) === 0;
}

/** 残り時間を "HH:MM:SS" 形式の文字列に変換 */
export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "逃げた";

  const totalSeconds = Math.floor(ms / 1000);
  const hours   = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** 残り時間の緊急度（色分けに使う） */
export function urgencyLevel(ms: number): "safe" | "warning" | "critical" {
  const hours = ms / (1000 * 60 * 60);
  if (hours > 2)  return "safe";
  if (hours > 0.5) return "warning";
  return "critical";
}

/** 残り時間の緊急度に対応するカラー */
export const URGENCY_COLOR = {
  safe:     "#00C9A7",
  warning:  "#FFD54F",
  critical: "#FF6B6B",
} as const;

// ---- Slot Management ----

/**
 * 期限切れの居住モンスターを除去して返す
 */
export function evictExpired(residents: ResidentMonster[]): {
  active: ResidentMonster[];
  evicted: ResidentMonster[];
} {
  const active:  ResidentMonster[] = [];
  const evicted: ResidentMonster[] = [];
  for (const r of residents) {
    (isExpired(r) ? evicted : active).push(r);
  }
  return { active, evicted };
}

/**
 * 新しいモンスターを追加できるか確認
 * スロットが埋まっていたら最も古い N/R を追い出す
 */
export function makeRoomForNew(
  residents: ResidentMonster[]
): ResidentMonster[] {
  if (residents.length < MAX_RESIDENTS) return residents;

  // 最も低レアかつ最も古いものを追い出す
  const rarityRank: Record<RarityType, number> = { N: 0, R: 1, SR: 2, SSR: 3, UR: 4 };
  const sorted = [...residents].sort((a, b) => {
    const rarityDiff = rarityRank[a.rarity] - rarityRank[b.rarity];
    if (rarityDiff !== 0) return rarityDiff;
    return new Date(a.arrivedAt).getTime() - new Date(b.arrivedAt).getTime();
  });

  // 最も価値の低いものを1体除外
  return sorted.slice(1);
}

// ---- Stay Duration Label ----

export function stayDurationLabel(rarity: RarityType): string {
  const ms = STAY_DURATION_MS[rarity];
  const hours = ms / (1000 * 60 * 60);
  if (hours >= 1) return `${hours}時間滞在`;
  return `${ms / (1000 * 60)}分滞在`;
}
