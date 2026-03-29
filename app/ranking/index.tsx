/**
 * 週間ランキング画面
 * app/ranking/index.tsx
 */

import { View, Text, FlatList, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useCallback } from "react";
import { router } from "expo-router";
import {
  fetchWeeklyRanking,
  fetchMyRank,
  type RankingEntry,
} from "@/services/syncService";
import { usePlayerStore } from "@/store/playerStore";

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function RankRow({
  entry,
  isMe,
}: {
  entry: RankingEntry;
  isMe: boolean;
}) {
  const medal = MEDAL[entry.rank];
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 14,
        marginBottom: 6,
        borderRadius: 16,
        backgroundColor: isMe ? "#00C9A715" : "#161628",
        borderWidth: 1,
        borderColor: isMe ? "#00C9A740" : "#1F1F38",
      }}
    >
      {/* Rank */}
      <View style={{ width: 40, alignItems: "center" }}>
        {medal ? (
          <Text style={{ fontSize: 22 }}>{medal}</Text>
        ) : (
          <Text style={{ color: "#9090AA", fontWeight: "700", fontSize: 15 }}>
            {entry.rank}
          </Text>
        )}
      </View>

      {/* Username */}
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text
          style={{
            color: isMe ? "#00C9A7" : "#F0F0FF",
            fontWeight: isMe ? "900" : "700",
            fontSize: 14,
          }}
        >
          {entry.username} {isMe ? "（あなた）" : ""}
        </Text>
      </View>

      {/* Steps */}
      <Text style={{ color: "#9090AA", fontWeight: "700", fontSize: 13 }}>
        {entry.totalSteps.toLocaleString()} 歩
      </Text>
    </View>
  );
}

export default function RankingScreen() {
  const { player } = usePlayerStore();
  const [entries, setEntries]   = useState<RankingEntry[]>([]);
  const [myRank,  setMyRank]    = useState<number | null>(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const currentWeekStart = (() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toLocaleDateString("ja-JP", {
      month: "long", day: "numeric",
    });
  })();

  const load = useCallback(async () => {
    const [data, rank] = await Promise.all([
      fetchWeeklyRanking(50),
      fetchMyRank(),
    ]);
    setEntries(data);
    setMyRank(rank);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
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
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#F0F0FF", fontSize: 22, fontWeight: "900" }}>
            週間ランキング
          </Text>
          <Text style={{ color: "#9090AA", fontSize: 12 }}>
            {currentWeekStart}〜の歩数集計
          </Text>
        </View>
      </View>

      {/* My rank card */}
      {myRank !== null && (
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 16,
            padding: 16,
            borderRadius: 20,
            backgroundColor: "#00C9A715",
            borderWidth: 1,
            borderColor: "#00C9A740",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 32 }}>{MEDAL[myRank] ?? "🏃"}</Text>
          <View style={{ marginLeft: 14 }}>
            <Text style={{ color: "#00C9A7", fontWeight: "900", fontSize: 18 }}>
              現在 {myRank}位
            </Text>
            <Text style={{ color: "#9090AA", fontSize: 12, marginTop: 2 }}>
              今週の歩数: {player?.totalSteps.toLocaleString() ?? 0}歩
            </Text>
          </View>
        </View>
      )}

      {/* List */}
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color="#00C9A7" />
          <Text style={{ color: "#9090AA", marginTop: 12, fontSize: 13 }}>
            ランキングを読み込み中...
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(e) => e.playerId}
          renderItem={({ item }) => (
            <RankRow
              entry={item}
              isMe={item.username === player?.username}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 40 }}>
              <Text style={{ fontSize: 40 }}>📊</Text>
              <Text style={{ color: "#9090AA", marginTop: 12, fontSize: 14 }}>
                まだランキングデータがありません
              </Text>
              <Text style={{ color: "#606080", marginTop: 4, fontSize: 12 }}>
                歩いてランキングに参加しよう！
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
