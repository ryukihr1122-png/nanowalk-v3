/**
 * NanoWalk — アイテム & アクティブ効果ストア
 *
 * - inventory: 所持アイテム（id → 個数）
 * - activeEffects: 現在発動中の効果リスト
 * - useItem(): アイテム使用 → effectsに追加
 * - getMultiplier(): 特定効果タイプの現在の合成倍率を返す
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getItem, type ItemEffectType } from "@/constants/items";

export interface ActiveEffect {
  id: string;            // ユニークID（同種複数を区別）
  itemId: string;
  effectType: ItemEffectType;
  effectValue: number;
  expiresAt: string;     // ISO string
  isSuperMagnet?: boolean;
}

interface ItemStore {
  inventory: Record<string, number>;   // itemId → quantity
  activeEffects: ActiveEffect[];

  // Inventory
  addItem:    (itemId: string, qty?: number) => void;
  removeItem: (itemId: string, qty?: number) => boolean;
  getQty:     (itemId: string) => number;

  // Use item
  useItem: (itemId: string) => { success: boolean; reason?: string };

  // Effects
  purgeExpiredEffects: () => void;
  getMultiplier: (effectType: ItemEffectType) => number;
  getSlotBonus:  () => number;   // stay_slot_extend の合計
  hasActiveEffect: (effectType: ItemEffectType) => boolean;
  getActiveEffectsByType: (effectType: ItemEffectType) => ActiveEffect[];
}

export const useItemStore = create<ItemStore>()(
  persist(
    (set, get) => ({
      inventory: {},
      activeEffects: [],

      // ---- Inventory ----

      addItem: (itemId, qty = 1) =>
        set((s) => ({
          inventory: {
            ...s.inventory,
            [itemId]: (s.inventory[itemId] ?? 0) + qty,
          },
        })),

      removeItem: (itemId, qty = 1) => {
        const current = get().inventory[itemId] ?? 0;
        if (current < qty) return false;
        set((s) => ({
          inventory: {
            ...s.inventory,
            [itemId]: s.inventory[itemId] - qty,
          },
        }));
        return true;
      },

      getQty: (itemId) => get().inventory[itemId] ?? 0,

      // ---- Use Item ----

      useItem: (itemId) => {
        const def = getItem(itemId);
        if (!def) return { success: false, reason: "unknown_item" };

        const qty = get().getQty(itemId);
        if (qty <= 0) return { success: false, reason: "not_owned" };

        // スタック上限チェック
        const existingSameType = get().activeEffects.filter(
          (e) => e.itemId === itemId
        );
        if (!def.stackable && existingSameType.length > 0) {
          return { success: false, reason: "already_active" };
        }
        if (existingSameType.length >= def.maxStack) {
          return { success: false, reason: "max_stack_reached" };
        }

        // 在庫を減らす
        get().removeItem(itemId, 1);

        // 効果を追加
        const now = Date.now();
        const expiresAt = new Date(
          now + def.durationMinutes * 60 * 1000
        ).toISOString();

        const effect: ActiveEffect = {
          id: `${itemId}_${now}`,
          itemId,
          effectType: def.effectType,
          effectValue: def.effectValue,
          expiresAt,
          isSuperMagnet: itemId === "super_magnet",
        };

        set((s) => ({ activeEffects: [...s.activeEffects, effect] }));

        // スーパーマグネットは複数効果を一括追加
        if (itemId === "super_magnet") {
          const extraTypes: ItemEffectType[] = [
            "xp_boost",
            "ne_boost",
            "capture_rate_up",
            "stay_time_extend",
          ];
          const extras: ActiveEffect[] = extraTypes.map((t) => ({
            id: `super_magnet_${t}_${now}`,
            itemId: "super_magnet",
            effectType: t,
            effectValue: def.effectValue,
            expiresAt,
            isSuperMagnet: true,
          }));
          set((s) => ({ activeEffects: [...s.activeEffects, ...extras] }));
        }

        return { success: true };
      },

      // ---- Effects ----

      purgeExpiredEffects: () => {
        const now = Date.now();
        set((s) => ({
          activeEffects: s.activeEffects.filter(
            (e) => new Date(e.expiresAt).getTime() > now
          ),
        }));
      },

      getMultiplier: (effectType) => {
        const now = Date.now();
        const relevant = get().activeEffects.filter(
          (e) =>
            e.effectType === effectType &&
            new Date(e.expiresAt).getTime() > now
        );
        if (relevant.length === 0) return 1.0;
        // 加算後に合成: 1.0 + Σ(value - 1.0)
        const bonus = relevant.reduce((sum, e) => sum + (e.effectValue - 1.0), 0);
        return 1.0 + bonus;
      },

      getSlotBonus: () => {
        const now = Date.now();
        return get().activeEffects
          .filter(
            (e) =>
              e.effectType === "stay_slot_extend" &&
              new Date(e.expiresAt).getTime() > now
          )
          .reduce((sum, e) => sum + e.effectValue, 0);
      },

      hasActiveEffect: (effectType) => {
        const now = Date.now();
        return get().activeEffects.some(
          (e) =>
            e.effectType === effectType &&
            new Date(e.expiresAt).getTime() > now
        );
      },

      getActiveEffectsByType: (effectType) => {
        const now = Date.now();
        return get().activeEffects.filter(
          (e) =>
            e.effectType === effectType &&
            new Date(e.expiresAt).getTime() > now
        );
      },
    }),
    {
      name: "nanowalk-items",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
