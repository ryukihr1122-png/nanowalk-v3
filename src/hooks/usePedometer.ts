import { useEffect, useState, useCallback } from "react";
import {
  fetchTodaySteps,
  subscribeToPedometer,
  isPedometerAvailable,
  calculateNanoEnergy,
  isAnomalousStepCount,
} from "@/services/pedometerService";
import { usePlayerStore } from "@/store/playerStore";

interface PedometerState {
  isAvailable: boolean;
  isLoading: boolean;
  todaySteps: number;
  todayNE: number;
  error: string | null;
}

export function usePedometer(): PedometerState {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { player, updateTodaySteps, addTotalSteps, addNanoEnergy } =
    usePlayerStore();

  const todaySteps = player?.todaySteps ?? 0;
  const todayNE = calculateNanoEnergy(todaySteps);

  const syncSteps = useCallback(
    async (steps: number) => {
      if (isAnomalousStepCount(steps)) {
        console.warn("[Pedometer] Anomalous step count detected:", steps);
        return;
      }

      const prev = player?.todaySteps ?? 0;
      const delta = Math.max(0, steps - prev);

      if (delta > 0) {
        addTotalSteps(delta);
        const prevNE = calculateNanoEnergy(prev);
        const newNE = calculateNanoEnergy(steps);
        const neGained = newNE - prevNE;
        if (neGained > 0) {
          addNanoEnergy(neGained);
        }
      }

      updateTodaySteps(steps);
    },
    [player?.todaySteps, updateTodaySteps, addTotalSteps, addNanoEnergy]
  );

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    (async () => {
      setIsLoading(true);
      try {
        const available = await isPedometerAvailable();
        setIsAvailable(available);

        if (!available) {
          setError("歩数計が利用できません。設定からヘルスケアを許可してください。");
          return;
        }

        // Initial fetch
        const steps = await fetchTodaySteps();
        await syncSteps(steps);

        // Live subscription
        unsubscribe = subscribeToPedometer(async (newSteps) => {
          await syncSteps(newSteps);
        });
      } catch (e) {
        setError("歩数の取得中にエラーが発生しました。");
        console.error("[Pedometer]", e);
      } finally {
        setIsLoading(false);
      }
    })();

    return () => {
      unsubscribe?.();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { isAvailable, isLoading, todaySteps, todayNE, error };
}
