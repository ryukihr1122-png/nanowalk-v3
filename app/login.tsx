/**
 * NanoWalk — ログイン画面
 * app/login.tsx
 *
 * Sign in with Apple + ゲストプレイの2択。
 * サインイン後は (tabs) へ遷移。
 */

import {
  View, Text, Pressable, Dimensions, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  withSequence,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/hooks/useAuth";
import { usePlayerStore } from "@/store/playerStore";

const { width, height } = Dimensions.get("window");

// ---- 浮遊するナノンアイコン ----
const FLOATERS = [
  { emoji: "🌿", x: 0.08, delay: 0 },
  { emoji: "⚡", x: 0.82, delay: 500 },
  { emoji: "🔥", x: 0.15, delay: 1200 },
  { emoji: "💧", x: 0.72, delay: 800 },
  { emoji: "🌑", x: 0.55, delay: 300 },
  { emoji: "✨", x: 0.35, delay: 1500 },
  { emoji: "💎", x: 0.90, delay: 1000 },
];

function FloatingEmoji({ emoji, x, delay }: { emoji: string; x: number; delay: number }) {
  const y = useSharedValue(height * 0.3 + Math.random() * height * 0.4);
  const opacity = useSharedValue(0);

  useEffect(() => {
    setTimeout(() => {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 800 }),
          withTiming(0.15, { duration: 1200 }),
        ), -1, true
      );
      y.value = withRepeat(
        withTiming(y.value - 30, {
          duration: 3000 + Math.random() * 2000,
          easing: Easing.inOut(Easing.ease),
        }), -1, true
      );
    }, delay);
  }, []);

  const style = useAnimatedStyle(() => ({
    position: "absolute",
    left: x * width,
    top: y.value,
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={style}>
      <Text style={{ fontSize: 28 }}>{emoji}</Text>
    </Animated.View>
  );
}

// ---- フィーチャーリスト ----
const FEATURES = [
  { emoji: "🚶", text: "歩くだけでモンスターに出会える" },
  { emoji: "⚔️", text: "捕まえて育てて、最強チームを作ろう" },
  { emoji: "🏆", text: "週間ランキングでNo.1を目指せ" },
  { emoji: "💎", text: "100万歩達成で伝説のモンスターが出現" },
];

export default function LoginScreen() {
  const { signIn, isLoading, isSignedIn } = useAuth();
  const { initPlayer } = usePlayerStore();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // サインイン済みなら即遷移
  useEffect(() => {
    if (isSignedIn) {
      (async () => {
        const done = await AsyncStorage.getItem("tutorial_completed");
        router.replace("/(tabs)");
      })();
    }
  }, [isSignedIn]);

  const logoScale = useSharedValue(0);
  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  useEffect(() => {
    logoScale.value = withSpring(1, { damping: 8, stiffness: 100 });
  }, []);

  const handleAppleSignIn = async () => {
    setSigningIn(true);
    setError(null);
    const ok = await signIn();
    setSigningIn(false);
    if (ok) {
      router.replace("/(tabs)");
    } else {
      setError("サインインに失敗しました。もう一度お試しください。");
    }
  };

  const handleGuest = () => {
    // ゲストプレイ: ローカルのみ、同期なし
    const guestId = `guest_${Date.now()}`;
    initPlayer(guestId, "ゲストトレーナー");
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0D0D1A" }}>
      {/* 背景浮遊アイコン */}
      <View style={{ position: "absolute", width, height, pointerEvents: "none" }}>
        {FLOATERS.map((f) => (
          <FloatingEmoji key={f.emoji} {...f} />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between", padding: 28 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- ロゴ ---- */}
        <View style={{ alignItems: "center", paddingTop: 40 }}>
          <Animated.View entering={FadeIn.delay(100).duration(600)} style={logoStyle}>
            <View style={{
              width: 96, height: 96, borderRadius: 28,
              backgroundColor: "#00C9A720",
              borderWidth: 2, borderColor: "#00C9A740",
              alignItems: "center", justifyContent: "center",
              marginBottom: 20,
            }}>
              <Text style={{ fontSize: 52 }}>🦶</Text>
            </View>
          </Animated.View>

          <Animated.Text
            entering={FadeInDown.delay(200).duration(500)}
            style={{
              color: "#F0F0FF", fontWeight: "900", fontSize: 36,
              letterSpacing: -1, textAlign: "center",
            }}
          >
            NanoWalk
          </Animated.Text>

          <Animated.Text
            entering={FadeInDown.delay(350).duration(500)}
            style={{
              color: "#9090AA", fontSize: 14, marginTop: 6, textAlign: "center",
            }}
          >
            歩くたびに世界が広がる、万歩計RPG
          </Animated.Text>
        </View>

        {/* ---- フィーチャー ---- */}
        <Animated.View
          entering={FadeInUp.delay(500).duration(500)}
          style={{ marginVertical: 32 }}
        >
          {FEATURES.map((f, i) => (
            <Animated.View
              key={f.text}
              entering={FadeInDown.delay(600 + i * 100).duration(400)}
              style={{
                flexDirection: "row", alignItems: "center", gap: 12,
                paddingVertical: 10, paddingHorizontal: 16,
                marginBottom: 8, borderRadius: 16,
                backgroundColor: "#161628",
                borderWidth: 1, borderColor: "#1F1F38",
              }}
            >
              <Text style={{ fontSize: 22 }}>{f.emoji}</Text>
              <Text style={{ color: "#D0D0EE", fontSize: 13, flex: 1 }}>{f.text}</Text>
            </Animated.View>
          ))}
        </Animated.View>

        {/* ---- ボタン群 ---- */}
        <Animated.View entering={FadeInUp.delay(900).duration(400)}>

          {/* エラー */}
          {error && (
            <View style={{
              padding: 12, borderRadius: 12, marginBottom: 12,
              backgroundColor: "#FF525220",
              borderWidth: 1, borderColor: "#FF525240",
            }}>
              <Text style={{ color: "#FF5252", fontSize: 12, textAlign: "center" }}>
                {error}
              </Text>
            </View>
          )}

          {/* Sign in with Apple */}
          <Pressable
            onPress={handleAppleSignIn}
            disabled={signingIn || isLoading}
            style={{
              flexDirection: "row", alignItems: "center", justifyContent: "center",
              gap: 10,
              paddingVertical: 16, borderRadius: 20,
              backgroundColor: "#F0F0FF",
              marginBottom: 12,
              opacity: signingIn ? 0.7 : 1,
            }}
          >
            <Text style={{ fontSize: 20 }}>🍎</Text>
            <Text style={{ color: "#0D0D1A", fontWeight: "900", fontSize: 16 }}>
              {signingIn ? "サインイン中..." : "Sign in with Apple"}
            </Text>
          </Pressable>

          {/* Guest */}
          <Pressable
            onPress={handleGuest}
            style={{
              paddingVertical: 16, borderRadius: 20,
              backgroundColor: "transparent",
              borderWidth: 1, borderColor: "#1F1F38",
              alignItems: "center", marginBottom: 20,
            }}
          >
            <Text style={{ color: "#9090AA", fontWeight: "700", fontSize: 14 }}>
              ゲストとしてプレイ
            </Text>
            <Text style={{ color: "#404060", fontSize: 11, marginTop: 2 }}>
              ※ デバイス間の同期・ランキング参加には Apple ID が必要です
            </Text>
          </Pressable>

          {/* Terms */}
          <Text style={{ color: "#404060", fontSize: 11, textAlign: "center", lineHeight: 18 }}>
            続けることで
            <Text style={{ color: "#606080" }}>利用規約</Text>
            および
            <Text style={{ color: "#606080" }}>プライバシーポリシー</Text>
            に同意したことになります
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
