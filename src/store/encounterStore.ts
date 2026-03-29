/**
 * NanoWalk — エンカウントストア v2.1
 *
 * ホーム画面のカードキューを管理する。
 * - モンスターカード（スカウト待ち）
 * - アイテム発見カード
 * - スカウット試行回数の管理
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { MonsterDefinition, AreaId, WeatherType, BallType } from "@/types";
import type { DroppedItem } from "@/services/itemDropService";

// ============================================================
// 型定義
// ============================================================

export interface MonsterEncounterCard {
  kind:        "monster";
  id:          string;
  monsterId:   number;
  area:        AreaId;
  weather:     WeatherType;
  timestamp:   string;         // ISO
  attemptsLeft: number;        // 残りスカウット試行回数（通常2）
  captureRate: number;         // モンスター固有の捕獲難易度（0〜1）
  expiresAt:   string;         // ISO: この時刻を過ぎると逃走
}

export interface ItemFoundCard {
  kind:      "item";
  id:        string;
  drop:      DroppedItem;
  area:      AreaId;
  timestamp: string;
  collected: boolean;
}

export type EncounterCard = MonsterEncounterCard | ItemFoundCard;

// ============================================================
// ストア
// ============================================================

interface EncounterStore {
  cards: EncounterCard[];
  maxCards: number;            // 最大カード枚数（デフォルト10）

  // カード追加
  addMonsterCard: (
    monster: MonsterDefinition,
    area: AreaId,
    weather: WeatherType
  ) => void;
  addItemCard: (drop: DroppedItem, area: AreaId) => void;

  // スカウット操作
  consumeAttempt: (cardId: string) => void;   // 試行回数を1減らす
  addAttempt:     (cardId: string) => void;   // ワンモアチャンス
  removeCard:     (cardId: string) => void;   // 成功・逃走で削除

  // アイテム回収
  collectItem: (cardId: string) => DroppedItem | null;

  // 期限切れカードの自動削除
  purgeExpiredCards: () => void;

  // 全クリア（デバッグ用）
  clearAll: () => void;
}

// ============================================================
// 捕獲難易度計算
// ============================================================
import { CAPTURE_DIFFICULTY_RANGE } from "@/constants/game";

function rollCaptureRate(rarity: MonsterDefinition["rarity"]): number {
  const [min, max] = CAPTURE_DIFFICULTY_RANGE[rarity];
  return min + Math.random() * (max - min);
}

// モンスターカードの有効期間（分）
const MONSTER_CARD_EXPIRE_MINUTES: Record<string, number> = {
  N:   30,    // Nは30分で逃げる
  R:   60,    // Rは1時間
  SR:  120,   // SRは2時間
  SSR: 360,   // SSRは6時間
  UR:  720,   // URは12時間
};

function makeId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

// ============================================================
// Store
// ============================================================

export const useEncounterStore = create<EncounterStore>()(
  persist(
    (set, get) => ({
      cards:    [],
      maxCards: 10,

      addMonsterCard: (monster, area, weather) => {
        const { cards, maxCards } = get();
        // 同じモンスターが既にキューにある場合はスキップ
        const duplicate = cards.some(
          (c) => c.kind === "monster" && (c as MonsterEncounterCard).monsterId === monster.id
        );
        if (duplicate) return;
        if (cards.length >= maxCards) return;

        const expireMin = MONSTER_CARD_EXPIRE_MINUTES[monster.rarity] ?? 60;
        const expiresAt = new Date(Date.now() + expireMin * 60 * 1000).toISOString();

        const card: MonsterEncounterCard = {
          kind:          "monster",
          id:            makeId(),
          monsterId:     monster.id,
          area,
          weather,
          timestamp:     new Date().toISOString(),
          attemptsLeft:  2,           // 通常2回
          captureRate:   rollCaptureRate(monster.rarity),
          expiresAt,
        };
        set((s) => ({ cards: [card, ...s.cards] }));
      },

      addItemCard: (drop, area) => {
        const { cards, maxCards } = get();
        if (cards.length >= maxCards) return;
        const card: ItemFoundCard = {
          kind:      "item",
          id:        makeId(),
          drop,
          area,
          timestamp: new Date().toISOString(),
          collected: false,
        };
        set((s) => ({ cards: [card, ...s.cards] }));
      },

      consumeAttempt: (cardId) =>
        set((s) => ({
          cards: s.cards.map((c) =>
            c.kind === "monster" && c.id === cardId
              ? { ...c, attemptsLeft: Math.max(0, (c as MonsterEncounterCard).attemptsLeft - 1) }
              : c
          ),
        })),

      addAttempt: (cardId) =>
        set((s) => ({
          cards: s.cards.map((c) =>
            c.kind === "monster" && c.id === cardId
              ? { ...c, attemptsLeft: (c as MonsterEncounterCard).attemptsLeft + 1 }
              : c
          ),
        })),

      removeCard: (cardId) =>
        set((s) => ({ cards: s.cards.filter((c) => c.id !== cardId) })),

      collectItem: (cardId) => {
        const { cards } = get();
        const card = cards.find((c) => c.kind === "item" && c.id === cardId) as ItemFoundCard | undefined;
        if (!card || card.collected) return null;
        set((s) => ({
          cards: s.cards.map((c) =>
            c.id === cardId ? { ...c, collected: true } : c
          ),
        }));
        // 収集済みカードは1分後に自動削除
        setTimeout(() => {
          get().removeCard(cardId);
        }, 60_000);
        return card.drop;
      },

      purgeExpiredCards: () => {
        const now = Date.now();
        set((s) => ({
          cards: s.cards.filter((c) => {
            if (c.kind !== "monster") return true;
            return new Date((c as MonsterEncounterCard).expiresAt).getTime() > now;
          }),
        }));
      },

      clearAll: () => set({ cards: [] }),
    }),
    {
      name:    "nanowalk-encounter-v2",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
