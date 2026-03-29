/**
 * ショップ画面
 * app/shop/index.tsx
 */

import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { router } from "expo-router";
import { useMonetizationStore } from "@/store/monetizationStore";
import { GEM_PRODUCTS } from "@/types/monetization";
import {
  purchaseProduct,
  purchaseSubscription,
  subscriptionExpiresAt,
  gemsForProduct,
} from "@/services/iapService";
import { SEASON_1 } from "@/constants/seasonPass";
import type { ProductId } from "@/types/monetization";

// ---- Gem Card ----
function GemCard({
  product,
  onBuy,
  loading,
}: {
  product: typeof GEM_PRODUCTS[0];
  onBuy: () => void;
  loading: boolean;
}) {
  return (
    <Pressable
      onPress={onBuy}
      disabled={loading}
      style={{
        flex: 1,
        minWidth: "45%",
        margin: 6,
        padding: 16,
        borderRadius: 18,
        backgroundColor: "#161628",
        borderWidth: 1,
        borderColor: product.badge ? "#FFD70060" : "#1F1F38",
        alignItems: "center",
        position: "relative",
        opacity: loading ? 0.6 : 1,
      }}
    >
      {product.badge && (
        <View
          style={{
            position: "absolute",
            top: -8,
            right: -8,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 12,
            backgroundColor: "#FFD700",
          }}
        >
          <Text style={{ color: "#0D0D1A", fontSize: 10, fontWeight: "900" }}>
            {product.badge}
          </Text>
        </View>
      )}
      <Text style={{ fontSize: 28 }}>💎</Text>
      <Text style={{ color: "#F0F0FF", fontWeight: "900", fontSize: 18, marginTop: 6 }}>
        {product.gems.toLocaleString()}
      </Text>
      {product.bonusPercent && (
        <Text style={{ color: "#00C9A7", fontSize: 11, fontWeight: "700" }}>
          +{product.bonusPercent}%ボーナス
        </Text>
      )}
      <Text style={{ color: "#9090AA", fontSize: 13, marginTop: 8 }}>
        ¥{product.priceJpy.toLocaleString()}
      </Text>
    </Pressable>
  );
}

// ---- Season Pass Card ----
function SeasonPassCard({
  isPremium,
  expiresAt,
  onMonthly,
  onYearly,
  loading,
}: {
  isPremium: boolean;
  expiresAt: Date | null;
  onMonthly: () => void;
  onYearly: () => void;
  loading: boolean;
}) {
  const perks = [
    "限定モンスタースキン（毎シーズン）",
    "ナノエナジー獲得量 +25%",
    "毎日ブライトストーン×1",
    "限定称号・フレーム",
    "SSR確定チケット（シーズン中1枚）",
  ];

  if (isPremium && expiresAt) {
    return (
      <View
        style={{
          marginHorizontal: 20,
          marginBottom: 20,
          padding: 20,
          borderRadius: 24,
          backgroundColor: "#161628",
          borderWidth: 2,
          borderColor: "#00C9A760",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <Text style={{ fontSize: 28 }}>⭐</Text>
          <View>
            <Text style={{ color: "#00C9A7", fontWeight: "900", fontSize: 16 }}>
              プレミアム有効中
            </Text>
            <Text style={{ color: "#9090AA", fontSize: 12 }}>
              {expiresAt.toLocaleDateString("ja-JP")}まで
            </Text>
          </View>
        </View>
        {perks.map((p, i) => (
          <View key={i} style={{ flexDirection: "row", gap: 8, marginBottom: 6 }}>
            <Text style={{ color: "#00C9A7" }}>✓</Text>
            <Text style={{ color: "#C0C0D0", fontSize: 13 }}>{p}</Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View
      style={{
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 24,
        backgroundColor: "#161628",
        borderWidth: 1,
        borderColor: "#1F1F38",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <View
        style={{
          padding: 20,
          backgroundColor: "#00C9A710",
          borderBottomWidth: 1,
          borderBottomColor: "#1F1F38",
        }}
      >
        <Text style={{ color: "#00C9A7", fontWeight: "900", fontSize: 18 }}>
          シーズンパス
        </Text>
        <Text style={{ color: "#9090AA", fontSize: 12, marginTop: 4 }}>
          {SEASON_1.title}
        </Text>
      </View>

      {/* Perks */}
      <View style={{ padding: 20 }}>
        {perks.map((p, i) => (
          <View key={i} style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
            <Text style={{ color: "#5B5EA6" }}>✦</Text>
            <Text style={{ color: "#C0C0D0", fontSize: 13 }}>{p}</Text>
          </View>
        ))}
      </View>

      {/* Purchase buttons */}
      <View style={{ padding: 16, paddingTop: 0, gap: 10 }}>
        <Pressable
          onPress={onMonthly}
          disabled={loading}
          style={{
            paddingVertical: 14,
            borderRadius: 16,
            alignItems: "center",
            backgroundColor: "#00C9A7",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#0D0D1A" />
          ) : (
            <>
              <Text style={{ color: "#0D0D1A", fontWeight: "900", fontSize: 15 }}>
                月額プラン
              </Text>
              <Text style={{ color: "#0D0D1A80", fontSize: 12 }}>
                ¥{SEASON_1.priceMonthlyJpy.toLocaleString()} / 月
              </Text>
            </>
          )}
        </Pressable>
        <Pressable
          onPress={onYearly}
          disabled={loading}
          style={{
            paddingVertical: 14,
            borderRadius: 16,
            alignItems: "center",
            backgroundColor: "#5B5EA620",
            borderWidth: 1,
            borderColor: "#5B5EA640",
            opacity: loading ? 0.6 : 1,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ color: "#5B5EA6", fontWeight: "900", fontSize: 15 }}>
              年額プラン
            </Text>
            <View
              style={{
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 8,
                backgroundColor: "#FFD70020",
              }}
            >
              <Text style={{ color: "#FFD700", fontSize: 10, fontWeight: "900" }}>
                2ヶ月分お得
              </Text>
            </View>
          </View>
          <Text style={{ color: "#5B5EA680", fontSize: 12 }}>
            ¥{SEASON_1.priceYearlyJpy.toLocaleString()} / 年
          </Text>
        </Pressable>
      </View>

      <Text
        style={{
          color: "#404060",
          fontSize: 10,
          textAlign: "center",
          paddingBottom: 16,
          paddingHorizontal: 20,
        }}
      >
        サブスクリプションはいつでもキャンセル可能。App Storeの規約に従います。
      </Text>
    </View>
  );
}

// ---- Main Screen ----
export default function ShopScreen() {
  const {
    nanoGems,
    addGems,
    isPremium,
    setPremium,
    getPurchaseState,
    starterPackPurchased,
    markStarterPackPurchased,
    addTicket,
  } = useMonetizationStore();

  const [loading, setLoading] = useState<string | null>(null);
  const { expiresAt } = getPurchaseState();

  const handleBuyGems = async (productId: ProductId) => {
    setLoading(productId);
    try {
      const result = await purchaseProduct(productId);
      if (result.success) {
        const gems = gemsForProduct(productId);
        addGems(gems);
        Alert.alert("購入完了！", `${gems}ジェムを獲得しました 💎`);
      } else if (!result.cancelled) {
        Alert.alert("購入失敗", result.error);
      }
    } finally {
      setLoading(null);
    }
  };

  const handleBuyStarter = async () => {
    if (starterPackPurchased) {
      Alert.alert("購入済み", "スターターパックはすでに購入済みです");
      return;
    }
    setLoading("starter_pack");
    try {
      const result = await purchaseProduct("starter_pack");
      if (result.success) {
        addGems(100);
        addTicket("SSR");
        markStarterPackPurchased();
        Alert.alert("スターターパック獲得！", "SSR確定チケット×1 + 100ジェムを獲得！");
      } else if (!result.cancelled) {
        Alert.alert("購入失敗", result.error);
      }
    } finally {
      setLoading(null);
    }
  };

  const handleSubscribe = async (type: "monthly" | "yearly") => {
    const productId = type === "monthly" ? "season_pass_monthly" : "season_pass_yearly";
    setLoading(productId);
    try {
      const result = await purchaseSubscription(productId);
      if (result.success) {
        const expires = subscriptionExpiresAt(productId);
        setPremium(expires);
        Alert.alert(
          "プレミアム有効！",
          `シーズンパスが有効になりました。\n${expires.toLocaleDateString("ja-JP")}まで有効。`
        );
      } else if (!result.cancelled) {
        Alert.alert("購入失敗", result.error);
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0D0D1A" }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 16,
          gap: 12,
        }}
      >
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: "#00C9A7", fontSize: 18 }}>←</Text>
        </Pressable>
        <Text style={{ color: "#F0F0FF", fontSize: 22, fontWeight: "900", flex: 1 }}>
          ショップ
        </Text>
        <View
          style={{
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: "#5B5EA620",
            borderWidth: 1,
            borderColor: "#5B5EA640",
          }}
        >
          <Text style={{ color: "#5B5EA6", fontWeight: "900" }}>
            💎 {nanoGems.toLocaleString()}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Starter pack */}
        {!starterPackPurchased && (
          <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
            <Pressable
              onPress={handleBuyStarter}
              disabled={!!loading}
              style={{
                padding: 20,
                borderRadius: 24,
                backgroundColor: "#FF6B3520",
                borderWidth: 2,
                borderColor: "#FF6B3560",
                flexDirection: "row",
                alignItems: "center",
                gap: 16,
              }}
            >
              <Text style={{ fontSize: 44 }}>🎁</Text>
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    alignSelf: "flex-start",
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 8,
                    backgroundColor: "#FF6B3533",
                    marginBottom: 6,
                  }}
                >
                  <Text style={{ color: "#FF6B35", fontSize: 10, fontWeight: "900" }}>
                    初回限定
                  </Text>
                </View>
                <Text style={{ color: "#F0F0FF", fontWeight: "900", fontSize: 16 }}>
                  スターターパック
                </Text>
                <Text style={{ color: "#9090AA", fontSize: 12, marginTop: 2 }}>
                  SSR確定チケット×1 + 100ジェム
                </Text>
                <Text style={{ color: "#FF6B35", fontWeight: "900", marginTop: 6 }}>
                  ¥600
                </Text>
              </View>
              {loading === "starter_pack" && (
                <ActivityIndicator color="#FF6B35" />
              )}
            </Pressable>
          </View>
        )}

        {/* Season Pass */}
        <Text
          style={{
            color: "#606080",
            fontSize: 11,
            fontWeight: "700",
            letterSpacing: 1,
            marginHorizontal: 20,
            marginBottom: 12,
          }}
        >
          シーズンパス
        </Text>
        <SeasonPassCard
          isPremium={isPremium}
          expiresAt={expiresAt}
          onMonthly={() => handleSubscribe("monthly")}
          onYearly={() => handleSubscribe("yearly")}
          loading={loading === "season_pass_monthly" || loading === "season_pass_yearly"}
        />

        {/* Gems */}
        <Text
          style={{
            color: "#606080",
            fontSize: 11,
            fontWeight: "700",
            letterSpacing: 1,
            marginHorizontal: 20,
            marginBottom: 12,
          }}
        >
          ナノジェム
        </Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            paddingHorizontal: 14,
            marginBottom: 20,
          }}
        >
          {GEM_PRODUCTS.map((p) => (
            <GemCard
              key={p.id}
              product={p}
              onBuy={() => handleBuyGems(p.id)}
              loading={loading === p.id}
            />
          ))}
        </View>

        <Text
          style={{
            color: "#303050",
            fontSize: 11,
            textAlign: "center",
            paddingHorizontal: 20,
          }}
        >
          課金はすべて任意です。すべてのモンスターは歩数でも入手可能です。
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
