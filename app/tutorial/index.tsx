/**
 * NanoWalk — チュートリアル画面
 * app/tutorial/index.tsx
 *
 * 初回ログイン後に1度だけ表示される冒険スタートのオンボーディング。
 * 全6ステップ：物語イントロ → 歩数 → エンカウント → スカウット → ストーン → 冒険へ
 */

import {
  View, Text, Pressable, Dimensions, ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  SlideOutLeft,
  Easing,
} from "react-native-reanimated";
import { useEffect, useState, useCallback } from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

// ============================================================
// チュートリアルコンテンツ定義
// ============================================================

const STEPS = [
  // ---- 0: 物語イントロ ----
  {
    id: "story",
    type: "story",
    badge: null,
    title: "ナノの世界へ、ようこそ。",
    subtitle: null,
    body: [
      "この地球には、目に見えない「ナノエナジー」が満ちている。",
      "",
      "人間が一歩踏み出すたびに、その振動エネルギーが世界に広がり——",
      "それに引き寄せられた小さな生命体が、ひっそりと姿を現す。",
      "",
      "彼らの名は「ナノン」。",
      "あなたの歩みを待っていた、小さな友達だ。",
    ],
    visual: {
      type: "lore",
      emojis: ["🌿", "💧", "🔥", "⚡", "🌑", "✨"],
    },
    cta: "はじめての一歩へ",
  },

  // ---- 1: 歩数とNE ----
  {
    id: "steps",
    type: "mechanic",
    badge: "基本①",
    title: "歩くと、力になる。",
    subtitle: "ナノエナジー（NE）のしくみ",
    body: [
      "歩くたびに「ナノエナジー（NE）」が溜まっていく。",
      "NEはこのゲームの基本エネルギー。",
      "歩けば歩くほど、できることが増えていく。",
    ],
    visual: {
      type: "demo",
      items: [
        { icon: "🦶", label: "1,000歩", arrow: "→", result: "NE +100" },
        { icon: "🥤", label: "エナジードリンク使用", arrow: "→", result: "NE ×1.5" },
      ],
    },
    tip: "アプリを開いていなくても、バックグラウンドで歩数を記録しています。",
    cta: "次へ",
  },

  // ---- 2: エンカウント ----
  {
    id: "encounter",
    type: "mechanic",
    badge: "基本②",
    title: "歩くと、出会いがある。",
    subtitle: "エンカウントカードのしくみ",
    body: [
      "1分ごとに、ナノンと出会うチャンスが訪れる。",
      "ホーム画面にエンカウントカードが溜まるので、タップしてスカウットしよう。",
      "カードは最大10枚まで蓄積される。",
    ],
    visual: {
      type: "card_demo",
      cards: [
        { emoji: "🌿", name: "ナノバナナ", rarity: "N", area: "ナノ草原" },
        { emoji: "💧", name: "シズクン",   rarity: "R", area: "ナノ草原" },
        { emoji: "⚡", name: "ピリリン",   rarity: "SR", area: "ナノ草原" },
      ],
    },
    tip: "放置していてもカードは溜まり続けます。まとめてスカウットしよう！",
    cta: "次へ",
  },

  // ---- 3: スカウット ----
  {
    id: "scout",
    type: "mechanic",
    badge: "基本③",
    title: "スカウットで、仲間にする。",
    subtitle: "スカウットのしくみ",
    body: [
      "カードをタップするとスカウット画面へ。",
      "ナノストーンを選んでミニゲームに挑戦！",
      "成功すれば、そのナノンが仲間になる。",
    ],
    visual: {
      type: "flow",
      steps: [
        { icon: "🃏", label: "カードをタップ" },
        { icon: "🪨", label: "ストーンを選ぶ" },
        { icon: "🎯", label: "ミニゲーム" },
        { icon: "✅", label: "仲間になる！" },
      ],
    },
    tip: "同じナノンを何度もスカウットするとレベルが上がり、新しい特性が解放される！",
    cta: "次へ",
  },

  // ---- 4: ナノストーン ----
  {
    id: "stone",
    type: "mechanic",
    badge: "基本④",
    title: "石の輝きが、成功率を変える。",
    subtitle: "ナノストーンのしくみ",
    body: [
      "スカウットには「ナノストーン」を使う。",
      "石は歩いて集めたエネルギーが結晶化したもの。",
      "輝きが強いほど、スカウット成功率がアップ！",
    ],
    visual: {
      type: "stones",
      stones: [
        { name: "ダルストーン",   emoji: "🪨", color: "#9090AA", bonus: "+0%",  desc: "くすんだ原石" },
        { name: "グローストーン", emoji: "💎", color: "#00C9A7", bonus: "+10%", desc: "うっすら光る" },
        { name: "ブライトストーン",emoji: "✨", color: "#FFD700", bonus: "+20%", desc: "強く輝く" },
        { name: "プリズムストーン",emoji: "🌈", color: "#CC44FF", bonus: "+35%", desc: "虹色に輝く" },
      ],
    },
    tip: "ストーンは歩いていると自然に拾えるほか、ガチャでも入手できる。",
    cta: "次へ",
  },

  // ---- 5: 出発 ----
  {
    id: "start",
    type: "finale",
    badge: null,
    title: "さあ、冒険へ。",
    subtitle: null,
    body: [
      "今日の最初の一歩が、",
      "すべての始まりになる。",
      "",
      "まずはナノ草原を歩いてみよう。",
      "きっとすぐに、最初のナノンが現れる。",
    ],
    visual: {
      type: "finale",
      emojis: ["🌿", "💧", "🔥", "⚡", "🌑", "✨"],
    },
    cta: "冒険スタート！",
  },
] as const;

const TOTAL = STEPS.length;
const BG = "#0D0D1A";
const TEAL = "#00C9A7";
const GOLD = "#FFD700";
const TEXT = "#F0F0FF";
const MUTED = "#9090AA";

// ============================================================
// サブコンポーネント
// ============================================================

/** 物語・エンディング用：浮遊する属性絵文字 */
function FloatingOrbs({ emojis }: { emojis: readonly string[] }) {
  return (
    <View style={{ height: 180, position: "relative", width: "100%", overflow: "hidden" }}>
      {emojis.map((emoji, i) => {
        const x = [0.08, 0.25, 0.45, 0.62, 0.78, 0.90][i] * (width - 40);
        const y = [60, 20, 80, 30, 70, 10][i];
        return (
          <Animated.Text
            key={i}
            entering={FadeIn.delay(i * 150).duration(600)}
            style={{
              position: "absolute",
              left: x, top: y,
              fontSize: i === 0 ? 40 : i === 5 ? 36 : 28,
              opacity: 0.7,
            }}
          >
            {emoji}
          </Animated.Text>
        );
      })}
    </View>
  );
}

/** メカニクス説明：デモ行 */
function DemoRow({ icon, label, arrow, result }: {
  icon: string; label: string; arrow: string; result: string;
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(400)}
      style={{
        flexDirection: "row", alignItems: "center",
        backgroundColor: "#161628", borderRadius: 12,
        padding: 14, marginBottom: 8, gap: 10,
      }}
    >
      <Text style={{ fontSize: 26 }}>{icon}</Text>
      <Text style={{ flex: 1, color: TEXT, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: MUTED, fontSize: 16 }}>{arrow}</Text>
      <View style={{
        backgroundColor: `${TEAL}22`, borderRadius: 8,
        paddingHorizontal: 10, paddingVertical: 4,
      }}>
        <Text style={{ color: TEAL, fontWeight: "700", fontSize: 13 }}>{result}</Text>
      </View>
    </Animated.View>
  );
}

/** エンカウントカードのミニプレビュー */
function MiniCard({ emoji, name, rarity, area, delay }: {
  emoji: string; name: string; rarity: string; area: string; delay: number;
}) {
  const RARITY_COLOR: Record<string, string> = {
    N: "#9090AA", R: "#4FC3F7", SR: "#AB47BC", SSR: "#FFD700", UR: "#FF4081",
  };
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400)}
      style={{
        flex: 1, backgroundColor: "#161628", borderRadius: 12,
        padding: 12, alignItems: "center", gap: 4,
        borderWidth: 1, borderColor: "#1F1F38",
      }}
    >
      <Text style={{ fontSize: 32 }}>{emoji}</Text>
      <View style={{
        backgroundColor: `${RARITY_COLOR[rarity]}22`,
        borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1,
      }}>
        <Text style={{ color: RARITY_COLOR[rarity], fontSize: 9, fontWeight: "700" }}>
          {rarity}
        </Text>
      </View>
      <Text style={{ color: TEXT, fontSize: 11, fontWeight: "600", textAlign: "center" }}>
        {name}
      </Text>
      <Text style={{ color: MUTED, fontSize: 9 }}>{area}</Text>
    </Animated.View>
  );
}

/** スカウットフロー矢印 */
function FlowStep({ icon, label, isLast, delay }: {
  icon: string; label: string; isLast: boolean; delay: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400)}
      style={{ alignItems: "center", flex: 1 }}
    >
      <View style={{
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: "#161628", borderWidth: 1.5,
        borderColor: TEAL, alignItems: "center", justifyContent: "center",
        marginBottom: 6,
      }}>
        <Text style={{ fontSize: 24 }}>{icon}</Text>
      </View>
      <Text style={{ color: TEXT, fontSize: 10, textAlign: "center", lineHeight: 14 }}>
        {label}
      </Text>
      {!isLast && (
        <Text style={{
          position: "absolute", right: -6, top: 16,
          color: MUTED, fontSize: 18,
        }}>›</Text>
      )}
    </Animated.View>
  );
}

/** ナノストーン一覧 */
function StoneRow({ name, emoji, color, bonus, desc, delay }: {
  name: string; emoji: string; color: string;
  bonus: string; desc: string; delay: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400)}
      style={{
        flexDirection: "row", alignItems: "center",
        backgroundColor: "#161628", borderRadius: 12,
        padding: 12, marginBottom: 8, gap: 12,
        borderLeftWidth: 3, borderLeftColor: color,
      }}
    >
      <Text style={{ fontSize: 28, width: 36, textAlign: "center" }}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ color: TEXT, fontWeight: "700", fontSize: 13 }}>{name}</Text>
        <Text style={{ color: MUTED, fontSize: 11, marginTop: 1 }}>{desc}</Text>
      </View>
      <View style={{
        backgroundColor: `${color}22`, borderRadius: 8,
        paddingHorizontal: 8, paddingVertical: 3,
      }}>
        <Text style={{ color, fontWeight: "700", fontSize: 12 }}>{bonus}</Text>
      </View>
    </Animated.View>
  );
}

// ============================================================
// メイン コンポーネント
// ============================================================

export default function TutorialScreen() {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  // プログレスバーアニメーション
  const progress = useSharedValue(0);
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%` as any,
  }));

  useEffect(() => {
    progress.value = withTiming((step + 1) / TOTAL, { duration: 400 });
  }, [step]);

  // パルスアニメーション（CTA ボタン用）
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 800 }),
        withTiming(1.00, { duration: 800 }),
      ), -1, true
    );
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const handleNext = useCallback(async () => {
    if (step < TOTAL - 1) {
      setStep((s) => s + 1);
    } else {
      await AsyncStorage.setItem("tutorial_completed", "true");
      router.replace("/(tabs)");
    }
  }, [step]);

  const handleSkip = useCallback(async () => {
    await AsyncStorage.setItem("tutorial_completed", "true");
    router.replace("/(tabs)");
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* ヘッダー：プログレス + スキップ */}
      <View style={{
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 12,
      }}>
        {/* プログレスバー */}
        <View style={{
          flex: 1, height: 3, backgroundColor: "#1F1F38",
          borderRadius: 2, overflow: "hidden",
        }}>
          <Animated.View style={[
            { height: 3, backgroundColor: TEAL, borderRadius: 2 },
            progressStyle,
          ]} />
        </View>
        {/* ステップ数 */}
        <Text style={{ color: MUTED, fontSize: 11 }}>
          {step + 1} / {TOTAL}
        </Text>
        {/* スキップ */}
        {step < TOTAL - 1 && (
          <Pressable onPress={handleSkip} hitSlop={8}>
            <Text style={{ color: MUTED, fontSize: 12 }}>スキップ</Text>
          </Pressable>
        )}
      </View>

      {/* コンテンツ */}
      <ScrollView
        key={step}
        contentContainerStyle={{
          flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      >

        {/* ---- STORY ---- */}
        {current.type === "story" && (
          <Animated.View entering={FadeIn.duration(600)} style={{ flex: 1 }}>
            <FloatingOrbs emojis={(current.visual as any).emojis} />

            <Animated.Text
              entering={FadeInDown.delay(300).duration(500)}
              style={{
                color: TEAL, fontSize: 11, fontWeight: "700",
                letterSpacing: 3, textAlign: "center", marginBottom: 16,
                textTransform: "uppercase",
              }}
            >
              NanoWalk
            </Animated.Text>

            <Animated.Text
              entering={FadeInDown.delay(450).duration(500)}
              style={{
                color: TEXT, fontSize: 26, fontWeight: "700",
                textAlign: "center", lineHeight: 36, marginBottom: 28,
              }}
            >
              {current.title}
            </Animated.Text>

            <Animated.View
              entering={FadeInDown.delay(600).duration(500)}
              style={{
                backgroundColor: "#0F0F20", borderRadius: 16,
                padding: 20, borderWidth: 1, borderColor: "#1F1F38",
                marginBottom: 24,
              }}
            >
              {(current.body as readonly string[]).map((line, i) => (
                <Text key={i} style={{
                  color: line === "" ? "transparent" : "#C0C0D8",
                  fontSize: 15, lineHeight: 26, textAlign: "center",
                  height: line === "" ? 8 : undefined,
                }}>
                  {line}
                </Text>
              ))}
            </Animated.View>
          </Animated.View>
        )}

        {/* ---- MECHANIC ---- */}
        {current.type === "mechanic" && (
          <Animated.View entering={FadeIn.duration(400)}>
            {/* バッジ */}
            <Animated.View
              entering={FadeInDown.duration(400)}
              style={{ alignItems: "center", marginBottom: 16 }}
            >
              <View style={{
                backgroundColor: `${TEAL}22`, borderRadius: 20,
                paddingHorizontal: 14, paddingVertical: 4,
                borderWidth: 1, borderColor: `${TEAL}44`,
              }}>
                <Text style={{ color: TEAL, fontSize: 11, fontWeight: "700" }}>
                  {current.badge}
                </Text>
              </View>
            </Animated.View>

            {/* タイトル */}
            <Animated.Text
              entering={FadeInDown.delay(100).duration(400)}
              style={{
                color: TEXT, fontSize: 24, fontWeight: "700",
                textAlign: "center", marginBottom: 6, lineHeight: 32,
              }}
            >
              {current.title}
            </Animated.Text>
            <Animated.Text
              entering={FadeInDown.delay(150).duration(400)}
              style={{
                color: TEAL, fontSize: 13, textAlign: "center",
                marginBottom: 20,
              }}
            >
              {current.subtitle}
            </Animated.Text>

            {/* 説明文 */}
            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              {(current.body as readonly string[]).map((line, i) => (
                <Text key={i} style={{
                  color: "#C0C0D8", fontSize: 14, lineHeight: 22,
                  textAlign: "center", marginBottom: 2,
                }}>
                  {line}
                </Text>
              ))}
            </Animated.View>

            {/* ビジュアル */}
            <View style={{ marginTop: 20, marginBottom: 16 }}>

              {/* デモ行（歩数） */}
              {(current.visual as any).type === "demo" &&
                (current.visual as any).items.map((item: any, i: number) => (
                  <DemoRow key={i} {...item} />
                ))
              }

              {/* カードプレビュー（エンカウント） */}
              {(current.visual as any).type === "card_demo" && (
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {(current.visual as any).cards.map((card: any, i: number) => (
                    <MiniCard key={i} {...card} delay={i * 100} />
                  ))}
                </View>
              )}

              {/* フロー矢印（スカウット） */}
              {(current.visual as any).type === "flow" && (
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 4 }}>
                  {(current.visual as any).steps.map((s: any, i: number) => (
                    <FlowStep
                      key={i} {...s}
                      isLast={i === (current.visual as any).steps.length - 1}
                      delay={i * 100}
                    />
                  ))}
                </View>
              )}

              {/* ストーン一覧 */}
              {(current.visual as any).type === "stones" && (
                <View>
                  {(current.visual as any).stones.map((stone: any, i: number) => (
                    <StoneRow key={i} {...stone} delay={i * 80} />
                  ))}
                </View>
              )}
            </View>

            {/* Tip */}
            {"tip" in current && current.tip && (
              <Animated.View
                entering={FadeInDown.delay(500).duration(400)}
                style={{
                  backgroundColor: `${GOLD}11`,
                  borderRadius: 10, padding: 12,
                  borderWidth: 1, borderColor: `${GOLD}33`,
                  flexDirection: "row", gap: 8, marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 14 }}>💡</Text>
                <Text style={{ flex: 1, color: "#D4B040", fontSize: 12, lineHeight: 18 }}>
                  {current.tip}
                </Text>
              </Animated.View>
            )}
          </Animated.View>
        )}

        {/* ---- FINALE ---- */}
        {current.type === "finale" && (
          <Animated.View entering={FadeIn.duration(800)} style={{ alignItems: "center" }}>

            {/* 放射状の光 */}
            <View style={{
              width: 160, height: 160, alignItems: "center",
              justifyContent: "center", marginVertical: 20,
            }}>
              <View style={{
                position: "absolute", width: 160, height: 160,
                borderRadius: 80, backgroundColor: `${TEAL}15`,
              }} />
              <View style={{
                position: "absolute", width: 110, height: 110,
                borderRadius: 55, backgroundColor: `${TEAL}20`,
              }} />
              <View style={{
                position: "absolute", width: 70, height: 70,
                borderRadius: 35, backgroundColor: `${TEAL}30`,
              }} />
              <Text style={{ fontSize: 52 }}>🦶</Text>
            </View>

            {/* タイトル */}
            <Animated.Text
              entering={FadeInDown.delay(300).duration(500)}
              style={{
                color: TEXT, fontSize: 28, fontWeight: "700",
                textAlign: "center", lineHeight: 38, marginBottom: 20,
              }}
            >
              {current.title}
            </Animated.Text>

            {/* 物語締め */}
            <Animated.View
              entering={FadeInDown.delay(500).duration(500)}
              style={{ marginBottom: 28 }}
            >
              {(current.body as readonly string[]).map((line, i) => (
                <Text key={i} style={{
                  color: line === "" ? "transparent" : "#C0C0D8",
                  fontSize: 15, lineHeight: 26, textAlign: "center",
                  height: line === "" ? 8 : undefined,
                }}>
                  {line}
                </Text>
              ))}
            </Animated.View>

            {/* 属性アイコン */}
            <Animated.View
              entering={FadeInDown.delay(700).duration(500)}
              style={{ flexDirection: "row", gap: 12, marginBottom: 8 }}
            >
              {(current.visual as any).emojis.map((emoji: string, i: number) => (
                <Text key={i} style={{ fontSize: 24, opacity: 0.8 }}>{emoji}</Text>
              ))}
            </Animated.View>

            <Animated.Text
              entering={FadeInDown.delay(800).duration(500)}
              style={{
                color: MUTED, fontSize: 11, textAlign: "center", marginTop: 4,
              }}
            >
              すべての属性のナノンが、あなたを待っている。
            </Animated.Text>
          </Animated.View>
        )}

      </ScrollView>

      {/* CTAボタン */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 28, paddingTop: 8 }}>
        <Animated.View style={pulseStyle}>
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => ({
              backgroundColor: current.type === "finale" ? GOLD : TEAL,
              borderRadius: 16, paddingVertical: 16,
              alignItems: "center",
              opacity: pressed ? 0.85 : 1,
              shadowColor: current.type === "finale" ? GOLD : TEAL,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 12,
              elevation: 8,
            })}
          >
            <Text style={{
              color: BG,
              fontWeight: "700",
              fontSize: current.type === "finale" ? 17 : 16,
            }}>
              {current.cta}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
