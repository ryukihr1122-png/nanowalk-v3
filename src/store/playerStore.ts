/**
 * NanoWalk — プレイヤーストア v2.0
 * コレクション特化設計
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Player, OwnedMonster, StoneType, ActiveEffect, EquippedGear, GearSlotType, NanoCore } from "@/types";
import { getItem, ITEM_DEFINITIONS } from "@/constants/items";
import { MAX_LEVEL_BY_RARITY } from "@/types";
import { MONSTER_POOL } from "@/constants/monsters";
import { INITIAL_STONES } from "@/constants/game";

interface PlayerStore {
  player:     Player | null;
  monsters:   OwnedMonster[];
  nanoCores:  NanoCore[];

  // 初期化
  initPlayer: (id: string, username: string) => void;

  // NE
  addNanoEnergy:   (amount: number) => void;
  spendNanoEnergy: (amount: number) => boolean;

  // ジェム
  addGems:   (amount: number) => void;
  spendGems: (amount: number) => boolean;

  // ストーン
  useStone:  (type: StoneType) => boolean;
  addStones: (type: StoneType, count: number) => void;
  // 旧互換
  useBall:   (type: StoneType) => boolean;
  addBalls:  (type: StoneType, count: number) => void;

  // モンスター
  /**
   * スカウト成功時に呼ぶ
   * - 初捕獲: 新規追加
   * - 2枚目以降: level+1（上限チェックあり）
   * 戻り値: "added"（初捕獲）| "level_up"（レベルアップ）| "max"（最大レベル済み）
   */
  addOrLevelUp: (definitionId: number, area: string) => "added" | "level_up" | "max";
  updateMonster: (uuid: string, updates: Partial<OwnedMonster>) => void;
  setFavorite:   (uuid: string, value: boolean) => void;
  setCompanion:  (uuid: string) => void;
  setNickname:   (uuid: string, nickname: string) => void;

  // ナノコア
  addCores: (definitionId: number, quantity: number) => void;

  // 歩数
  updateTodaySteps: (steps: number) => void;
  addTotalSteps:    (steps: number) => void;

  // アイテム使用
  useItem:          (itemId: string) => boolean;
  removeItem:       (itemId: string, qty?: number) => void;
  addItem:          (itemId: string, qty?: number) => void;
  getActiveEffect:  (effectType: string) => ActiveEffect | undefined;
  tickEffects:      () => void;            // 毎分呼び出し（効果期限チェック）
  processFieldQueue: () => void;           // キュー先頭を有効化

  // 装備
  equipGear:        (monsterId: string, itemId: string) => boolean;
  unequipGear:      (monsterId: string, slot: GearSlotType) => void;
  getCompanionGearBonus: (effectType: string) => number;

  // エリア移動
  moveToArea: (area: string) => void;
}

const DEFAULT_STONES: Record<StoneType, number> = {
  dull: 30, glow: 5, bright: 2, prism: 0,
};

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      player:    null,
      monsters:  [],
      nanoCores: [],

      initPlayer: (id, username) =>
        set({
          player: {
            id, username,
            createdAt:    new Date(),
            nanoEnergy:   0,
            nanoGems:     0,
            totalSteps:   0,
            todaySteps:   0,
            lastStepSync: new Date(),
            currentArea:  "nano_plains",
            companionId:   undefined,
            stones:        { ...DEFAULT_STONES },
            items:         [],
            activeEffects: [],
            fieldQueue:    [],
          },
        }),

      addNanoEnergy: (amount) =>
        set((s) => ({
          player: s.player
            ? { ...s.player, nanoEnergy: s.player.nanoEnergy + amount }
            : null,
        })),

      spendNanoEnergy: (amount) => {
        const { player } = get();
        if (!player || player.nanoEnergy < amount) return false;
        set((s) => ({
          player: s.player
            ? { ...s.player, nanoEnergy: s.player.nanoEnergy - amount }
            : null,
        }));
        return true;
      },

      addGems: (amount) =>
        set((s) => ({
          player: s.player
            ? { ...s.player, nanoGems: s.player.nanoGems + amount }
            : null,
        })),

      spendGems: (amount) => {
        const { player } = get();
        if (!player || player.nanoGems < amount) return false;
        set((s) => ({
          player: s.player
            ? { ...s.player, nanoGems: s.player.nanoGems - amount }
            : null,
        }));
        return true;
      },

      useStone: (type) => {
        const { player } = get();
        if (!player || (player.stones ?? player.balls ?? {})[type] <= 0) return false;
        set((s) => ({
          player: s.player
            ? {
                ...s.player,
                stones: { ...(s.player.stones ?? s.player.balls ?? DEFAULT_STONES), [type]: ((s.player.stones ?? s.player.balls ?? DEFAULT_STONES)[type] ?? 0) - 1 },
              }
            : null,
        }));
        return true;
      },

      addStones: (type, count) =>
        set((s) => ({
          player: s.player
            ? {
                ...s.player,
                stones: { ...(s.player.stones ?? s.player.balls ?? DEFAULT_STONES), [type]: ((s.player.stones ?? s.player.balls ?? DEFAULT_STONES)[type] ?? 0) + count },
              }
            : null,
        })),

      // 旧互換
      useBall:  (type) => get().useStone(type),
      addBalls: (type, count) => get().addStones(type, count),

      // ── アイテム管理 ──
      addItem: (itemId, qty = 1) => {
        const def = getItem(itemId);
        if (!def) return;
        set((s) => {
          if (!s.player) return s;
          const existing = s.player.items.find((i) => i.itemId === itemId);
          const current  = existing?.quantity ?? 0;
          const capped   = Math.min(current + qty, def.stackLimit);
          const newItems = existing
            ? s.player.items.map((i) => i.itemId === itemId ? { ...i, quantity: capped } : i)
            : [...s.player.items, { itemId, quantity: capped }];
          return { player: { ...s.player, items: newItems } };
        });
      },

      removeItem: (itemId, qty = 1) => {
        set((s) => {
          if (!s.player) return s;
          const newItems = s.player.items
            .map((i) => i.itemId === itemId ? { ...i, quantity: i.quantity - qty } : i)
            .filter((i) => i.quantity > 0);
          return { player: { ...s.player, items: newItems } };
        });
      },

      useItem: (itemId) => {
        const { player } = get();
        if (!player) return false;
        const def = getItem(itemId);
        if (!def) return false;
        const inv = player.items.find((i) => i.itemId === itemId);
        if (!inv || inv.quantity <= 0) return false;

        if (def.category === "gear") return false; // 装備は equipGear を使う
        if (def.consumeType === "passive") return false;

        const effect: ActiveEffect = {
          itemId,
          effectType:  def.effectType,
          effectValue: def.effectValue,
          ...(def.consumeType === "duration"
            ? { expiresAt: new Date(Date.now() + def.consumeAmount * 60 * 1000) }
            : { usesLeft: def.consumeAmount }),
        };

        set((s) => {
          if (!s.player) return s;

          // フィールド系キュー制
          if (def.queueable) {
            const alreadyActive = s.player.activeEffects.some(
              (a) => a.effectType === def.effectType
            );
            if (alreadyActive) {
              // キューに積む
              const newItems = s.player.items
                .map((i) => i.itemId === itemId ? { ...i, quantity: i.quantity - 1 } : i)
                .filter((i) => i.quantity > 0);
              return {
                player: {
                  ...s.player,
                  items: newItems,
                  fieldQueue: [...s.player.fieldQueue, effect],
                },
              };
            }
          }

          // 通常適用
          const newItems = s.player.items
            .map((i) => i.itemId === itemId ? { ...i, quantity: i.quantity - 1 } : i)
            .filter((i) => i.quantity > 0);
          return {
            player: {
              ...s.player,
              items: newItems,
              activeEffects: [...s.player.activeEffects, effect],
            },
          };
        });
        return true;
      },

      getActiveEffect: (effectType) => {
        const { player } = get();
        return player?.activeEffects.find((a) => a.effectType === effectType);
      },

      // 毎分呼び出し：期限切れ効果を削除 → キューから次を適用
      tickEffects: () => {
        set((s) => {
          if (!s.player) return s;
          const now = Date.now();
          const stillActive = s.player.activeEffects.filter((a) =>
            !a.expiresAt || a.expiresAt.getTime() > now
          );
          const expired = s.player.activeEffects.filter((a) =>
            a.expiresAt && a.expiresAt.getTime() <= now
          );
          if (expired.length === 0 && s.player.fieldQueue.length === 0) return s;

          let queue = [...s.player.fieldQueue];
          let active = [...stillActive];

          // 期限切れの effectType についてキューから次を起動
          for (const exp of expired) {
            const nextIdx = queue.findIndex((q) => q.effectType === exp.effectType);
            if (nextIdx >= 0) {
              const next = queue[nextIdx];
              const def = getItem(next.itemId);
              const activated: ActiveEffect = {
                ...next,
                expiresAt: def?.consumeAmount
                  ? new Date(Date.now() + def.consumeAmount * 60 * 1000)
                  : undefined,
              };
              active.push(activated);
              queue.splice(nextIdx, 1);
            }
          }

          return {
            player: { ...s.player, activeEffects: active, fieldQueue: queue },
          };
        });
      },

      processFieldQueue: () => get().tickEffects(),

      // ── 装備 ──
      equipGear: (monsterId, itemId) => {
        const def = getItem(itemId);
        if (!def || def.category !== "gear" || !def.gearSlot) return false;
        set((s) => ({
          monsters: s.monsters.map((m) => {
            if (m.uuid !== monsterId) return m;
            return {
              ...m,
              gear: { ...(m.gear ?? {}), [def.gearSlot!]: itemId },
            };
          }),
        }));
        return true;
      },

      unequipGear: (monsterId, slot) => {
        set((s) => ({
          monsters: s.monsters.map((m) => {
            if (m.uuid !== monsterId) return m;
            const gear = { ...(m.gear ?? {}) };
            delete gear[slot];
            return { ...m, gear };
          }),
        }));
      },

      // 相棒の装備ボーナス合計を返す
      getCompanionGearBonus: (effectType) => {
        const { player, monsters } = get();
        if (!player?.companionId) return 0;
        const companion = monsters.find((m) => m.uuid === player.companionId);
        if (!companion?.gear) return 0;
        return Object.values(companion.gear).reduce((sum, itemId) => {
          if (!itemId) return sum;
          const def = getItem(itemId);
          if (!def || def.effectType !== effectType) return sum;
          return sum + def.effectValue;
        }, 0);
      },

      addOrLevelUp: (definitionId, area) => {
        const { monsters } = get();
        const existing = monsters.find((m) => m.definitionId === definitionId);
        const def = MONSTER_POOL.find((d) => d.id === definitionId);
        const maxLevel = def ? (MAX_LEVEL_BY_RARITY[def.rarity] ?? 5) : 5;

        if (!existing) {
          // 初捕獲
          const newMonster: OwnedMonster = {
            uuid:           `${definitionId}_${Date.now()}`,
            definitionId,
            level:          1,
            capturedAt:     new Date(),
            lastCapturedAt: new Date(),
            caughtInArea:   area as any,
            isFavorite:     false,
          };
          set((s) => ({ monsters: [...s.monsters, newMonster] }));
          return "added";
        }

        if (existing.level >= maxLevel) {
          // 最大レベル済み
          set((s) => ({
            monsters: s.monsters.map((m) =>
              m.uuid === existing.uuid
                ? { ...m, lastCapturedAt: new Date() }
                : m
            ),
          }));
          return "max";
        }

        // レベルアップ
        set((s) => ({
          monsters: s.monsters.map((m) =>
            m.uuid === existing.uuid
              ? { ...m, level: m.level + 1, lastCapturedAt: new Date() }
              : m
          ),
        }));
        return "level_up";
      },

      updateMonster: (uuid, updates) =>
        set((s) => ({
          monsters: s.monsters.map((m) =>
            m.uuid === uuid ? { ...m, ...updates } : m
          ),
        })),

      setFavorite: (uuid, value) =>
        set((s) => ({
          monsters: s.monsters.map((m) =>
            m.uuid === uuid ? { ...m, isFavorite: value } : m
          ),
        })),

      setCompanion: (uuid) =>
        set((s) => ({
          player: s.player ? { ...s.player, companionId: uuid } : null,
        })),

      setNickname: (uuid, nickname) =>
        set((s) => ({
          monsters: s.monsters.map((m) =>
            m.uuid === uuid ? { ...m, nickname } : m
          ),
        })),

      addCores: (definitionId, quantity) =>
        set((s) => {
          const cores = [...s.nanoCores];
          const idx = cores.findIndex((c) => c.definitionId === definitionId);
          if (idx >= 0) {
            cores[idx] = { ...cores[idx], quantity: cores[idx].quantity + quantity };
          } else {
            cores.push({ definitionId, quantity });
          }
          return { nanoCores: cores };
        }),

      updateTodaySteps: (steps) =>
        set((s) => ({
          player: s.player
            ? { ...s.player, todaySteps: steps, lastStepSync: new Date() }
            : null,
        })),

      addTotalSteps: (steps) =>
        set((s) => ({
          player: s.player
            ? { ...s.player, totalSteps: Number(s.player.totalSteps) + steps }
            : null,
        })),

      moveToArea: (area) =>
        set((s) => ({
          player: s.player ? { ...s.player, currentArea: area as any } : null,
        })),
    }),
    {
      name:    "nanowalk-player-v2",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
