/**
 * NanoWalk — モンスター詳細画面 v2.0
 * コレクション特化設計
 */

import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSpring, withSequence, Easing,
  FadeInDown,
} from "react-native-reanimated";
import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { usePlayerStore } from "@/store/playerStore";
import { getMonsterById } from "@/constants/monsters";
import { getUnlockedTraits, getNewlyUnlockedTrait } from "@/services/scoutService";
import { useEvolution } from "@/hooks/useEvolution";
import { MAX_LEVEL_BY_RARITY } from "@/types";
import type { RarityType, ElementType, Trait } from "@/types";

const RARITY_COLOR: Record<RarityType, string> = {
  N:"#9090AA", R:"#4FC3F7", SR:"#AB47BC", SSR:"#FFD700", UR:"#FF4081",
};
const ELEMENT_EMOJI: Record<ElementType, string> = {
  flare:"🔥", aqua:"💧", forest:"🌿", bolt:"⚡", shadow:"🌑", lumina:"✨",
};
const TRIGGER_LABEL: Record<string, string> = {
  on_own:       "常時発動",
  on_field:     "フィールド探索中",
  on_scout:     "スカウト時",
  weather_sunny:"晴天時",
  weather_rainy:"雨天時",
  weather_snowy:"雪天時",
  area_match:   "エリア属性一致時",
  same_element: "同属性スカウト時",
  night:        "夜間（22時〜4時）",
};

// ---- レベルバー ----
function LevelBar({ level, max }: { level: number; max: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {Array.from({ length: max }).map((_, i) => (
        <View key={i} style={{
          flex: 1, height: 8, borderRadius: 4,
          backgroundColor: i < level ? "#00C9A7" : "#1F1F38",
        }} />
      ))}
    </View>
  );
}

// ---- 特性カード ----
function TraitCard({ trait, unlocked }: { trait: Trait; unlocked: boolean }) {
  return (
    <View style={{
      padding: 12, borderRadius: 14, marginBottom: 8,
      backgroundColor: unlocked ? "#161628" : "#0D0D1A",
      borderWidth: 1,
      borderColor: unlocked ? "#00C9A730" : "#1F1F38",
      opacity: unlocked ? 1 : 0.5,
    }}>
      <View style={{ flexDirection: "row", alignItems: "center",
        justifyContent: "space-between", marginBottom: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ fontSize: 16 }}>
            {unlocked ? "✨" : "🔒"}
          </Text>
          <Text style={{ color: unlocked ? "#F0F0FF" : "#404060",
            fontWeight: "700", fontSize: 14 }}>
            {trait.name}
          </Text>
        </View>
        <View style={{ paddingHorizontal: 8, paddingVertical: 2,
          borderRadius: 8,
          backgroundColor: unlocked ? "#00C9A720" : "#1F1F38" }}>
          <Text style={{
            color: unlocked ? "#00C9A7" : "#404060",
            fontSize: 10, fontWeight: "700",
          }}>
            Lv.{trait.unlockLevel}
          </Text>
        </View>
      </View>
      <Text style={{ color: unlocked ? "#B0B0CC" : "#303050",
        fontSize: 12, marginBottom: 4 }}>
        {trait.description}
      </Text>
      <Text style={{ color: "#505070", fontSize: 10 }}>
        {TRIGGER_LABEL[trait.trigger] ?? trait.trigger}
      </Text>
    </View>
  );
}

// ============================================================
// Main Screen
// ============================================================
export default function MonsterDetailScreen() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const { monsters, setFavorite, setCompanion, setNickname } = usePlayerStore();
  const { checkCanEvolve, triggerEvolution } = useEvolution();

  const monster    = monsters.find((m) => m.uuid === uuid);
  const definition = monster ? getMonsterById(monster.definitionId) : null;

  const evolvedDef = definition?.evolvesTo
    ? getMonsterById(definition.evolvesTo) : null;

  const maxLevel = definition
    ? MAX_LEVEL_BY_RARITY[definition.rarity] : 5;

  const unlockedTraits = (definition && monster)
    ? getUnlockedTraits(definition, monster.level) : [];

  const nextTrait = (definition && monster && monster.level < maxLevel)
    ? definition.traits.find((t) => t.unlockLevel === monster.level + 1)
    : null;

  // bounce animation
  const bounce = useSharedValue(0);
  useEffect(() => {
    bounce.value = withRepeat(
      withTiming(-8, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1, true
    );
  }, []);
  const bounceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }],
  }));

  if (!monster || !definition) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0D0D1A",
        alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#9090AA" }}>モンスターが見つかりません</Text>
      </SafeAreaView>
    );
  }

  const rarityColor = RARITY_COLOR[definition.rarity];
  const evolutionCheck = monster ? checkCanEvolve(monster.uuid) : null;
  const canEvolve = evolutionCheck?.canEvolve ?? false;

  const handleSetCompanion = () => {
    setCompanion(monster.uuid);
    Alert.alert("相棒に設定しました！", `${definition.name} が相棒になりました。`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0D0D1A" }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center",
        paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 10 }}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: "#00C9A7", fontSize: 18 }}>←</Text>
        </Pressable>
        <Text style={{ color: "#F0F0FF", fontWeight: "900", fontSize: 20, flex: 1 }}>
          {monster.nickname ?? definition.name}
        </Text>
        <Pressable onPress={() => setFavorite(monster.uuid, !monster.isFavorite)}>
          <Text style={{ fontSize: 22 }}>
            {monster.isFavorite ? "⭐" : "☆"}
          </Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}>

        {/* ヒーローカード */}
        <View style={{ marginHorizontal: 20, marginBottom: 16,
          padding: 24, borderRadius: 24, alignItems: "center",
          backgroundColor: "#161628",
          borderWidth: 2, borderColor: `${rarityColor}40` }}>

          <Animated.View style={bounceStyle}>
            <View style={{ width: 120, height: 120, borderRadius: 20,
              backgroundColor: `${rarityColor}18`,
              alignItems: "center", justifyContent: "center",
              borderWidth: 2, borderColor: `${rarityColor}60`,
              marginBottom: 12 }}>
              <Text style={{ fontSize: 64 }}>
                {ELEMENT_EMOJI[definition.element]}
              </Text>
            </View>
          </Animated.View>

          {/* バッジ */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
            <View style={{ paddingHorizontal: 10, paddingVertical: 4,
              borderRadius: 10, backgroundColor: `${rarityColor}22` }}>
              <Text style={{ color: rarityColor, fontWeight: "700", fontSize: 12 }}>
                {definition.rarity}
              </Text>
            </View>
            <View style={{ paddingHorizontal: 10, paddingVertical: 4,
              borderRadius: 10, backgroundColor: "#1F1F38" }}>
              <Text style={{ color: "#9090AA", fontSize: 12 }}>
                {ELEMENT_EMOJI[definition.element]} {definition.element}
              </Text>
            </View>
          </View>

          <Text style={{ color: "#F0F0FF", fontWeight: "900", fontSize: 22, marginBottom: 4 }}>
            {definition.name}
          </Text>
          {monster.nickname && (
            <Text style={{ color: "#9090AA", fontSize: 13 }}>
              「{monster.nickname}」
            </Text>
          )}
          <Text style={{ color: "#9090AA", fontSize: 12,
            textAlign: "center", marginTop: 8, lineHeight: 18 }}>
            {definition.description}
          </Text>
        </View>

        {/* レベル（所持枚数） */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}
          style={{ marginHorizontal: 20, marginBottom: 16,
            padding: 16, borderRadius: 18,
            backgroundColor: "#161628", borderWidth: 1, borderColor: "#1F1F38" }}>

          <View style={{ flexDirection: "row", justifyContent: "space-between",
            alignItems: "center", marginBottom: 12 }}>
            <Text style={{ color: "#F0F0FF", fontWeight: "900", fontSize: 16 }}>
              レベル
            </Text>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
              <Text style={{ color: "#00C9A7", fontWeight: "900", fontSize: 28 }}>
                {monster.level}
              </Text>
              <Text style={{ color: "#9090AA", fontSize: 14 }}>
                / {maxLevel}
              </Text>
            </View>
          </View>

          <LevelBar level={monster.level} max={maxLevel} />

          <Text style={{ color: "#606080", fontSize: 11, marginTop: 8 }}>
            同じモンスターをスカウトするとレベルアップ（所持枚数 = レベル）
          </Text>

          {/* 次のレベルアップで何が解放されるか */}
          {nextTrait && monster.level < maxLevel && (
            <View style={{ marginTop: 10, padding: 10, borderRadius: 12,
              backgroundColor: "#FFD70010",
              borderWidth: 1, borderColor: "#FFD70030" }}>
              <Text style={{ color: "#FFD700", fontSize: 11, fontWeight: "700" }}>
                Lv.{monster.level + 1} で「{nextTrait.name}」が解放されます
              </Text>
            </View>
          )}

          {monster.level >= maxLevel && (
            <View style={{ marginTop: 10, padding: 10, borderRadius: 12,
              backgroundColor: "#FFD70015",
              borderWidth: 1, borderColor: "#FFD70040",
              alignItems: "center" }}>
              <Text style={{ color: "#FFD700", fontWeight: "900" }}>
                ⭐ 最大レベル達成！
              </Text>
            </View>
          )}
        </Animated.View>

        {/* 特性一覧 */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}
          style={{ marginHorizontal: 20, marginBottom: 16 }}>
          <Text style={{ color: "#9090AA", fontSize: 11, fontWeight: "700",
            textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
            特性 ({unlockedTraits.length}/{definition.traits.length})
          </Text>
          {definition.traits.map((trait) => (
            <TraitCard
              key={trait.id}
              trait={trait}
              unlocked={!!unlockedTraits.find((t) => t.id === trait.id)}
            />
          ))}
        </Animated.View>

        {/* 進化パネル */}
        {evolvedDef && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)}
            style={{ marginHorizontal: 20, marginBottom: 16,
              padding: 16, borderRadius: 18,
              backgroundColor: "#161628", borderWidth: 1,
              borderColor: canEvolve ? "#AB47BC40" : "#1F1F38" }}>

            <Text style={{ color: "#F0F0FF", fontWeight: "900",
              fontSize: 14, marginBottom: 12 }}>進化</Text>

            <View style={{ flexDirection: "row", alignItems: "center",
              justifyContent: "space-around" }}>
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 36 }}>
                  {ELEMENT_EMOJI[definition.element]}
                </Text>
                <Text style={{ color: "#9090AA", fontSize: 11, marginTop: 4 }}>
                  {definition.name}
                </Text>
              </View>
              <Text style={{ color: "#AB47BC", fontSize: 28 }}>→</Text>
              <View style={{ alignItems: "center" }}>
                <View style={{ width: 56, height: 56, borderRadius: 14,
                  backgroundColor: "#AB47BC18",
                  alignItems: "center", justifyContent: "center",
                  borderWidth: 1, borderColor: "#AB47BC40" }}>
                  <Text style={{ fontSize: 28 }}>
                    {ELEMENT_EMOJI[evolvedDef.element]}
                  </Text>
                </View>
                <Text style={{ color: "#F0F0FF", fontWeight: "700",
                  fontSize: 12, marginTop: 4 }}>
                  {evolvedDef.name}
                </Text>
              </View>
            </View>

            {/* 進化条件・ボタン */}
            {canEvolve ? (
              <Pressable
                onPress={() => {
                  const ok = triggerEvolution(monster.uuid);
                  if (ok) {
                    Alert.alert(
                      "⚡ 進化解放！",
                      `${evolvedDef?.name} がエンカウントに現れます！スカウットして捕まえましょう。`,
                      [{ text: "OK！" }]
                    );
                  }
                }}
                style={{ marginTop: 14, paddingVertical: 14, borderRadius: 16,
                  backgroundColor: "#AB47BC", alignItems: "center" }}>
                <Text style={{ color: "#0D0D1A", fontWeight: "900", fontSize: 15 }}>
                  ⚡ 進化を解放する
                </Text>
                <Text style={{ color: "#0D0D1A88", fontSize: 11, marginTop: 2 }}>
                  {evolvedDef?.name} がエンカウントに追加されます
                </Text>
              </Pressable>
            ) : (
              <View style={{ marginTop: 10, padding: 10, borderRadius: 12,
                backgroundColor: "#1F1F38" }}>
                <Text style={{ color: "#9090AA", fontSize: 12, textAlign: "center" }}>
                  {evolutionCheck?.reason ?? `Lv.${definition.evolutionLevel} で進化可能（現在 Lv.${monster.level}）`}
                </Text>
                {/* 進捗バー */}
                <View style={{ height: 4, backgroundColor: "#2a2a4a",
                  borderRadius: 2, overflow: "hidden", marginTop: 8 }}>
                  <View style={{
                    height: 4, borderRadius: 2, backgroundColor: "#AB47BC",
                    width: `${Math.min((monster.level / (definition.evolutionLevel ?? 1)) * 100, 100)}%`
                  }} />
                </View>
                <Text style={{ color: "#606080", fontSize: 10, textAlign: "center", marginTop: 4 }}>
                  {monster.level} / {definition.evolutionLevel}
                </Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* アクションボタン */}
        <View style={{ marginHorizontal: 20, gap: 10 }}>
          <Pressable onPress={handleSetCompanion}
            style={{ paddingVertical: 14, borderRadius: 18,
              backgroundColor: "#00C9A720",
              borderWidth: 1, borderColor: "#00C9A740",
              alignItems: "center" }}>
            <Text style={{ color: "#00C9A7", fontWeight: "700" }}>
              🤝 相棒に設定する
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Alert.prompt("ニックネームをつける", "",
                (text) => { if (text) setNickname(monster.uuid, text); });
            }}
            style={{ paddingVertical: 14, borderRadius: 18,
              backgroundColor: "#161628",
              borderWidth: 1, borderColor: "#1F1F38",
              alignItems: "center" }}>
            <Text style={{ color: "#9090AA", fontWeight: "700" }}>
              ✏️ ニックネームをつける
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
