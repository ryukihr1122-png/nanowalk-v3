/**
 * NanoWalk — プロフィール画面
 * app/(tabs)/profile.tsx
 */

import {
  View, Text, ScrollView, Pressable, Modal, Alert, Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePlayerStore } from "@/store/playerStore";
import { useAuth } from "@/hooks/useAuth";
import { useSync } from "@/hooks/useSync";
import { MONSTER_POOL } from "@/constants/monsters";

// ---- 称号テーブル ----
interface Title {
  id: string; label: string; emoji: string;
  condition: (s: PlayerStats) => boolean; description: string;
}
interface PlayerStats {
  totalSteps: number; capturedCount: number; pokedexCount: number;
  monsters: { level: number }[]; nanoGems: number;
}
const TITLES: Title[] = [
  { id: "first_step", label: "はじめの一歩", emoji: "👣",
    condition: (s) => s.totalSteps >= 1, description: "初めて歩いた" },
  { id: "walker_1k",  label: "1,000歩ウォーカー", emoji: "🚶",
    condition: (s) => s.totalSteps >= 1_000, description: "累計1,000歩達成" },
  { id: "walker_10k", label: "万歩達成者", emoji: "🏃",
    condition: (s) => s.totalSteps >= 10_000, description: "累計10,000歩達成" },
  { id: "walker_100k",label: "ナノランナー", emoji: "⚡",
    condition: (s) => s.totalSteps >= 100_000, description: "累計100,000歩達成" },
  { id: "walker_1m",  label: "ナノマスター", emoji: "🌈",
    condition: (s) => s.totalSteps >= 1_000_000, description: "累計100万歩達成" },
  { id: "first_catch",label: "初捕獲", emoji: "🎯",
    condition: (s) => s.capturedCount >= 1, description: "最初のモンスターを捕まえた" },
  { id: "collect_10", label: "コレクター", emoji: "📚",
    condition: (s) => s.pokedexCount >= 10, description: "図鑑10種類捕獲" },
  { id: "collect_50", label: "ナノコレクター", emoji: "🗂",
    condition: (s) => s.pokedexCount >= 50, description: "図鑑50種類捕獲" },
  { id: "collect_100",label: "図鑑マスター", emoji: "🏆",
    condition: (s) => s.pokedexCount >= 100, description: "全100種捕獲達成" },
  { id: "lv20", label: "育て親", emoji: "🌱",
    condition: (s) => s.monsters.some((m) => m.level >= 20), description: "モンスターをLv.20まで育てた" },
  { id: "lv50", label: "達人", emoji: "⭐",
    condition: (s) => s.monsters.some((m) => m.level >= 50), description: "モンスターをLv.50まで育てた" },
  { id: "gem_100", label: "ジェム収集家", emoji: "💎",
    condition: (s) => s.nanoGems >= 100, description: "ナノジェム100個以上所持" },
];

function getTrainerRank(steps: number) {
  if (steps >= 1_000_000) return { label: "ナノマスター",   color: "#FF4081", next: null };
  if (steps >= 500_000)   return { label: "レジェンド",     color: "#FFD700", next: 1_000_000 };
  if (steps >= 200_000)   return { label: "エキスパート",   color: "#AB47BC", next: 500_000 };
  if (steps >= 100_000)   return { label: "ベテラン",       color: "#4FC3F7", next: 200_000 };
  if (steps >= 30_000)    return { label: "アドベンチャー", color: "#66BB6A", next: 100_000 };
  if (steps >= 10_000)    return { label: "エクスプローラー",color:"#9090AA", next: 30_000 };
  return { label: "ビギナー", color: "#9090AA", next: 10_000 };
}

function StatCard({ emoji, value, label, color }: {
  emoji: string; value: string | number; label: string; color?: string;
}) {
  return (
    <View style={{ flex: 1, alignItems: "center", paddingVertical: 14,
      backgroundColor: "#161628", borderRadius: 14, borderWidth: 1, borderColor: "#1F1F38" }}>
      <Text style={{ fontSize: 20, marginBottom: 3 }}>{emoji}</Text>
      <Text style={{ color: color ?? "#00C9A7", fontWeight: "900", fontSize: 16 }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </Text>
      <Text style={{ color: "#9090AA", fontSize: 9, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

// ── 開発用：チュートリアルリセット ──
// 本番ビルドでは __DEV__ が false になるため表示されない
export function DevTutorialReset() {
  if (!__DEV__) return null;
  return (
    <Pressable
      onPress={async () => {
        await AsyncStorage.removeItem("tutorial_completed");
        alert("チュートリアルをリセットしました。再起動後に表示されます。");
      }}
      style={{ padding: 12, alignItems: "center" }}
    >
      <Text style={{ color: "#FF4081", fontSize: 11 }}>
        [DEV] チュートリアルをリセット
      </Text>
    </Pressable>
  );
}

function AchievementBadge({ title, unlocked }: { title: Title; unlocked: boolean }) {
  return (
    <View style={{ alignItems: "center", width: 70, opacity: unlocked ? 1 : 0.3 }}>
      <View style={{ width: 50, height: 50, borderRadius: 25,
        backgroundColor: unlocked ? "#FFD70018" : "#1F1F38",
        borderWidth: 2, borderColor: unlocked ? "#FFD700" : "#2a2a4a",
        alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
        <Text style={{ fontSize: 22 }}>{unlocked ? title.emoji : "🔒"}</Text>
      </View>
      <Text style={{ color: unlocked ? "#F0F0FF" : "#404060", fontSize: 9,
        textAlign: "center", fontWeight: "700" }} numberOfLines={2}>
        {title.label}
      </Text>
    </View>
  );
}

function SettingRow({ emoji, label, onPress, type = "arrow" }: {
  emoji: string; label: string; onPress?: () => void; type?: "arrow" | "destructive";
}) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: "row", alignItems: "center",
      paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: "#1F1F38" }}>
      <Text style={{ fontSize: 18, marginRight: 12 }}>{emoji}</Text>
      <Text style={{ flex: 1, fontSize: 14, fontWeight: "600",
        color: type === "destructive" ? "#FF5252" : "#F0F0FF" }}>{label}</Text>
      {type === "arrow" && <Text style={{ color: "#404060" }}>›</Text>}
    </Pressable>
  );
}

function TitleModal({ titles, currentId, onSelect, onClose }: {
  titles: Title[]; currentId: string;
  onSelect: (id: string) => void; onClose: () => void;
}) {
  return (
    <Modal transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: "#161628", borderTopLeftRadius: 24,
          borderTopRightRadius: 24, padding: 20, maxHeight: "70%" }}>
          <Text style={{ color: "#F0F0FF", fontWeight: "900", fontSize: 18, marginBottom: 16 }}>
            称号を選ぶ
          </Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {titles.map((t) => (
              <Pressable key={t.id} onPress={() => { onSelect(t.id); onClose(); }}
                style={{ flexDirection: "row", alignItems: "center", padding: 14,
                  marginBottom: 8, borderRadius: 16,
                  backgroundColor: currentId === t.id ? "#00C9A715" : "#0D0D1A",
                  borderWidth: 1, borderColor: currentId === t.id ? "#00C9A740" : "#1F1F38" }}>
                <Text style={{ fontSize: 22, marginRight: 12 }}>{t.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#F0F0FF", fontWeight: "700", fontSize: 14 }}>{t.label}</Text>
                  <Text style={{ color: "#9090AA", fontSize: 11, marginTop: 2 }}>{t.description}</Text>
                </View>
                {currentId === t.id && <Text style={{ color: "#00C9A7" }}>✓</Text>}
              </Pressable>
            ))}
          </ScrollView>
          <Pressable onPress={onClose} style={{ paddingVertical: 14, borderRadius: 16,
            marginTop: 8, backgroundColor: "#1F1F38", alignItems: "center" }}>
            <Text style={{ color: "#9090AA", fontWeight: "700" }}>閉じる</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function ProfileScreen() {
  const { player, monsters, nanoCores } = usePlayerStore();
  const { isSignedIn, signOut }         = useAuth();
  const { lastSyncAt, syncing, triggerSync } = useSync();

  const [selectedTitleId, setSelectedTitleId] = useState("first_step");
  const [showTitleModal,  setShowTitleModal]   = useState(false);

  const totalSteps = player?.totalSteps ?? 0;
  const nanoEnergy = player?.nanoEnergy ?? 0;
  const nanoGems   = player?.nanoGems   ?? 0;
  const username   = player?.username   ?? "トレーナー";

  const capturedCount = monsters.length;
  const pokedexCount  = new Set(monsters.map((m) => m.definitionId)).size;
  const maxLevel      = monsters.reduce((max, m) => Math.max(max, m.level), 0);
  const totalCores    = nanoCores.reduce((s, c) => s + c.quantity, 0);
  const favMonster    = monsters.find((m) => m.isFavorite);

  const rank = getTrainerRank(totalSteps);
  const stats: PlayerStats = { totalSteps, capturedCount, pokedexCount,
    monsters: monsters.map((m) => ({ level: m.level })), nanoGems };

  const unlockedTitles = TITLES.filter((t) => t.condition(stats));
  const selectedTitle  = TITLES.find((t) => t.id === selectedTitleId) ?? TITLES[0];

  useEffect(() => {
    if (!unlockedTitles.find((t) => t.id === selectedTitleId)) {
      setSelectedTitleId(unlockedTitles[0]?.id ?? "first_step");
    }
  }, [unlockedTitles.length]);

  const handleSignOut = () => {
    Alert.alert("サインアウト", "サインアウトしますか？", [
      { text: "キャンセル", style: "cancel" },
      { text: "サインアウト", style: "destructive",
        onPress: async () => { await signOut(); router.replace("/login"); } },
    ]);
  };

  const syncLabel = lastSyncAt
    ? `同期済 ${lastSyncAt.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}`
    : "未同期";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0D0D1A" }} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}>

        {/* ---- トレーナーカード ---- */}
        <Animated.View entering={FadeInDown.duration(400)} style={{
          margin: 20, padding: 22, borderRadius: 24,
          backgroundColor: "#161628", borderWidth: 1, borderColor: "#1F1F38" }}>

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <View style={{ width: 68, height: 68, borderRadius: 34,
              backgroundColor: "#00C9A718", borderWidth: 2, borderColor: "#00C9A740",
              alignItems: "center", justifyContent: "center", marginRight: 14 }}>
              <Text style={{ fontSize: 36 }}>🧑‍🦯</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#F0F0FF", fontWeight: "900", fontSize: 20 }}>{username}</Text>
              <Pressable onPress={() => setShowTitleModal(true)}
                style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 5,
                  paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
                  backgroundColor: "#FFD70015", borderWidth: 1, borderColor: "#FFD70030",
                  alignSelf: "flex-start" }}>
                <Text style={{ fontSize: 13 }}>{selectedTitle?.emoji}</Text>
                <Text style={{ color: "#FFD700", fontSize: 11, fontWeight: "700" }}>
                  {selectedTitle?.label}
                </Text>
                <Text style={{ color: "#805500", fontSize: 10 }}>✎</Text>
              </Pressable>
            </View>
          </View>

          {/* ランク */}
          <View style={{ flexDirection: "row", alignItems: "center",
            justifyContent: "space-between", padding: 12, borderRadius: 14,
            backgroundColor: "#0D0D1A", marginBottom: 14 }}>
            <View>
              <Text style={{ color: "#9090AA", fontSize: 10 }}>トレーナーランク</Text>
              <Text style={{ color: rank.color, fontWeight: "900", fontSize: 17, marginTop: 2 }}>
                {rank.label}
              </Text>
            </View>
            {rank.next && (
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ color: "#606080", fontSize: 10 }}>次のランクまで</Text>
                <Text style={{ color: "#9090AA", fontWeight: "700", fontSize: 12 }}>
                  {(rank.next - totalSteps).toLocaleString()} 歩
                </Text>
                <View style={{ width: 72, height: 3, backgroundColor: "#1F1F38",
                  borderRadius: 2, overflow: "hidden", marginTop: 3 }}>
                  <View style={{ height: 3,
                    width: `${Math.min((totalSteps / rank.next) * 100, 100)}%`,
                    backgroundColor: rank.color, borderRadius: 2 }} />
                </View>
              </View>
            )}
          </View>

          {/* 統計 */}
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 6 }}>
            <StatCard emoji="🚶" value={totalSteps} label="総歩数" color="#00C9A7" />
            <StatCard emoji="🐾" value={capturedCount} label="手持ち" color="#4FC3F7" />
            <StatCard emoji="📖" value={`${pokedexCount}/100`} label="図鑑" color="#AB47BC" />
          </View>
          <View style={{ flexDirection: "row", gap: 6 }}>
            <StatCard emoji="⚡" value={nanoEnergy} label="NE" color="#FFD54F" />
            <StatCard emoji="💎" value={nanoGems} label="ジェム" color="#FF4081" />
            <StatCard emoji="⭐" value={maxLevel > 0 ? `Lv.${maxLevel}` : "—"} label="最高Lv" color="#FF8C00" />
          </View>
        </Animated.View>

        {/* ---- お気に入りモンスター ---- */}
        {favMonster && (() => {
          const def = MONSTER_POOL.find((d) => d.id === favMonster.definitionId);
          if (!def) return null;
          return (
            <Animated.View entering={FadeInDown.delay(100).duration(400)}
              style={{ marginHorizontal: 20, marginBottom: 14 }}>
              <Text style={{ color: "#9090AA", fontSize: 11, fontWeight: "700",
                textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                お気に入りモンスター
              </Text>
              <Pressable onPress={() => router.push(`/monster/${favMonster.uuid}`)}
                style={{ flexDirection: "row", alignItems: "center", padding: 14,
                  borderRadius: 16, backgroundColor: "#161628",
                  borderWidth: 1, borderColor: "#FFD70025" }}>
                <View style={{ width: 48, height: 48, borderRadius: 12,
                  backgroundColor: "#FFD70015", alignItems: "center",
                  justifyContent: "center", marginRight: 12 }}>
                  <Text style={{ fontSize: 26 }}>⭐</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#F0F0FF", fontWeight: "700" }}>
                    {favMonster.nickname ?? def.name}
                  </Text>
                  <Text style={{ color: "#9090AA", fontSize: 11, marginTop: 2 }}>
                    Lv.{favMonster.level} · {def.element} · {def.rarity}
                  </Text>
                </View>
                <Text style={{ color: "#404060" }}>›</Text>
              </Pressable>
            </Animated.View>
          );
        })()}

        {/* ---- 実績バッジ ---- */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}
          style={{ marginHorizontal: 20, marginBottom: 14 }}>
          <Text style={{ color: "#9090AA", fontSize: 11, fontWeight: "700",
            textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
            実績 ({unlockedTitles.length}/{TITLES.length})
          </Text>
          <View style={{ padding: 14, borderRadius: 18, backgroundColor: "#161628",
            borderWidth: 1, borderColor: "#1F1F38" }}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {TITLES.map((t) => (
                <AchievementBadge key={t.id} title={t}
                  unlocked={!!unlockedTitles.find((u) => u.id === t.id)} />
              ))}
            </View>
          </View>
        </Animated.View>

        {/* ---- ナノコア在庫 ---- */}
        {totalCores > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)}
            style={{ marginHorizontal: 20, marginBottom: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center",
              justifyContent: "space-between", padding: 14, borderRadius: 16,
              backgroundColor: "#161628", borderWidth: 1, borderColor: "#FF8C0025" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Text style={{ fontSize: 22 }}>💎</Text>
                <View>
                  <Text style={{ color: "#F0F0FF", fontWeight: "700" }}>ナノコア 計{totalCores}個</Text>
                  <Text style={{ color: "#9090AA", fontSize: 11 }}>強化素材として使用可能</Text>
                </View>
              </View>
              <Pressable onPress={() => router.push("/(tabs)/monsters")}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
                  backgroundColor: "#FF8C0015", borderWidth: 1, borderColor: "#FF8C0035" }}>
                <Text style={{ color: "#FF8C00", fontSize: 12, fontWeight: "700" }}>強化する →</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* ---- 設定 ---- */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)}
          style={{ marginHorizontal: 20, marginBottom: 14 }}>
          <Text style={{ color: "#9090AA", fontSize: 11, fontWeight: "700",
            textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>設定</Text>
          <View style={{ backgroundColor: "#161628", borderRadius: 18,
            borderWidth: 1, borderColor: "#1F1F38", overflow: "hidden" }}>
            <SettingRow emoji="🔔" label="通知設定"
              onPress={() => router.push("/settings/notifications")} />
            <SettingRow emoji="☁️" label={syncing ? "同期中..." : `クラウド同期 (${syncLabel})`}
              onPress={async () => { await triggerSync(); Alert.alert("同期完了", "データを同期しました"); }} />
            <SettingRow emoji="🏆" label="週間ランキング"
              onPress={() => router.push("/ranking")} />
            <SettingRow emoji="🎁" label="デイリークエスト"
              onPress={() => router.push("/quests")} />
            <SettingRow emoji="📄" label="プライバシーポリシー" onPress={() => {}} />
            <SettingRow emoji="❓" label="ヘルプ・お問い合わせ" onPress={() => {}} />
          </View>
        </Animated.View>

        {/* ---- アカウント ---- */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}
          style={{ marginHorizontal: 20 }}>
          <Text style={{ color: "#9090AA", fontSize: 11, fontWeight: "700",
            textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>アカウント</Text>
          <View style={{ backgroundColor: "#161628", borderRadius: 18,
            borderWidth: 1, borderColor: "#1F1F38", overflow: "hidden" }}>
            {isSignedIn
              ? <SettingRow emoji="🚪" label="サインアウト"
                  type="destructive" onPress={handleSignOut} />
              : <SettingRow emoji="🍎" label="Apple IDでサインイン"
                  onPress={() => router.push("/login")} />
            }
          </View>
        </Animated.View>

        <Text style={{ color: "#303050", fontSize: 11, textAlign: "center", marginTop: 24 }}>
          NanoWalk v0.9.0
        </Text>
      </ScrollView>

      {showTitleModal && (
        <TitleModal titles={unlockedTitles} currentId={selectedTitleId}
          onSelect={setSelectedTitleId} onClose={() => setShowTitleModal(false)} />
      )}
    </SafeAreaView>
  );
}
