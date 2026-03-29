/**
 * NanoWalk — ゲーム定数 v2.1
 * バランス調整: エリア別レアリティ出現率 / アイテム確率アップ / イベント対応
 */

import type { AreaId, StoneType, RarityType } from "@/types";

// ============================================================
// NanoEnergy (NE)
// ============================================================

export const NE_PER_STEP = 0.01;

export const NE_STEP_BONUSES: { steps: number; bonus: number }[] = [
  { steps: 5_000,  bonus: 10 },
  { steps: 10_000, bonus: 30 },
  { steps: 15_000, bonus: 50 },
];

export const NE_DAILY_CAP = 300;

// ============================================================
// エンカウント確率
// ============================================================

export const BASE_ENCOUNTER_CHANCE = 0.05; // 5% / 1分チェック

export const STEP_MULTIPLIERS: { min: number; max: number; multiplier: number }[] = [
  { min: 0,      max: 2_999,  multiplier: 0.5 },
  { min: 3_000,  max: 6_999,  multiplier: 1.0 },
  { min: 7_000,  max: 9_999,  multiplier: 1.5 },
  { min: 10_000, max: Infinity, multiplier: 2.0 },
];

export const TIME_MULTIPLIERS: { start: number; end: number; multiplier: number; label: string }[] = [
  { start: 5,  end: 8,  multiplier: 1.3, label: "早朝ボーナス" },
  { start: 8,  end: 20, multiplier: 1.0, label: "通常" },
  { start: 20, end: 23, multiplier: 0.8, label: "夜" },
  { start: 23, end: 29, multiplier: 0.5, label: "深夜" },
];

export const WEATHER_MULTIPLIERS: Record<string, number> = {
  sunny:  1.0,
  cloudy: 1.1,
  rainy:  1.5,
  snowy:  2.0,
};

// ============================================================
// エリア別レアリティ出現重み
// ============================================================
// 設計思想:
//   - 序盤エリアはN多め、UR極小
//   - エリアが上がるほど高レアが現実的な確率に
//   - ナノコアはUR/SSRが主役
// ============================================================

export type RarityWeights = Record<RarityType, number>;

export const AREA_RARITY_WEIGHTS: Record<AreaId, RarityWeights> = {
  // 初期エリア: N多め、UR実質なし
  nano_plains: {
    N: 70, R: 22, SR: 7, SSR: 1,   UR: 0,
  },
  // 洞窟: SRが少し出やすくなる
  crystal_cave: {
    N: 60, R: 25, SR: 12, SSR: 2.5, UR: 0.5,
  },
  // 火山: SR・SSR意識し始める
  flare_valley: {
    N: 55, R: 26, SR: 14, SSR: 4,   UR: 1,
  },
  // 深海: SSRが現実的に
  deep_ocean: {
    N: 45, R: 28, SR: 18, SSS: 7,   UR: 2,
  },
  // ジャングル（夜特化）: 夜間はSSR強化
  neon_jungle: {
    N: 40, R: 28, SR: 20, SSR: 9,   UR: 3,
  },
  // 雪山: SSR・UR狙い目
  frost_peak: {
    N: 30, R: 28, SR: 24, SSR: 13,  UR: 5,
  },
  // ナノコア（聖域）: UR・SSRが主役
  nano_core: {
    N: 10, R: 20, SR: 30, SSR: 25,  UR: 15,
  },
};

// deep_oceanのSSS表記ミスを修正するヘルパー
// (TypeScript上でRecord<RarityType,number>を満たすため正規化)
export function getNormalizedWeights(area: AreaId): RarityWeights {
  const raw = AREA_RARITY_WEIGHTS[area] as any;
  return {
    N:   raw.N   ?? 0,
    R:   raw.R   ?? 0,
    SR:  raw.SR  ?? 0,
    SSR: raw.SSR ?? raw.SSS ?? 0,
    UR:  raw.UR  ?? 0,
  };
}

// ============================================================
// ベーススカウト率（レアリティ別）
// ============================================================

export const BASE_SCOUT_RATES: Record<RarityType, number> = {
  N:   0.75,   // N: 75%
  R:   0.50,   // R: 50%
  SR:  0.30,   // SR: 30%
  SSR: 0.20,   // SSR: 20%（エリアが高いとそもそも出現頻度も高い）
  UR:  0.15,   // UR: 15%（ナノコアならそこそこ狙える）
};

// 旧互換
export const BASE_CAPTURE_RATES = BASE_SCOUT_RATES;

// ============================================================
// ボール設定
// ============================================================

export const STONE_CONFIG: Record<StoneType, {
  neCost:     number;
  scoutBonus: number;
  label:      string;
  color:      string;
  emoji:      string;
  description: string;
}> = {
  dull:   {
    neCost: 5,   scoutBonus: 0.00,
    label: "ダルストーン",
    color: "#9090AA", emoji: "🪨",
    description: "くすんだ原石。歩き始めの頃に見つかる。",
  },
  glow:   {
    neCost: 15,  scoutBonus: 0.10,
    label: "グローストーン",
    color: "#00C9A7", emoji: "💎",
    description: "内側からうっすら光る石。歩数エネルギーが宿り始めた証。",
  },
  bright: {
    neCost: 40,  scoutBonus: 0.20,
    label: "ブライトストーン",
    color: "#FFD700", emoji: "✨",
    description: "はっきりと輝く多面体カットの石。ナノンが引き寄せられる温かみのある光。",
  },
  prism:  {
    neCost: 100, scoutBonus: 0.35,
    label: "プリズムストーン",
    color: "#CC44FF", emoji: "🌈",
    description: "虹色に輝く伝説の石。これを差し出されたナノンは拒めないとされる。",
  },
};

// 旧互換
export const BALL_CONFIG = STONE_CONFIG;
export const BALL_SCOUT_BONUS: Record<StoneType, number> = {
  dull: 0, glow: 0.10, bright: 0.20, prism: 0.35,
};


// ============================================================
// アイテム確率アップ設定
// ============================================================

export interface ScoutBoostItem {
  id:          string;
  name:        string;
  rareBoostMin: RarityType;  // このレアリティ以上を底上げ
  boostValue:  number;       // 出現重みに加算する倍率（×）
  duration:    number;       // 分
}

export const SCOUT_BOOST_ITEMS: ScoutBoostItem[] = [
  {
    id: "rare_up_s", name: "キラキラスプレー",
    rareBoostMin: "SR", boostValue: 1.5,  // SR以上の重みを×1.5
    duration: 30,
  },
  {
    id: "rare_up_m", name: "レインボーダスト",
    rareBoostMin: "SR", boostValue: 2.0,  // SR以上の重みを×2.0
    duration: 60,
  },
  {
    id: "ur_scout_ticket", name: "URスカウトチケット",
    rareBoostMin: "UR", boostValue: 5.0,  // URの重みを×5.0
    duration: 30,
  },
];

/**
 * アクティブなアイテム効果を加味してレアリティ重みを調整する
 *
 * @param baseWeights   エリアベースの重み
 * @param activeBoosts  現在有効なブーストアイテム
 */
export function applyItemBoosts(
  baseWeights: RarityWeights,
  activeBoosts: ScoutBoostItem[]
): RarityWeights {
  const result = { ...baseWeights };
  const RARITY_ORDER: RarityType[] = ["N", "R", "SR", "SSR", "UR"];

  for (const boost of activeBoosts) {
    const minIdx = RARITY_ORDER.indexOf(boost.rareBoostMin);
    for (let i = minIdx; i < RARITY_ORDER.length; i++) {
      const r = RARITY_ORDER[i];
      result[r] = result[r] * boost.boostValue;
    }
  }
  return result;
}

// ============================================================
// イベント定義
// ============================================================

export interface ScoutEvent {
  id:          string;
  name:        string;
  description: string;
  startDate:   string;         // ISO date string
  endDate:     string;
  targetMonsterIds?: number[];  // 特定モンスターをピックアップ
  rarityBoost?: Partial<RarityWeights>; // レアリティ重みの加算
  scoutRateBoost?: number;      // スカウト率への加算（全体）
  encounterBoost?: number;      // エンカウント倍率
}

// 実際のイベントはサーバーから取得するが、
// オフライン用のフォールバックイベントを定義
export const DEFAULT_EVENTS: ScoutEvent[] = [
  {
    id: "forest_festa",
    name: "🌿 フォレストフェスタ",
    description: "forest属性モンスターの出現率2倍！",
    startDate: "2026-04-01",
    endDate:   "2026-04-07",
    rarityBoost: { SR: 3, SSR: 2 },
    encounterBoost: 1.5,
    scoutRateBoost: 0.10,
  },
];

/**
 * 現在アクティブなイベントを返す
 */
export function getActiveEvents(events: ScoutEvent[] = DEFAULT_EVENTS): ScoutEvent[] {
  const now = new Date();
  return events.filter((e) => {
    const start = new Date(e.startDate);
    const end   = new Date(e.endDate);
    return now >= start && now <= end;
  });
}

/**
 * イベント効果を加味してレアリティ重みを最終調整
 */
export function applyEventBoosts(
  weights: RarityWeights,
  events: ScoutEvent[]
): RarityWeights {
  const result = { ...weights };
  for (const event of events) {
    if (event.rarityBoost) {
      for (const [r, boost] of Object.entries(event.rarityBoost)) {
        result[r as RarityType] = (result[r as RarityType] ?? 0) + (boost ?? 0);
      }
    }
  }
  return result;
}

// ============================================================
// 最終レアリティ重み計算（全要素統合）
// ============================================================

/**
 * エリア + アイテム + イベントを全て加味した
 * 最終レアリティ出現重みを返す
 */
export function calcFinalRarityWeights(
  area:         AreaId,
  activeBoosts: ScoutBoostItem[] = [],
  events:       ScoutEvent[]     = [],
): RarityWeights {
  const base    = getNormalizedWeights(area);
  const boosted = applyItemBoosts(base, activeBoosts);
  const final   = applyEventBoosts(boosted, events);
  return final;
}

/**
 * 重みテーブルからランダムにレアリティを選ぶ
 */
export function rollRarityFromWeights(weights: RarityWeights): RarityType {
  const entries = Object.entries(weights) as [RarityType, number][];
  const total   = entries.reduce((s, [, w]) => s + w, 0);
  let roll      = Math.random() * total;
  for (const [rarity, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return rarity;
  }
  return "N";
}

// ============================================================
// エリア設定
// ============================================================

export const AREA_CONFIG: Record<AreaId, {
  name:        string;
  unlockSteps: number;
  description: string;
  elementBonus: string[];
  rarityHint:  string;   // UI表示用のレアリティ説明
}> = {
  nano_plains: {
    name: "ナノ草原", unlockSteps: 0,
    description: "初心者向けの広大な草原。N・Rが多く出現。",
    elementBonus: ["forest"],
    rarityHint: "N ★★★★★  R ★★★★☆  SR ★★☆☆☆  SSR ★☆☆☆☆  UR ☆☆☆☆☆",
  },
  crystal_cave: {
    name: "クリスタル洞窟", unlockSteps: 10_000,
    description: "電気と闇が交差する神秘の洞窟。SRが狙えてくる。",
    elementBonus: ["bolt", "shadow"],
    rarityHint: "N ★★★★☆  R ★★★★☆  SR ★★★☆☆  SSR ★★☆☆☆  UR ★☆☆☆☆",
  },
  flare_valley: {
    name: "フレアバレー", unlockSteps: 30_000,
    description: "灼熱の谷。SR・SSRを本格的に狙えるエリア。",
    elementBonus: ["flare", "lumina"],
    rarityHint: "N ★★★★☆  R ★★★★☆  SR ★★★☆☆  SSR ★★★☆☆  UR ★★☆☆☆",
  },
  deep_ocean: {
    name: "ディープオーシャン", unlockSteps: 60_000,
    description: "深海の底。雨天時に特に賑わう。SSRがぐっと近づく。",
    elementBonus: ["aqua"],
    rarityHint: "N ★★★☆☆  R ★★★★☆  SR ★★★★☆  SSR ★★★☆☆  UR ★★☆☆☆",
  },
  neon_jungle: {
    name: "ネオンジャングル", unlockSteps: 100_000,
    description: "夜に輝くジャングル。夜間はSSR率が大幅アップ。",
    elementBonus: ["forest", "shadow"],
    rarityHint: "N ★★★☆☆  R ★★★★☆  SR ★★★★☆  SSR ★★★★☆  UR ★★★☆☆",
  },
  frost_peak: {
    name: "フロストピーク", unlockSteps: 200_000,
    description: "極寒の山頂。SSR・URを本格的に狙えるエリア。",
    elementBonus: ["aqua", "bolt"],
    rarityHint: "N ★★★☆☆  R ★★★☆☆  SR ★★★★☆  SSR ★★★★☆  UR ★★★☆☆",
  },
  nano_core: {
    name: "ナノコア", unlockSteps: 500_000,
    description: "世界の中心。URが最高確率で出現する聖域。",
    elementBonus: ["flare", "aqua", "forest", "bolt", "shadow", "lumina"],
    rarityHint: "N ★★☆☆☆  R ★★★☆☆  SR ★★★★☆  SSR ★★★★★  UR ★★★★★",
  },
};

// ============================================================
// 初期ボール配布（ゲームスタート時）
// ============================================================

export const INITIAL_BALLS: Record<BallType, number> = {
  normal:   30,   // 1週間分
  silver:   5,
  gold:     2,
  platinum: 0,
};

// デイリーボーナス（毎日無料配布）
export const DAILY_BALL_BONUS: Record<BallType, number> = {
  normal:   5,    // 毎日5個
  silver:   0,
  gold:     0,
  platinum: 0,
};

// 週間ボーナス（週1回）
export const WEEKLY_STONE_BONUS: Record<StoneType, number> = {
  dull:   0,
  glow:   3,
  bright: 1,
  prism:  0,
};
export const WEEKLY_BALL_BONUS = WEEKLY_STONE_BONUS;

// ============================================================
// 属性相性（スカウト率への影響を残す）
// ============================================================

export const ELEMENT_EFFECTIVENESS: Record<string, Record<string, number>> = {
  flare:  { forest: 1.5, aqua: 0.6 },
  aqua:   { flare: 1.5,  bolt: 0.6 },
  forest: { bolt: 1.5,   flare: 0.6 },
  bolt:   { aqua: 1.5,   forest: 0.6 },
  shadow: { lumina: 1.5 },
  lumina: { shadow: 1.5 },
};

// ============================================================
// その他定数（後方互換）
// ============================================================

export const BATTLE_TURN_TIMER_SECONDS = 5;  // 旧互換
export const MAX_SP = 5;                      // 旧互換
export const SP_RECOVERY_PER_TURN = 1;        // 旧互換
export const MAX_BOND_LEVEL = 10;
export const HEARTS_PER_BOND_LEVEL = 100;
export const HEARTS_PER_1000_STEPS = 5;

export const RARITY_WEIGHTS = AREA_RARITY_WEIGHTS.nano_plains; // 旧互換

// ============================================================
// アイテムドロップテーブル
// ============================================================

/**
 * フィールド探索中にアイテムを発見する確率（モンスターとは独立）
 * 歩数が多いほど発見しやすい
 */
export const ITEM_DROP_CHANCE_BY_STEPS: { min: number; max: number; chance: number }[] = [
  { min: 0,      max: 2_999,  chance: 0.02 },  // 2%/分
  { min: 3_000,  max: 6_999,  chance: 0.04 },  // 4%/分
  { min: 7_000,  max: 9_999,  chance: 0.06 },  // 6%/分
  { min: 10_000, max: Infinity, chance: 0.08 }, // 8%/分
];

/**
 * アイテムカテゴリ別ドロップ重み
 */
export const ITEM_CATEGORY_WEIGHTS = {
  stone:   55,   // ストーン系 55%
  field:   30,   // フィールドアイテム 30%
  special: 15,   // 特殊アイテム 15%
};

/**
 * ボール種別ドロップ重み
 */
export const STONE_DROP_WEIGHTS: Record<StoneType, number> = {
  dull:   50,
  glow:   30,
  bright: 15,
  prism:  5,
};
export const BALL_DROP_WEIGHTS = STONE_DROP_WEIGHTS;

/**
 * フィールドアイテムドロップテーブル
 * weight: 相対確率、higher = more common
 */
export const FIELD_ITEM_DROP_TABLE: { id: string; weight: number }[] = [
  { id: "stay_extend_s",  weight: 30 },  // おやつ（小）
  { id: "stay_extend_m",  weight: 20 },  // おやつ（中）
  { id: "stay_extend_l",  weight: 8  },  // ごちそう
  { id: "slot_extend_1",  weight: 15 },  // ナノテント
  { id: "slot_extend_2",  weight: 8  },  // ナノキャンプ
  { id: "encounter_up_s", weight: 12 },  // ナノホイッスル
  { id: "encounter_up_m", weight: 7  },  // ナノビーコン
];

/**
 * 特殊アイテムドロップテーブル
 */
export const SPECIAL_ITEM_DROP_TABLE: { id: string; weight: number }[] = [
  { id: "rare_up_s",         weight: 40 },  // キラキラスプレー
  { id: "rare_up_m",         weight: 20 },  // レインボーダスト
  { id: "capture_up_s",      weight: 20 },  // なでなでブラシ
  { id: "capture_up_m",      weight: 10 },  // ナノジャム
  { id: "one_more_chance",   weight: 10 },  // ワンモアチャンス（新）
];

// ============================================================
// スカウト試行設定
// ============================================================

/** 1回のエンカウントで試みられるスカウット回数（通常） */
export const SCOUT_MAX_ATTEMPTS = 2;

/** ワンモアチャンスアイテム使用時の追加試行回数 */
export const SCOUT_ONE_MORE_CHANCE_BONUS = 1;

/** モンスター固有捕獲難易度（レアリティ別レンジ） */
export const CAPTURE_DIFFICULTY_RANGE: Record<RarityType, [number, number]> = {
  N:   [0.65, 0.80],
  R:   [0.40, 0.55],
  SR:  [0.20, 0.35],
  SSR: [0.10, 0.20],
  UR:  [0.05, 0.15],
};
