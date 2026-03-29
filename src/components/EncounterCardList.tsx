/**
 * NanoWalk — EncounterCardList
 * ホーム画面のエンカウントカード一覧
 *
 * - モンスターカード: スカウト / アイテムを使ってスカウト
 * - アイテムカード: タップで回収
 */

import {
  View, Text, Pressable, ScrollView, Modal,
  TouchableOpacity, Image,
} from "react-native";
import { getMonsterImage } from "@/constants/monsterImages";
import Animated, {
  FadeInRight, FadeOutLeft, useSharedValue,
  useAnimatedStyle, withSpring,
} from "react-native-reanimated";
import { useState, useCallback, useEffect } from "react";
import { router } from "expo-router";
import { useEncounterStore, type MonsterEncounterCard, type ItemFoundCard } from "@/store/encounterStore";
import { usePlayerStore } from "@/store/playerStore";
import { useItemStore } from "@/store/itemStore";
import { getMonsterById } from "@/constants/monsters";
import { getDropDisplayInfo } from "@/services/itemDropService";
import type { BallType } from "@/types";

const RARITY_COLOR: Record<string, string> = {
  N:"#9090AA", R:"#4FC3F7", SR:"#AB47BC", SSR:"#FFD700", UR:"#FF4081",
};
const ELEMENT_EMOJI: Record<string, string> = {
  flare:"🔥", aqua:"💧", forest:"🌿", bolt:"⚡", shadow:"🌑", lumina:"✨",
};

// ---- アイテム選択モーダル ----
interface ItemSelectModalProps {
  card:    MonsterEncounterCard;
  onClose: () => void;
  onStart: (cardId: string, selectedItems: string[]) => void;
}

const USABLE_ITEMS: { id: string; emoji: string; name: string; effect: string }[] = [
  { id: "rare_up_s",       emoji: "✨", name: "キラキラスプレー", effect: "SR以上+50%" },
  { id: "rare_up_m",       emoji: "🌈", name: "レインボーダスト",  effect: "SR以上+100%" },
  { id: "scout_brush",    emoji: "🪮", name: "なでなでブラシ",    effect: "スカウト率+20%" },
  { id: "scout_jam",    emoji: "🍯", name: "ナノジャム",        effect: "スカウト率+35%" },
  { id: "guiding_stone", emoji: "🎲", name: "みちびきの石",  effect: "試行+1 / 失敗しても継続" },
];

function ItemSelectModal({ card, onClose, onStart }: ItemSelectModalProps) {
  const { player } = usePlayerStore();
  const { getQty } = useItemStore();

  const [selectedBall, setSelectedBall]   = useState<BallType>("normal");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const def = getMonsterById(card.monsterId);
  if (!def) return null;
  const color = RARITY_COLOR[def.rarity];

  const ballBonus: Record<BallType, number> = {
    normal: 0, silver: 10, gold: 20, platinum: 35,
  };

  const handleStart = () => {
    const allSelected = [
      `ball:${selectedBall}`,
      ...selectedItems,
    ];
    onStart(card.id, allSelected);
    onClose();
  };

  return (
    <Modal transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" }}>
        <View style={{
          backgroundColor: "#161628",
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          padding: 20, paddingBottom: 36,
        }}>
          {/* ヘッダー */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 10 }}>
            <Text style={{ fontSize: 32 }}>{ELEMENT_EMOJI[def.element]}</Text>
            <View>
              <Text style={{ color: "#F0F0FF", fontWeight: "900", fontSize: 18 }}>
                {def.name}
              </Text>
              <Text style={{ color: color, fontSize: 12, fontWeight: "700" }}>
                {def.rarity} · 残り試行{card.attemptsLeft}回
              </Text>
            </View>
          </View>

          {/* ボール選択 */}
          <Text style={{ color: "#9090AA", fontSize: 11, fontWeight: "700",
            marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
            ボールを選ぶ（必須）
          </Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
            {(["normal","silver","gold","platinum"] as BallType[]).map((ball) => {
              const qty = (player?.stones ?? {})[ball as any] ?? 0;
              const sel = selectedBall === ball;
              const bc = ball==="platinum"?"#CC44FF":ball==="gold"?"#FFD700":ball==="silver"?"#AAAACC":"#FFFFFF";
              return (
                <Pressable
                  key={ball}
                  onPress={() => qty > 0 && setSelectedBall(ball)}
                  style={{
                    flex: 1, padding: 10, borderRadius: 14, alignItems: "center",
                    backgroundColor: sel ? `${bc}22` : "#0D0D1A",
                    borderWidth: 2, borderColor: sel ? bc : "#1F1F38",
                    opacity: qty === 0 ? 0.4 : 1,
                  }}
                >
                  <Text style={{ fontSize: 18, marginBottom: 2 }}>⚪</Text>
                  <Text style={{ color: bc, fontSize: 9, fontWeight: "700", textAlign: "center" }}>
                    {ball === "normal" ? "普通" : ball === "silver" ? "銀" :
                     ball === "gold" ? "金" : "白金"}
                  </Text>
                  {ballBonus[ball] > 0 && (
                    <Text style={{ color: bc, fontSize: 8 }}>+{ballBonus[ball]}%</Text>
                  )}
                  <Text style={{ color: "#606080", fontSize: 9 }}>×{qty}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* アイテム選択 */}
          <Text style={{ color: "#9090AA", fontSize: 11, fontWeight: "700",
            marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
            アイテムを選ぶ（任意・複数可）
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            {USABLE_ITEMS.map((item) => {
              const qty = getQty(item.id);
              const sel = selectedItems.includes(item.id);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => qty > 0 && toggleItem(item.id)}
                  style={{
                    width: "30%", padding: 10, borderRadius: 14, alignItems: "center",
                    backgroundColor: sel ? "#00C9A720" : "#0D0D1A",
                    borderWidth: 2, borderColor: sel ? "#00C9A7" : "#1F1F38",
                    opacity: qty === 0 ? 0.35 : 1,
                  }}
                >
                  <Text style={{ fontSize: 24, marginBottom: 4 }}>{item.emoji}</Text>
                  <Text style={{ color: sel ? "#00C9A7" : "#9090AA",
                    fontSize: 10, fontWeight: "700", textAlign: "center" }}
                    numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={{ color: "#00C9A7", fontSize: 9 }}>
                    {item.effect}
                  </Text>
                  <Text style={{ color: "#606080", fontSize: 9 }}>
                    ×{qty}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* 確認バナー */}
          {selectedItems.length > 0 && (
            <View style={{
              padding: 10, borderRadius: 12, backgroundColor: "#00C9A710",
              borderWidth: 1, borderColor: "#00C9A730", marginBottom: 12,
            }}>
              <Text style={{ color: "#00C9A7", fontSize: 12 }}>
                使用: {selectedItems.map((id) =>
                  USABLE_ITEMS.find((i) => i.id === id)?.name
                ).join("・")}
              </Text>
            </View>
          )}

          {/* ボタン */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable onPress={onClose} style={{
              flex: 1, paddingVertical: 14, borderRadius: 16,
              backgroundColor: "#1F1F38", alignItems: "center",
            }}>
              <Text style={{ color: "#9090AA", fontWeight: "700" }}>キャンセル</Text>
            </Pressable>
            <Pressable onPress={handleStart} style={{
              flex: 2, paddingVertical: 14, borderRadius: 16,
              backgroundColor: color, alignItems: "center",
            }}>
              <Text style={{ color: "#0D0D1A", fontWeight: "900", fontSize: 15 }}>
                🎯 スカウト開始！
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ---- モンスターカード ----
function MonsterCard({ card }: { card: MonsterEncounterCard }) {
  const { removeCard, addAttempt } = useEncounterStore();
  const { addBalls } = usePlayerStore();
  const { addItem } = useItemStore();

  const [showItemModal, setShowItemModal] = useState(false);
  const def = getMonsterById(card.monsterId);
  if (!def) return null;

  const color   = RARITY_COLOR[def.rarity];
  const scale   = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  // 残り時間
  const msLeft  = new Date(card.expiresAt).getTime() - Date.now();
  const minLeft = Math.max(0, Math.floor(msLeft / 60000));
  const timeStr = minLeft >= 60
    ? `${Math.floor(minLeft/60)}時間後に逃走`
    : `${minLeft}分後に逃走`;

  const handleDirectScout = () => {
    router.push(`/scout/${def.id}?cardId=${card.id}`);
  };

  const handleItemScout = (cardId: string, selectedItems: string[]) => {
    // アイテム効果をパラメータとして渡す
    const params = encodeURIComponent(JSON.stringify(selectedItems));
    router.push(`/scout/${def.id}?cardId=${cardId}&items=${params}`);
  };

  return (
    <Animated.View
      entering={FadeInRight.duration(400)}
      style={{
        marginBottom: 10,
        borderRadius: 20,
        backgroundColor: "#161628",
        borderWidth: 2,
        borderColor: `${color}40`,
        overflow: "hidden",
      }}
    >
      {/* レアリティライン */}
      <View style={{ height: 4, backgroundColor: color }} />

      <View style={{ padding: 14 }}>
        {/* モンスター情報 */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <View style={{
            width: 56, height: 56, borderRadius: 14,
            backgroundColor: `${color}18`,
            alignItems: "center", justifyContent: "center",
            marginRight: 12, borderWidth: 1, borderColor: `${color}30`,
            overflow: "hidden",
          }}>
            {getMonsterImage(def.id) ? (
              <Image
                source={getMonsterImage(def.id)}
                style={{ width: 52, height: 52, borderRadius: 12 }}
                resizeMode="contain"
              />
            ) : (
              <Text style={{ fontSize: 30 }}>{ELEMENT_EMOJI[def.element]}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <Text style={{ color: "#F0F0FF", fontWeight: "900", fontSize: 16 }}>
                {def.name}
              </Text>
              <View style={{ paddingHorizontal: 7, paddingVertical: 2,
                borderRadius: 8, backgroundColor: `${color}22` }}>
                <Text style={{ color, fontSize: 10, fontWeight: "700" }}>{def.rarity}</Text>
              </View>
            </View>
            <Text style={{ color: "#9090AA", fontSize: 11 }}>
              {ELEMENT_EMOJI[def.element]} {def.element} · 試行{card.attemptsLeft}回残
            </Text>
            {/* スカウト難易度バー */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 5 }}>
              <Text style={{ color: "#606080", fontSize: 9 }}>捕獲難易度</Text>
              <View style={{ flex: 1, height: 4, backgroundColor: "#1F1F38",
                borderRadius: 2, overflow: "hidden" }}>
                <View style={{
                  height: 4, width: `${card.captureRate * 100}%`,
                  backgroundColor: card.captureRate >= 0.6 ? "#00C9A7" :
                    card.captureRate >= 0.3 ? "#FFD700" : "#FF5252",
                  borderRadius: 2,
                }} />
              </View>
              <Text style={{ color: "#9090AA", fontSize: 9, width: 32 }}>
                {Math.round(card.captureRate * 100)}%
              </Text>
            </View>
          </View>
        </View>

        {/* 逃走タイマー */}
        <Text style={{ color: minLeft <= 10 ? "#FF5252" : "#606080",
          fontSize: 10, marginBottom: 10, textAlign: "right" }}>
          ⏱ {timeStr}
        </Text>

        {/* ボタン */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            onPress={handleDirectScout}
            style={{
              flex: 1, paddingVertical: 12, borderRadius: 14,
              backgroundColor: `${color}22`,
              borderWidth: 1, borderColor: `${color}40`,
              alignItems: "center",
            }}
          >
            <Text style={{ color, fontWeight: "900", fontSize: 13 }}>
              🎯 スカウト
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setShowItemModal(true)}
            style={{
              flex: 1, paddingVertical: 12, borderRadius: 14,
              backgroundColor: "#1F1F38",
              borderWidth: 1, borderColor: "#2a2a4a",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#00C9A7", fontWeight: "700", fontSize: 12 }}>
              🎒 アイテムを使う
            </Text>
          </Pressable>
        </View>
      </View>

      {showItemModal && (
        <ItemSelectModal
          card={card}
          onClose={() => setShowItemModal(false)}
          onStart={handleItemScout}
        />
      )}
    </Animated.View>
  );
}

// ---- アイテムカード ----
function ItemCard({ card }: { card: ItemFoundCard }) {
  const { collectItem } = useEncounterStore();
  const { addStones }   = usePlayerStore();
  const { addItem }     = useItemStore();
  const [collected, setCollected] = useState(card.collected);

  const info = getDropDisplayInfo(card.drop);

  const handleCollect = useCallback(() => {
    if (collected) return;
    const drop = collectItem(card.id);
    if (!drop) return;
    setCollected(true);
    // 実際にアイテムを付与
    if (drop.kind === "stone") {
      addStones(drop.stoneType, drop.quantity);
    } else {
      addItem(drop.itemId ?? (drop as any).itemId, drop.quantity);
    }
  }, [collected, card.id, collectItem, addStones, addItem]);

  return (
    <Animated.View
      entering={FadeInRight.duration(400)}
      style={{
        marginBottom: 10, borderRadius: 20,
        backgroundColor: "#161628",
        borderWidth: 1, borderColor: collected ? "#1F1F38" : "#00C9A740",
        opacity: collected ? 0.5 : 1,
      }}
    >
      <View style={{ height: 3, backgroundColor: collected ? "#1F1F38" : "#00C9A7" }} />
      <Pressable onPress={handleCollect} style={{
        padding: 14, flexDirection: "row", alignItems: "center", gap: 12,
      }}>
        <View style={{
          width: 52, height: 52, borderRadius: 16,
          backgroundColor: collected ? "#1F1F38" : "#00C9A718",
          alignItems: "center", justifyContent: "center",
          borderWidth: 1, borderColor: collected ? "#1F1F38" : "#00C9A740",
        }}>
          <Text style={{ fontSize: 26 }}>{collected ? "✓" : info.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#9090AA", fontSize: 10, marginBottom: 2 }}>
            🎁 アイテムを発見！
          </Text>
          <Text style={{ color: collected ? "#606080" : "#F0F0FF",
            fontWeight: "900", fontSize: 15 }}>
            {info.name}
          </Text>
          <Text style={{ color: "#00C9A7", fontSize: 12, marginTop: 2 }}>
            × {info.qty}
          </Text>
        </View>
        {!collected && (
          <View style={{
            paddingHorizontal: 14, paddingVertical: 8,
            borderRadius: 12, backgroundColor: "#00C9A7",
          }}>
            <Text style={{ color: "#0D0D1A", fontWeight: "900", fontSize: 12 }}>
              受け取る
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ============================================================
// EncounterCardList — ホームに表示するカード一覧
// ============================================================
export function EncounterCardList() {
  const { cards, purgeExpiredCards } = useEncounterStore();

  useEffect(() => { purgeExpiredCards(); }, []);

  const activeCards = cards.filter((c) => {
    if (c.kind === "item") return !c.collected;
    return true;
  });

  if (activeCards.length === 0) return null;

  return (
    <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center",
        justifyContent: "space-between", marginBottom: 10 }}>
        <Text style={{ color: "#F0F0FF", fontWeight: "900", fontSize: 16 }}>
          エンカウント
        </Text>
        <View style={{ paddingHorizontal: 10, paddingVertical: 4,
          borderRadius: 12, backgroundColor: "#161628",
          borderWidth: 1, borderColor: "#1F1F38" }}>
          <Text style={{ color: "#9090AA", fontSize: 11 }}>
            {activeCards.length}件
          </Text>
        </View>
      </View>

      {activeCards.map((card) =>
        card.kind === "monster" ? (
          <MonsterCard key={card.id} card={card as MonsterEncounterCard} />
        ) : (
          <ItemCard key={card.id} card={card as ItemFoundCard} />
        )
      )}
    </View>
  );
}
