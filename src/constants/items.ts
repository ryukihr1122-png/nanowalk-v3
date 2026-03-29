/**
 * NanoWalk — アイテム定義 v3.0
 *
 * 消費タイプ:
 *   duration  — 持続時間（分）。フィールド系はキュー制（前が切れたら自動消費）
 *   encounter — エンカウント回数消費。スカウト系
 *   entrance  — スロット系。ナノン入室回数で消費（時間ではない）
 *   once      — スカウット画面で1回使い切り
 *   passive   — 装備中は常時有効。消費しない
 */

import type { ItemDefinition } from "@/types";

export type { ItemCategory, ItemEffectType, ConsumeType } from "@/types";

export const ITEM_DEFINITIONS: Record<string, ItemDefinition> = {

  // ================================================================
  // フィールド系（持続時間消費・キュー制）
  // ================================================================

  stay_extend_s: {
    id: "stay_extend_s", name: "おやつ（小）", emoji: "🍪",
    description: "モンスターの滞在時間を1.5倍に延長（30分）。キュー積み可能。",
    category: "field", effectType: "stay_time_extend", effectValue: 1.5,
    consumeType: "duration", consumeAmount: 30,
    stackLimit: 10, queueable: true, rarity: "common",
  },
  stay_extend_m: {
    id: "stay_extend_m", name: "おやつ（中）", emoji: "🍰",
    description: "モンスターの滞在時間を2倍に延長（60分）。キュー積み可能。",
    category: "field", effectType: "stay_time_extend", effectValue: 2.0,
    consumeType: "duration", consumeAmount: 60,
    stackLimit: 5, queueable: true, rarity: "uncommon",
  },
  stay_extend_l: {
    id: "stay_extend_l", name: "ごちそう", emoji: "🍖",
    description: "モンスターの滞在時間を3倍に延長（120分）。URにも有効。キュー積み可能。",
    category: "field", effectType: "stay_time_extend", effectValue: 3.0,
    consumeType: "duration", consumeAmount: 120,
    stackLimit: 3, queueable: true, rarity: "rare",
  },
  encounter_up_s: {
    id: "encounter_up_s", name: "ナノホイッスル", emoji: "📯",
    description: "エンカウント確率を1.5倍にする（30分）。キュー積み可能。",
    category: "field", effectType: "encounter_rate_up", effectValue: 1.5,
    consumeType: "duration", consumeAmount: 30,
    stackLimit: 10, queueable: true, rarity: "common",
  },
  encounter_up_m: {
    id: "encounter_up_m", name: "ナノビーコン", emoji: "🔦",
    description: "エンカウント確率を2倍にする（60分）。キュー積み可能。",
    category: "field", effectType: "encounter_rate_up", effectValue: 2.0,
    consumeType: "duration", consumeAmount: 60,
    stackLimit: 5, queueable: true, rarity: "uncommon",
  },
  rare_up_s: {
    id: "rare_up_s", name: "キラキラスプレー", emoji: "✨",
    description: "SR以上の出現率を1.5倍にする（30分）。キュー積み可能。",
    category: "field", effectType: "rare_rate_up", effectValue: 1.5,
    consumeType: "duration", consumeAmount: 30,
    stackLimit: 5, queueable: true, rarity: "rare",
  },
  rare_up_m: {
    id: "rare_up_m", name: "レインボーダスト", emoji: "🌈",
    description: "SR以上の出現率を2倍にする（60分）。キュー積み可能。",
    category: "field", effectType: "rare_rate_up", effectValue: 2.0,
    consumeType: "duration", consumeAmount: 60,
    stackLimit: 3, queueable: true, rarity: "epic",
  },

  // スロット系（入室回数消費・時間ではない）
  slot_extend_1: {
    id: "slot_extend_1", name: "ナノテント", emoji: "⛺",
    description: "滞在スロット+1増加。ナノン1体が入室した時点で消費。入室したナノンは逃げない。",
    category: "field", effectType: "stay_slot_extend", effectValue: 1,
    consumeType: "entrance", consumeAmount: 1,
    stackLimit: 5, queueable: false, rarity: "uncommon",
  },
  slot_extend_2: {
    id: "slot_extend_2", name: "ナノキャンプ", emoji: "🏕️",
    description: "滞在スロット+2増加。ナノン2体が入室した時点で消費。入室したナノンは逃げない。",
    category: "field", effectType: "stay_slot_extend", effectValue: 2,
    consumeType: "entrance", consumeAmount: 2,
    stackLimit: 3, queueable: false, rarity: "rare",
  },

  // ================================================================
  // スカウト系（エンカウント回数消費）
  // ================================================================

  // 汎用スカウト率UP
  scout_brush: {
    id: "scout_brush", name: "なでなでブラシ", emoji: "🪮",
    description: "スカウト成功率+20%（1エンカウント消費）。",
    category: "scout", effectType: "scout_rate_up", effectValue: 0.20,
    consumeType: "once", consumeAmount: 1,
    stackLimit: 10, queueable: false, rarity: "common",
  },
  scout_jam: {
    id: "scout_jam", name: "ナノジャム", emoji: "🫙",
    description: "スカウト成功率+35%（1エンカウント消費）。",
    category: "scout", effectType: "scout_rate_up", effectValue: 0.35,
    consumeType: "once", consumeAmount: 1,
    stackLimit: 5, queueable: false, rarity: "rare",
  },

  // みちびきの石（旧：ワンモアチャンス）
  guiding_stone: {
    id: "guiding_stone", name: "みちびきの石", emoji: "🪨",
    description: "スカウット失敗時に試行回数を1回追加する。道に迷ったナノンを呼び戻す石。",
    category: "scout", effectType: "scout_extra_try", effectValue: 1,
    consumeType: "once", consumeAmount: 1,
    stackLimit: 5, queueable: false, rarity: "rare",
  },

  // ナノシールド（逃走ペナルティ無効）
  nano_shield: {
    id: "nano_shield", name: "ナノシールド", emoji: "🛡️",
    description: "スカウット失敗してもナノンが逃走しない（1エンカウント）。",
    category: "scout", effectType: "scout_no_penalty", effectValue: 0,
    consumeType: "once", consumeAmount: 1,
    stackLimit: 5, queueable: false, rarity: "uncommon",
  },

  // UR専用
  ur_compass: {
    id: "ur_compass", name: "URコンパス", emoji: "⭐",
    description: "UR限定のスカウト成功率を+50%アップ（1エンカウント消費）。",
    category: "scout", effectType: "scout_rate_up", effectValue: 0.50,
    consumeType: "once", consumeAmount: 1,
    stackLimit: 3, queueable: false, rarity: "epic",
  },

  // 属性特効（6属性）
  elem_forest: {
    id: "elem_forest", name: "フォレストバーム", emoji: "🌿",
    description: "フォレスト属性ナノンへのスカウト成功率+40%（1エンカウント）。",
    category: "scout", effectType: "scout_rate_up_elem", effectValue: 0.40,
    targetElement: "forest",
    consumeType: "once", consumeAmount: 1,
    stackLimit: 5, queueable: false, rarity: "uncommon",
  },
  elem_aqua: {
    id: "elem_aqua", name: "アクアジェル", emoji: "💧",
    description: "アクア属性ナノンへのスカウト成功率+40%（1エンカウント）。",
    category: "scout", effectType: "scout_rate_up_elem", effectValue: 0.40,
    targetElement: "aqua",
    consumeType: "once", consumeAmount: 1,
    stackLimit: 5, queueable: false, rarity: "uncommon",
  },
  elem_flare: {
    id: "elem_flare", name: "フレアソルト", emoji: "🔥",
    description: "フレア属性ナノンへのスカウト成功率+40%（1エンカウント）。",
    category: "scout", effectType: "scout_rate_up_elem", effectValue: 0.40,
    targetElement: "flare",
    consumeType: "once", consumeAmount: 1,
    stackLimit: 5, queueable: false, rarity: "uncommon",
  },
  elem_bolt: {
    id: "elem_bolt", name: "ボルトチップ", emoji: "⚡",
    description: "ボルト属性ナノンへのスカウト成功率+40%（1エンカウント）。",
    category: "scout", effectType: "scout_rate_up_elem", effectValue: 0.40,
    targetElement: "bolt",
    consumeType: "once", consumeAmount: 1,
    stackLimit: 5, queueable: false, rarity: "uncommon",
  },
  elem_shadow: {
    id: "elem_shadow", name: "シャドウクリスタル", emoji: "🌑",
    description: "シャドウ属性ナノンへのスカウト成功率+40%（1エンカウント）。",
    category: "scout", effectType: "scout_rate_up_elem", effectValue: 0.40,
    targetElement: "shadow",
    consumeType: "once", consumeAmount: 1,
    stackLimit: 5, queueable: false, rarity: "uncommon",
  },
  elem_lumina: {
    id: "elem_lumina", name: "ルミナパウダー", emoji: "🌟",
    description: "ルミナ属性ナノンへのスカウト成功率+40%（1エンカウント）。",
    category: "scout", effectType: "scout_rate_up_elem", effectValue: 0.40,
    targetElement: "lumina",
    consumeType: "once", consumeAmount: 1,
    stackLimit: 5, queueable: false, rarity: "uncommon",
  },

  // ================================================================
  // ブースト系（持続時間消費）
  // ================================================================

  ne_boost_s: {
    id: "ne_boost_s", name: "エナジードリンク（小）", emoji: "🥤",
    description: "NE獲得量を1.5倍にする（30分）。",
    category: "boost", effectType: "ne_boost", effectValue: 1.5,
    consumeType: "duration", consumeAmount: 30,
    stackLimit: 10, queueable: false, rarity: "common",
  },
  ne_boost_m: {
    id: "ne_boost_m", name: "エナジードリンク（大）", emoji: "⚡",
    description: "NE獲得量を2倍にする（60分）。",
    category: "boost", effectType: "ne_boost", effectValue: 2.0,
    consumeType: "duration", consumeAmount: 60,
    stackLimit: 5, queueable: false, rarity: "uncommon",
  },
  step_multiplier_s: {
    id: "step_multiplier_s", name: "ナノシューズ", emoji: "👟",
    description: "歩数→NE換算効率を1.5倍にする（60分）。",
    category: "boost", effectType: "step_multiplier", effectValue: 1.5,
    consumeType: "duration", consumeAmount: 60,
    stackLimit: 5, queueable: false, rarity: "uncommon",
  },
  step_multiplier_m: {
    id: "step_multiplier_m", name: "スーパーナノシューズ", emoji: "🥿",
    description: "歩数→NE換算効率を2倍にする（120分）。",
    category: "boost", effectType: "step_multiplier", effectValue: 2.0,
    consumeType: "duration", consumeAmount: 120,
    stackLimit: 3, queueable: false, rarity: "rare",
  },

  // ================================================================
  // 特殊系
  // ================================================================

  super_magnet: {
    id: "super_magnet", name: "スーパーマグネット", emoji: "🧲",
    description: "エンカウント・NE・スカウト率、すべての効果を1.5倍（30分）。",
    category: "special", effectType: "all_boost", effectValue: 1.5,
    consumeType: "duration", consumeAmount: 30,
    stackLimit: 3, queueable: false, rarity: "epic",
  },

  // ================================================================
  // 装備系（gear）— 相棒ナノンに装備。永続パッシブ効果。
  // スロット: omamori（お守り）/ gofuku（護符）/ accessory（装飾品）
  // ================================================================

  // ── お守り（omamori）: スカウト関連 ──
  gear_nano_orb: {
    id: "gear_nano_orb", name: "ナノオーブ", emoji: "🔵",
    description: "【お守り】相棒のスカウト成功率+5%（永続パッシブ）。",
    category: "gear", effectType: "gear_scout_up", effectValue: 0.05,
    gearSlot: "omamori",
    consumeType: "passive", consumeAmount: 0,
    stackLimit: 1, queueable: false, rarity: "uncommon",
  },
  gear_crystal_orb: {
    id: "gear_crystal_orb", name: "クリスタルオーブ", emoji: "🔮",
    description: "【お守り】相棒のスカウト成功率+10%（永続パッシブ）。ナノオーブの上位版。",
    category: "gear", effectType: "gear_scout_up", effectValue: 0.10,
    gearSlot: "omamori",
    consumeType: "passive", consumeAmount: 0,
    stackLimit: 1, queueable: false, rarity: "rare",
  },
  gear_prism_orb: {
    id: "gear_prism_orb", name: "プリズムオーブ", emoji: "🌈",
    description: "【お守り】相棒のスカウト成功率+18%（永続パッシブ）。虹色に輝く最高位のお守り。",
    category: "gear", effectType: "gear_scout_up", effectValue: 0.18,
    gearSlot: "omamori",
    consumeType: "passive", consumeAmount: 0,
    stackLimit: 1, queueable: false, rarity: "epic",
  },

  // ── 護符（gofuku）: エンカウント・歩数関連 ──
  gear_walker_boots: {
    id: "gear_walker_boots", name: "ウォーカーの護符", emoji: "🥾",
    description: "【護符】歩数→NE換算効率+8%（永続パッシブ）。歩けば歩くほど恩恵を受ける。",
    category: "gear", effectType: "gear_ne_up", effectValue: 0.08,
    gearSlot: "gofuku",
    consumeType: "passive", consumeAmount: 0,
    stackLimit: 1, queueable: false, rarity: "uncommon",
  },
  gear_nano_crown: {
    id: "gear_nano_crown", name: "ナノクラウンの護符", emoji: "👑",
    description: "【護符】エンカウント率+5%（永続パッシブ）。ナノンを引き寄せる護符。",
    category: "gear", effectType: "gear_encounter_up", effectValue: 0.05,
    gearSlot: "gofuku",
    consumeType: "passive", consumeAmount: 0,
    stackLimit: 1, queueable: false, rarity: "uncommon",
  },
  gear_explorer_seal: {
    id: "gear_explorer_seal", name: "エクスプローラーの護符", emoji: "🗺️",
    description: "【護符】エンカウント率+12%（永続パッシブ）。伝説の探索者が刻んだ護符。",
    category: "gear", effectType: "gear_encounter_up", effectValue: 0.12,
    gearSlot: "gofuku",
    consumeType: "passive", consumeAmount: 0,
    stackLimit: 1, queueable: false, rarity: "rare",
  },

  // ── 装飾品（accessory）: 絆関連 ──
  gear_nano_bracelet: {
    id: "gear_nano_bracelet", name: "ナノブレスレット", emoji: "📿",
    description: "【装飾品】相棒との絆EXP獲得+10%（永続パッシブ）。",
    category: "gear", effectType: "gear_bond_up", effectValue: 0.10,
    gearSlot: "accessory",
    consumeType: "passive", consumeAmount: 0,
    stackLimit: 1, queueable: false, rarity: "uncommon",
  },
  gear_bond_crystal: {
    id: "gear_bond_crystal", name: "絆のクリスタル", emoji: "💎",
    description: "【装飾品】相棒との絆EXP獲得+20%（永続パッシブ）。深い絆が結晶化したもの。",
    category: "gear", effectType: "gear_bond_up", effectValue: 0.20,
    gearSlot: "accessory",
    consumeType: "passive", consumeAmount: 0,
    stackLimit: 1, queueable: false, rarity: "rare",
  },
  gear_eternal_charm: {
    id: "gear_eternal_charm", name: "エターナルチャーム", emoji: "✨",
    description: "【装飾品】スカウト率+8% & 絆EXP+8%（永続パッシブ複合効果）。",
    category: "gear", effectType: "gear_scout_up", effectValue: 0.08,
    gearSlot: "accessory",
    consumeType: "passive", consumeAmount: 0,
    stackLimit: 1, queueable: false, rarity: "epic",
  },
};

// ================================================================
// ユーティリティ
// ================================================================

export function getItem(id: string): ItemDefinition | undefined {
  return ITEM_DEFINITIONS[id];
}

export function getItemsByCategory(cat: string): ItemDefinition[] {
  return Object.values(ITEM_DEFINITIONS).filter((i) => i.category === cat);
}

export function getGearItems(): ItemDefinition[] {
  return Object.values(ITEM_DEFINITIONS).filter((i) => i.category === "gear");
}

export function getItemsBySlot(slot: string): ItemDefinition[] {
  return Object.values(ITEM_DEFINITIONS).filter((i) => i.gearSlot === slot);
}

/** フィールド系アイテム（キュー制）のIDリスト */
export const QUEUEABLE_ITEM_IDS: string[] = Object.values(ITEM_DEFINITIONS)
  .filter((i) => i.queueable)
  .map((i) => i.id);

/** 装備スロット表示名 */
export const GEAR_SLOT_LABEL: Record<string, string> = {
  omamori:   "お守り",
  gofuku:    "護符",
  accessory: "装飾品",
};

export type ItemCategory = import("@/types").ItemCategory;
