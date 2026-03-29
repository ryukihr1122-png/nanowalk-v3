/**
 * デイリークエスト画面
 * app/quests/index.tsx
 */

import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withSequence, withTiming,
} from "react-native-reanimated";
import { router } from "expo-router";
import { useEffect } from "react";
import {
  useDailyQuestStore,
  QUEST_TEMPLATES,
  DAILY_CLEAR_BONUS,
} from "@/store/dailyQuestStore";
import { useItemStore } from "@/store/itemStore";
import { useMonetizationStore } from "@/store/monetizationStore";
import { usePlayerStore } from "@/store/playerStore";
import type { QuestReward } from "@/store/dailyQuestStore";

// ---- Reward helper ----
function applyReward(
  reward: QuestReward,
  addItem: (id: string, qty: number) => void,
  addGems: (n: number) => void,
  addStones: (t: any, n: number) => void,
) {
  switch (reward.type) {
    case "item":  addItem(String(reward.value), reward.quantity); break;
    case "gems":  addGems(Number(reward.value));                  break;
    case "stone": addStones(reward.value, reward.quantity);       break;
    case "ball":  addStones(reward.value, reward.quantity);        break; // 旧互換
    case "ne":    /* addNanoEnergy is handled separately */       break;
  }
}

// ---- Progress Bar ----
function QuestProgressBar({ current, target }: { current: number; target: number }) {
  const pct = Math.min(current / target, 1);
  return (
    <View style={{ height: 6, backgroundColor: "#1F1F38", borderRadius: 3, overflow: "hidden", marginTop: 8 }}>
      <View
        style={{
          width: `${pct * 100}%`,
          height: "100%",
          borderRadius: 3,
          backgroundColor: pct >= 1 ? "#00C9A7" : "#5B5EA6",
        }}
      />
    </View>
  );
}

// ---- Quest Card ----
function QuestCard({
  templateId,
  current,
  completed,
  claimed,
  onClaim,
}: {
  templateId: string;
  current: number;
  completed: boolean;
  claimed: boolean;
  onClaim: () => void;
}) {
  const tmpl = QUEST_TEMPLATES.find((t) => t.id === templateId);
  if (!tmpl) return null;

  const claimScale = useSharedValue(1);
  const claimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: claimScale.value }],
  }));

  const handleClaim = () => {
    claimScale.value = withSequence(withSpring(0.9), withSpring(1));
    onClaim();
  };

  const diffColor = {
    easy:   "#00C9A7",
    normal: "#FFD54F",
    hard:   "#FF4081",
  }[tmpl.difficulty];

  return (
    <View
      style={{
        marginBottom: 12,
        borderRadius: 20,
        backgroundColor: "#161628",
        borderWidth: 1,
        borderColor: claimed ? "#1a1a2a" : completed ? "#00C9A740" : "#1F1F38",
        opacity: claimed ? 0.5 : 1,
        overflow: "hidden",
      }}
    >
      {/* Difficulty stripe */}
      <View style={{ height: 3, backgroundColor: claimed ? "#1F1F38" : diffColor }} />

      <View style={{ padding: 16 }}>
        {/* Header row */}
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
          <Text style={{ fontSize: 28 }}>{claimed ? "✅" : tmpl.emoji}</Text>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <Text style={{ color: "#F0F0FF", fontWeight: "900", fontSize: 14 }}>
                {tmpl.title}
              </Text>
              <View
                style={{
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 6,
                  backgroundColor: `${diffColor}20`,
                }}
              >
                <Text style={{ color: diffColor, fontSize: 9, fontWeight: "700" }}>
                  {tmpl.difficulty.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={{ color: "#9090AA", fontSize: 12, marginTop: 2 }}>
              {tmpl.description}
            </Text>
          </View>
        </View>

        {/* Progress */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
          <Text style={{ color: "#606080", fontSize: 11 }}>
            {current} / {tmpl.target}
          </Text>
          <Text style={{ color: "#9090AA", fontSize: 11 }}>
            報酬: {tmpl.reward.emoji} {tmpl.reward.label}
          </Text>
        </View>
        <QuestProgressBar current={current} target={tmpl.target} />

        {/* Claim button */}
        {completed && !claimed && (
          <Animated.View style={claimStyle}>
            <Pressable
              onPress={handleClaim}
              style={{
                marginTop: 12,
                paddingVertical: 10,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: "#00C9A7",
              }}
            >
              <Text style={{ color: "#0D0D1A", fontWeight: "900" }}>
                報酬を受け取る！
              </Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

// ---- Main Screen ----
export default function QuestsScreen() {
  const {
    quests,
    allClearClaimed,
    claimReward,
    claimAllClearBonus,
    refreshIfNeeded,
  } = useDailyQuestStore();

  const { addItem } = useItemStore();
  const { addGems } = useMonetizationStore();
  const { addStones } = usePlayerStore();

  // 画面表示時に日付リセットチェック
  useEffect(() => { refreshIfNeeded(); }, []);

  const completedCount = quests.filter((q) => q.completed).length;
  const claimedCount   = quests.filter((q) => q.claimed).length;
  const allClearReady  = quests.every((q) => q.completed && q.claimed) && !allClearClaimed;

  const handleClaim = (templateId: string) => {
    const reward = claimReward(templateId);
    if (!reward) return;
    applyReward(reward, addItem, addGems, addStones);
    Alert.alert("報酬ゲット！", `${reward.emoji} ${reward.label}`);
  };

  const handleAllClear = () => {
    const reward = claimAllClearBonus();
    if (!reward) return;
    applyReward(reward, addItem, addGems, addStones);
    Alert.alert(
      "🎉 全クリアボーナス！",
      `${reward.emoji} ${reward.label} をゲット！`,
    );
  };

  // リセットまでの残り時間
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const remainMs = midnight.getTime() - now.getTime();
  const rh = Math.floor(remainMs / 3600000);
  const rm = Math.floor((remainMs % 3600000) / 60000);

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
          デイリークエスト
        </Text>
        <Text style={{ color: "#606080", fontSize: 12 }}>
          リセット {rh}h{rm}m
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingTop: 0 }}
      >
        {/* Progress summary */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 16,
            borderRadius: 20,
            backgroundColor: "#161628",
            borderWidth: 1,
            borderColor: "#1F1F38",
            marginBottom: 20,
            gap: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#F0F0FF", fontWeight: "900", fontSize: 15 }}>
              今日の達成状況
            </Text>
            <Text style={{ color: "#9090AA", fontSize: 12, marginTop: 2 }}>
              {claimedCount} / {quests.length} クリア
            </Text>
            <View
              style={{
                height: 6,
                backgroundColor: "#1F1F38",
                borderRadius: 3,
                overflow: "hidden",
                marginTop: 8,
              }}
            >
              <View
                style={{
                  width: `${(claimedCount / quests.length) * 100}%`,
                  height: "100%",
                  borderRadius: 3,
                  backgroundColor: claimedCount === quests.length ? "#FFD700" : "#00C9A7",
                }}
              />
            </View>
          </View>
          {/* All clear indicator */}
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 32 }}>
              {claimedCount === quests.length ? "⭐" : "🎯"}
            </Text>
            {allClearClaimed && (
              <Text style={{ color: "#FFD700", fontSize: 10, fontWeight: "700" }}>
                全クリ済
              </Text>
            )}
          </View>
        </View>

        {/* All clear bonus */}
        {(allClearReady || allClearClaimed) && (
          <Pressable
            onPress={allClearReady ? handleAllClear : undefined}
            disabled={allClearClaimed}
            style={{
              padding: 16,
              borderRadius: 20,
              backgroundColor: allClearClaimed ? "#1F1F38" : "#FFD70015",
              borderWidth: 2,
              borderColor: allClearClaimed ? "#2a2a4a" : "#FFD70060",
              alignItems: "center",
              marginBottom: 20,
              opacity: allClearClaimed ? 0.5 : 1,
            }}
          >
            <Text style={{ fontSize: 32 }}>
              {allClearClaimed ? "✅" : DAILY_CLEAR_BONUS.emoji}
            </Text>
            <Text style={{ color: "#FFD700", fontWeight: "900", marginTop: 4 }}>
              全クリアボーナス
            </Text>
            <Text style={{ color: "#9090AA", fontSize: 12, marginTop: 2 }}>
              {DAILY_CLEAR_BONUS.label}
            </Text>
            {allClearReady && (
              <Text
                style={{
                  color: "#0D0D1A",
                  fontWeight: "900",
                  fontSize: 13,
                  marginTop: 10,
                  backgroundColor: "#FFD700",
                  paddingHorizontal: 20,
                  paddingVertical: 8,
                  borderRadius: 12,
                }}
              >
                受け取る！
              </Text>
            )}
          </Pressable>
        )}

        {/* Quest list */}
        {quests.map((q) => (
          <QuestCard
            key={q.templateId}
            {...q}
            onClaim={() => handleClaim(q.templateId)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
