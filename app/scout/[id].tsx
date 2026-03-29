/**
 * NanoWalk — スカウト画面 v2.0
 * app/scout/[id].tsx
 *
 * バトル廃止・コレクション特化
 * ミニゲーム3種: タップタイミング / ルーレット / スライダー
 */

import {
  View, Text, Pressable, Modal, Animated as RNAnimated, PanResponder,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, withRepeat, withSequence,
  runOnJS, Easing, FadeIn, FadeInDown, FadeOut,
} from "react-native-reanimated";
import { useEffect, useState, useRef, useCallback } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useEncounterStore } from "@/store/encounterStore";
import { usePlayerStore } from "@/store/playerStore";
import { getMonsterById } from "@/constants/monsters";
import {
  buildScoutSession, applyMiniGameResult, executeScout,
  calcTraitBonus, tapTimingToMultiplier,
  rouletteToMultiplier, sliderToMultiplier,
} from "@/services/scoutService";
import { MONSTER_POOL } from "@/constants/monsters";
import type { StoneType, ScoutResult, MiniGameType, MonsterDefinition } from "@/types";
import { getItemsByCategory, getItem } from "@/constants/items";

// ---- Constants ----
const ELEMENT_EMOJI: Record<string, string> = {
  flare:"🔥", aqua:"💧", forest:"🌿", bolt:"⚡", shadow:"🌑", lumina:"✨",
};
const RARITY_COLOR: Record<string, string> = {
  N:"#9090AA", R:"#4FC3F7", SR:"#AB47BC", SSR:"#FFD700", UR:"#FF4081",
};
const stoneColor: Record<string, string> = {
  dull:"#9090AA", glow:"#00C9A7", bright:"#FFD700", prism:"#CC44FF",
};
const stoneEmoji: Record<string, string> = {
  dull:"🪨", glow:"💎", bright:"✨", prism:"🌈",
};
const stoneLabel: Record<string, string> = {
  dull:"ダルストーン", glow:"グローストーン", bright:"ブライトストーン", prism:"プリズムストーン",
};
const stoneBonus: Record<string, number> = {
  dull:0, glow:10, bright:20, prism:35,
};

// ---- ミニゲーム共通: 5段階結果ラベル ----
function getResultLabel(mult: number) {
  if (mult >= 2.0) return { text: "PERFECT!", sub: "×2.0", color: "#FFD700" };
  if (mult >= 1.5) return { text: "GREAT",   sub: "×1.5", color: "#00C9A7" };
  if (mult >= 1.0) return { text: "GOOD",    sub: "×1.0", color: "#4FC3F7" };
  if (mult >= 0.7) return { text: "MISS",    sub: "×0.7", color: "#FF8C00" };
  return               { text: "BAD",     sub: "×0.5", color: "#FF5252" };
}

// ============================================================
// ミニゲーム: タップタイミング（加速あり・5段階判定）
// ============================================================
function TapTimingGame({ onComplete }: { onComplete: (mult: number) => void }) {
  const BAR_WIDTH     = 240;
  const TARGET_CENTER = BAR_WIDTH * 0.5;
  const TARGET_WIDTH  = 44;
  const MIN_SPEED     = 3;
  const MAX_SPEED     = 14;

  const [position, setPosition] = useState(0);
  const [speedLevel, setSpeedLevel] = useState(0); // 0〜5 表示用
  const [done, setDone]         = useState(false);
  const [label, setLabel]       = useState<ReturnType<typeof getResultLabel> | null>(null);

  const posRef      = useRef(0);
  const dirRef      = useRef(1);
  const speedRef    = useRef(MIN_SPEED);
  const tickRef     = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      tickRef.current++;
      // 約4秒で最高速に達する加速
      speedRef.current = Math.min(MAX_SPEED, MIN_SPEED + tickRef.current * 0.045);
      setSpeedLevel(Math.floor((speedRef.current - MIN_SPEED) / (MAX_SPEED - MIN_SPEED) * 5));

      posRef.current += dirRef.current * speedRef.current;
      if (posRef.current >= BAR_WIDTH - 20) {
        posRef.current = BAR_WIDTH - 20;
        dirRef.current = -1;
      } else if (posRef.current <= 0) {
        posRef.current = 0;
        dirRef.current = 1;
      }
      setPosition(posRef.current);
    }, 16);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const handleTap = useCallback(() => {
    if (done) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDone(true);
    const distance = Math.abs(posRef.current - (TARGET_CENTER - 10));
    const mult =
      distance <=  4 ? 2.0 :
      distance <= 12 ? 1.5 :
      distance <= 22 ? 1.0 :
      distance <= 42 ? 0.7 : 0.5;
    setLabel(getResultLabel(mult));
    setTimeout(() => onComplete(mult), 900);
  }, [done, onComplete]);

  const inZone = Math.abs(position - (TARGET_CENTER - 10)) <= TARGET_WIDTH / 2;

  return (
    <View style={{ alignItems: "center", gap: 18 }}>
      <Text style={{ color: "#9090AA", fontSize: 13 }}>
        ⚡ 緑ゾーンでタップ！だんだん速くなるよ
      </Text>

      {/* バー */}
      <View style={{
        width: BAR_WIDTH, height: 28, backgroundColor: "#1F1F38",
        borderRadius: 14, overflow: "hidden", position: "relative",
      }}>
        {/* GOOD ゾーン（広め） */}
        <View style={{
          position: "absolute",
          left: TARGET_CENTER - TARGET_WIDTH / 2,
          width: TARGET_WIDTH, height: 28,
          backgroundColor: "#4FC3F718",
          borderLeftWidth: 1, borderRightWidth: 1,
          borderColor: "#4FC3F760",
        }} />
        {/* GREAT ゾーン（中） */}
        <View style={{
          position: "absolute",
          left: TARGET_CENTER - 12,
          width: 24, height: 28,
          backgroundColor: "#00C9A725",
          borderLeftWidth: 1, borderRightWidth: 1,
          borderColor: "#00C9A780",
        }} />
        {/* PERFECT ゾーン（中心線） */}
        <View style={{
          position: "absolute",
          left: TARGET_CENTER - 4,
          width: 8, height: 28,
          backgroundColor: "#FFD70040",
        }} />
        {/* インジケーター */}
        <View style={{
          position: "absolute", top: 4, left: position,
          width: 20, height: 20, borderRadius: 10,
          backgroundColor: done ? "#606080" : inZone ? "#00FFB0" : "#FFFFFF",
        }} />
      </View>

      {/* スピードメーター */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Text style={{ color: "#606080", fontSize: 10 }}>SPEED</Text>
        {[1,2,3,4,5].map(i => (
          <View key={i} style={{
            width: 20, height: 7, borderRadius: 3,
            backgroundColor: speedLevel >= i
              ? i <= 2 ? "#00C9A7" : i <= 4 ? "#FF8C00" : "#FF4081"
              : "#1F1F38",
          }} />
        ))}
      </View>

      {/* タップボタン */}
      <Pressable
        onPress={handleTap}
        disabled={done}
        style={{
          width: 120, height: 120, borderRadius: 60,
          backgroundColor: done ? "#1F1F38" : inZone ? "#00FFB0" : "#00C9A7",
          alignItems: "center", justifyContent: "center",
          opacity: done ? 0.5 : 1,
        }}
      >
        <Text style={{ color: "#0D0D1A", fontWeight: "900", fontSize: 18 }}>
          {done ? "✓" : "TAP!"}
        </Text>
      </Pressable>

      {label && (
        <View style={{ alignItems: "center" }}>
          <Text style={{ color: label.color, fontWeight: "900", fontSize: 28 }}>{label.text}</Text>
          <Text style={{ color: label.color, fontWeight: "700", fontSize: 16 }}>{label.sub}</Text>
        </View>
      )}
    </View>
  );
}

// ============================================================
// ミニゲーム: ルーレット（加速→減速・5段階判定）
// ============================================================
function RouletteGame({ onComplete }: { onComplete: (mult: number) => void }) {
  const [rotation, setRotation] = useState(0);
  const [done, setDone]         = useState(false);
  const [label, setLabel]       = useState<ReturnType<typeof getResultLabel> | null>(null);

  const rotRef      = useRef(0);
  const tickRef     = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // 最初は速く（12deg/tick）→ 徐々に加速→ 5秒後から急減速（自然に止まる感じ）
    intervalRef.current = setInterval(() => {
      tickRef.current++;
      const t = tickRef.current;
      // 0〜180tick: 8→14deg/tick に加速、180tick〜: 14→4deg/tick に減速（繰り返し）
      const cycle = t % 360;
      const speed = cycle < 180
        ? 8 + (cycle / 180) * 6        // 加速フェーズ
        : 14 - ((cycle - 180) / 180) * 10; // 減速フェーズ
      rotRef.current = (rotRef.current + Math.max(4, speed)) % 360;
      setRotation(rotRef.current);
    }, 16);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const handleStop = useCallback(() => {
    if (done) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDone(true);
    const deg = rotRef.current;
    // 矢印（上 = 0°）からの赤ゾーン距離
    const distFromRed = Math.min(deg, 360 - deg);
    const mult =
      distFromRed <=  3 ? 2.0 :
      distFromRed <=  9 ? 1.5 :
      distFromRed <= 18 ? 1.0 :
      distFromRed <= 30 ? 0.7 : 0.5;
    setLabel(getResultLabel(mult));
    setTimeout(() => onComplete(mult), 900);
  }, [done, onComplete]);

  // 凡例ゾーン
  const ZONES = [
    { label: "P",  deg: 3,  color: "#FFD700" },
    { label: "G+", deg: 9,  color: "#00C9A7" },
    { label: "G",  deg: 18, color: "#4FC3F7" },
    { label: "M",  deg: 30, color: "#FF8C00" },
  ];

  return (
    <View style={{ alignItems: "center", gap: 18 }}>
      <Text style={{ color: "#9090AA", fontSize: 13 }}>
        🎡 赤い▲が上を向いたら STOP！
      </Text>

      {/* ルーレット + 矢印 */}
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        {/* 固定矢印（上） */}
        <View style={{ position: "absolute", top: -14, zIndex: 10 }}>
          <Text style={{ color: "#FF4081", fontSize: 22, fontWeight: "900" }}>▼</Text>
        </View>

        <View style={{
          width: 150, height: 150, borderRadius: 75,
          borderWidth: 3, borderColor: "#2A2A44",
          overflow: "hidden",
          transform: [{ rotate: `${rotation}deg` }],
        }}>
          {/* 8セクション: 0番目だけ赤（PERFECT）、1番目オレンジ（GREAT）、2番目青（GOOD）*/}
          {[
            "#FF4081",  // 0: PERFECT赤
            "#FF6B35",  // 1: GREAT
            "#4FC3F7",  // 2: GOOD
            "#1F1F38",  // 3: MISS
            "#1F1F38",  // 4: BAD
            "#1F1F38",  // 5
            "#4FC3F740",// 6: GOOD
            "#FF6B3540",// 7: GREAT
          ].map((segColor, i) => (
            <View key={i} style={{
              position: "absolute",
              width: 150, height: 150,
              borderRadius: 75,
              overflow: "hidden",
              transform: [{ rotate: `${i * 45}deg` }],
            }}>
              <View style={{
                position: "absolute",
                top: 0, left: 75,
                width: 75, height: 75,
                backgroundColor: segColor,
              }} />
            </View>
          ))}
          {/* 中心 */}
          <View style={{
            position: "absolute", top: 55, left: 55,
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: "#0D0D1A",
            borderWidth: 2, borderColor: "#2A2A44",
          }} />
        </View>
      </View>

      {/* 判定ゾーン凡例 */}
      <View style={{ flexDirection: "row", gap: 8 }}>
        {ZONES.map(z => (
          <View key={z.label} style={{ alignItems: "center" }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: z.color }} />
            <Text style={{ color: z.color, fontSize: 9, marginTop: 2 }}>{z.label}</Text>
          </View>
        ))}
      </View>

      {/* ストップボタン */}
      <Pressable
        onPress={handleStop}
        disabled={done}
        style={{
          paddingHorizontal: 52, paddingVertical: 18,
          borderRadius: 22,
          backgroundColor: done ? "#1F1F38" : "#FF4081",
          opacity: done ? 0.5 : 1,
        }}
      >
        <Text style={{ color: "#0D0D1A", fontWeight: "900", fontSize: 20 }}>
          {done ? "✓" : "STOP!"}
        </Text>
      </Pressable>

      {label && (
        <View style={{ alignItems: "center" }}>
          <Text style={{ color: label.color, fontWeight: "900", fontSize: 28 }}>{label.text}</Text>
          <Text style={{ color: label.color, fontWeight: "700", fontSize: 16 }}>{label.sub}</Text>
        </View>
      )}
    </View>
  );
}

// ============================================================
// ミニゲーム: スライダー（自動移動＋加速・5段階判定）
// ============================================================
function SliderGame({ onComplete }: { onComplete: (mult: number) => void }) {
  const SLIDER_WIDTH  = 240;
  const TARGET_CENTER = SLIDER_WIDTH * 0.5;
  const MIN_SPEED     = 2;
  const MAX_SPEED     = 11;

  const [position, setPosition]     = useState(0);
  const [speedLevel, setSpeedLevel] = useState(0);
  const [done, setDone]             = useState(false);
  const [label, setLabel]           = useState<ReturnType<typeof getResultLabel> | null>(null);

  const posRef      = useRef(0);
  const dirRef      = useRef(1);
  const speedRef    = useRef(MIN_SPEED);
  const tickRef     = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      tickRef.current++;
      // 約3.5秒で最高速に加速
      speedRef.current = Math.min(MAX_SPEED, MIN_SPEED + tickRef.current * 0.05);
      setSpeedLevel(Math.floor((speedRef.current - MIN_SPEED) / (MAX_SPEED - MIN_SPEED) * 5));

      posRef.current += dirRef.current * speedRef.current;
      if (posRef.current >= SLIDER_WIDTH - 20) {
        posRef.current = SLIDER_WIDTH - 20;
        dirRef.current = -1;
      } else if (posRef.current <= 0) {
        posRef.current = 0;
        dirRef.current = 1;
      }
      setPosition(posRef.current);
    }, 16);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const handleStop = useCallback(() => {
    if (done) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDone(true);
    const distance = Math.abs(posRef.current - (TARGET_CENTER - 10));
    const mult =
      distance <=  5 ? 2.0 :
      distance <= 14 ? 1.5 :
      distance <= 28 ? 1.0 :
      distance <= 50 ? 0.7 : 0.5;
    setLabel(getResultLabel(mult));
    setTimeout(() => onComplete(mult), 900);
  }, [done, onComplete]);

  const inZone = Math.abs(position - (TARGET_CENTER - 10)) <= 28;

  return (
    <View style={{ alignItems: "center", gap: 18 }}>
      <Text style={{ color: "#9090AA", fontSize: 13 }}>
        🎚 中央で STOP！速くなるほど難しい
      </Text>

      {/* スライダー */}
      <View style={{
        width: SLIDER_WIDTH, height: 32, backgroundColor: "#1F1F38",
        borderRadius: 16, overflow: "hidden", position: "relative",
      }}>
        {/* GOOD ゾーン */}
        <View style={{
          position: "absolute",
          left: TARGET_CENTER - 28,
          width: 56, height: 32,
          backgroundColor: "#4FC3F718",
          borderLeftWidth: 1, borderRightWidth: 1, borderColor: "#4FC3F750",
        }} />
        {/* GREAT ゾーン */}
        <View style={{
          position: "absolute",
          left: TARGET_CENTER - 14,
          width: 28, height: 32,
          backgroundColor: "#00C9A720",
          borderLeftWidth: 1, borderRightWidth: 1, borderColor: "#00C9A760",
        }} />
        {/* PERFECT ゾーン */}
        <View style={{
          position: "absolute",
          left: TARGET_CENTER - 5,
          width: 10, height: 32,
          backgroundColor: "#FFD70030",
        }} />
        {/* インジケーター */}
        <View style={{
          position: "absolute", top: 6, left: position,
          width: 20, height: 20, borderRadius: 10,
          backgroundColor: done ? "#606080" : inZone ? "#00FFB0" : "#FFFFFF",
        }} />
      </View>

      {/* スピードメーター */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Text style={{ color: "#606080", fontSize: 10 }}>SPEED</Text>
        {[1,2,3,4,5].map(i => (
          <View key={i} style={{
            width: 20, height: 7, borderRadius: 3,
            backgroundColor: speedLevel >= i
              ? i <= 2 ? "#00C9A7" : i <= 4 ? "#FF8C00" : "#FF4081"
              : "#1F1F38",
          }} />
        ))}
      </View>

      {/* STOPボタン */}
      <Pressable
        onPress={handleStop}
        disabled={done}
        style={{
          paddingHorizontal: 52, paddingVertical: 18,
          borderRadius: 22,
          backgroundColor: done ? "#1F1F38" : inZone ? "#00FFB0" : "#00C9A7",
          opacity: done ? 0.5 : 1,
        }}
      >
        <Text style={{ color: "#0D0D1A", fontWeight: "900", fontSize: 20 }}>
          {done ? "✓" : "STOP!"}
        </Text>
      </Pressable>

      {label && (
        <View style={{ alignItems: "center" }}>
          <Text style={{ color: label.color, fontWeight: "900", fontSize: 28 }}>{label.text}</Text>
          <Text style={{ color: label.color, fontWeight: "700", fontSize: 16 }}>{label.sub}</Text>
        </View>
      )}
    </View>
  );
}

// ============================================================
// ミニゲーム: ダイス（3つ・運まかせ）
// ============================================================
const DICE_FACES = ["⚀","⚁","⚂","⚃","⚄","⚅"];

function DiceGame({ onComplete }: { onComplete: (mult: number) => void }) {
  const [dice, setDice]   = useState([1, 1, 1]);
  const [rolling, setRolling] = useState(false);
  const [done, setDone]   = useState(false);
  const [label, setLabel] = useState<ReturnType<typeof getResultLabel> | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleRoll = useCallback(() => {
    if (done || rolling) return;
    setRolling(true);

    let ticks = 0;
    const totalTicks = 28; // 約0.45秒ロール
    intervalRef.current = setInterval(() => {
      ticks++;
      setDice([
        Math.ceil(Math.random() * 6),
        Math.ceil(Math.random() * 6),
        Math.ceil(Math.random() * 6),
      ]);
      if (ticks >= totalTicks) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setRolling(false);
        setDone(true);

        // 加重乱数で結果決定（スキル不要の純粋な運）
        const rand = Math.random();
        const mult =
          rand < 0.05 ? 2.0 :  // PERFECT 5%
          rand < 0.30 ? 1.5 :  // GREAT   25%
          rand < 0.60 ? 1.0 :  // GOOD    30%
          rand < 0.82 ? 0.7 :  // MISS    22%
                        0.5;   // BAD     18%

        // ダイスの目を結果に合わせて演出
        const finalDice =
          mult >= 2.0 ? [6, 6, 6] :
          mult >= 1.5 ? [6, 6, Math.ceil(Math.random() * 5)] :
          mult >= 1.0 ? [5, 4, Math.ceil(Math.random() * 4) + 1] :
          mult >= 0.7 ? [3, 2, Math.ceil(Math.random() * 3)] :
                        [1, 1, Math.ceil(Math.random() * 2)];
        setDice(finalDice);
        setLabel(getResultLabel(mult));
        setTimeout(() => onComplete(mult), 1000);
      }
    }, 16);
  }, [done, rolling, onComplete]);

  return (
    <View style={{ alignItems: "center", gap: 24 }}>
      <Text style={{ color: "#9090AA", fontSize: 13 }}>
        🎲 ダイスをふって運試し！
      </Text>

      {/* 3つのダイス */}
      <View style={{ flexDirection: "row", gap: 16 }}>
        {dice.map((d, i) => (
          <View key={i} style={{
            width: 64, height: 64, borderRadius: 16,
            backgroundColor: "#1F1F38",
            borderWidth: 2,
            borderColor: done && !rolling
              ? (label?.color ?? "#1F1F38")
              : rolling ? "#FFD70060" : "#2A2A44",
            alignItems: "center", justifyContent: "center",
          }}>
            <Text style={{ fontSize: 36 }}>{DICE_FACES[d - 1]}</Text>
          </View>
        ))}
      </View>

      {/* ロールボタン */}
      <Pressable
        onPress={handleRoll}
        disabled={done || rolling}
        style={{
          paddingHorizontal: 56, paddingVertical: 18,
          borderRadius: 22,
          backgroundColor: done ? "#1F1F38" : rolling ? "#FFD70060" : "#FFD700",
          opacity: done ? 0.5 : 1,
        }}
      >
        <Text style={{ color: "#0D0D1A", fontWeight: "900", fontSize: 20 }}>
          {done ? "✓" : rolling ? "..." : "ROLL!"}
        </Text>
      </Pressable>

      {label && !rolling && (
        <View style={{ alignItems: "center" }}>
          <Text style={{ color: label.color, fontWeight: "900", fontSize: 28 }}>{label.text}</Text>
          <Text style={{ color: label.color, fontWeight: "700", fontSize: 16 }}>{label.sub}</Text>
        </View>
      )}
    </View>
  );
}

// ============================================================
// ミニゲーム: カードめくり（3枚・運まかせ）
// ============================================================
function CardGame({ onComplete }: { onComplete: (mult: number) => void }) {
  // 3枚のカードの結果をシャッフルして割り当て
  const [cards] = useState(() => {
    const rand = Math.random();
    const hasPerfect = rand < 0.08; // 8%でPERFECT登場
    const pool = hasPerfect
      ? [2.0, 1.0, 0.5]
      : [1.5, 1.0, 0.5];
    // シャッフル
    return [...pool].sort(() => Math.random() - 0.5);
  });

  const [flipped, setFlipped]   = useState<boolean[]>([false, false, false]);
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone]         = useState(false);

  const handlePick = useCallback((idx: number) => {
    if (done) return;
    setDone(true);
    setSelected(idx);
    // 選んだカードをめくる
    setFlipped([true, true, true]);
    const mult = cards[idx];
    setTimeout(() => onComplete(mult), 1200);
  }, [done, cards, onComplete]);

  const CARD_COLORS: Record<number, string> = {
    2.0: "#FFD700", 1.5: "#00C9A7", 1.0: "#4FC3F7", 0.5: "#FF5252",
  };
  const CARD_LABELS: Record<number, string> = {
    2.0: "PERFECT", 1.5: "GREAT", 1.0: "GOOD", 0.7: "MISS", 0.5: "BAD",
  };

  return (
    <View style={{ alignItems: "center", gap: 24 }}>
      <Text style={{ color: "#9090AA", fontSize: 13 }}>
        🃏 1枚選んでめくろう！
      </Text>

      {/* 3枚のカード */}
      <View style={{ flexDirection: "row", gap: 14 }}>
        {cards.map((mult, i) => {
          const isFlipped = flipped[i];
          const isSelected = selected === i;
          const color = CARD_COLORS[mult] ?? "#9090AA";
          return (
            <Pressable
              key={i}
              onPress={() => handlePick(i)}
              disabled={done}
              style={{
                width: 72, height: 108, borderRadius: 14,
                backgroundColor: isFlipped ? `${color}18` : "#1F1F38",
                borderWidth: 2,
                borderColor: isFlipped
                  ? color
                  : isSelected ? "#FFFFFF" : "#2A2A44",
                alignItems: "center", justifyContent: "center",
                opacity: done && !isSelected && !isFlipped ? 0.4 : 1,
              }}
            >
              {isFlipped ? (
                <View style={{ alignItems: "center", gap: 4 }}>
                  <Text style={{ fontSize: 28 }}>
                    {mult >= 2.0 ? "👑" : mult >= 1.5 ? "⭐" : mult >= 1.0 ? "🔷" : "💀"}
                  </Text>
                  <Text style={{ color, fontWeight: "900", fontSize: 11 }}>
                    {CARD_LABELS[mult]}
                  </Text>
                  <Text style={{ color, fontWeight: "700", fontSize: 13 }}>
                    ×{mult.toFixed(1)}
                  </Text>
                </View>
              ) : (
                <Text style={{ fontSize: 32 }}>🂠</Text>
              )}
            </Pressable>
          );
        })}
      </View>

      {!done && (
        <Text style={{ color: "#606080", fontSize: 12 }}>
          タップして1枚選んでください
        </Text>
      )}

      {done && selected !== null && (
        <View style={{ alignItems: "center" }}>
          {(() => {
            const lbl = getResultLabel(cards[selected]);
            return (
              <>
                <Text style={{ color: lbl.color, fontWeight: "900", fontSize: 28 }}>{lbl.text}</Text>
                <Text style={{ color: lbl.color, fontWeight: "700", fontSize: 16 }}>{lbl.sub}</Text>
              </>
            );
          })()}
        </View>
      )}
    </View>
  );
}

// ============================================================
// スカウト結果表示
// ============================================================
function ScoutResultView({
  result, onClose,
}: {
  result: ScoutResult; onClose: () => void;
}) {
  const scale = useSharedValue(0);
  useEffect(() => {
    scale.value = withSpring(1, { damping: 8 });
  }, []);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isSuccess = result.type === "success" || result.type === "level_up";
  const color = isSuccess ? "#00C9A7" : "#FF5252";
  const emoji =
    result.type === "success"   ? "🎉" :
    result.type === "level_up"  ? "⬆️" :
    result.type === "escape"    ? "💨" : "💧";

  return (
    <View style={{ alignItems: "center", gap: 16 }}>
      <Animated.View style={animStyle}>
        <Text style={{ fontSize: 72 }}>{emoji}</Text>
      </Animated.View>

      <Text style={{ color, fontWeight: "900", fontSize: 26 }}>
        {result.type === "success"  ? "スカウト成功！" :
         result.type === "level_up" ? `Lv.${result.newLevel} に強化！` :
         result.type === "escape"   ? "逃げられた..." : "スカウト失敗"}
      </Text>

      {/* モンスター名 */}
      <View style={{
        paddingHorizontal: 20, paddingVertical: 10,
        borderRadius: 16, backgroundColor: `${color}18`,
        borderWidth: 1, borderColor: `${color}40`,
      }}>
        <Text style={{ color: "#F0F0FF", fontWeight: "700", fontSize: 18, textAlign: "center" }}>
          {ELEMENT_EMOJI[result.monster.element]} {result.monster.name}
        </Text>
        <Text style={{ color: "#9090AA", fontSize: 12, textAlign: "center", marginTop: 4 }}>
          {result.monster.rarity} · {result.monster.element}
        </Text>
      </View>

      {/* 特性解放 */}
      {result.traitUnlocked && (
        <Animated.View
          entering={FadeInDown.delay(400).duration(400)}
          style={{
            padding: 14, borderRadius: 16,
            backgroundColor: "#FFD70018",
            borderWidth: 1, borderColor: "#FFD70040",
            width: "100%",
          }}
        >
          <Text style={{ color: "#FFD700", fontWeight: "900", fontSize: 13, marginBottom: 4 }}>
            ✨ 特性解放！
          </Text>
          <Text style={{ color: "#F0F0FF", fontWeight: "700" }}>
            {result.traitUnlocked.name}
          </Text>
          <Text style={{ color: "#9090AA", fontSize: 12, marginTop: 2 }}>
            {result.traitUnlocked.description}
          </Text>
        </Animated.View>
      )}

      {/* 進化解放 */}
      {result.evolved && (
        <Animated.View
          entering={FadeInDown.delay(600).duration(400)}
          style={{
            padding: 14, borderRadius: 16,
            backgroundColor: "#AB47BC18",
            borderWidth: 1, borderColor: "#AB47BC40",
            width: "100%",
          }}
        >
          <Text style={{ color: "#AB47BC", fontWeight: "900", fontSize: 13, marginBottom: 4 }}>
            ⚡ 進化解放！
          </Text>
          <Text style={{ color: "#F0F0FF", fontWeight: "700" }}>
            → {result.evolved.name} に進化できる！
          </Text>
        </Animated.View>
      )}

      <Pressable
        onPress={onClose}
        style={{
          paddingHorizontal: 48, paddingVertical: 16,
          borderRadius: 20, backgroundColor: "#00C9A7", marginTop: 8,
        }}
      >
        <Text style={{ color: "#0D0D1A", fontWeight: "900", fontSize: 16 }}>
          もどる
        </Text>
      </Pressable>
    </View>
  );
}

// ============================================================
// スカウト率インジケーター
// ============================================================
function ScoutRateBar({ rate, label }: { rate: number; label: string }) {
  const color =
    rate >= 0.6 ? "#00C9A7" :
    rate >= 0.3 ? "#FFD700" :
    rate >= 0.1 ? "#FF8C00" : "#FF4081";
  return (
    <View style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={{ color: "#9090AA", fontSize: 11 }}>{label}</Text>
        <Text style={{ color, fontWeight: "700", fontSize: 13 }}>
          {Math.round(rate * 100)}%
        </Text>
      </View>
      <View style={{ height: 6, backgroundColor: "#1F1F38", borderRadius: 3, overflow: "hidden" }}>
        <View style={{
          height: 6, width: `${Math.min(rate * 100, 100)}%`,
          backgroundColor: color, borderRadius: 3,
        }} />
      </View>
    </View>
  );
}

// ============================================================
// Main Scout Screen
// ============================================================
export default function ScoutScreen() {
  const { id, cardId, items } = useLocalSearchParams<{
    id: string; cardId?: string; items?: string;
  }>();
  const { player, monsters, useStone, addOrLevelUp, useItem, removeItem, getActiveEffect, getCompanionGearBonus } = usePlayerStore();
  const { consumeAttempt, removeCard, addAttempt } = useEncounterStore();

  // カードから捕獲率をオーバーライド
  const { cards } = useEncounterStore();
  const encounterCard = cardId
    ? cards.find((c) => c.id === cardId && c.kind === "monster")
    : null;

  const monsterDef = getMonsterById(Number(id));

  const [phase, setPhase]         = useState<"prep" | "minigame" | "result">("prep");
  const [selectedStone, setSelectedStone] = useState<StoneType>("dull");
  const [miniGameMult, setMiniGameMult] = useState(1.0);
  const [scoutResult, setScoutResult]   = useState<ScoutResult | null>(null);

  // スカウト率の計算
  const area    = (player?.currentArea ?? "nano_plains") as any;
  const weather = "sunny" as any;   // TODO: 天気APIから取得
  const hour    = new Date().getHours();

  const traitBonus = monsterDef
    ? calcTraitBonus(monsterDef, monsters, MONSTER_POOL, area, weather, hour)
    : 0;

  const session = monsterDef
    ? buildScoutSession({
        monsterDef, area, weather,
        ballType: selectedStone,
        itemBonus: 0,
        traitBonus,
        hour,
      })
    : null;

  const miniGameType: MiniGameType = session?.miniGameType ?? "tap_timing";

  const monsterScale = useSharedValue(0.8);
  const monsterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: monsterScale.value }],
  }));
  useEffect(() => {
    monsterScale.value = withSpring(1, { damping: 8 });
  }, []);

  if (!monsterDef || !session || !player) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0D0D1A",
        alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#9090AA" }}>モンスターが見つかりません</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16, padding: 12 }}>
          <Text style={{ color: "#00C9A7" }}>戻る</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const color = RARITY_COLOR[monsterDef.rarity];

  const handleStartScout = () => {
    if (!useStone(selectedStone)) return;
    setPhase("minigame");
  };

  const handleMiniGameComplete = (mult: number) => {
    setMiniGameMult(mult);
    const finalSession = applyMiniGameResult(session, mult);
    const result = executeScout(finalSession, monsters, MONSTER_POOL);

    if (result.type === "success" || result.type === "level_up") {
      // 捕獲成功 → カードを削除
      addOrLevelUp(monsterDef.id, area);
      if (cardId) removeCard(cardId);
      setScoutResult(result);
    } else {
      // 失敗・逃走 → モンスターは即逃げる（デフォルト動作）
      if (cardId) removeCard(cardId);
      const escapeResult: ScoutResult = {
        type: "escape",
        monster: monsterDef,
        ballConsumed: result.ballConsumed,
      };
      setScoutResult(escapeResult);
    }

    setTimeout(() => setPhase("result"), 600);
  };

  // ---- Prep Phase ----
  if (phase === "prep") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0D0D1A" }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center",
          paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 10 }}>
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: "#00C9A7", fontSize: 18 }}>←</Text>
          </Pressable>
          <Text style={{ color: "#F0F0FF", fontWeight: "900", fontSize: 20 }}>
            スカウト
          </Text>
        </View>

        <View style={{ flex: 1, padding: 20 }}>
          {/* モンスター表示 */}
          <Animated.View style={[monsterStyle, {
            alignItems: "center", padding: 24, borderRadius: 24,
            backgroundColor: "#161628",
            borderWidth: 2, borderColor: `${color}40`,
            marginBottom: 20,
          }]}>
            <Text style={{ fontSize: 72, marginBottom: 12 }}>
              {ELEMENT_EMOJI[monsterDef.element]}
            </Text>
            <Text style={{ color: "#F0F0FF", fontWeight: "900", fontSize: 22 }}>
              {monsterDef.name}
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4,
                borderRadius: 12, backgroundColor: `${color}22` }}>
                <Text style={{ color, fontWeight: "700", fontSize: 12 }}>
                  {monsterDef.rarity}
                </Text>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4,
                borderRadius: 12, backgroundColor: "#1F1F38" }}>
                <Text style={{ color: "#9090AA", fontSize: 12 }}>
                  {ELEMENT_EMOJI[monsterDef.element]} {monsterDef.element}
                </Text>
              </View>
            </View>
            <Text style={{ color: "#9090AA", fontSize: 12,
              marginTop: 10, textAlign: "center" }}>
              {monsterDef.description}
            </Text>
          </Animated.View>

          {/* スカウト率 */}
          <View style={{ padding: 16, borderRadius: 18,
            backgroundColor: "#161628", borderWidth: 1,
            borderColor: "#1F1F38", marginBottom: 16 }}>
            <Text style={{ color: "#F0F0FF", fontWeight: "900",
              fontSize: 14, marginBottom: 12 }}>
              スカウト成功率
            </Text>
            <ScoutRateBar rate={session.baseRate} label="基本率" />
            {session.areaBonus > 0 &&
              <ScoutRateBar rate={session.areaBonus} label="エリアボーナス" />}
            {session.weatherBonus > 0 &&
              <ScoutRateBar rate={session.weatherBonus} label="天候ボーナス" />}
            {session.traitBonus > 0 &&
              <ScoutRateBar rate={session.traitBonus} label="特性ボーナス" />}
            <View style={{ height: 1, backgroundColor: "#1F1F38", marginVertical: 8 }} />
            <ScoutRateBar rate={session.finalRate}
              label={`最終スカウト率（ミニゲーム前）`} />
            <Text style={{ color: "#606080", fontSize: 10, marginTop: 4 }}>
              ミニゲームで×0.5〜×2.0 変動します
            </Text>
          </View>

          {/* ボール選択 */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: "#9090AA", fontSize: 12,
              fontWeight: "700", marginBottom: 8 }}>
              使うストーンを選ぶ
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {(["dull", "glow", "bright", "prism"] as StoneType[]).map((stone) => {
                const count = (player.stones ?? player.balls ?? {})[stone] ?? 0;
                const isSelected = selectedStone === stone;
                const sc = stoneColor[stone];
                return (
                  <Pressable
                    key={stone}
                    onPress={() => count > 0 && setSelectedStone(stone)}
                    style={{
                      flex: 1, padding: 10, borderRadius: 14,
                      alignItems: "center",
                      backgroundColor: isSelected ? `${sc}22` : "#161628",
                      borderWidth: 2,
                      borderColor: isSelected ? sc : "#1F1F38",
                      opacity: count === 0 ? 0.4 : 1,
                    }}
                  >
                    <Text style={{ fontSize: 20, marginBottom: 3 }}>{stoneEmoji[stone]}</Text>
                    <Text style={{ color: sc, fontWeight: "700",
                      fontSize: 10, textAlign: "center" }}>
                      {stoneLabel[stone]}
                    </Text>
                    {stoneBonus[stone] > 0 && (
                      <Text style={{ color: sc, fontSize: 9 }}>+{stoneBonus[stone]}%</Text>
                    )}
                    <Text style={{ color: "#606080", fontSize: 10 }}>×{count}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* スカウトボタン */}
          <Pressable
            onPress={handleStartScout}
            disabled={(player.stones ?? player.balls ?? {})[selectedStone] <= 0}
            style={{
              paddingVertical: 18, borderRadius: 22,
              backgroundColor: (player.stones ?? player.balls ?? {})[selectedStone] > 0 ? "#00C9A7" : "#1F1F38",
              alignItems: "center",
              opacity: (player.stones ?? player.balls ?? {})[selectedStone] > 0 ? 1 : 0.5,
            }}
          >
            <Text style={{ color: "#0D0D1A", fontWeight: "900", fontSize: 18 }}>
              {(player.stones ?? player.balls ?? {})[selectedStone] > 0
                ? `🎯 スカウト開始！`
                : "ストーンが足りません（手持ちなし）"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ---- Minigame Phase ----
  if (phase === "minigame") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0D0D1A",
        alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Animated.View entering={FadeIn.duration(300)} style={{
          width: "100%", padding: 28, borderRadius: 24,
          backgroundColor: "#161628",
          borderWidth: 1, borderColor: `${color}40`,
          alignItems: "center", gap: 8,
        }}>
          <Text style={{ color: color, fontWeight: "900",
            fontSize: 12, letterSpacing: 2, marginBottom: 4 }}>
            MINI GAME
          </Text>
          <Text style={{ color: "#F0F0FF", fontWeight: "900", fontSize: 20,
            marginBottom: 16 }}>
            {miniGameType === "tap_timing" ? "タップタイミング" :
             miniGameType === "slider"     ? "スライダー" :
             miniGameType === "dice"       ? "ダイス" : "カードめくり"}
          </Text>

          {miniGameType === "tap_timing" && (
            <TapTimingGame onComplete={handleMiniGameComplete} />
          )}
          {miniGameType === "slider" && (
            <SliderGame onComplete={handleMiniGameComplete} />
          )}
          {miniGameType === "dice" && (
            <DiceGame onComplete={handleMiniGameComplete} />
          )}
          {miniGameType === "card" && (
            <CardGame onComplete={handleMiniGameComplete} />
          )}
        </Animated.View>
      </SafeAreaView>
    );
  }

  // ---- Result Phase ----
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0D0D1A",
      alignItems: "center", justifyContent: "center", padding: 24 }}>
      {scoutResult && (
        <Animated.View entering={FadeIn.duration(400)} style={{ width: "100%" }}>
          <ScoutResultView
            result={scoutResult}
            onClose={() => router.back()}
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
}
