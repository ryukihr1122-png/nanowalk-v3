/**
 * NanoWalk — 型定義 v3.0
 * コレクション特化 + ナノストーン + アイテム再設計 + 装備システム
 */

// ============================================================
// 基本型
// ============================================================

export type RarityType = "N" | "R" | "SR" | "SSR" | "UR";
export type WeatherType = "sunny" | "cloudy" | "rainy" | "windy" | "foggy" | "stormy";
export type AreaId =
  | "nano_plains"
  | "crystal_cave"
  | "flare_valley"
  | "deep_ocean"
  | "neon_jungle"
  | "frost_peak"
  | "nano_core";

export type ElementType =
  | "forest" | "aqua" | "flare" | "bolt" | "shadow" | "lumina";

// ストーン（旧ボール）
export type StoneType = "dull" | "glow" | "bright" | "prism";
export type BallType = StoneType; // 旧互換エイリアス

// ============================================================
// アイテム
// ============================================================

export type ItemCategory =
  | "stone"    // ストーン系
  | "field"    // フィールド系（持続時間・キュー制）
  | "scout"    // スカウト系（エンカウント回数消費）
  | "boost"    // ブースト系（持続時間）
  | "special"  // 特殊（複合効果）
  | "gear";    // 装備系（永続・相棒装備）

export type ItemEffectType =
  | "stay_time_extend"    // 滞在時間延長（倍率）
  | "stay_slot_extend"    // 滞在スロット増加（入室回数消費）
  | "encounter_rate_up"   // エンカウント率UP（倍率）
  | "rare_rate_up"        // SR以上出現率UP（倍率）
  | "scout_rate_up"       // スカウト成功率UP（加算%）
  | "scout_rate_up_elem"  // 属性特効スカウト率UP（加算%）
  | "scout_extra_try"     // 試行回数+1（みちびきの石）
  | "scout_no_penalty"    // 逃走ペナルティ無効（ナノシールド）
  | "ne_boost"            // NE獲得倍率UP
  | "step_multiplier"     // 歩数→NE換算効率UP
  | "all_boost"           // 全効果×N（スーパーマグネット）
  // 装備パッシブ
  | "gear_scout_up"       // 装備：スカウト率+N%（永続）
  | "gear_ne_up"          // 装備：NE効率+N%（永続）
  | "gear_encounter_up"   // 装備：エンカウント率+N%（永続）
  | "gear_bond_up";       // 装備：絆EXP+N%（永続）

export type ConsumeType =
  | "duration"   // 持続時間（分）で消費
  | "encounter"  // エンカウント回数で消費
  | "entrance"   // スロット：ナノン入室回数で消費
  | "once"       // 1回使い切り（スカウト画面で即時）
  | "passive";   // 装備中は常時有効（消費しない）

export interface ItemDefinition {
  id:            string;
  name:          string;
  description:   string;
  emoji:         string;
  category:      ItemCategory;
  effectType:    ItemEffectType;
  effectValue:   number;          // 倍率 or 加算値
  targetElement?: ElementType;    // scout_rate_up_elem 専用
  consumeType:   ConsumeType;
  consumeAmount: number;          // duration=分数 / encounter=回数 / entrance=入室数 / once=1
  stackLimit:    number;          // 所持上限
  queueable:     boolean;         // フィールド系：キュー積み可能か
  rarity:        "common" | "uncommon" | "rare" | "epic";
  // 装備スロット（gear のみ）
  gearSlot?:     "omamori" | "gofuku" | "accessory";
}

// インベントリ
export interface InventoryItem {
  itemId:    string;
  quantity:  number;
}

// アクティブ効果（適用中のフィールド/ブースト系）
export interface ActiveEffect {
  itemId:      string;
  effectType:  ItemEffectType;
  effectValue: number;
  expiresAt?:  Date;           // duration系
  usesLeft?:   number;         // encounter/entrance系
}

// 装備スロット（相棒モンスターに装備）
export type GearSlotType = "omamori" | "gofuku" | "accessory";

export interface EquippedGear {
  omamori?:   string;   // itemId
  gofuku?:    string;   // itemId
  accessory?: string;   // itemId
}

// ============================================================
// モンスター定義
// ============================================================

export type TraitTrigger =
  | "on_own"         // 所持中に常時発動
  | "on_field"       // フィールド探索中
  | "on_scout"       // スカウット中
  | "on_catch"       // 捕獲成功時
  | "companion";     // 相棒時のみ

export type TraitEffect =
  | "scout_rate_up"
  | "ne_gain_up"
  | "rare_rate_up"
  | "encounter_up"
  | "stone_save";    // ストーン消費しないことがある

export interface MonsterTrait {
  id:          string;
  name:        string;
  description: string;
  trigger:     TraitTrigger;
  effect:      TraitEffect;
  value:       number;
  unlockLevel: number;
}

export interface MonsterDefinition {
  id:            number;
  name:          string;
  element:       ElementType;
  rarity:        RarityType;
  description:   string;
  spriteUrl:     string;
  baseScoutRate: number;
  captureRate:   number;         // 旧互換
  maxLevel:      number;
  favoriteAreas:   AreaId[];
  favoriteWeather: WeatherType[];
  traits:        MonsterTrait[];
  evolvesFrom?:    number;
  evolvesTo?:      number;
  evolutionLevel?: number;
}

// ============================================================
// 所持モンスター
// ============================================================

export interface OwnedMonster {
  uuid:           string;
  definitionId:   number;
  nickname?:      string;
  level:          number;        // = 所持枚数
  capturedAt:     Date;
  lastCapturedAt: Date;
  caughtInArea:   AreaId;
  isFavorite:     boolean;
  gear?:          EquippedGear;  // 相棒装備スロット
}

// ============================================================
// プレイヤー
// ============================================================

export interface Player {
  id:           string;
  username:     string;
  createdAt:    Date;
  nanoEnergy:   number;
  nanoGems:     number;
  totalSteps:   bigint | number;
  todaySteps:   number;
  lastStepSync: Date;
  currentArea:  AreaId;
  companionId?: string;           // OwnedMonster.uuid
  stones:       Record<StoneType, number>;
  items:        InventoryItem[];
  activeEffects: ActiveEffect[];  // 現在有効中の効果
  fieldQueue:   ActiveEffect[];   // フィールド系キュー（待機中）
}

// ============================================================
// スカウト
// ============================================================

export type MiniGameType = "tap_timing" | "slider" | "dice" | "card";

export type ScoutResult =
  | { type: "success";  monster: MonsterDefinition; newLevel: number; traitUnlocked?: MonsterTrait; ballConsumed: boolean }
  | { type: "level_up"; monster: MonsterDefinition; newLevel: number; traitUnlocked?: MonsterTrait; evolved?: MonsterDefinition; ballConsumed: boolean }
  | { type: "fail";     monster: MonsterDefinition; ballConsumed: boolean }
  | { type: "escape";   monster: MonsterDefinition; ballConsumed: boolean };

// 旧互換エイリアス
export type Trait = MonsterTrait;

// ============================================================
// エンカウントカード
// ============================================================

export interface EncounterCard {
  id:          string;
  monsterId:   number;
  area:        AreaId;
  weather:     WeatherType;
  expiresAt:   Date;
  isBoss?:     boolean;
}

// ============================================================
// ガチャ
// ============================================================

export interface GachaResult {
  items:       GachaResultItem[];
  totalCost:   number;
  pullCount:   number;
}

export type GachaResultItem =
  | { kind: "stone";   stoneType: string;  rarity: RarityType; qty: number }
  | { kind: "item";    itemId:    string;  rarity: RarityType; qty: number }
  | { kind: "monster"; monsterId: number;  rarity: RarityType };

// ============================================================
// 互換エクスポート
// ============================================================

export const STONE_SCOUT_BONUS: Record<StoneType, number> = {
  dull: 0, glow: 0.10, bright: 0.20, prism: 0.35,
};
export const BALL_SCOUT_BONUS = STONE_SCOUT_BONUS;

// NanoCore 型
export type NanoCore = {
  definitionId: number;
  quantity: number;
};

// ============================================================
// ゲームバランス定数
// ============================================================

export const MAX_LEVEL_BY_RARITY: Record<RarityType, number> = {
  N: 5, R: 10, SR: 15, SSR: 20, UR: 30,
};

export const WEATHER_BONUS      = 0.05;
export const AREA_ELEMENT_BONUS = 0.05;
export const MINI_GAME_MIN      = 0.5;
export const MINI_GAME_MAX      = 2.0;
