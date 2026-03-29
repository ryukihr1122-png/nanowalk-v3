/**
 * NanoWalk — useEvolution v2.0
 *
 * 新設計:
 * - 進化条件: monster.level >= definition.evolutionLevel
 * - 進化実行: 進化先モンスターをエンカウントカードに追加
 * - EXP・streak・旧レベル計算は廃止
 *
 * 進化はモンスターの変換ではなく「進化先との出会い」。
 * エンカウントカードが追加され、スカウットで捕まえる形。
 */

import { useCallback } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { useEncounterStore } from "@/store/encounterStore";
import { getMonsterById } from "@/constants/monsters";
import type { OwnedMonster } from "@/types";

// ---- 型定義 ----

export interface EvolutionCheck {
  canEvolve:     boolean;
  reason?:       string;       // 未満足の場合の理由
  evolvedDef?:   ReturnType<typeof getMonsterById>;
  currentLevel:  number;
  requiredLevel: number;
}

export interface UseEvolutionReturn {
  /** 進化可能かチェック */
  checkCanEvolve: (uuid: string) => EvolutionCheck;

  /** 進化を実行（エンカウントカードに追加） */
  triggerEvolution: (uuid: string) => boolean;

  /** 進化可能なモンスター一覧 */
  getEvolvableMonsters: () => { monster: OwnedMonster; check: EvolutionCheck }[];
}

export function useEvolution(): UseEvolutionReturn {
  const { monsters } = usePlayerStore();
  const { addMonsterCard } = useEncounterStore();

  // ---- 進化条件チェック ----
  const checkCanEvolve = useCallback((uuid: string): EvolutionCheck => {
    const monster = monsters.find((m) => m.uuid === uuid);
    if (!monster) return { canEvolve: false, reason: "モンスターが見つかりません", currentLevel: 0, requiredLevel: 0 };

    const def = getMonsterById(monster.definitionId);
    if (!def) return { canEvolve: false, reason: "定義が見つかりません", currentLevel: 0, requiredLevel: 0 };

    if (!def.evolvesTo || !def.evolutionLevel) {
      return { canEvolve: false, reason: "進化先がありません", currentLevel: monster.level, requiredLevel: 0 };
    }

    const evolvedDef = getMonsterById(def.evolvesTo);
    if (!evolvedDef) {
      return { canEvolve: false, reason: "進化先データが見つかりません", currentLevel: monster.level, requiredLevel: def.evolutionLevel };
    }

    if (monster.level < def.evolutionLevel) {
      return {
        canEvolve:     false,
        reason:        `Lv.${def.evolutionLevel} で進化可能（現在 Lv.${monster.level}）`,
        evolvedDef,
        currentLevel:  monster.level,
        requiredLevel: def.evolutionLevel,
      };
    }

    return {
      canEvolve:     true,
      evolvedDef,
      currentLevel:  monster.level,
      requiredLevel: def.evolutionLevel,
    };
  }, [monsters]);

  // ---- 進化実行 ----
  const triggerEvolution = useCallback((uuid: string): boolean => {
    const check = checkCanEvolve(uuid);
    if (!check.canEvolve || !check.evolvedDef) return false;

    const monster = monsters.find((m) => m.uuid === uuid);
    if (!monster) return false;

    const playerArea = "nano_plains" as any; // TODO: playerStore.currentArea

    // 進化先をエンカウントカードに追加
    addMonsterCard(check.evolvedDef, playerArea, "sunny");

    return true;
  }, [checkCanEvolve, monsters, addMonsterCard]);

  // ---- 進化可能一覧 ----
  const getEvolvableMonsters = useCallback(() => {
    return monsters
      .map((monster) => ({ monster, check: checkCanEvolve(monster.uuid) }))
      .filter(({ check }) => check.canEvolve);
  }, [monsters, checkCanEvolve]);

  return { checkCanEvolve, triggerEvolution, getEvolvableMonsters };
}
