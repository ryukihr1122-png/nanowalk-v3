/**
 * NanoWalk — Supabase クライアント
 *
 * シングルトンパターンで管理する。
 * 環境変数は app.json の extra または .env から読み込む。
 *
 * セットアップ:
 *   1. Supabase プロジェクトを作成
 *   2. supabase/schema.sql を実行
 *   3. .env に以下を記述:
 *      EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 *      EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import "react-native-url-polyfill/auto";

const SUPABASE_URL  = process.env.EXPO_PUBLIC_SUPABASE_URL  ?? "";
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Supabase 未設定時はダミー URL でクライアントを作成してクラッシュを防ぐ
const IS_CONFIGURED = !!(SUPABASE_URL && SUPABASE_ANON);

if (!IS_CONFIGURED) {
  console.warn(
    "[Supabase] 環境変数が未設定です（デモモード）。" +
    "ログイン・同期機能は動作しません。"
  );
}

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      SUPABASE_URL  || "https://placeholder.supabase.co",
      SUPABASE_ANON || "placeholder-anon-key",
      {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: IS_CONFIGURED,
          persistSession: IS_CONFIGURED,
          detectSessionInUrl: false,
        },
      }
    );
  }
  return _client;
}

export const supabase = getSupabase();
export { IS_CONFIGURED as isSupabaseConfigured };
