import { Pedometer } from "expo-sensors";
import {
  NE_PER_STEP,
  NE_STEP_BONUSES,
  NE_DAILY_CAP,
  PEDOMETER_POLL_INTERVAL_MS,
  MAX_DAILY_STEPS_THRESHOLD,
} from "@/constants/game";

// ---- NE Calculation ----

/**
 * Calculate NanoEnergy earned from a given step count (daily).
 * Includes milestone bonuses, capped at NE_DAILY_CAP.
 */
export function calculateNanoEnergy(steps: number): number {
  if (steps <= 0) return 0;

  let ne = steps * NE_PER_STEP;

  for (const { steps: milestone, bonus } of NE_STEP_BONUSES) {
    if (steps >= milestone) {
      ne += bonus;
    }
  }

  return Math.min(Math.floor(ne), NE_DAILY_CAP);
}

/**
 * Returns the step multiplier for encounter probability.
 */
export function getStepMultiplier(todaySteps: number): number {
  if (todaySteps >= 10_000) return 2.0;
  if (todaySteps >= 7_000)  return 1.5;
  if (todaySteps >= 3_000)  return 1.0;
  return 0.5;
}

/**
 * Returns the time-of-day multiplier for encounter probability.
 */
export function getTimeMultiplier(): number {
  const hour = new Date().getHours();
  if (hour >= 5  && hour < 8)  return 1.3;
  if (hour >= 8  && hour < 20) return 1.0;
  if (hour >= 20 && hour < 23) return 0.8;
  return 0.5; // midnight 〜 5am
}

/**
 * Sanity check for server-side or client-side anomaly detection.
 */
export function isAnomalousStepCount(steps: number): boolean {
  return steps > MAX_DAILY_STEPS_THRESHOLD;
}

// ---- Pedometer Access ----

export async function isPedometerAvailable(): Promise<boolean> {
  const { granted } = await Pedometer.requestPermissionsAsync();
  if (!granted) return false;
  const { available } = await Pedometer.isAvailableAsync();
  return available;
}

/**
 * Fetch today's step count (midnight → now).
 */
export async function fetchTodaySteps(): Promise<number> {
  const available = await isPedometerAvailable();
  if (!available) return 0;

  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);

  try {
    const result = await Pedometer.getStepCountAsync(midnight, now);
    return result.steps;
  } catch {
    return 0;
  }
}

/**
 * Start a live pedometer subscription.
 * Returns an unsubscribe function.
 */
export function subscribeToPedometer(
  onUpdate: (steps: number) => void
): () => void {
  const subscription = Pedometer.watchStepCount((result) => {
    onUpdate(result.steps);
  });

  return () => subscription.remove();
}

// ---- Polling Fallback (background) ----

let pollTimer: ReturnType<typeof setInterval> | null = null;

export function startStepPolling(onUpdate: (steps: number) => void): void {
  if (pollTimer) return;
  pollTimer = setInterval(async () => {
    const steps = await fetchTodaySteps();
    onUpdate(steps);
  }, PEDOMETER_POLL_INTERVAL_MS);
}

export function stopStepPolling(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}
