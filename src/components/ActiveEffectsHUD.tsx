/**
 * ActiveEffectsHUD
 * 現在発動中のアイテム効果をホーム画面上部に小さく表示
 */

import React, { useEffect } from "react";
import { View, Text, ScrollView } from "react-native";
import { useItemStore } from "@/store/itemStore";
import { getItem } from "@/constants/items";
import type { ActiveEffect } from "@/store/itemStore";

function msToHMS(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function EffectBadge({ effect }: { effect: ActiveEffect }) {
  const def = getItem(effect.itemId);
  if (!def) return null;

  const remaining = Math.max(0, new Date(effect.expiresAt).getTime() - Date.now());
  const isExpiringSoon = remaining < 5 * 60 * 1000; // 5分未満

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        backgroundColor: isExpiringSoon ? "#FF6B6B15" : "#00C9A715",
        borderWidth: 1,
        borderColor: isExpiringSoon ? "#FF6B6B40" : "#00C9A740",
        marginRight: 8,
      }}
    >
      <Text style={{ fontSize: 14 }}>{def.emoji}</Text>
      <View>
        <Text style={{ color: "#F0F0FF", fontSize: 10, fontWeight: "700" }}>
          ×{def.effectValue}
        </Text>
        <Text
          style={{
            color: isExpiringSoon ? "#FF6B6B" : "#00C9A7",
            fontSize: 9,
          }}
        >
          {msToHMS(remaining)}
        </Text>
      </View>
    </View>
  );
}

interface ActiveEffectsHUDProps {
  /** 1秒ごとに再レンダーするための外部 tick */
  tick?: number;
}

export function ActiveEffectsHUD({ tick }: ActiveEffectsHUDProps) {
  const { activeEffects, purgeExpiredEffects } = useItemStore();

  useEffect(() => {
    purgeExpiredEffects();
  }, [tick]);

  // スーパーマグネットの重複表示を避けるため itemId でデdup
  const seen = new Set<string>();
  const deduped = activeEffects.filter((e) => {
    if (e.isSuperMagnet) {
      if (seen.has("super_magnet")) return false;
      seen.add("super_magnet");
      return true;
    }
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });

  if (deduped.length === 0) return null;

  return (
    <View style={{ marginBottom: 8 }}>
      <Text
        style={{
          color: "#606080",
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 0.5,
          marginHorizontal: 20,
          marginBottom: 6,
        }}
      >
        発動中エフェクト
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20 }}
      >
        {deduped.map((e) => (
          <EffectBadge key={e.id} effect={e} />
        ))}
      </ScrollView>
    </View>
  );
}
