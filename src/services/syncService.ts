/**
 * NanoWalk — 差分同期サービス v2.1
 *
 * コレクション特化設計に対応:
 * - モンスターは level（所持枚数）のみ管理
 * - currentStats / exp / skills / bondLevel は廃止
 * - battle_history は廃止
 *
 * 設計原則:
 * - ローカル Zustand が常に主体（オフライン動作保証）
 * - Supabase はバックアップ兼クロスデバイス同期
 * - 競合解決: 歩数は大きい方、モンスターはサーバー優先
 */

import { supabase } from "./supabaseClient";
import { getCurrentUser } from "./authService";
import { usePlayerStore } from "@/store/playerStore";
import { useMonetizationStore } from "@/store/monetizationStore";
import type { OwnedMonster } from "@/types";

// ---- Sync state ----

let _lastSyncAt: Date | null = null;
let _isSyncing  = false;

export const getLastSyncAt = (): Date | null => _lastSyncAt;
export const isSyncing     = (): boolean => _isSyncing;

// ============================================================
// PUSH
// ============================================================

async function pushProfile(userId: string): Promise<void> {
  const player = usePlayerStore.getState().player;
  if (!player) return;

  await supabase.from("profiles").upsert({
    id:             userId,
    nano_energy:    player.nanoEnergy,
    nano_gems:      useMonetizationStore.getState().nanoGems,
    total_steps:    Number(player.totalSteps),
    current_area:   player.currentArea,
    stones:         player.stones,
    last_step_sync: new Date().toISOString(),
  });
}

async function pushMonsters(userId: string): Promise<void> {
  const { monsters } = usePlayerStore.getState();
  if (monsters.length === 0) return;

  const rows = monsters.map((m: OwnedMonster) => ({
    id:              m.uuid,
    player_id:       userId,
    definition_id:   m.definitionId,
    nickname:        m.nickname ?? null,
    level:           m.level,                // 所持枚数 = レベル
    caught_in_area:  m.caughtInArea,
    is_favorite:     m.isFavorite,
    captured_at:     m.capturedAt instanceof Date
                       ? m.capturedAt.toISOString()
                       : String(m.capturedAt),
    last_captured_at: m.lastCapturedAt instanceof Date
                       ? m.lastCapturedAt.toISOString()
                       : String(m.lastCapturedAt),
  }));

  await supabase.from("monsters").upsert(rows, {
    onConflict:       "id",
    ignoreDuplicates: false,
  });
}

async function pushDailySteps(userId: string): Promise<void> {
  const player = usePlayerStore.getState().player;
  if (!player) return;

  // 今日分のみpush
  const today = new Date().toISOString().slice(0, 10);
  await supabase.from("daily_steps").upsert({
    player_id:  userId,
    date:       today,
    steps:      player.todaySteps,
  }, { onConflict: "player_id,date", ignoreDuplicates: false });
}

async function pushRanking(userId: string): Promise<void> {
  const player = usePlayerStore.getState().player;
  if (!player) return;

  await supabase.rpc("upsert_weekly_ranking", {
    p_player_id: userId,
    p_username:  player.username,
    p_steps:     Number(player.totalSteps),
  });
}

// ============================================================
// PULL
// ============================================================

async function pullProfile(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return;

  usePlayerStore.setState((s) => ({
    player: s.player
      ? {
          ...s.player,
          totalSteps:  Math.max(Number(s.player.totalSteps), data.total_steps ?? 0),
          nanoEnergy:  Math.max(s.player.nanoEnergy, data.nano_energy ?? 0),
          currentArea: data.current_area ?? s.player.currentArea,
          stones:      data.stones ?? s.player.stones,
        }
      : null,
  }));

  const gemStore = useMonetizationStore.getState();
  if ((data.nano_gems ?? 0) > gemStore.nanoGems) {
    gemStore.addGems((data.nano_gems ?? 0) - gemStore.nanoGems);
  }
}

async function pullMonsters(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from("monsters")
    .select("id, definition_id, nickname, level, caught_in_area, is_favorite, captured_at, last_captured_at")
    .eq("player_id", userId);

  if (error || !data) return;

  const { monsters } = usePlayerStore.getState();
  const localMap = new Map(monsters.map((m) => [m.uuid, m]));

  for (const row of data) {
    const local = localMap.get(row.id);

    if (!local) {
      // サーバーにあってローカルにない → 追加
      const newMonster: OwnedMonster = {
        uuid:           row.id,
        definitionId:   row.definition_id,
        nickname:       row.nickname ?? undefined,
        level:          row.level,
        capturedAt:     new Date(row.captured_at),
        lastCapturedAt: new Date(row.last_captured_at ?? row.captured_at),
        caughtInArea:   row.caught_in_area,
        isFavorite:     row.is_favorite,
      };
      usePlayerStore.setState((s) => ({ monsters: [...s.monsters, newMonster] }));
    } else if (row.level > local.level) {
      // サーバーのレベルが高い → 上書き（別デバイスで捕獲した場合）
      usePlayerStore.getState().updateMonster(row.id, { level: row.level });
    }
  }
}

// ============================================================
// FULL SYNC
// ============================================================

export interface SyncResult {
  success:      boolean;
  syncedAt:     Date | null;
  error?:       string;
  tablesSynced: string[];
}

export async function syncAll(): Promise<SyncResult> {
  if (_isSyncing) {
    return { success: false, syncedAt: _lastSyncAt, error: "すでに同期中です", tablesSynced: [] };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { success: false, syncedAt: _lastSyncAt, error: "未ログインです", tablesSynced: [] };
  }

  _isSyncing = true;
  const synced: string[] = [];

  try {
    await pushProfile(user.id);   synced.push("profiles");
    await pushMonsters(user.id);  synced.push("monsters");
    await pushDailySteps(user.id); synced.push("daily_steps");
    await pushRanking(user.id);   synced.push("weekly_rankings");

    await pullProfile(user.id);
    await pullMonsters(user.id);

    _lastSyncAt = new Date();

    await supabase.from("sync_log").insert({
      player_id: user.id, tables: synced, success: true,
    });

    return { success: true, syncedAt: _lastSyncAt, tablesSynced: synced };

  } catch (e: unknown) {
    const msg = (e as { message?: string }).message ?? "Unknown error";
    console.error("[Sync] Error:", msg);

    await supabase.from("sync_log").insert({
      player_id: user.id, tables: synced, success: false, error_msg: msg,
    }).catch(() => {});

    return { success: false, syncedAt: _lastSyncAt, error: msg, tablesSynced: synced };
  } finally {
    _isSyncing = false;
  }
}

// ============================================================
// RANKING
// ============================================================

export interface RankingEntry {
  playerId:   string;
  username:   string;
  totalSteps: number;
  rank:       number;
}

export async function fetchWeeklyRanking(limit = 50): Promise<RankingEntry[]> {
  const { data, error } = await supabase
    .from("current_week_ranking")
    .select("*")
    .limit(limit);

  if (error || !data) return [];

  return data.map((row) => ({
    playerId:   row.player_id,
    username:   row.username,
    totalSteps: row.total_steps,
    rank:       row.rank,
  }));
}

export async function fetchMyRank(): Promise<number | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data } = await supabase
    .from("current_week_ranking")
    .select("rank")
    .eq("player_id", user.id)
    .single();

  return data?.rank ?? null;
}
