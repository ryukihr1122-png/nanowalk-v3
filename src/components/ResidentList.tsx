/**
 * ResidentList
 * ホーム画面に埋め込む横スクロール滞在モンスター一覧
 */

import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { useResidents } from "@/hooks/useResidents";
import { ResidentCard } from "./ResidentCard";
import { MAX_RESIDENTS, STAY_DURATION_MS } from "@/services/residencyService";

export function ResidentList() {
  const { residents, timers, captureResident, dismissResident } = useResidents();

  if (residents.length === 0) {
    return (
      <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text style={{ color: "#F0F0FF", fontWeight: "900", fontSize: 15 }}>
            出現中のモンスター
          </Text>
          <Text style={{ color: "#606080", fontSize: 12 }}>
            0 / {MAX_RESIDENTS}
          </Text>
        </View>

        <View
          style={{
            padding: 24,
            borderRadius: 20,
            backgroundColor: "#161628",
            borderWidth: 1,
            borderColor: "#1F1F38",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 36, marginBottom: 8 }}>🌿</Text>
          <Text style={{ color: "#9090AA", fontSize: 13, textAlign: "center" }}>
            まだモンスターがいません
          </Text>
          <Text style={{ color: "#606080", fontSize: 11, marginTop: 4, textAlign: "center" }}>
            歩くとモンスターが現れるよ！
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ marginBottom: 20 }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginHorizontal: 20,
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ color: "#F0F0FF", fontWeight: "900", fontSize: 15 }}>
            出現中のモンスター
          </Text>
          {/* Slot indicator */}
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 10,
              backgroundColor: residents.length >= MAX_RESIDENTS ? "#FF6B6B20" : "#00C9A720",
              borderWidth: 1,
              borderColor: residents.length >= MAX_RESIDENTS ? "#FF6B6B40" : "#00C9A740",
            }}
          >
            <Text
              style={{
                color: residents.length >= MAX_RESIDENTS ? "#FF6B6B" : "#00C9A7",
                fontSize: 11,
                fontWeight: "700",
              }}
            >
              {residents.length} / {MAX_RESIDENTS}
            </Text>
          </View>
        </View>

        {/* Full slots warning */}
        {residents.length >= MAX_RESIDENTS && (
          <Text style={{ color: "#FF6B6B", fontSize: 11 }}>
            枠が一杯！
          </Text>
        )}
      </View>

      {/* Horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingRight: 32 }}
      >
        {residents.map((r) => (
          <ResidentCard
            key={r.id}
            resident={r}
            remainingMs={timers[r.id] ?? 0}
            onCapture={() => {
              // 捕獲画面へ遷移
              router.push(`/encounter/${r.id}`);
            }}
            onDismiss={() => dismissResident(r.id)}
          />
        ))}
      </ScrollView>

      {/* Legend: stay duration reference */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          gap: 8,
          marginTop: 10,
        }}
      >
        {(["N", "R", "SR", "SSR", "UR"] as const).map((rarity) => {
          const ms = STAY_DURATION_MS[rarity];
          const hours = ms / (1000 * 60 * 60);
          const label = hours >= 1 ? `${hours}h` : `${ms / (1000 * 60)}m`;
          const colors: Record<string, string> = {
            N: "#9090AA", R: "#4FC3F7", SR: "#AB47BC", SSR: "#FFD700", UR: "#FF4081",
          };
          return (
            <View
              key={rarity}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 10,
                backgroundColor: `${colors[rarity]}15`,
                borderWidth: 1,
                borderColor: `${colors[rarity]}30`,
              }}
            >
              <Text style={{ color: colors[rarity], fontSize: 10, fontWeight: "900" }}>
                {rarity}
              </Text>
              <Text style={{ color: "#606080", fontSize: 10 }}>
                {label}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
