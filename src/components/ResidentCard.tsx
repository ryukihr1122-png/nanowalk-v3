/**
 * ResidentCard
 * ホーム画面に並ぶ「滞在モンスター」の1枚カード
 * 残り時間がリアルタイムで更新され、緊急度に応じて色が変わる
 */

import React from "react";
import { View, Text, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useEffect } from "react";
import type { ResidentMonster, RarityType, ElementType } from "@/types";
import {
  formatTimeRemaining,
  urgencyLevel,
  URGENCY_COLOR,
  stayDurationLabel,
} from "@/services/residencyService";

const RARITY_COLOR: Record<RarityType, string> = {
  N: "#9090AA", R: "#4FC3F7", SR: "#AB47BC", SSR: "#FFD700", UR: "#FF4081",
};
const ELEMENT_EMOJI: Record<ElementType, string> = {
  flare: "🔥", aqua: "💧", forest: "🌿", bolt: "⚡", shadow: "🌑", lumina: "✨",
};

interface ResidentCardProps {
  resident: ResidentMonster;
  remainingMs: number;
  onCapture: () => void;
  onDismiss: () => void;
}

export function ResidentCard({
  resident,
  remainingMs,
  onCapture,
  onDismiss,
}: ResidentCardProps) {
  const urgency  = urgencyLevel(remainingMs);
  const timerColor = URGENCY_COLOR[urgency];
  const rarityColor = RARITY_COLOR[resident.rarity];

  // Critical pulse animation
  const pulseOpacity = useSharedValue(1);
  useEffect(() => {
    if (urgency === "critical") {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      pulseOpacity.value = 1;
    }
  }, [urgency]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const isExpired = remainingMs <= 0;

  return (
    <View
      style={{
        width: 140,
        marginRight: 12,
        borderRadius: 20,
        backgroundColor: "#161628",
        borderWidth: urgency === "critical" ? 2 : 1,
        borderColor: urgency === "critical" ? timerColor : "#1F1F38",
        overflow: "hidden",
        opacity: isExpired ? 0.4 : 1,
      }}
    >
      {/* Rarity stripe at top */}
      <View style={{ height: 4, backgroundColor: rarityColor }} />

      <View style={{ padding: 12 }}>
        {/* Monster sprite area */}
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 16,
            backgroundColor: `${rarityColor}18`,
            alignItems: "center",
            justifyContent: "center",
            alignSelf: "center",
            marginBottom: 8,
          }}
        >
          <Text style={{ fontSize: 40 }}>{ELEMENT_EMOJI[resident.element]}</Text>
        </View>

        {/* Rarity badge */}
        <View
          style={{
            alignSelf: "center",
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 10,
            backgroundColor: `${rarityColor}22`,
            marginBottom: 4,
          }}
        >
          <Text style={{ color: rarityColor, fontSize: 10, fontWeight: "900" }}>
            {resident.rarity}
          </Text>
        </View>

        {/* Name */}
        <Text
          style={{
            color: "#F0F0FF",
            fontWeight: "700",
            fontSize: 12,
            textAlign: "center",
            marginBottom: 8,
          }}
          numberOfLines={1}
        >
          {resident.monsterName}
        </Text>

        {/* Countdown timer */}
        <Animated.View
          style={[
            pulseStyle,
            {
              alignItems: "center",
              paddingVertical: 6,
              borderRadius: 10,
              backgroundColor: `${timerColor}15`,
              borderWidth: 1,
              borderColor: `${timerColor}40`,
              marginBottom: 10,
            },
          ]}
        >
          <Text style={{ color: "#9090AA", fontSize: 9, marginBottom: 1 }}>
            残り時間
          </Text>
          <Text style={{ color: timerColor, fontWeight: "900", fontSize: 13 }}>
            {isExpired ? "逃げた！" : formatTimeRemaining(remainingMs)}
          </Text>
        </Animated.View>

        {/* Action buttons */}
        {!isExpired ? (
          <View style={{ gap: 6 }}>
            <Pressable
              onPress={onCapture}
              style={{
                paddingVertical: 8,
                borderRadius: 10,
                alignItems: "center",
                backgroundColor: rarityColor,
              }}
            >
              <Text style={{ color: "#0D0D1A", fontWeight: "900", fontSize: 12 }}>
                捕まえる
              </Text>
            </Pressable>
            <Pressable
              onPress={onDismiss}
              style={{
                paddingVertical: 6,
                borderRadius: 10,
                alignItems: "center",
                backgroundColor: "#1F1F38",
              }}
            >
              <Text style={{ color: "#606080", fontSize: 11 }}>
                見逃す
              </Text>
            </Pressable>
          </View>
        ) : (
          <View
            style={{
              paddingVertical: 8,
              borderRadius: 10,
              alignItems: "center",
              backgroundColor: "#1F1F38",
            }}
          >
            <Text style={{ color: "#404060", fontSize: 12 }}>
              逃げてしまった
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
