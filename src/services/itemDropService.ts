/**
 * NanoWalk — アイテムドロップサービス
 *
 * フィールド探索中にアイテムを発見する処理。
 * モンスターエンカウントとは独立して判定される。
 */

import {
  ITEM_DROP_CHANCE_BY_STEPS,
  ITEM_CATEGORY_WEIGHTS,
  STONE_DROP_WEIGHTS,
  FIELD_ITEM_DROP_TABLE,
  SPECIAL_ITEM_DROP_TABLE,
} from "@/constants/game";
import type { StoneType } from "@/types";

// ---- ドロップ確率計算 ----

export function getItemDropChance(todaySteps: number): number {
  const entry = [...ITEM_DROP_CHANCE_BY_STEPS]
    .reverse()
    .find((e) => todaySteps >= e.min);
  return entry?.chance ?? 0.02;
}

export function shouldDropItem(todaySteps: number): boolean {
  return Math.random() < getItemDropChance(todaySteps);
}

// ---- ドロップアイテム決定 ----

export type DroppedItem =
  | { kind: "stone"; stoneType: StoneType; quantity: number }
  | { kind: "field"; itemId: string; quantity: number }
  | { kind: "special"; itemId: string; quantity: number };

function rollFromTable(table: { id: string; weight: number }[]): string {
  const total = table.reduce((s, t) => s + t.weight, 0);
  let roll = Math.random() * total;
  for (const entry of table) {
    roll -= entry.weight;
    if (roll <= 0) return entry.id;
  }
  return table[0].id;
}

export function rollDroppedItem(): DroppedItem {
  // カテゴリ抽選
  const catTotal =
    ITEM_CATEGORY_WEIGHTS.ball +
    ITEM_CATEGORY_WEIGHTS.field +
    ITEM_CATEGORY_WEIGHTS.special;
  let catRoll = Math.random() * catTotal;

  // ---- ボール ----
  catRoll -= ITEM_CATEGORY_WEIGHTS.ball;
  if (catRoll <= 0) {
    const ballTotal = Object.values(STONE_DROP_WEIGHTS).reduce((s, w) => s + w, 0);
    let ballRoll = Math.random() * ballTotal;
    for (const [bt, w] of Object.entries(STONE_DROP_WEIGHTS) as [BallType, number][]) {
      ballRoll -= w;
      if (ballRoll <= 0) {
        return { kind: "ball", ballType: bt, quantity: bt === "normal" ? 3 : 1 };
      }
    }
    return { kind: "ball", ballType: "normal", quantity: 3 };
  }

  // ---- フィールドアイテム ----
  catRoll -= ITEM_CATEGORY_WEIGHTS.field;
  if (catRoll <= 0) {
    const id = rollFromTable(FIELD_ITEM_DROP_TABLE);
    return { kind: "field", itemId: id, quantity: 1 };
  }

  // ---- 特殊アイテム ----
  const id = rollFromTable(SPECIAL_ITEM_DROP_TABLE);
  return { kind: "special", itemId: id, quantity: 1 };
}

// ---- ドロップ結果の表示用テキスト ----

export function getDropDisplayInfo(drop: DroppedItem): {
  emoji: string;
  name:  string;
  qty:   number;
} {
  if (drop.kind === "stone") {
    const names: Record<StoneType, string> = {
      dull: "ダルストーン", glow: "グローストーン",
      bright: "ブライトストーン", prism: "プリズムストーン",
    };
    const emojis: Record<StoneType, string> = {
      dull: "🪨", glow: "💎", bright: "✨", prism: "🌈",
    };
    return { emoji: emojis[drop.stoneType], name: names[drop.stoneType], qty: drop.quantity };
  }
  const fieldNames: Record<string, [string, string]> = {
    stay_extend_s:  ["🍪", "おやつ（小）"],
    stay_extend_m:  ["🍰", "おやつ（中）"],
    stay_extend_l:  ["🍽", "ごちそう"],
    slot_extend_1:  ["⛺", "ナノテント"],
    slot_extend_2:  ["🏕", "ナノキャンプ"],
    encounter_up_s: ["🎵", "ナノホイッスル"],
    encounter_up_m: ["📡", "ナノビーコン"],
    rare_up_s:      ["✨", "キラキラスプレー"],
    rare_up_m:      ["🌈", "レインボーダスト"],
    scout_brush:    ["🪮", "なでなでブラシ"],
    scout_jam:      ["🫙", "ナノジャム"],
    guiding_stone:  ["🪨", "みちびきの石"],
  };
  const id = drop.kind === "field" ? drop.itemId : drop.itemId;
  const info = fieldNames[id] ?? ["🎁", id];
  return { emoji: info[0], name: info[1], qty: drop.quantity };
}
