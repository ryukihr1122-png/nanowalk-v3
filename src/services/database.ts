/**
 * NanoWalk — ローカルSQLite v2.1
 *
 * コレクション特化設計:
 * - daily_steps: 歩数履歴
 * - capture_history: スカウット記録
 * - battle_history は廃止
 */

import * as SQLite from "expo-sqlite";

const DB_NAME = "nanowalk_v2.db";
let db: SQLite.SQLiteDatabase | null = null;

export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DB_NAME);
  await initSchema(db);
  return db;
}

async function initSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS daily_steps (
      date        TEXT    PRIMARY KEY,
      steps       INTEGER NOT NULL DEFAULT 0,
      ne_earned   REAL    NOT NULL DEFAULT 0,
      encounters  INTEGER NOT NULL DEFAULT 0,
      scouts_ok   INTEGER NOT NULL DEFAULT 0,
      scouts_fail INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS capture_history (
      id            TEXT    PRIMARY KEY,
      monster_id    INTEGER NOT NULL,
      area          TEXT    NOT NULL,
      weather       TEXT    NOT NULL DEFAULT 'sunny',
      ball_type     TEXT    NOT NULL,
      success       INTEGER NOT NULL DEFAULT 0,
      final_rate    REAL,
      mini_game     TEXT,
      captured_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_capture_monster ON capture_history(monster_id);
    CREATE INDEX IF NOT EXISTS idx_capture_date    ON capture_history(captured_at);
  `);
}

// ---- 歩数履歴 ----

export async function recordDailySteps(params: {
  date:       string;
  steps:      number;
  neEarned:   number;
  encounters: number;
}): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    `INSERT INTO daily_steps (date, steps, ne_earned, encounters)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       steps      = MAX(steps, excluded.steps),
       ne_earned  = MAX(ne_earned, excluded.ne_earned),
       encounters = encounters + excluded.encounters`,
    [params.date, params.steps, params.neEarned, params.encounters]
  );
}

export async function getStepHistory(days = 30): Promise<{
  date: string; steps: number; nanoEnergyEarned: number; encountersTriggered: number;
}[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<{
    date: string; steps: number; ne_earned: number; encounters: number;
  }>(
    `SELECT date, steps, ne_earned, encounters
     FROM daily_steps
     ORDER BY date DESC
     LIMIT ?`,
    [days]
  );
  return rows.map((r) => ({
    date:                r.date,
    steps:               r.steps,
    nanoEnergyEarned:    r.ne_earned,
    encountersTriggered: r.encounters,
  }));
}

// ---- スカウット記録 ----

export async function recordCapture(params: {
  id:        string;
  monsterId: number;
  area:      string;
  weather:   string;
  ballType:  string;
  success:   boolean;
  finalRate: number;
  miniGame:  string;
}): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    `INSERT OR IGNORE INTO capture_history
     (id, monster_id, area, weather, ball_type, success, final_rate, mini_game)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      params.id, params.monsterId, params.area, params.weather,
      params.ballType, params.success ? 1 : 0, params.finalRate, params.miniGame,
    ]
  );
}

export async function getCaptureStats(): Promise<{
  total: number; success: number; byMonster: Record<number, number>;
}> {
  const db = await getDB();
  const [totals] = await db.getAllAsync<{ total: number; success: number }>(
    `SELECT COUNT(*) as total, SUM(success) as success FROM capture_history`
  );
  const byMonsterRows = await db.getAllAsync<{ monster_id: number; cnt: number }>(
    `SELECT monster_id, COUNT(*) as cnt FROM capture_history WHERE success=1 GROUP BY monster_id`
  );
  const byMonster: Record<number, number> = {};
  byMonsterRows.forEach((r) => { byMonster[r.monster_id] = r.cnt; });

  return {
    total:     totals?.total ?? 0,
    success:   totals?.success ?? 0,
    byMonster,
  };
}
