/**
 * NanoWalk — マップ画面
 * app/(tabs)/map.tsx
 *
 * 7エリアの解禁ストーリー演出、エリア詳細、移動機能
 */

import {
  View, Text, ScrollView, Pressable, Modal, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  FadeIn, FadeInDown, FadeInRight,
  useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSpring, withSequence,
  Easing,
} from "react-native-reanimated";
import { useEffect, useState } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { getAreaRaritySummary } from "@/services/encounterService";
import { getActiveEvents } from "@/constants/game";
import { AREA_CONFIG } from "@/constants/game";
import type { AreaId, ElementType } from "@/types";

const { width } = Dimensions.get("window");

// ---- エリア設定（UIレイヤー） ----

interface AreaUIConfig {
  emoji:       string;
  bgGradient:  string;  // 背景色
  accentColor: string;  // アクセントカラー
  terrain:     string;  // 地形タイプ説明
  weather:     string;  // 特徴的な天候
  rarity:      string;  // 出現レアリティ
  story:       string;  // 解禁ストーリーテキスト
  monsters:    string[];// 出現代表モンスター
  tips:        string;  // 攻略ヒント
}

const AREA_UI: Record<AreaId, AreaUIConfig> = {
  nano_plains: {
    emoji:      "🌿",
    bgGradient: "#0D1F0D",
    accentColor:"#66BB6A",
    terrain:    "広大な草原",
    weather:    "晴れ・曇り",
    rarity:     "N〜R",
    story:      "ナノの世界への入り口。広大な緑の草原に、小さな生命体たちが息づいている。ここから君の旅が始まる。",
    monsters:   ["🌿 ナノバナナ", "🌿 コケモス", "💧 プルプルン"],
    tips:       "昼間は森属性、夜は影属性が出やすい。まず10種類を目指そう！",
  },
  crystal_cave: {
    emoji:      "💎",
    bgGradient: "#0D0D2E",
    accentColor:"#4FC3F7",
    terrain:    "地下洞窟",
    weather:    "常時薄暗",
    rarity:     "N〜SR",
    story:      "地下深くに広がる神秘の洞窟。水晶の壁が電気を帯び、闇の中で妖しく輝く。特殊な生態系が存在する。",
    monsters:   ["⚡ ピカトン", "🌑 クロモチン", "💎 ジルコン"],
    tips:       "ボルト・シャドウ属性が充実。洞窟内は昼夜関係なく珍しいモンスターに会える。",
  },
  flare_valley: {
    emoji:      "🔥",
    bgGradient: "#2E0D00",
    accentColor:"#FF6B35",
    terrain:    "溶岩渓谷",
    weather:    "晴天・高温",
    rarity:     "R〜SR",
    story:      "灼熱の大地が広がる渓谷。溶岩流が生み出す独特のエコシステムに、炎と光を操る強力なナノンが棲む。",
    monsters:   ["🔥 フレアボム", "🔥 インフェルノン", "✨ アークライト"],
    tips:       "晴れた日の昼間にフレア属性が大量出現。NEの稼ぎ場として最適。",
  },
  deep_ocean: {
    emoji:      "🌊",
    bgGradient: "#000D2E",
    accentColor:"#0288D1",
    terrain:    "深海底",
    weather:    "雨天時に強化",
    rarity:     "R〜SSR",
    story:      "海面下数千メートルの深淵。光も届かないその場所で、古代から存在するナノンたちが静かに暮らしている。",
    monsters:   ["💧 タイダルコロ", "💧 ディープコーラル", "💧 アビスマン"],
    tips:       "雨の日に出現率が2倍になる特殊エリア。SSRが比較的狙いやすい。",
  },
  neon_jungle: {
    emoji:      "🌴",
    bgGradient: "#001A0D",
    accentColor:"#00C9A7",
    terrain:    "熱帯ジャングル",
    weather:    "夜間特化",
    rarity:     "SR〜SSR",
    story:      "昼は静かなジャングルが、夜になると突然輝き始める。生物が発する生体発光が、別世界のような光景を作り出す。",
    monsters:   ["🌿 フォレスタルン", "🌑 ダークネスキング", "🌿 マッシュキング"],
    tips:       "22時〜4時の間にSR出現率が3倍。ただし体力管理に注意！",
  },
  frost_peak: {
    emoji:      "❄️",
    bgGradient: "#0D1A2E",
    accentColor:"#80DEEA",
    terrain:    "万年雪山",
    weather:    "雪天・強風",
    rarity:     "SSR〜UR",
    story:      "常に雪が降り続ける山頂。極限の寒さに適応したナノンだけが生き残れる過酷な環境。URの目撃情報も多い。",
    monsters:   ["💧 フロストタイタン", "⚡ テンペストロード", "❄️ フリーズトン"],
    tips:       "雪天時のみ特殊モンスターが出現。URの捕獲チャンスあり！",
  },
  nano_core: {
    emoji:      "⚡",
    bgGradient: "#1A001A",
    accentColor:"#FF4081",
    terrain:    "ナノの核心",
    weather:    "エネルギー嵐",
    rarity:     "SSR〜UR",
    story:      "世界の中心。すべての属性エネルギーが収束する場所。ここに至った者だけが、伝説のナノンに出会える。",
    monsters:   ["🌈 ガイアノヴァ", "🌑 ゼロウォーカー", "🌈 ナノウォーカー"],
    tips:       "100万歩達成者のみが入れる聖域。URの出現率が全エリア最高。",
  },
};

// ---- 解禁ストーリーモーダル ----
function UnlockStoryModal({ areaId, onClose }: {
  areaId: AreaId; onClose: () => void;
}) {
  const ui  = AREA_UI[areaId];
  const cfg = AREA_CONFIG[areaId];

  const scale = useSharedValue(0.8);
  useEffect(() => {
    scale.value = withSpring(1, { damping: 10 });
  }, []);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Modal transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.85)",
        justifyContent: "center", padding: 28 }}>
        <Animated.View style={[animStyle, {
          backgroundColor: ui.bgGradient,
          borderRadius: 28, padding: 28,
          borderWidth: 2, borderColor: `${ui.accentColor}60`,
        }]}>
          {/* 解禁エフェクト */}
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <Text style={{ fontSize: 64 }}>{ui.emoji}</Text>
            <Text style={{ color: ui.accentColor, fontWeight: "900",
              fontSize: 11, letterSpacing: 3, marginTop: 8 }}>
              NEW AREA UNLOCKED
            </Text>
            <Text style={{ color: "#F0F0FF", fontWeight: "900", fontSize: 26, marginTop: 4 }}>
              {cfg.name}
            </Text>
          </View>

          {/* ストーリーテキスト */}
          <View style={{ padding: 16, borderRadius: 16,
            backgroundColor: "rgba(0,0,0,0.4)", marginBottom: 16 }}>
            <Text style={{ color: "#D0D0EE", fontSize: 14, lineHeight: 22, textAlign: "center" }}>
              {ui.story}
            </Text>
          </View>

          {/* 出現モンスター */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: ui.accentColor, fontSize: 11, fontWeight: "700",
              marginBottom: 8 }}>出現モンスター</Text>
            {ui.monsters.map((m) => (
              <Text key={m} style={{ color: "#9090AA", fontSize: 12, marginBottom: 3 }}>
                • {m}
              </Text>
            ))}
          </View>

          <Pressable onPress={onClose} style={{ paddingVertical: 16, borderRadius: 20,
            backgroundColor: ui.accentColor, alignItems: "center" }}>
            <Text style={{ color: "#0D0D1A", fontWeight: "900", fontSize: 16 }}>
              探索開始！
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ---- エリア詳細モーダル ----
function AreaDetailModal({ areaId, isActive, onMove, onClose }: {
  areaId: AreaId; isActive: boolean;
  onMove: () => void; onClose: () => void;
}) {
  const ui  = AREA_UI[areaId];
  const cfg = AREA_CONFIG[areaId];

  return (
    <Modal transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: ui.bgGradient, borderTopLeftRadius: 28,
          borderTopRightRadius: 28, padding: 24,
          borderTopWidth: 2, borderColor: `${ui.accentColor}40` }}>

          {/* ヘッダー */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <Text style={{ fontSize: 40, marginRight: 12 }}>{ui.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#F0F0FF", fontWeight: "900", fontSize: 22 }}>
                {cfg.name}
              </Text>
              <Text style={{ color: "#9090AA", fontSize: 12, marginTop: 2 }}>
                {ui.terrain} · {ui.weather}
              </Text>
            </View>
            {isActive && (
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
                backgroundColor: `${ui.accentColor}20`,
                borderWidth: 1, borderColor: `${ui.accentColor}40` }}>
                <Text style={{ color: ui.accentColor, fontSize: 11, fontWeight: "700" }}>
                  現在地
                </Text>
              </View>
            )}
          </View>

          {/* ストーリー */}
          <Text style={{ color: "#B0B0CC", fontSize: 13, lineHeight: 20, marginBottom: 16 }}>
            {ui.story}
          </Text>

          {/* 詳細情報 */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
            {[
              { label: "出現レアリティ", value: ui.rarity },
              { label: "特徴属性", value: cfg.elementBonus.map((e) => {
                const emojis: Record<string, string> = {
                  forest:"🌿",aqua:"💧",flare:"🔥",bolt:"⚡",shadow:"🌑",lumina:"✨"
                };
                return emojis[e] ?? e;
              }).join(" ") },
            ].map((item) => (
              <View key={item.label} style={{ flex: 1, padding: 12, borderRadius: 14,
                backgroundColor: "rgba(0,0,0,0.4)",
                borderWidth: 1, borderColor: `${ui.accentColor}25` }}>
                <Text style={{ color: "#9090AA", fontSize: 10, marginBottom: 4 }}>
                  {item.label}
                </Text>
                <Text style={{ color: "#F0F0FF", fontWeight: "700", fontSize: 13 }}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>

          {/* 出現モンスター */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: ui.accentColor, fontSize: 11, fontWeight: "700",
              marginBottom: 8 }}>代表モンスター</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {ui.monsters.map((m) => (
                <View key={m} style={{ paddingHorizontal: 10, paddingVertical: 5,
                  borderRadius: 20, backgroundColor: `${ui.accentColor}15`,
                  borderWidth: 1, borderColor: `${ui.accentColor}30` }}>
                  <Text style={{ color: ui.accentColor, fontSize: 12 }}>{m}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ヒント */}
          <View style={{ padding: 12, borderRadius: 14, marginBottom: 16,
            backgroundColor: "rgba(255,255,255,0.05)",
            borderWidth: 1, borderColor: "#1F1F38" }}>
            <Text style={{ color: "#9090AA", fontSize: 10, marginBottom: 3 }}>💡 攻略ヒント</Text>
            <Text style={{ color: "#B0B0CC", fontSize: 12 }}>{ui.tips}</Text>
          </View>

          {/* ボタン */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable onPress={onClose} style={{ flex: 1, paddingVertical: 14,
              borderRadius: 16, backgroundColor: "#1F1F38", alignItems: "center" }}>
              <Text style={{ color: "#9090AA", fontWeight: "700" }}>閉じる</Text>
            </Pressable>
            {!isActive && (
              <Pressable onPress={onMove} style={{ flex: 2, paddingVertical: 14,
                borderRadius: 16, backgroundColor: ui.accentColor, alignItems: "center" }}>
                <Text style={{ color: "#0D0D1A", fontWeight: "900", fontSize: 15 }}>
                  このエリアに移動
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ---- エリアカード ----
function AreaCard({ areaId, isUnlocked, isActive, progress, onPress }: {
  areaId: AreaId; isUnlocked: boolean; isActive: boolean;
  progress: number; onPress: () => void;
}) {
  const ui  = AREA_UI[areaId];
  const cfg = AREA_CONFIG[areaId];

  // アクティブエリアは点滅
  const glow = useSharedValue(1);
  useEffect(() => {
    if (isActive) {
      glow.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        ), -1, false
      );
    }
  }, [isActive]);
  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: isActive ? glow.value * 0.4 : 0,
    shadowColor: ui.accentColor,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  }));

  return (
    <Animated.View entering={FadeInRight.delay(100).duration(400)} style={glowStyle}>
      <Pressable
        onPress={isUnlocked ? onPress : undefined}
        style={{
          marginBottom: 10, borderRadius: 20, overflow: "hidden",
          backgroundColor: ui.bgGradient,
          borderWidth: isActive ? 2 : 1,
          borderColor: isActive ? ui.accentColor : `${ui.accentColor}25`,
          opacity: isUnlocked ? 1 : 0.55,
        }}
      >
        <View style={{ padding: 16, flexDirection: "row", alignItems: "center" }}>
          {/* アイコン */}
          <View style={{ width: 60, height: 60, borderRadius: 18,
            backgroundColor: `${ui.accentColor}18`,
            alignItems: "center", justifyContent: "center", marginRight: 14,
            borderWidth: 1, borderColor: `${ui.accentColor}30` }}>
            {isUnlocked
              ? <Text style={{ fontSize: 32 }}>{ui.emoji}</Text>
              : <Text style={{ fontSize: 28 }}>🔒</Text>
            }
          </View>

          {/* テキスト */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <Text style={{ color: isUnlocked ? "#F0F0FF" : "#505070",
                fontWeight: "900", fontSize: 16 }}>
                {cfg.name}
              </Text>
              {isActive && (
                <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
                  backgroundColor: `${ui.accentColor}20`,
                  borderWidth: 1, borderColor: `${ui.accentColor}40` }}>
                  <Text style={{ color: ui.accentColor, fontSize: 10, fontWeight: "700" }}>
                    現在地
                  </Text>
                </View>
              )}
            </View>
            <Text style={{ color: "#9090AA", fontSize: 12, marginBottom: 6 }} numberOfLines={1}>
              {isUnlocked ? cfg.description : `${cfg.unlockSteps.toLocaleString()}歩で解禁`}
            </Text>

            {/* 解禁進捗バー */}
            {!isUnlocked && (
              <View>
                <View style={{ height: 4, backgroundColor: "#1F1F38",
                  borderRadius: 2, overflow: "hidden" }}>
                  <View style={{ height: 4,
                    width: `${Math.min(progress * 100, 100)}%`,
                    backgroundColor: ui.accentColor, borderRadius: 2 }} />
                </View>
                <Text style={{ color: "#606080", fontSize: 9, marginTop: 3 }}>
                  {Math.floor(progress * 100)}% 解禁済み
                </Text>
              </View>
            )}

            {/* 解禁済み：属性ボーナスバッジ */}
            {isUnlocked && (
              <View style={{ flexDirection: "row", gap: 4 }}>
                {cfg.elementBonus.map((el) => {
                  const emojis: Record<string, string> = {
                    forest:"🌿",aqua:"💧",flare:"🔥",
                    bolt:"⚡",shadow:"🌑",lumina:"✨"
                  };
                  return (
                    <View key={el} style={{ paddingHorizontal: 7, paddingVertical: 2,
                      borderRadius: 8, backgroundColor: `${ui.accentColor}18`,
                      borderWidth: 1, borderColor: `${ui.accentColor}30` }}>
                      <Text style={{ fontSize: 10 }}>{emojis[el] ?? el}</Text>
                    </View>
                  );
                })}
                <View style={{ paddingHorizontal: 7, paddingVertical: 2,
                  borderRadius: 8, backgroundColor: "#1F1F38" }}>
                  <Text style={{ color: "#606080", fontSize: 10 }}>{ui.rarity}</Text>
                </View>
              </View>
            )}
          </View>

          {isUnlocked && (
            <Text style={{ color: "#404060", marginLeft: 8 }}>›</Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ============================================================
// Main Screen
// ============================================================
export default function MapScreen() {
  const { player, updateMonster } = usePlayerStore();
  const [selectedArea, setSelectedArea] = useState<AreaId | null>(null);
  const [unlockStoryArea, setUnlockStoryArea] = useState<AreaId | null>(null);

  const totalSteps   = player?.totalSteps ?? 0;
  const currentArea  = (player?.currentArea ?? "nano_plains") as AreaId;

  const AREA_IDS: AreaId[] = [
    "nano_plains", "crystal_cave", "flare_valley",
    "deep_ocean", "neon_jungle", "frost_peak", "nano_core",
  ];

  const isUnlocked = (areaId: AreaId) =>
    totalSteps >= AREA_CONFIG[areaId].unlockSteps;

  const getProgress = (areaId: AreaId) => {
    const needed = AREA_CONFIG[areaId].unlockSteps;
    if (needed === 0) return 1;
    return Math.min(totalSteps / needed, 1);
  };

  const unlockedCount = AREA_IDS.filter(isUnlocked).length;

  const handleMove = (areaId: AreaId) => {
    if (!player) return;
    // プレイヤーの現在地を更新
    usePlayerStore.setState((s) => ({
      player: s.player ? { ...s.player, currentArea: areaId } : null,
    }));
    setSelectedArea(null);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0D0D1A" }} edges={["top"]}>

      {/* ---- ヘッダー ---- */}
      <Animated.View entering={FadeIn.duration(400)}
        style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
        <Text style={{ color: "#F0F0FF", fontWeight: "900", fontSize: 22 }}>
          ワールドマップ
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center",
          justifyContent: "space-between", marginTop: 4 }}>
          <Text style={{ color: "#9090AA", fontSize: 13 }}>
            現在地: {AREA_CONFIG[currentArea].name}
          </Text>
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
            backgroundColor: "#161628", borderWidth: 1, borderColor: "#1F1F38" }}>
            <Text style={{ color: "#9090AA", fontSize: 11 }}>
              {unlockedCount}/7 解禁
            </Text>
          </View>
        </View>

        {/* 総歩数プログレス */}
        <View style={{ marginTop: 12, padding: 12, borderRadius: 16,
          backgroundColor: "#161628", borderWidth: 1, borderColor: "#1F1F38" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <Text style={{ color: "#9090AA", fontSize: 11 }}>総歩数</Text>
            <Text style={{ color: "#00C9A7", fontWeight: "700", fontSize: 13 }}>
              {totalSteps.toLocaleString()} 歩
            </Text>
          </View>
          {/* 次のエリア解禁まで */}
          {(() => {
            const next = AREA_IDS.find((id) => !isUnlocked(id));
            if (!next) return (
              <Text style={{ color: "#FFD700", fontSize: 11, textAlign: "center" }}>
                🌈 全エリア解禁達成！
              </Text>
            );
            const needed = AREA_CONFIG[next].unlockSteps;
            const pct = Math.min(totalSteps / needed, 1);
            return (
              <>
                <View style={{ height: 4, backgroundColor: "#1F1F38",
                  borderRadius: 2, overflow: "hidden", marginBottom: 4 }}>
                  <View style={{ height: 4, width: `${pct * 100}%`,
                    backgroundColor: AREA_UI[next].accentColor, borderRadius: 2 }} />
                </View>
                <Text style={{ color: "#606080", fontSize: 10 }}>
                  次の解禁「{AREA_CONFIG[next].name}」まで
                  あと {(needed - totalSteps).toLocaleString()} 歩
                </Text>
              </>
            );
          })()}
        </View>
      </Animated.View>

      {/* ---- エリアリスト ---- */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        {AREA_IDS.map((areaId) => (
          <AreaCard
            key={areaId}
            areaId={areaId}
            isUnlocked={isUnlocked(areaId)}
            isActive={areaId === currentArea}
            progress={getProgress(areaId)}
            onPress={() => setSelectedArea(areaId)}
          />
        ))}
      </ScrollView>

      {/* ---- エリア詳細モーダル ---- */}
      {selectedArea && (
        <AreaDetailModal
          areaId={selectedArea}
          isActive={selectedArea === currentArea}
          onMove={() => handleMove(selectedArea)}
          onClose={() => setSelectedArea(null)}
        />
      )}

      {/* ---- 解禁ストーリーモーダル ---- */}
      {unlockStoryArea && (
        <UnlockStoryModal
          areaId={unlockStoryArea}
          onClose={() => setUnlockStoryArea(null)}
        />
      )}
    </SafeAreaView>
  );
}
