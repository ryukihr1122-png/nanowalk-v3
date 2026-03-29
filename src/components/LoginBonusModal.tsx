/**
 * ログインボーナスモーダル
 * _layout.tsx の AppInit から起動時に表示
 */

import React, { useEffect, useState } from "react";
import {
  View, Text, Pressable, Modal, ScrollView,
} from "react-native";
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withDelay, withTiming, withSequence,
} from "react-native-reanimated";
import { useLoginBonusStore, LOGIN_REWARDS, type LoginReward } from "@/store/loginBonusStore";
import { useItemStore } from "@/store/itemStore";
import { useMonetizationStore } from "@/store/monetizationStore";
import { usePlayerStore } from "@/store/playerStore";

// ---- Day Tile ----
function DayTile({
  reward,
  isToday,
  isClaimed,
  index,
}: {
  reward: LoginReward;
  isToday: boolean;
  isClaimed: boolean;
  index: number;
}) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(index * 80, withSpring(1, { damping: 10 }));
    opacity.value = withDelay(index * 80, withTiming(1, { duration: 300 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const bg = isClaimed
    ? "#1F1F38"
    : isToday
    ? reward.isSpecial ? "#FF408120" : "#00C9A720"
    : "#161628";

  const border = isClaimed
    ? "#2a2a4a"
    : isToday
    ? reward.isSpecial ? "#FF4081" : "#00C9A7"
    : "#1F1F38";

  return (
    <Animated.View
      style={[
        style,
        {
          width: 80,
          padding: 10,
          borderRadius: 16,
          borderWidth: isToday ? 2 : 1,
          borderColor: border,
          backgroundColor: bg,
          alignItems: "center",
          margin: 5,
        },
      ]}
    >
      <Text style={{ color: "#606080", fontSize: 10, marginBottom: 4 }}>
        Day {reward.day}
      </Text>
      <Text style={{ fontSize: 28, opacity: isClaimed ? 0.3 : 1 }}>
        {isClaimed ? "✅" : reward.emoji}
      </Text>
      <Text
        style={{
          color: isClaimed ? "#404060" : "#9090AA",
          fontSize: 9,
          marginTop: 4,
          textAlign: "center",
        }}
        numberOfLines={2}
      >
        {reward.label}
      </Text>
      {isToday && !isClaimed && (
        <View
          style={{
            marginTop: 4,
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 6,
            backgroundColor: reward.isSpecial ? "#FF408133" : "#00C9A733",
          }}
        >
          <Text
            style={{
              color: reward.isSpecial ? "#FF4081" : "#00C9A7",
              fontSize: 8,
              fontWeight: "900",
            }}
          >
            TODAY
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

// ---- Main Modal ----
interface LoginBonusModalProps {
  visible: boolean;
  onClose: () => void;
}

export function LoginBonusModal({ visible, onClose }: LoginBonusModalProps) {
  const {
    currentDay,
    currentStreak,
    todayClaimed,
    claimLoginBonus,
    isStreakBroken,
  } = useLoginBonusStore();

  const { addItem } = useItemStore();
  const { addGems, addTicket } = useMonetizationStore();
  const { addStones } = usePlayerStore();

  const [claimedReward, setClaimedReward] = useState<LoginReward | null>(null);
  const [phase, setPhase] = useState<"calendar" | "reward">("calendar");

  const rewardScale = useSharedValue(0);
  const rewardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rewardScale.value }],
  }));

  const handleClaim = () => {
    const reward = claimLoginBonus();
    if (!reward) {
      onClose();
      return;
    }

    // 報酬を付与
    switch (reward.type) {
      case "gems":
        addGems(Number(reward.value));
        break;
      case "item":
        addItem(String(reward.value), reward.quantity);
        break;
      case "stone":
        addStones(reward.value as any, reward.quantity);
        break;
      case "ticket":
        addTicket(reward.value as any, reward.quantity);
        break;
    }

    // デイリーボール付与（毎日5個）
    if ((reward as any).dailyBallBonus) {
      const bonus = (reward as any).dailyBallBonus;
      if (bonus.normal) addStones("normal", bonus.normal);
    }

    setClaimedReward(reward);
    setPhase("reward");
    rewardScale.value = withSequence(
      withSpring(1.3, { damping: 6 }),
      withSpring(1.0, { damping: 12 })
    );
  };

  if (!visible) return null;

  const streakBroken = isStreakBroken();

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(13,13,26,0.92)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 380,
            borderRadius: 28,
            backgroundColor: "#161628",
            borderWidth: 1,
            borderColor: "#1F1F38",
            overflow: "hidden",
          }}
        >
          {phase === "calendar" ? (
            <>
              {/* Header */}
              <View
                style={{
                  padding: 20,
                  alignItems: "center",
                  backgroundColor: "#0D0D1A",
                  borderBottomWidth: 1,
                  borderBottomColor: "#1F1F38",
                }}
              >
                <Text style={{ fontSize: 32 }}>🎁</Text>
                <Text
                  style={{
                    color: "#F0F0FF",
                    fontSize: 20,
                    fontWeight: "900",
                    marginTop: 8,
                  }}
                >
                  ログインボーナス
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 8,
                  }}
                >
                  <Text style={{ color: "#00C9A7", fontWeight: "700" }}>
                    🔥 {currentStreak}日連続
                  </Text>
                  {streakBroken && (
                    <Text style={{ color: "#FF6B6B", fontSize: 11 }}>
                      （リセット）
                    </Text>
                  )}
                </View>
              </View>

              {/* Calendar */}
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  padding: 16,
                }}
              >
                {LOGIN_REWARDS.map((r, i) => (
                  <DayTile
                    key={r.day}
                    reward={r}
                    isToday={r.day === (streakBroken ? 1 : currentDay === 0 ? 1 : ((currentDay % 7) + 1) )}
                    isClaimed={todayClaimed ? r.day <= currentDay : r.day < currentDay}
                    index={i}
                  />
                ))}
              </View>

              {/* Button */}
              <View style={{ padding: 20, paddingTop: 0 }}>
                {todayClaimed ? (
                  <Pressable
                    onPress={onClose}
                    style={{
                      paddingVertical: 16,
                      borderRadius: 20,
                      alignItems: "center",
                      backgroundColor: "#1F1F38",
                    }}
                  >
                    <Text style={{ color: "#9090AA", fontWeight: "700" }}>
                      また明日！
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={handleClaim}
                    style={{
                      paddingVertical: 16,
                      borderRadius: 20,
                      alignItems: "center",
                      backgroundColor: "#00C9A7",
                    }}
                  >
                    <Text
                      style={{ color: "#0D0D1A", fontWeight: "900", fontSize: 16 }}
                    >
                      受け取る！
                    </Text>
                  </Pressable>
                )}
              </View>
            </>
          ) : (
            /* Reward reveal */
            <View style={{ padding: 32, alignItems: "center" }}>
              <Text
                style={{
                  color: "#00C9A7",
                  fontSize: 16,
                  fontWeight: "700",
                  marginBottom: 24,
                }}
              >
                Day {currentDay} 報酬ゲット！
              </Text>
              <Animated.View style={rewardStyle}>
                <Text style={{ fontSize: 80 }}>{claimedReward?.emoji}</Text>
              </Animated.View>
              <Text
                style={{
                  color: "#F0F0FF",
                  fontSize: 22,
                  fontWeight: "900",
                  marginTop: 16,
                  textAlign: "center",
                }}
              >
                {claimedReward?.label}
              </Text>
              <Pressable
                onPress={onClose}
                style={{
                  marginTop: 32,
                  paddingHorizontal: 40,
                  paddingVertical: 14,
                  borderRadius: 20,
                  backgroundColor: "#00C9A7",
                }}
              >
                <Text
                  style={{ color: "#0D0D1A", fontWeight: "900", fontSize: 16 }}
                >
                  やった！
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
