/**
 * useResidents
 *
 * - 1秒ごとに残り時間を再計算してUIを更新
 * - 期限切れを自動削除（+ 「逃げた」通知）
 * - エンカウント発生時に滞在リストへ追加
 * - 新規滞在時のプッシュ通知
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useResidentStore } from "@/store/residentStore";
import {
  buildResident,
  getTimeRemainingMs,
  isExpired,
  stayDurationLabel,
} from "@/services/residencyService";
import { scheduleEncounterNotification } from "@/services/notificationService";
import type { ResidentMonster } from "@/types";
import type { EncounterEvent } from "@/types";

interface ResidentTimer {
  id: string;
  remainingMs: number;
}

interface UseResidentsReturn {
  residents: ResidentMonster[];
  timers: Record<string, number>;      // id → remainingMs
  addFromEncounter: (event: EncounterEvent) => void;
  captureResident: (id: string) => void;
  dismissResident: (id: string) => void;
}

export function useResidents(): UseResidentsReturn {
  const { residents, addResident, removeResident, purgeExpired } = useResidentStore();
  const [tick, setTick] = useState(0);   // 1秒ごとに再レンダー
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- 1秒タイマー ----
  useEffect(() => {
    timerRef.current = setInterval(() => {
      // 期限切れを自動削除
      purgeExpired();
      // UI 更新トリガー
      setTick((t) => t + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [purgeExpired]);

  // ---- 残り時間マップ（render ごとに再計算） ----
  const timers: Record<string, number> = {};
  for (const r of residents) {
    timers[r.id] = getTimeRemainingMs(r);
  }

  // ---- エンカウント → 滞在追加 ----
  const addFromEncounter = useCallback(
    async (event: EncounterEvent) => {
      const resident = buildResident(
        event.id,
        event.monster,
        event.area,
        event.captureMultiplier
      );

      const { added } = addResident(resident);
      if (!added) return;

      // 出現プッシュ通知
      const notifId = await scheduleEncounterNotification({
        monsterName: event.monster.name,
        rarity: event.monster.rarity,
        delaySeconds: 1,
      }).catch(() => undefined);

      // notificationId を後付けで保存（storeに直接書く）
      if (notifId) {
        useResidentStore.getState().removeResident(resident.id);
        useResidentStore.getState().addResident({ ...resident, notificationId: notifId });
      }
    },
    [addResident]
  );

  // ---- 捕獲成功 → 削除 ----
  const captureResident = useCallback(
    (id: string) => removeResident(id),
    [removeResident]
  );

  // ---- スキップ → 削除 ----
  const dismissResident = useCallback(
    (id: string) => removeResident(id),
    [removeResident]
  );

  return { residents, timers, addFromEncounter, captureResident, dismissResident };
}
