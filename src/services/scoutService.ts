/**
 * NanoWalk — スカウトサービス v2.0
 *
 * バトルを廃止し、コレクション特化設計に刷新。
 *
 * スカウト成功率の計算式:
 *   最終率 = (基本率 + 属性ボーナス + 天候ボーナス + 特性ボーナス + アイテムボーナス)
 *            × ボール倍率 × ミニゲーム倍率
 *
 * レベルアップ:
 *   2枚目以降を捕まえると既存モンスターのレベルが+1
 *   レベル = 所持枚数（上限はレアリティで決定）
 */

import type {
  MonsterDefinition,
  OwnedMonster,
  AreaId,
  WeatherType,
  BallType,
  Trait,
  ScoutSession,
  ScoutResult,
  MiniGameType,
} from "@/types";
import {
  BALL_SCOUT_BONUS,
  WEATHER_BONUS,
  AREA_ELEMENT_BONUS,
  MAX_LEVEL_BY_RARITY,
  MINI_GAME_MIN,
  MINI_GAME_MAX,
} from "@/types";
import { ELEMENT_EFFECTIVENESS, AREA_CONFIG } from "@/constants/game";

// ============================================================
// 特性の解放チェック
// ============================================================

/**
 * 現在のレベルで解放されている特性一覧を返す
 */
export function getUnlockedTraits(
  definition: MonsterDefinition,
  level: number
): Trait[] {
  return definition.traits.filter((t) => t.unlockLevel <= level);
}

/**
 * レベルアップで新たに解放された特性を返す（なければ null）
 */
export function getNewlyUnlockedTrait(
  definition: MonsterDefinition,
  oldLevel: number,
  newLevel: number
): Trait | null {
  const newTraits = definition.traits.filter(
    (t) => t.unlockLevel > oldLevel && t.unlockLevel <= newLevel
  );
  return newTraits[0] ?? null;
}

// ============================================================
// スカウト率計算
// ============================================================

/**
 * 所持モンスターの特性によるスカウトボーナスを計算
 */
export function calcTraitBonus(
  target: MonsterDefinition,
  ownedMonsters: OwnedMonster[],
  allDefinitions: MonsterDefinition[],
  area: AreaId,
  weather: WeatherType,
  hour: number
): number {
  let bonus = 0;

  for (const owned of ownedMonsters) {
    const def = allDefinitions.find((d) => d.id === owned.definitionId);
    if (!def) continue;

    const traits = getUnlockedTraits(def, owned.level);

    for (const trait of traits) {
      // トリガー判定
      let triggered = false;
      switch (trait.trigger) {
        case "on_own":
          triggered = true;
          break;
        case "on_field":
          triggered = true;
          break;
        case "weather_sunny":
          triggered = weather === "sunny";
          break;
        case "weather_rainy":
          triggered = weather === "rainy";
          break;
        case "weather_snowy":
          triggered = weather === "snowy";
          break;
        case "area_match": {
          const areaConfig = AREA_CONFIG[area];
          triggered = areaConfig.elementBonus.includes(def.element);
          break;
        }
        case "same_element":
          triggered = def.element === target.element;
          break;
        case "night":
          triggered = hour >= 22 || hour < 4;
          break;
        case "on_scout":
          triggered = true;
          break;
        default:
          triggered = false;
      }

      if (!triggered) continue;

      // 効果適用
      switch (trait.effect) {
        case "scout_rate_up":
          bonus += trait.value;
          break;
        case "same_element_up":
          if (def.element === target.element) bonus += trait.value;
          break;
        case "rare_rate_up":
          // レア出現率は別計算なのでスカウト率には加算しない
          break;
        default:
          break;
      }
    }
  }

  // 上限: 特性ボーナスは最大+50%
  return Math.min(bonus, 0.5);
}

/**
 * スカウトセッションを構築する（実際のスカウト前に呼ぶ）
 */
export function buildScoutSession(params: {
  monsterDef:    MonsterDefinition;
  area:          AreaId;
  weather:       WeatherType;
  ballType:      BallType;
  itemBonus:     number;
  traitBonus:    number;
  hour:          number;
}): ScoutSession {
  const { monsterDef, area, weather, ballType, itemBonus, traitBonus, hour } = params;

  // 天候ボーナス（favoriteWeatherに一致）
  const weatherBonus = monsterDef.favoriteWeather.includes(weather)
    ? WEATHER_BONUS
    : 0;

  // エリアボーナス（favoriteAreasに一致）
  const areaBonus = monsterDef.favoriteAreas.includes(area)
    ? AREA_ELEMENT_BONUS
    : 0;

  // ボールボーナス
  const ballBonus = BALL_SCOUT_BONUS[ballType];

  // 合計レート（ミニゲーム前）
  const baseRate = monsterDef.baseScoutRate;
  const sumRate  = baseRate + weatherBonus + areaBonus + traitBonus + itemBonus;

  // ミニゲームタイプを決定（レアリティで変わる）
  const miniGameType = decideMiniGameType(monsterDef.rarity, hour);

  return {
    monsterDef,
    area,
    weather,
    ballType,
    baseRate,
    traitBonus,
    itemBonus,
    weatherBonus,
    areaBonus,
    miniGameType,
    miniGameMultiplier: 1.0,    // ミニゲーム完了後に更新
    finalRate: Math.min(sumRate * (1 + ballBonus), 0.95), // 上限95%
  };
}

/**
 * レアリティ・時間帯でミニゲームタイプを決定
 */
export function decideMiniGameType(
  rarity: MonsterDefinition["rarity"],
  _hour: number
): MiniGameType {
  if (rarity === "N")   return "tap_timing";
  if (rarity === "R")   return Math.random() > 0.5 ? "tap_timing" : "slider";
  if (rarity === "SR")  return Math.random() > 0.5 ? "slider" : "card";
  if (rarity === "SSR") return Math.random() > 0.5 ? "dice"   : "card";
  return "dice"; // UR: 運まかせ
}

/**
 * ミニゲーム結果を反映してfinalRateを更新
 */
export function applyMiniGameResult(
  session: ScoutSession,
  multiplier: number
): ScoutSession {
  const clampedMult = Math.max(MINI_GAME_MIN, Math.min(MINI_GAME_MAX, multiplier));
  const newFinalRate = Math.min(session.finalRate * clampedMult, 0.95);
  return {
    ...session,
    miniGameMultiplier: clampedMult,
    finalRate: newFinalRate,
  };
}

// ============================================================
// スカウト実行
// ============================================================

/**
 * スカウトを実行し、結果を返す
 * ownedMonsters: 現在の所持モンスター一覧
 */
export function executeScout(
  session: ScoutSession,
  ownedMonsters: OwnedMonster[],
  allDefinitions: MonsterDefinition[]
): ScoutResult {
  const { monsterDef, finalRate, ballType } = session;

  // 乱数判定
  const roll = Math.random();
  const success = roll <= finalRate;

  if (!success) {
    // スカウト失敗 or 逃走（URは低確率で逃走演出）
    const escaped = monsterDef.rarity === "UR" && roll > 0.98;
    return {
      type: escaped ? "escape" : "fail",
      monster: monsterDef,
      ballConsumed: ballType !== "platinum" || Math.random() > 0.3,
    };
  }

  // 成功 — 既に所持しているか？
  const existing = ownedMonsters.find(
    (m) => m.definitionId === monsterDef.id
  );
  const maxLevel = MAX_LEVEL_BY_RARITY[monsterDef.rarity];

  if (existing) {
    // 2枚目以降 → レベルアップ
    const oldLevel = existing.level;
    const newLevel = Math.min(oldLevel + 1, maxLevel);
    const alreadyMax = oldLevel >= maxLevel;

    if (alreadyMax) {
      // 最大レベル済みでも成功扱い（称号など別途処理）
      return {
        type: "level_up",
        monster: monsterDef,
        newLevel: maxLevel,
        ballConsumed: true,
      };
    }

    // 特性解放チェック
    const newTrait = getNewlyUnlockedTrait(monsterDef, oldLevel, newLevel);

    // 進化チェック
    let evolved: MonsterDefinition | undefined;
    if (
      monsterDef.evolvesTo &&
      monsterDef.evolutionLevel &&
      newLevel >= monsterDef.evolutionLevel
    ) {
      evolved = allDefinitions.find((d) => d.id === monsterDef.evolvesTo);
    }

    return {
      type: "level_up",
      monster: monsterDef,
      newLevel,
      traitUnlocked: newTrait ?? undefined,
      evolved,
      ballConsumed: true,
    };
  }

  // 初捕獲 → 新規追加
  const firstTrait = getNewlyUnlockedTrait(monsterDef, 0, 1);
  return {
    type: "success",
    monster: monsterDef,
    newLevel: 1,
    traitUnlocked: firstTrait ?? undefined,
    ballConsumed: true,
  };
}

// ============================================================
// ミニゲーム: タップタイミング
// ============================================================

/**
 * タップタイミングの精度（0〜1）をミニゲーム倍率に変換
 * accuracy: 0（最悪）〜 1（完璧）
 */
export function tapTimingToMultiplier(accuracy: number): number {
  // 完璧（0.9以上）: ×2.0
  // 良い（0.7以上）: ×1.5
  // 普通（0.5以上）: ×1.0
  // 悪い（0.3以上）: ×0.7
  // 最悪（0.3未満）: ×0.5
  if (accuracy >= 0.9) return 2.0;
  if (accuracy >= 0.7) return 1.5;
  if (accuracy >= 0.5) return 1.0;
  if (accuracy >= 0.3) return 0.7;
  return 0.5;
}

/**
 * ルーレットの停止位置（0〜1、ターゲット範囲内かどうか）
 * hit: ターゲット範囲内に止まったか
 * accuracy: 中心からの距離（0=中心, 1=端）
 */
export function rouletteToMultiplier(hit: boolean, accuracy: number): number {
  if (!hit) return 0.5;
  // 中心に近いほどボーナス大
  if (accuracy <= 0.1) return 2.0;
  if (accuracy <= 0.3) return 1.5;
  return 1.2;
}

/**
 * スライダー位置（0〜1、ターゲット範囲 0.4〜0.6 を狙う）
 */
export function sliderToMultiplier(position: number): number {
  const center = 0.5;
  const distance = Math.abs(position - center);
  if (distance <= 0.05) return 2.0;  // ど真ん中
  if (distance <= 0.10) return 1.5;
  if (distance <= 0.15) return 1.2;
  if (distance <= 0.25) return 1.0;
  return 0.5;                         // 大きく外れ
}
