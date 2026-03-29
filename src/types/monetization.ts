// ============================================================
// NanoWalk — 課金・ガチャ関連の型定義
// ============================================================

import type { RarityType, BallType } from "./index";

// ---- 商品ID（App Store / Google Play と一致させる） ----

export type ProductId =
  // ナノジェム（消費型）
  | "nanogem_60"        // ¥120  → 60 gems
  | "nanogem_330"       // ¥610  → 330 gems
  | "nanogem_700"       // ¥1,220 → 700 gems
  | "nanogem_1500"      // ¥2,440 → 1,500 gems
  | "nanogem_3200"      // ¥4,900 → 3,200 gems
  // スターターパック（初回限定）
  | "starter_pack"      // ¥600  → SSR確定+プレミアム7日+ブライトストーン×5
  // シーズンパス（自動更新サブスク）
  | "season_pass_monthly"  // ¥480/月
  | "season_pass_yearly";  // ¥3,980/年

// ---- ジェム定義 ----

export interface GemProduct {
  id: ProductId;
  label: string;
  gems: number;
  priceJpy: number;
  bonusPercent?: number; // ボーナス%表示用
  badge?: string;        // "お得！" など
}

export const GEM_PRODUCTS: GemProduct[] = [
  { id: "nanogem_60",   label: "60ジェム",    gems: 60,   priceJpy: 120 },
  { id: "nanogem_330",  label: "330ジェム",   gems: 330,  priceJpy: 610,  bonusPercent: 10 },
  { id: "nanogem_700",  label: "700ジェム",   gems: 700,  priceJpy: 1220, bonusPercent: 17, badge: "人気" },
  { id: "nanogem_1500", label: "1,500ジェム", gems: 1500, priceJpy: 2440, bonusPercent: 25 },
  { id: "nanogem_3200", label: "3,200ジェム", gems: 3200, priceJpy: 4900, bonusPercent: 33, badge: "最大お得" },
];

// ---- ガチャ ----

export type GachaBannerType = "standard" | "pickup" | "step_up";

export interface GachaBanner {
  id: string;
  title: string;
  description: string;
  type: GachaBannerType;
  featuredMonsterIds: number[];     // ピックアップ対象
  costPerPull: number;              // ジェム消費
  costPerMulti: number;             // 10連コスト（通常より安い）
  guaranteedRarity: RarityType;     // 天井レアリティ
  guaranteedAt: number;             // 天井連数
  ssrPityAt: number;                // SSR確定連数（ソフト天井）
  startAt: Date;
  endAt: Date;
  isActive: boolean;
}

export type GachaResultItem =
  | { kind: "item";    itemId: string;    rarity: RarityType; emoji: string; name: string }
  | { kind: "ball";    ballType: string;  rarity: RarityType; qty: number }
  | { kind: "monster"; monsterId: number; rarity: RarityType; isEncounter: true };
  // モンスターはエンカウントに追加（直接入手ではない）

export interface GachaResult {
  items: GachaResultItem[];         // 排出結果（アイテム/ボール/モンスター）
  highlightIndex: number;           // 演出ハイライト位置（最レア）
  monsterEncounterIds: number[];    // エンカウントに追加されたモンスターID
}

export interface GachaHistory {
  bannerId: string;
  pullCount: number;                // この天井内での累計引き数
  ssrPityCount: number;             // SSR確定までの残りカウント
  totalPulls: number;               // バナー通算
}

// ---- シーズンパス ----

export interface SeasonPassTier {
  level: number;         // 1〜30
  freeReward: SeasonReward;
  premiumReward?: SeasonReward;
  requiredPoints: number;
}

export interface SeasonReward {
  type: "gems" | "ball" | "ticket" | "skin" | "title" | "ne_bonus";
  value: number | string;
  label: string;
  emoji: string;
}

export interface SeasonPass {
  id: string;
  title: string;
  seasonNumber: number;
  startAt: Date;
  endAt: Date;
  tiers: SeasonPassTier[];
  priceMonthlyJpy: number;
  priceYearlyJpy: number;
}

export type SubscriptionStatus = "active" | "expired" | "none";

export interface PurchaseState {
  isPremium: boolean;
  subscriptionStatus: SubscriptionStatus;
  expiresAt: Date | null;
  neBonusPercent: number;          // プレミアム時 +25%
}

// ---- チケット ----

export type GachaTicketRarity = RarityType | "any";

export interface GachaTicket {
  id: string;
  rarity: GachaTicketRarity;
  label: string;
  emoji: string;
}
