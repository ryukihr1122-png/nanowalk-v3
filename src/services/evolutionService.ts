/**
 * NanoWalk — evolutionService v2.0（軽量版）
 *
 * 新設計での進化:
 *   進化条件 = monster.level >= definition.evolutionLevel
 *   進化実行 = 進化先をエンカウントカードに追加（useEvolutionフック経由）
 *
 * このファイルには型定義と補助関数のみを残す。
 * EXP計算・旧レベルアップ・streak は廃止。
 */

import type { OwnedMonster } from "@/types";
import type { MonsterDefinition } from "@/types";

// ---- 型定義（後方互換のため残す） ----

export interface EvolutionCheckResult {
  canEvolve:     boolean;
  reason?:       string;
}

export interface EvolutionResult {
  evolved:       { definitionId: number; name: string };
  fromName:      string;
}

// ---- 進化条件チェック（シンプル版） ----

export function checkEvolutionCondition(
  monster:    OwnedMonster,
  definition: MonsterDefinition,
): EvolutionCheckResult {
  if (!definition.evolvesTo || !definition.evolutionLevel) {
    return { canEvolve: false, reason: "進化先がありません" };
  }
  if (monster.level < definition.evolutionLevel) {
    return {
      canEvolve: false,
      reason: `Lv.${definition.evolutionLevel} で進化可能（現在 Lv.${monster.level}）`,
    };
  }
  return { canEvolve: true };
}
