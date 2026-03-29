/**
 * NanoWalk — 認証サービス
 *
 * Sign in with Apple（iOS必須）+ メールアドレス認証（開発用）
 */

import { supabase } from "./supabaseClient";
import { Platform } from "react-native";

// expo-apple-authentication は EAS Build でのみ利用可能
// import * as AppleAuthentication from "expo-apple-authentication";

// ---- Apple Sign In ----

export async function signInWithApple(): Promise<{
  success: boolean;
  userId?: string;
  error?: string;
}> {
  if (Platform.OS !== "ios") {
    return { success: false, error: "iOS のみ対応しています" };
  }

  if (__DEV__) {
    // 開発環境: モックサインイン
    console.log("[Auth] Mock Apple Sign In");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "dev@nanowalk.app",
      password: "nanowalk_dev_2026",
    });
    if (error) {
      // 初回は登録
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: "dev@nanowalk.app",
        password: "nanowalk_dev_2026",
      });
      if (signUpError) return { success: false, error: signUpError.message };
      return { success: true, userId: signUpData.user?.id };
    }
    return { success: true, userId: data.user?.id };
  }

  try {
    // 本番: expo-apple-authentication
    // const credential = await AppleAuthentication.signInAsync({
    //   requestedScopes: [
    //     AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
    //     AppleAuthentication.AppleAuthenticationScope.EMAIL,
    //   ],
    // });
    //
    // const { data, error } = await supabase.auth.signInWithIdToken({
    //   provider: "apple",
    //   token: credential.identityToken!,
    // });
    //
    // if (error) return { success: false, error: error.message };
    // return { success: true, userId: data.user?.id };
    return { success: false, error: "Apple Sign In は本番環境でのみ使用できます" };
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err.code === "ERR_REQUEST_CANCELED") {
      return { success: false, error: "キャンセルされました" };
    }
    return { success: false, error: err.message ?? "サインインに失敗しました" };
  }
}

// ---- Sign Out ----

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

// ---- Get current user ----

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ---- Session listener ----

export function onAuthStateChange(
  callback: (userId: string | null) => void
): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      callback(session?.user?.id ?? null);
    }
  );
  return () => subscription.unsubscribe();
}

// ---- Create profile on first sign in ----

export async function ensureProfile(
  userId: string,
  username: string
): Promise<boolean> {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .single();

  if (existing) return true;

  const { error } = await supabase.from("profiles").insert({
    id: userId,
    username,
  });

  return !error;
}
