/**
 * NanoWalk — IAP Service
 *
 * expo-iap（旧 react-native-iap の Expo 対応版）を使用。
 * App Store Connect で設定した商品IDと1:1で対応させる。
 *
 * ⚠️ 実機・TestFlight でのみ動作。シミュレーターはモックモードで動く。
 */

import { Platform } from "react-native";
import type { ProductId } from "@/types/monetization";
import { GEM_PRODUCTS } from "@/types/monetization";

// expo-iap は npm install expo-iap 後に利用可能
// import * as IAP from "expo-iap";

// ---- Mock 実装（開発用）----
// 実際に expo-iap を導入したら下記の mock を置き換える

export interface IAPProduct {
  productId: ProductId;
  title: string;
  description: string;
  localizedPrice: string;
  priceAmountMicros: number;
  currency: string;
}

export type PurchaseResult =
  | { success: true; productId: ProductId; transactionId: string }
  | { success: false; error: string; cancelled?: boolean };

// ---- 商品リスト取得 ----

export async function fetchProducts(): Promise<IAPProduct[]> {
  if (__DEV__) {
    // 開発環境モック
    return GEM_PRODUCTS.map((p) => ({
      productId: p.id,
      title: p.label,
      description: `${p.gems}ジェムをゲット`,
      localizedPrice: `¥${p.priceJpy.toLocaleString()}`,
      priceAmountMicros: p.priceJpy * 1_000_000,
      currency: "JPY",
    }));
  }

  // 本番: expo-iap を使って App Store から取得
  // const products = await IAP.getProducts({ skus: GEM_PRODUCTS.map(p => p.id) });
  // return products;
  return [];
}

// ---- 購入実行 ----

export async function purchaseProduct(productId: ProductId): Promise<PurchaseResult> {
  if (__DEV__) {
    // 開発環境: 常に成功
    console.log("[IAP] Mock purchase:", productId);
    await new Promise((r) => setTimeout(r, 1200)); // simulate delay
    return {
      success: true,
      productId,
      transactionId: `mock_txn_${Date.now()}`,
    };
  }

  try {
    // 本番: expo-iap
    // const purchase = await IAP.requestPurchase({ sku: productId });
    // await IAP.finishTransaction({ purchase, isConsumable: true });
    // return { success: true, productId, transactionId: purchase.transactionId ?? "" };
    throw new Error("IAP not configured");
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err.code === "E_USER_CANCELLED") {
      return { success: false, error: "キャンセルされました", cancelled: true };
    }
    return { success: false, error: err.message ?? "購入に失敗しました" };
  }
}

// ---- サブスクリプション購入 ----

export async function purchaseSubscription(
  productId: "season_pass_monthly" | "season_pass_yearly"
): Promise<PurchaseResult> {
  if (__DEV__) {
    console.log("[IAP] Mock subscription:", productId);
    await new Promise((r) => setTimeout(r, 1200));
    return { success: true, productId, transactionId: `mock_sub_${Date.now()}` };
  }

  try {
    // 本番: expo-iap
    // const purchase = await IAP.requestSubscription({ sku: productId });
    // return { success: true, productId, transactionId: purchase.transactionId ?? "" };
    throw new Error("IAP not configured");
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err.code === "E_USER_CANCELLED") {
      return { success: false, error: "キャンセルされました", cancelled: true };
    }
    return { success: false, error: err.message ?? "購入に失敗しました" };
  }
}

// ---- レシート検証（サーバーサイド） ----

export async function verifyReceipt(
  transactionId: string,
  productId: ProductId
): Promise<boolean> {
  try {
    // Supabase Edge Function 経由でレシート検証
    const res = await fetch(
      `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/verify-purchase`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, productId, platform: Platform.OS }),
      }
    );
    const data = await res.json();
    return data.valid === true;
  } catch {
    // 検証サーバーに繋がらない場合はオフライン許可（後で再検証）
    return true;
  }
}

// ---- ジェム付与ロジック ----

export function gemsForProduct(productId: ProductId): number {
  const product = GEM_PRODUCTS.find((p) => p.id === productId);
  return product?.gems ?? 0;
}

// ---- サブスク有効期限 ----

export function subscriptionExpiresAt(
  productId: "season_pass_monthly" | "season_pass_yearly"
): Date {
  const now = new Date();
  if (productId === "season_pass_yearly") {
    return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  }
  return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
}
