/**
 * NanoWalk — useEncounter v2.1
 *
 * 1分ごとに2種類の判定を行う:
 * 1. モンスターエンカウント → カードストアに追加
 * 2. アイテムドロップ → カードストアに追加
 */

import { useEffect, useRef, useCallback } from "react";
import { AppState, type AppStateStatus } from "react-native";
import {
  shouldEncounter,
  buildEncounterEvent,
  pickMonsterFromPool,
  rollRarity,
} from "@/services/encounterService";
import { shouldDropItem, rollDroppedItem } from "@/services/itemDropService";
import { useEncounterStore } from "@/store/encounterStore";
import { usePlayerStore } from "@/store/playerStore";
import { MONSTER_POOL } from "@/constants/monsters";
import type { WeatherType } from "@/types";

const ENCOUNTER_CHECK_INTERVAL_MS = 60 * 1000; // 1分ごと

export function useEncounter(weather: WeatherType = "sunny"): void {
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const { player } = usePlayerStore();
  const { addMonsterCard, addItemCard, purgeExpiredCards } = useEncounterStore();

  const check = useCallback(() => {
    const todaySteps = player?.todaySteps ?? 0;
    const area       = (player?.currentArea ?? "nano_plains") as any;

    // ---- 1. モンスターエンカウント ----
    if (shouldEncounter(todaySteps, weather)) {
      const rarity  = rollRarity(area);
      const monster = pickMonsterFromPool(MONSTER_POOL, rarity, area);
      if (monster) {
        addMonsterCard(monster, area, weather);
      }
    }

    // ---- 2. アイテムドロップ ----
    if (shouldDropItem(todaySteps)) {
      const drop = rollDroppedItem();
      addItemCard(drop, area);
    }

    // 期限切れカードを削除
    purgeExpiredCards();
  }, [player, weather, addMonsterCard, addItemCard, purgeExpiredCards]);

  useEffect(() => {
    timerRef.current = setInterval(check, ENCOUNTER_CHECK_INTERVAL_MS);

    const sub = AppState.addEventListener("change", (next) => {
      if (appStateRef.current.match(/inactive|background/) && next === "active") {
        check();
      }
      appStateRef.current = next;
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      sub.remove();
    };
  }, [check]);
}
