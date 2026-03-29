/**
 * NanoWalk — バッグ画面 v2.1
 * カテゴリ: ボール / フィールド / スカウト / ブースト / 特殊
 */

import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useState } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { useItemStore } from "@/store/itemStore";
import { ITEM_DEFINITIONS, getItemsByCategory, type ItemCategory } from "@/constants/items";
import { STONE_CONFIG } from "@/constants/game";
import type { StoneType } from "@/types";

const STONE_EMOJI: Record<StoneType, string> = {
  dull: "🪨", glow: "💎", bright: "✨", prism: "🌈",
};
const STONE_COLOR: Record<StoneType, string> = {
  dull: "#9090AA", glow: "#00C9A7", bright: "#FFD700", prism: "#CC44FF",
};
const STONE_LABEL: Record<StoneType, string> = {
  dull: "ダルストーン", glow: "グローストーン",
  bright: "ブライトストーン", prism: "プリズムストーン",
};
const STONE_BONUS: Record<StoneType, number> = {
  dull: 0, glow: 10, bright: 20, prism: 35,
};

const CATEGORY_CONFIG: { key: ItemCategory | "stone"; label: string; emoji: string }[] = [
  { key: "stone",   label: "ストーン",     emoji: "🪨" },
  { key: "gear",    label: "装備",         emoji: "📿" },
  { key: "field",   label: "フィールド",   emoji: "🌿" },
  { key: "scout",   label: "スカウト",     emoji: "🎯" },
  { key: "boost",   label: "ブースト",     emoji: "⚡" },
  { key: "special", label: "特殊",         emoji: "🌈" },
];

// ---- ボールカード ----
function StoneCard({ type, count }: { type: StoneType; count: number }) {
  const color = STONE_COLOR[type];
  const bonus = STONE_BONUS[type];
  return (
    <View style={{
      flexDirection: "row", alignItems: "center",
      padding: 14, marginBottom: 8, borderRadius: 16,
      backgroundColor: "#161628",
      borderWidth: 1, borderColor: count > 0 ? `${color}40` : "#1F1F38",
      opacity: count === 0 ? 0.5 : 1,
    }}>
      <View style={{
        width: 50, height: 50, borderRadius: 25,
        backgroundColor: `${color}18`,
        alignItems: "center", justifyContent: "center",
        marginRight: 14, borderWidth: 1, borderColor: `${color}30`,
      }}>
        <Text style={{ fontSize: 26 }}>{STONE_EMOJI[type]}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: "#F0F0FF", fontWeight: "900", fontSize: 15 }}>
          {STONE_LABEL[type]}
        </Text>
        {bonus > 0 && (
          <Text style={{ color, fontSize: 11, marginTop: 2 }}>
            スカウトボーナス +{bonus}%
          </Text>
        )}
        <Text style={{ color: "#9090AA", fontSize: 11, marginTop: 1 }}>
          {count === 0 ? "在庫なし" : `残り${count}個`}
        </Text>
      </View>
      <View style={{
        paddingHorizontal: 14, paddingVertical: 6,
        borderRadius: 12, backgroundColor: `${color}22`,
        borderWidth: 1, borderColor: `${color}40`,
      }}>
        <Text style={{ color, fontWeight: "900", fontSize: 18 }}>
          {count}
        </Text>
      </View>
    </View>
  );
}

// ---- アイテムカード ----
function ItemCard({ itemId, quantity }: { itemId: string; quantity: number }) {
  const { useItem } = useItemStore();
  const def = ITEM_DEFINITIONS[itemId];
  if (!def) return null;

  const handleUse = () => {
    if (def.durationMinutes === null) {
      Alert.alert(
        def.name,
        `${def.description}\n\nスカウット画面で使用できます。`,
        [{ text: "OK" }]
      );
      return;
    }
    Alert.alert(
      `${def.name}を使う`,
      `${def.description}\n\n効果時間: ${def.durationMinutes}分`,
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "使う",
          onPress: () => {
            const result = useItem(itemId);
            if (!result.success) {
              Alert.alert("使用できません", result.reason ?? "");
            }
          },
        },
      ]
    );
  };

  const rarityColor: Record<string, string> = {
    common: "#9090AA", uncommon: "#4FC3F7",
    rare: "#AB47BC", epic: "#FFD700",
  };
  const rc = rarityColor[def.rarity ?? "common"] ?? "#9090AA";

  return (
    <View style={{
      flexDirection: "row", alignItems: "center",
      padding: 12, marginBottom: 8, borderRadius: 16,
      backgroundColor: "#161628",
      borderWidth: 1, borderColor: "#1F1F38",
      opacity: quantity === 0 ? 0.4 : 1,
    }}>
      {/* アイコン */}
      <View style={{
        width: 48, height: 48, borderRadius: 14,
        backgroundColor: `${rc}18`,
        alignItems: "center", justifyContent: "center",
        marginRight: 12, borderWidth: 1, borderColor: `${rc}30`,
      }}>
        <Text style={{ fontSize: 24 }}>{def.emoji ?? "🎁"}</Text>
      </View>

      {/* 情報 */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <Text style={{ color: "#F0F0FF", fontWeight: "700", fontSize: 14 }}>
            {def.name}
          </Text>
          <View style={{ paddingHorizontal: 6, paddingVertical: 1,
            borderRadius: 6, backgroundColor: `${rc}22` }}>
            <Text style={{ color: rc, fontSize: 9, fontWeight: "700" }}>
              ×{quantity}
            </Text>
          </View>
        </View>
        <Text style={{ color: "#9090AA", fontSize: 11 }} numberOfLines={2}>
          {def.description}
        </Text>
        {def.durationMinutes && (
          <Text style={{ color: "#606080", fontSize: 10, marginTop: 2 }}>
            ⏱ {def.durationMinutes}分
          </Text>
        )}
      </View>

      {/* 使うボタン */}
      <Pressable
        onPress={quantity > 0 ? handleUse : undefined}
        style={{
          paddingHorizontal: 12, paddingVertical: 8,
          borderRadius: 12,
          backgroundColor: quantity > 0 ? "#00C9A720" : "#1F1F38",
          borderWidth: 1,
          borderColor: quantity > 0 ? "#00C9A740" : "#1F1F38",
          marginLeft: 8,
        }}
      >
        <Text style={{ color: quantity > 0 ? "#00C9A7" : "#404060",
          fontSize: 12, fontWeight: "700" }}>
          使う
        </Text>
      </Pressable>
    </View>
  );
}

// ============================================================
// Main Screen
// ============================================================
export default function BagScreen() {
  const { player } = usePlayerStore();
  const { inventory } = useItemStore();
  const [activeTab, setActiveTab] = useState<ItemCategory | "stone">("stone");

  const stones = (player?.stones ?? player?.balls) as Record<StoneType, number> ?? { dull: 0, glow: 0, bright: 0, prism: 0 };
  const totalStones = Object.values(stones).reduce((s, n) => s + n, 0);

  // アイテム集計
  const itemsByCategory = (cat: ItemCategory) =>
    Object.entries(inventory)
      .filter(([id]) => {
        const def = ITEM_DEFINITIONS[id];
        return def?.category === cat;
      })
      .filter(([, qty]) => qty > 0);

  const countByCategory = (cat: ItemCategory) =>
    itemsByCategory(cat).reduce((s, [, q]) => s + q, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0D0D1A" }} edges={["top"]}>
      {/* ヘッダー */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
        <Text style={{ color: "#F0F0FF", fontWeight: "900", fontSize: 22 }}>
          バッグ
        </Text>
      </View>

      {/* タブ */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, gap: 8 }}
      >
        {CATEGORY_CONFIG.map((cat) => {
          const isActive = activeTab === cat.key;
          const count = cat.key === "stone"
            ? totalStones
            : countByCategory(cat.key as ItemCategory);
          return (
            <Pressable
              key={cat.key}
              onPress={() => setActiveTab(cat.key)}
              style={{
                paddingHorizontal: 14, paddingVertical: 9,
                borderRadius: 20,
                backgroundColor: isActive ? "#00C9A7" : "#161628",
                borderWidth: 1,
                borderColor: isActive ? "#00C9A7" : "#1F1F38",
                flexDirection: "row", alignItems: "center", gap: 5,
              }}
            >
              <Text style={{ fontSize: 14 }}>{cat.emoji}</Text>
              <Text style={{
                color: isActive ? "#0D0D1A" : "#9090AA",
                fontWeight: "700", fontSize: 12,
              }}>
                {cat.label}
              </Text>
              {count > 0 && (
                <View style={{
                  paddingHorizontal: 6, paddingVertical: 1,
                  borderRadius: 8,
                  backgroundColor: isActive ? "#0D0D1A30" : "#00C9A720",
                }}>
                  <Text style={{
                    color: isActive ? "#0D0D1A" : "#00C9A7",
                    fontSize: 10, fontWeight: "900",
                  }}>
                    {count}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* コンテンツ */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}
      >
        {activeTab === "stone" && (
          <Animated.View entering={FadeInDown.duration(300)}>
            {/* デイリーボーナス案内 */}
            <View style={{
              padding: 12, borderRadius: 14, marginBottom: 16,
              backgroundColor: "#00C9A710",
              borderWidth: 1, borderColor: "#00C9A730",
              flexDirection: "row", alignItems: "center", gap: 10,
            }}>
              <Text style={{ fontSize: 20 }}>🎁</Text>
              <View>
                <Text style={{ color: "#00C9A7", fontWeight: "700", fontSize: 12 }}>
                  デイリーボーナス
                </Text>
                <Text style={{ color: "#9090AA", fontSize: 11 }}>
                  毎日ログインでダルストーン×5を獲得！
                </Text>
              </View>
            </View>
            {(["dull", "glow", "bright", "prism"] as StoneType[]).map((st) => (
              <StoneCard key={st} type={st} count={stones[st] ?? 0} />
            ))}
          </Animated.View>
        )}

        {activeTab !== "stone" && (
          <Animated.View entering={FadeInDown.duration(300)}>
            {itemsByCategory(activeTab as ItemCategory).length === 0 ? (
              <View style={{ alignItems: "center", paddingTop: 60 }}>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>🎒</Text>
                <Text style={{ color: "#9090AA", fontSize: 14 }}>
                  このカテゴリのアイテムはありません
                </Text>
                <Text style={{ color: "#606080", fontSize: 12, marginTop: 4 }}>
                  歩いているとアイテムを発見できます
                </Text>
              </View>
            ) : (
              itemsByCategory(activeTab as ItemCategory).map(([id, qty]) => (
                <ItemCard key={id} itemId={id} quantity={qty} />
              ))
            )}
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
