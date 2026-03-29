import { View, Text, ScrollView, Pressable, Dimensions, Image } from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { usePedometer } from "@/hooks/usePedometer";
import { usePlayerStore } from "@/store/playerStore";
import { useResidents } from "@/hooks/useResidents";
import { ResidentList } from "@/components/ResidentList";
import { EncounterCardList } from "@/components/EncounterCardList";
import { ActiveEffectsHUD } from "@/components/ActiveEffectsHUD";
import { LoginBonusModal } from "@/components/LoginBonusModal";
import { useLoginBonusStore } from "@/store/loginBonusStore";
import { useEncounter } from "@/hooks/useEncounter";
import { useEncounterStore } from "@/store/encounterStore";
import { useItemStore } from "@/store/itemStore";
import { getDropDisplayInfo } from "@/services/itemDropService";
import { getMonsterById } from "@/constants/monsters";
import { shouldDropItem, rollDroppedItem } from "@/services/itemDropService";
import { MONSTER_POOL } from "@/constants/monsters";
import { rollRarity, pickMonsterFromPool } from "@/services/encounterService";
import { NE_DAILY_CAP } from "@/constants/game";
import { getMonsterImage } from "@/constants/monsterImages";

const DAILY_GOAL = 10_000;

// ---- Step Ring ----

function StepRing({ steps, goal }: { steps: number; goal: number }) {
  const progress = Math.min(steps / goal, 1);
  const percentage = Math.round(progress * 100);

  const ringSize = Math.min(SCREEN_WIDTH * 0.55, 210);
  const innerSize = ringSize * 0.84;

  return (
    <View style={{ alignItems: "center", justifyContent: "center", marginVertical: 20 }}>
      <View
        style={{
          width: ringSize, height: ringSize, borderRadius: ringSize / 2,
          alignItems: "center", justifyContent: "center",
          borderWidth: 3, borderColor: "#1F1F38",
          backgroundColor: "#161628",
          shadowColor: "#00C9A7", shadowOpacity: 0.3,
          shadowRadius: 20, elevation: 10,
        }}
      >
        <View
          style={{
            width: innerSize, height: innerSize, borderRadius: innerSize / 2,
            alignItems: "center", justifyContent: "center",
            borderWidth: 6,
            borderColor: progress >= 1 ? "#00C9A7" : progress > 0.5 ? "#5B5EA6" : "#1F1F38",
          }}
        >
          <Text style={{ fontSize: 36, fontWeight: "900", color: "#F0F0FF" }}>
            {steps.toLocaleString()}
          </Text>
          <Text style={{ color: "#9090AA", fontSize: 13, marginTop: 2 }}>
            歩 / {goal.toLocaleString()}歩
          </Text>
          <View style={{ marginTop: 6, paddingHorizontal: 10, paddingVertical: 2,
            borderRadius: 20, backgroundColor: "#1F1F38" }}>
            <Text style={{ color: "#00C9A7", fontSize: 12, fontWeight: "700" }}>
              {percentage}%
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ---- NE Gauge ----

function NEGauge({ current, max }: { current: number; max: number }) {
  const progress = Math.min(current / max, 1);

  return (
    <View className="mx-6 mb-4">
      <View className="flex-row justify-between mb-1">
        <Text className="text-text-muted text-xs font-nunito">ナノエナジー</Text>
        <Text className="text-primary text-xs font-nunito-bold">
          {current} / {max} NE
        </Text>
      </View>
      <View className="h-3 bg-bg-elevated rounded-full overflow-hidden">
        <View
          className="h-full rounded-full bg-primary"
          style={{ width: `${progress * 100}%` }}
        />
      </View>
    </View>
  );
}

// ---- Companion Card ----

function CompanionCard() {
  const { player, monsters } = usePlayerStore();
  const companion = monsters.find((m) => m.uuid === player?.companionId) ?? monsters[0] ?? null;
  const def = companion ? MONSTER_POOL.find((d) => d.id === companion.definitionId) : null;

  if (!companion || !def) return null;

  const ELEMENT_EMOJI: Record<string, string> = {
    flare:"🔥", aqua:"💧", forest:"🌿", bolt:"⚡", shadow:"🌑", lumina:"✨",
  };
  const bondLevel = companion.bondLevel ?? 0;

  return (
    <View style={{ marginHorizontal: 20, marginBottom: 16, padding: 16,
      borderRadius: 20, backgroundColor: "#161628", borderWidth: 1, borderColor: "#1F1F38" }}>
      <Text style={{ color: "#9090AA", fontSize: 11, marginBottom: 8 }}>相棒</Text>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Image
          source={getMonsterImage(def.id)}
          style={{ width: 64, height: 64, borderRadius: 14 }}
          resizeMode="contain"
        />
        <View style={{ marginLeft: 14, flex: 1 }}>
          <Text style={{ color: "#F0F0FF", fontWeight: "900", fontSize: 16 }}>
            {companion.nickname ?? def.name}
          </Text>
          <Text style={{ color: "#9090AA", fontSize: 12, marginTop: 2 }}>
            Lv.{companion.level} · {ELEMENT_EMOJI[def.element]} {def.element}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
            <Text style={{ color: "#9090AA", fontSize: 11 }}>絆 </Text>
            {Array.from({ length: 10 }).map((_, i) => (
              <Text key={i} style={{ fontSize: 10 }}>
                {i < bondLevel ? "❤️" : "🤍"}
              </Text>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

// ---- Daily Missions Quick View ----

function DailyMissions() {
  const missions = [
    { label: "3,000歩歩く", current: 1200, target: 3000, reward: "30 NE" },
    { label: "モンスターを3体捕獲", current: 0, target: 3, reward: "シルバー×2" },
    { label: "バトル5回勝利", current: 2, target: 5, reward: "50 NE" },
  ];

  return (
    <View className="mx-6 mb-6">
      <Text className="text-text font-nunito-bold text-base mb-3">デイリーミッション</Text>
      {missions.map((m, i) => (
        <View
          key={i}
          className="flex-row items-center justify-between mb-2 p-3 rounded-xl bg-bg-card"
        >
          <View className="flex-1">
            <Text className="text-text text-sm font-nunito">{m.label}</Text>
            <View className="h-1.5 bg-bg-elevated rounded-full mt-1.5 overflow-hidden">
              <View
                className="h-full bg-secondary rounded-full"
                style={{ width: `${Math.min((m.current / m.target) * 100, 100)}%` }}
              />
            </View>
          </View>
          <Text className="text-primary text-xs font-nunito-bold ml-3">{m.reward}</Text>
        </View>
      ))}
    </View>
  );
}

// ---- Main Screen ----

export default function HomeScreen() {
  // エンカウント・アイテムドロップを1分ごとにチェック
  useEncounter("sunny");
  const { todaySteps, todayNE, isLoading, error } = usePedometer();
  const { player } = usePlayerStore();
  const { todayClaimed } = useLoginBonusStore();
  const [showLoginBonus, setShowLoginBonus] = useState(false);
  const [tick, setTick] = useState(0);

  // 1秒ごとに tick を更新（HUD 用）
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // 起動時にログインボーナスを自動表示
  useEffect(() => {
    if (!todayClaimed) {
      setTimeout(() => setShowLoginBonus(true), 800);
    }
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0D0D1A" }} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 pt-2 pb-0">
          <Text className="text-text-muted text-sm font-nunito">
            {new Date().toLocaleDateString("ja-JP", {
              month: "long",
              day: "numeric",
              weekday: "short",
            })}
          </Text>
          <View className="flex-row gap-2">
            {/* Quest shortcut */}
            <Pressable
              onPress={() => router.push("/quests")}
              className="flex-row items-center bg-bg-card px-3 py-1 rounded-full border border-bg-elevated active:opacity-70"
            >
              <Text className="text-yellow-400 text-xs font-nunito-bold">🎯 クエスト</Text>
            </Pressable>
            {/* NE */}
            <View className="flex-row items-center bg-bg-card px-3 py-1 rounded-full border border-bg-elevated">
              <Text className="text-primary text-xs font-nunito-bold">
                ⚡ {player?.nanoEnergy ?? 0} NE
              </Text>
            </View>
          </View>
        </View>

        {/* Step Ring */}
        <StepRing steps={todaySteps} goal={DAILY_GOAL} />

        {/* NE Gauge */}
        <NEGauge current={todayNE} max={NE_DAILY_CAP} />

        {/* Active Effects HUD */}
        <ActiveEffectsHUD tick={tick} />

        {/* Error state */}
        {error && (
          <View className="mx-6 mb-4 p-3 rounded-xl bg-accent/20 border border-accent/40">
            <Text className="text-accent text-xs font-nunito">{error}</Text>
          </View>
        )}

        {/* エンカウントカード */}
        <EncounterCardList />

        {/* 相棒 */}
        <CompanionCard />

        {/* Missions */}
        <DailyMissions />
      </ScrollView>

      {/* Login Bonus Modal */}
      <LoginBonusModal
        visible={showLoginBonus}
        onClose={() => setShowLoginBonus(false)}
      />
    </SafeAreaView>
  );
}
