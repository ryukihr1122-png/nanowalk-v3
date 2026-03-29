/**
 * NanoWalk — Gacha Service v2.1
 *
 * 設計変更:
 * - 排出物: アイテム・ボールが主体
 * - モンスターは稀に「エンカウント追加」として出現（直接入手ではない）
 */

import type { GachaBanner, GachaResult, GachaResultItem, GachaHistory } from "@/types/monetization";
import type { RarityType } from "@/types";
import { MONSTER_POOL } from "@/constants/monsters";
import { ITEM_DEFINITIONS } from "@/constants/items";
import { STONE_CONFIG } from "@/constants/game";

// ---- 確率テーブル ----

const BASE_RATES: Record<RarityType, number> = {
  N:   55.00,
  R:   28.00,
  SR:  12.00,
  SSR:  4.00,
  UR:   1.00,
};

// レアリティ別排出内容プール
type ItemPool = { kind: "item" | "stone" | "monster"; id: string; weight: number; qty?: number };

const RARITY_ITEM_POOL: Record<RarityType, ItemPool[]> = {
  N: [
    { kind: "stone",  id: "dull",          weight: 60, qty: 3 },
    { kind: "stone",  id: "dull",          weight: 20, qty: 5 },
    { kind: "item",    id: "stay_extend_s",   weight: 15 },
    { kind: "item",    id: "encounter_up_s",  weight: 5  },
  ],
  R: [
    { kind: "stone",  id: "dull",          weight: 30, qty: 5 },
    { kind: "stone",  id: "glow",          weight: 30, qty: 2 },
    { kind: "item",    id: "stay_extend_m",   weight: 15 },
    { kind: "item",    id: "stay_extend_s",   weight: 10 },
    { kind: "item",    id: "scout_brush",    weight: 10 },
    { kind: "item",    id: "elem_forest",    weight: 6  },
    { kind: "item",    id: "elem_aqua",      weight: 6  },
    { kind: "item",    id: "elem_flare",     weight: 6  },
    { kind: "item",    id: "elem_bolt",      weight: 6  },
    { kind: "item",    id: "elem_shadow",    weight: 6  },
    { kind: "item",    id: "elem_lumina",    weight: 6  },
    { kind: "item",    id: "ne_boost_s",      weight: 5  },
  ],
  SR: [
    { kind: "stone",  id: "glow",          weight: 25, qty: 3 },
    { kind: "stone",  id: "bright",            weight: 20, qty: 1 },
    { kind: "item",    id: "rare_up_s",       weight: 20 },
    { kind: "item",    id: "scout_jam",   weight: 15 },
    { kind: "item",    id: "scout_brush",    weight: 10 },
    { kind: "item",    id: "ne_boost_m",      weight: 5  },
    { kind: "monster", id: "monster",         weight: 5  },
  ],
  SSR: [
    { kind: "stone",  id: "bright",            weight: 30, qty: 3 },
    { kind: "stone",  id: "prism",        weight: 15, qty: 1 },
    { kind: "item",    id: "rare_up_m",       weight: 25 },
    { kind: "item",    id: "guiding_stone", weight: 15 },
    { kind: "item",    id: "scout_jam",    weight: 5  },
    { kind: "monster", id: "monster",         weight: 10 },
  ],
  UR: [
    { kind: "stone",  id: "prism",        weight: 20, qty: 3 },
    { kind: "item",    id: "rare_up_m",       weight: 20 },
    { kind: "item",    id: "guiding_stone",    weight: 20 },
    { kind: "item",    id: "gear_nano_orb",    weight: 8  },
    { kind: "item",    id: "gear_walker_boots",weight: 8  },
    { kind: "item",    id: "gear_nano_bracelet",weight: 8 },
    { kind: "item",    id: "scout_jam",   weight: 10 },
    { kind: "monster", id: "monster",         weight: 30 },
  ],
};

function boostedSSRRate(pityCount: number): number {
  if (pityCount < 50) return BASE_RATES.SSR;
  return Math.min(BASE_RATES.SSR + (pityCount - 49), 50);
}

function rollRarityWithPity(
  pityCount: number,
  isGuaranteedSSR: boolean,
  isGuaranteedUR: boolean
): RarityType {
  if (isGuaranteedUR)  return "UR";
  if (isGuaranteedSSR) return "SSR";
  const ssrRate = boostedSSRRate(pityCount);
  const rates: Record<RarityType, number> = {
    ...BASE_RATES, SSR: ssrRate,
    N: Math.max(0, BASE_RATES.N - (ssrRate - BASE_RATES.SSR)),
  };
  const total = Object.values(rates).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (const [rarity, rate] of Object.entries(rates) as [RarityType, number][]) {
    roll -= rate;
    if (roll <= 0) return rarity;
  }
  return "N";
}

function rollFromPool(pool: ItemPool[]): ItemPool {
  const total = pool.reduce((s, p) => s + p.weight, 0);
  let roll = Math.random() * total;
  for (const entry of pool) {
    roll -= entry.weight;
    if (roll <= 0) return entry;
  }
  return pool[0];
}

function pickEncounterMonster(rarity: RarityType, featuredIds: number[]): number {
  const featured = MONSTER_POOL.filter((m) => featuredIds.includes(m.id) && m.rarity === rarity);
  if (featured.length > 0 && Math.random() < 0.5)
    return featured[Math.floor(Math.random() * featured.length)].id;
  const pool = MONSTER_POOL.filter((m) => m.rarity === rarity);
  if (pool.length === 0) return MONSTER_POOL[0].id;
  return pool[Math.floor(Math.random() * pool.length)].id;
}

function rollOne(rarity: RarityType, featuredIds: number[]): GachaResultItem {
  const picked = rollFromPool(RARITY_ITEM_POOL[rarity]);

  if (picked.kind === "monster") {
    return { kind: "monster", monsterId: pickEncounterMonster(rarity, featuredIds), rarity, isEncounter: true };
  }

  if (picked.kind === "stone") {
    return { kind: "stone", stoneType: picked.id, rarity, qty: picked.qty ?? 1 };
  }

  const def = ITEM_DEFINITIONS[picked.id];
  return { kind: "item", itemId: picked.id, rarity, emoji: def?.emoji ?? "🎁", name: def?.name ?? picked.id };
}

export function executePull(
  banner:  GachaBanner,
  count:   1 | 10,
  history: GachaHistory
): { result: GachaResult; updatedHistory: GachaHistory } {
  const results: GachaResultItem[] = [];
  const encounterIds: number[]     = [];
  let { pullCount, ssrPityCount, totalPulls } = history;

  for (let i = 0; i < count; i++) {
    const isGuaranteedSSR = ssrPityCount >= (banner.ssrPityAt - 1);
    const isGuaranteedUR  = pullCount    >= (banner.urPityAt  - 1);
    const rarity  = rollRarityWithPity(ssrPityCount, isGuaranteedSSR, isGuaranteedUR);
    const item    = rollOne(rarity, banner.featuredMonsterIds ?? []);
    results.push(item);
    if (item.kind === "monster") encounterIds.push(item.monsterId);
    pullCount++; totalPulls++;
    if (rarity === "SSR" || rarity === "UR") { ssrPityCount = 0; if (rarity === "UR") pullCount = 0; }
    else ssrPityCount++;
  }

  const RARITY_ORDER: RarityType[] = ["N", "R", "SR", "SSR", "UR"];
  let highlightIndex = 0, maxRarityIdx = -1;
  results.forEach((r, i) => {
    const idx = RARITY_ORDER.indexOf(r.rarity);
    if (idx > maxRarityIdx) { maxRarityIdx = idx; highlightIndex = i; }
  });

  return {
    result: { items: results, highlightIndex, monsterEncounterIds: encounterIds },
    updatedHistory: { ...history, pullCount, ssrPityCount, totalPulls },
  };
}

export const ALL_BANNERS: GachaBanner[] = [
  {
    id: "standard", type: "standard",
    name: "スタンダードガチャ",
    description: "ボール・アイテムが主役。稀にモンスターとのエンカウントも！",
    featuredMonsterIds: [],
    urPityAt: 100, ssrPityAt: 50,
    startAt: new Date("2026-01-01"), endAt: new Date("2099-12-31"),
    isActive: true,
  },
  {
    id: "event_forest", type: "event",
    name: "🌿 フォレストフェスタ",
    description: "forest属性モンスターのエンカウント率UP！ブライトストーンも出やすい。",
    featuredMonsterIds: [1, 2, 3, 36, 37, 66, 67],
    urPityAt: 50, ssrPityAt: 30,
    startAt: new Date("2026-04-01"), endAt: new Date("2026-04-07"),
    isActive: false,
  },
];
