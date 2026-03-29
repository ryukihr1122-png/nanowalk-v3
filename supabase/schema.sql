-- ============================================================
-- NanoWalk Supabase Schema v3.0
-- コレクション特化設計（バトル廃止）
-- ============================================================
-- 実行方法: Supabase Dashboard → SQL Editor → このファイルを貼り付けて Run
-- ============================================================

-- ---- Extensions ----
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. profiles（プレイヤープロフィール）
-- ============================================================
create table if not exists profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  username       text not null unique,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  -- リソース（定期同期）
  nano_energy    integer not null default 0,
  nano_gems      integer not null default 0,
  total_steps    bigint  not null default 0,
  today_steps    integer not null default 0,

  -- ゲーム状態
  current_area   text not null default 'nano_plains',
  companion_id   uuid,

  -- ストーン在庫（v3: balls → stones）
  stones         jsonb not null default '{"dull":10,"glow":3,"bright":0,"prism":0}',

  -- 不正検知
  last_step_sync      timestamptz,
  step_anomaly_count  integer not null default 0
);

alter table profiles enable row level security;

create policy "profiles: own read"
  on profiles for select using (auth.uid() = id);

create policy "profiles: own update"
  on profiles for update using (auth.uid() = id);

create policy "profiles: insert on signup"
  on profiles for insert with check (auth.uid() = id);

-- updated_at 自動更新トリガー
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- ============================================================
-- 2. monsters（所持モンスター）v3: コレクション特化
-- ============================================================
create table if not exists monsters (
  id               uuid primary key,          -- ローカル uuid と一致
  player_id        uuid not null references profiles(id) on delete cascade,
  definition_id    integer not null,          -- constants/monsters.ts の id
  nickname         text,
  level            integer not null default 1, -- 所持枚数 = レベル
  caught_in_area   text not null,
  is_favorite      boolean not null default false,
  captured_at      timestamptz not null default now(),
  last_captured_at timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table monsters enable row level security;

create policy "monsters: own all"
  on monsters for all
  using (auth.uid() = player_id)
  with check (auth.uid() = player_id);

create trigger monsters_updated_at
  before update on monsters
  for each row execute function update_updated_at();

-- ============================================================
-- 3. daily_steps（歩数履歴）
-- ============================================================
create table if not exists daily_steps (
  id          uuid primary key default uuid_generate_v4(),
  player_id   uuid not null references profiles(id) on delete cascade,
  date        date not null,
  steps       integer not null default 0,
  ne_earned   integer not null default 0,
  synced_at   timestamptz not null default now(),

  unique (player_id, date)
);

alter table daily_steps enable row level security;

create policy "daily_steps: own all"
  on daily_steps for all
  using (auth.uid() = player_id)
  with check (auth.uid() = player_id);

-- ============================================================
-- 4. weekly_rankings（週間歩数ランキング）
-- ============================================================
create table if not exists weekly_rankings (
  id          uuid primary key default uuid_generate_v4(),
  player_id   uuid not null references profiles(id) on delete cascade,
  username    text not null,
  week_start  date not null,
  total_steps bigint not null default 0,
  updated_at  timestamptz not null default now(),

  unique (player_id, week_start)
);

alter table weekly_rankings enable row level security;

create policy "rankings: public read"
  on weekly_rankings for select using (true);

create policy "rankings: own write"
  on weekly_rankings for all
  using (auth.uid() = player_id)
  with check (auth.uid() = player_id);

-- ============================================================
-- 5. purchase_receipts（課金レシート）
-- ============================================================
create table if not exists purchase_receipts (
  id             uuid primary key default uuid_generate_v4(),
  player_id      uuid not null references profiles(id) on delete cascade,
  transaction_id text not null unique,
  product_id     text not null,
  platform       text not null,   -- 'ios' | 'android'
  verified       boolean not null default false,
  verified_at    timestamptz,
  created_at     timestamptz not null default now()
);

alter table purchase_receipts enable row level security;

create policy "receipts: own all"
  on purchase_receipts for all
  using (auth.uid() = player_id)
  with check (auth.uid() = player_id);

-- ============================================================
-- 6. sync_log（差分同期ログ）
-- ============================================================
create table if not exists sync_log (
  id          uuid primary key default uuid_generate_v4(),
  player_id   uuid not null references profiles(id) on delete cascade,
  synced_at   timestamptz not null default now(),
  tables      text[] not null,
  success     boolean not null default true,
  error_msg   text
);

alter table sync_log enable row level security;

create policy "sync_log: own all"
  on sync_log for all
  using (auth.uid() = player_id)
  with check (auth.uid() = player_id);

-- ============================================================
-- 7. 週間ランキングビュー
-- ============================================================
create or replace view current_week_ranking as
select
  wr.player_id,
  wr.username,
  wr.total_steps,
  rank() over (order by wr.total_steps desc) as rank
from weekly_rankings wr
where wr.week_start = date_trunc('week', current_date)::date
order by total_steps desc
limit 100;

-- ============================================================
-- 8. ヘルパー関数
-- ============================================================

-- 週ランキング upsert（歩数は大きい方を採用）
create or replace function upsert_weekly_ranking(
  p_player_id uuid,
  p_username  text,
  p_steps     bigint
) returns void language plpgsql security definer as $$
declare
  v_week_start date := date_trunc('week', current_date)::date;
begin
  insert into weekly_rankings (player_id, username, week_start, total_steps)
  values (p_player_id, p_username, v_week_start, p_steps)
  on conflict (player_id, week_start)
  do update set
    total_steps = greatest(excluded.total_steps, weekly_rankings.total_steps),
    username    = excluded.username,
    updated_at  = now();
end;
$$;

-- ============================================================
-- 9. 新規ユーザー登録トリガー（Auth → profiles 自動作成）
-- ============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
