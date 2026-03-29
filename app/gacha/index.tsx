/**
 * NanoWalk — ガチャ画面 v2.1
 * アイテム・ボールが主役。モンスターはエンカウントとして追加。
 */

import {
  View, Text, ScrollView, Pressable, Modal, FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withSequence, withTiming, withDelay,
  FadeIn, FadeInDown,
} from "react-native-reanimated";
import { useState, useCallback } from "react";
import { router } from "expo-router";
import { useMonetizationStore } from "@/store/monetizationStore";
import { usePlayerStore } from "@/store/playerStore";
import { useItemStore } from "@/store/itemStore";
import { useEncounterStore } from "@/store/encounterStore";
import { executePull, ALL_BANNERS } from "@/services/gachaService";
import { getMonsterById } from "@/constants/monsters";
import type { GachaBanner, GachaResult, GachaResultItem } from "@/types/monetization";
import type { RarityType } from "@/types";

const RARITY_COLOR: Record<RarityType, string> = {
  N:"#9090AA", R:"#4FC3F7", SR:"#AB47BC", SSR:"#FFD700", UR:"#FF4081",
};

// ---- 1枠カード ----
function ResultCard({ item, index, highlightIndex, delay }: {
  item: GachaResultItem; index: number; highlightIndex: number; delay: number;
}) {
  const isHighlight = index === highlightIndex;
  const color = RARITY_COLOR[item.rarity];

  const scale = useSharedValue(0);
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  // 遅延表示
  setTimeout(() => {
    scale.value = withSpring(isHighlight ? 1.08 : 1.0, { damping: 8 });
  }, delay);

  const stoneType = (item as any).stoneType as string | undefined;
  const stoneEmoji: Record<string, string> = { dull: "🪨", glow: "💎", bright: "✨", prism: "💠" };
  const stoneLabel: Record<string, string> = { dull: "ダルストーン", glow: "グローストーン", bright: "ブライトストーン", prism: "プリズムストーン" };

  const emoji =
    item.kind === "stone"   ? (stoneEmoji[stoneType ?? ""] ?? "🪨") :
    item.kind === "item"    ? ((item as any).emoji ?? "🎁") :
    item.kind === "monster" ? "✨" : "❓";

  const label =
    item.kind === "stone"   ? `${stoneLabel[stoneType ?? ""] ?? "ストーン"} ×${(item as any).qty ?? 1}` :
    item.kind === "item"    ? (item as any).name :
    item.kind === "monster" ? (
      `${getMonsterById((item as any).monsterId)?.name ?? "???"}出現！`
    ) : "?";

  const sublabel =
    item.kind === "monster" ? "エンカウントに追加" :
    item.kind === "stone"   ? "スカウトで使用" : "";

  return (
    <Animated.View style={[cardStyle, {
      width: "30%", margin: "1.5%",
      borderRadius: 16, overflow: "hidden",
      backgroundColor: isHighlight ? `${color}20` : "#161628",
      borderWidth: isHighlight ? 2 : 1,
      borderColor: isHighlight ? color : "#1F1F38",
    }]}>
      {/* レアリティライン */}
      <View style={{ height: 3, backgroundColor: color }} />

      <View style={{ padding: 10, alignItems: "center" }}>
        {/* アイコン */}
        <View style={{
          width: 52, height: 52, borderRadius: 12,
          backgroundColor: `${color}18`,
          alignItems: "center", justifyContent: "center",
          marginBottom: 6,
        }}>
          <Text style={{ fontSize: item.kind === "monster" ? 24 : 28 }}>{emoji}</Text>
        </View>

        {/* レアリティ */}
        <View style={{
          paddingHorizontal: 6, paddingVertical: 2,
          borderRadius: 8, backgroundColor: `${color}22`, marginBottom: 4,
        }}>
          <Text style={{ color, fontSize: 9, fontWeight: "700" }}>{item.rarity}</Text>
        </View>

        {/* ラベル */}
        <Text style={{
          color: "#F0F0FF", fontWeight: "700", fontSize: 10,
          textAlign: "center",
        }} numberOfLines={2}>
          {label}
        </Text>

        {sublabel ? (
          <Text style={{ color: "#00C9A7", fontSize: 8, marginTop: 2, textAlign: "center" }}>
            {sublabel}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

// ---- 結果モーダル ----
function ResultModal({ result, onClose }: { result: GachaResult; onClose: () => void }) {
  const monsterCount = result.monsterEncounterIds.length;

  return (
    <Modal transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.85)" }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flex: 1, padding: 16 }}>
            {/* ヘッダー */}
            <Animated.View entering={FadeIn.duration(400)}
              style={{ alignItems: "center", marginBottom: 16 }}>
              <Text style={{ color: "#FFD700", fontWeight: "900", fontSize: 22 }}>
                ガチャ結果
              </Text>
              {monsterCount > 0 && (
                <Animated.View entering={FadeInDown.delay(300).duration(400)}
                  style={{
                    marginTop: 6, paddingHorizontal: 16, paddingVertical: 6,
                    borderRadius: 14, backgroundColor: "#FF408120",
                    borderWidth: 1, borderColor: "#FF408140",
                  }}>
                  <Text style={{ color: "#FF4081", fontWeight: "900", fontSize: 13 }}>
                    ✨ モンスター{monsterCount}体がエンカウントに追加！
                  </Text>
                </Animated.View>
              )}
            </Animated.View>

            {/* カードグリッド */}
            <View style={{ flex: 1 }}>
              <FlatList
                data={result.items}
                numColumns={3}
                keyExtractor={(_, i) => String(i)}
                renderItem={({ item, index }) => (
                  <ResultCard
                    item={item}
                    index={index}
                    highlightIndex={result.highlightIndex}
                    delay={index * 80}
                  />
                )}
                showsVerticalScrollIndicator={false}
              />
            </View>

            {/* 閉じるボタン */}
            <Pressable
              onPress={onClose}
              style={{
                paddingVertical: 16, borderRadius: 20,
                backgroundColor: "#00C9A7", alignItems: "center",
                marginTop: 12,
              }}
            >
              <Text style={{ color: "#0D0D1A", fontWeight: "900", fontSize: 16 }}>
                受け取る
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// ---- バナーカード ----
function BannerCard({ banner, onPull }: {
  banner: GachaBanner;
  onPull: (banner: GachaBanner, count: 1 | 10) => void;
}) {
  const { gachaHistory } = useMonetizationStore();
  const history = gachaHistory[banner.id] ?? { pullCount: 0, ssrPityCount: 0, totalPulls: 0 };
  const pityLeft = banner.urPityAt - history.pullCount;

  return (
    <View style={{
      marginBottom: 16, borderRadius: 22, overflow: "hidden",
      backgroundColor: "#161628",
      borderWidth: 1, borderColor: banner.type === "event" ? "#FF408140" : "#1F1F38",
    }}>
      {/* バナーヘッダー */}
      <View style={{
        padding: 16,
        backgroundColor: banner.type === "event" ? "#FF408110" : "#0D0D1A",
        borderBottomWidth: 1, borderBottomColor: "#1F1F38",
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
          {banner.type === "event" && (
            <View style={{ paddingHorizontal: 8, paddingVertical: 3,
              borderRadius: 10, backgroundColor: "#FF408120" }}>
              <Text style={{ color: "#FF4081", fontSize: 10, fontWeight: "700" }}>
                期間限定
              </Text>
            </View>
          )}
          <Text style={{ color: "#F0F0FF", fontWeight: "900", fontSize: 17 }}>
            {banner.name}
          </Text>
        </View>
        <Text style={{ color: "#9090AA", fontSize: 12 }}>{banner.description}</Text>
      </View>

      {/* 排出内容プレビュー */}
      <View style={{ padding: 14 }}>
        <Text style={{ color: "#606080", fontSize: 10, marginBottom: 8,
          fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 }}>
          排出内容
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {[
            { emoji: "🪨", label: "ダルストーン" },
            { emoji: "💎", label: "グローストーン" },
            { emoji: "✨", label: "ブライトストーン" },
            { emoji: "✨", label: "キラキラスプレー" },
            { emoji: "🎲", label: "ワンモアチャンス" },
            { emoji: "🐾", label: "モンスターENC(稀)" },
          ].map((item) => (
            <View key={item.label} style={{ flexDirection: "row", alignItems: "center",
              gap: 3, paddingHorizontal: 8, paddingVertical: 3,
              borderRadius: 10, backgroundColor: "#0D0D1A",
              borderWidth: 1, borderColor: "#1F1F38" }}>
              <Text style={{ fontSize: 12 }}>{item.emoji}</Text>
              <Text style={{ color: "#9090AA", fontSize: 10 }}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* 天井カウンター */}
        <View style={{ flexDirection: "row", justifyContent: "space-between",
          marginBottom: 14, padding: 10, borderRadius: 12, backgroundColor: "#0D0D1A" }}>
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: "#FFD700", fontWeight: "900", fontSize: 18 }}>
              {pityLeft}
            </Text>
            <Text style={{ color: "#606080", fontSize: 10 }}>UR天井まで</Text>
          </View>
          <View style={{ width: 1, backgroundColor: "#1F1F38" }} />
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: "#AB47BC", fontWeight: "900", fontSize: 18 }}>
              {Math.max(0, banner.ssrPityAt - history.ssrPityCount)}
            </Text>
            <Text style={{ color: "#606080", fontSize: 10 }}>SSR天井まで</Text>
          </View>
          <View style={{ width: 1, backgroundColor: "#1F1F38" }} />
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: "#9090AA", fontWeight: "900", fontSize: 18 }}>
              {history.totalPulls}
            </Text>
            <Text style={{ color: "#606080", fontSize: 10 }}>累計</Text>
          </View>
        </View>

        {/* 引くボタン */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable onPress={() => onPull(banner, 1)}
            style={{ flex: 1, paddingVertical: 14, borderRadius: 16,
              backgroundColor: "#1F1F38", alignItems: "center",
              borderWidth: 1, borderColor: "#2a2a4a" }}>
            <Text style={{ color: "#00C9A7", fontWeight: "900", fontSize: 14 }}>
              1回引く
            </Text>
            <Text style={{ color: "#606080", fontSize: 11, marginTop: 2 }}>
              💎 160
            </Text>
          </Pressable>
          <Pressable onPress={() => onPull(banner, 10)}
            style={{ flex: 2, paddingVertical: 14, borderRadius: 16,
              backgroundColor: "#00C9A7", alignItems: "center" }}>
            <Text style={{ color: "#0D0D1A", fontWeight: "900", fontSize: 16 }}>
              10連！
            </Text>
            <Text style={{ color: "#0D0D1A88", fontSize: 11, marginTop: 2 }}>
              💎 1500（+1保証）
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ============================================================
// Main Screen
// ============================================================
export default function GachaScreen() {
  const { nanoGems, spendGems, updateGachaHistory, gachaHistory } = useMonetizationStore();
  const { addStones } = usePlayerStore();
  const { addItem }  = useItemStore();
  const { addMonsterCard } = useEncounterStore();

  const [result,    setResult]    = useState<GachaResult | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handlePull = useCallback((banner: GachaBanner, count: 1 | 10) => {
    const cost = count === 1 ? 160 : 1500;
    if (!spendGems(cost)) {
      return;
    }

    const history = gachaHistory[banner.id] ?? { pullCount: 0, ssrPityCount: 0, totalPulls: 0 };
    const { result: res, updatedHistory } = executePull(banner, count, history);

    updateGachaHistory(banner.id, updatedHistory);

    // 報酬を付与
    for (const item of res.items) {
      if (item.kind === "stone") {
        addStones((item as any).stoneType as any, (item as any).qty ?? 1);
      } else if (item.kind === "item") {
        addItem(item.itemId, 1);
      } else if (item.kind === "monster") {
        // モンスターはエンカウントに追加
        const def = getMonsterById((item as any).monsterId);
        if (def) {
          addMonsterCard(def, "nano_core" as any, "sunny" as any);
        }
      }
    }

    setResult(res);
    setShowModal(true);
  }, [gachaHistory, spendGems, addStones, addItem, addMonsterCard, updateGachaHistory]);

  const activeBanners = ALL_BANNERS.filter((b) => b.isActive);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0D0D1A" }}>
      {/* ヘッダー */}
      <View style={{ flexDirection: "row", alignItems: "center",
        paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 10 }}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: "#00C9A7", fontSize: 18 }}>←</Text>
        </Pressable>
        <Text style={{ color: "#F0F0FF", fontWeight: "900", fontSize: 20, flex: 1 }}>
          ガチャ
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4,
          paddingHorizontal: 12, paddingVertical: 6,
          borderRadius: 14, backgroundColor: "#161628",
          borderWidth: 1, borderColor: "#1F1F38" }}>
          <Text style={{ fontSize: 14 }}>💎</Text>
          <Text style={{ color: "#FFD700", fontWeight: "900", fontSize: 14 }}>
            {nanoGems}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}
      >
        {/* 説明バナー */}
        <Animated.View entering={FadeInDown.duration(400)}
          style={{
            padding: 14, borderRadius: 18, marginBottom: 20,
            backgroundColor: "#00C9A710",
            borderWidth: 1, borderColor: "#00C9A730",
          }}>
          <Text style={{ color: "#00C9A7", fontWeight: "900", fontSize: 13, marginBottom: 4 }}>
            🎲 ガチャとは？
          </Text>
          <Text style={{ color: "#9090AA", fontSize: 12, lineHeight: 18 }}>
            ストーン・アイテムが主な報酬です。{"\n"}
            稀にモンスターが出現することも！その場合はエンカウントに追加され、スカウットのチャンスが生まれます。
          </Text>
        </Animated.View>

        {activeBanners.map((banner) => (
          <Animated.View key={banner.id} entering={FadeInDown.delay(100).duration(400)}>
            <BannerCard banner={banner} onPull={handlePull} />
          </Animated.View>
        ))}
      </ScrollView>

      {showModal && result && (
        <ResultModal
          result={result}
          onClose={() => { setShowModal(false); setResult(null); }}
        />
      )}
    </SafeAreaView>
  );
}
