import {
  View, Text, FlatList, Pressable, TextInput,
  ScrollView, Modal, Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useMemo, useRef, useEffect } from "react";
import { router } from "expo-router";
import { usePlayerStore } from "@/store/playerStore";
import { MONSTER_POOL } from "@/constants/monsters";
import type { OwnedMonster, ElementType, RarityType } from "@/types";
import type { MonsterDefinition } from "@/types";

// ---- Constants ----

const ELEMENT_EMOJI: Record<ElementType, string> = {
  flare: "🔥", aqua: "💧", forest: "🌿",
  bolt: "⚡", shadow: "🌑", lumina: "✨",
};
const ELEMENT_LABEL: Record<ElementType, string> = {
  flare: "フレア", aqua: "アクア", forest: "フォレスト",
  bolt: "ボルト", shadow: "シャドウ", lumina: "ルミナ",
};
const RARITY_COLOR: Record<RarityType, string> = {
  N: "#9090AA", R: "#4FC3F7", SR: "#AB47BC", SSR: "#FFD700", UR: "#FF4081",
};
const RARITY_ORDER: RarityType[] = ["N", "R", "SR", "SSR", "UR"];

const ACHIEVEMENTS = [
  { count: 10,  label: "ブライトストーン×5",    emoji: "🟡" },
  { count: 30,  label: "SR確定チケット×1",    emoji: "🎟" },
  { count: 50,  label: "プリズムストーン×10",   emoji: "💠" },
  { count: 70,  label: "SSR確定チケット×1",   emoji: "🎟" },
  { count: 100, label: "UR確定 + 称号", emoji: "🌈" },
];

// ---- FilterChip ----
function FilterChip({ label, active, color, onPress }: {
  label: string; active: boolean; color?: string; onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 18,
        backgroundColor: active ? (color ?? "#00C9A7") : "#161628",
        borderWidth: 1, borderColor: active ? (color ?? "#00C9A7") : "#1F1F38",
        marginRight: 6,
      }}
    >
      <Text style={{ color: active ? "#0D0D1A" : "#9090AA", fontWeight: "700", fontSize: 11 }}>
        {label}
      </Text>
    </Pressable>
  );
}

// ---- Achievement Badge ----
function AchievementBadge({ count, label, emoji, captured }: {
  count: number; label: string; emoji: string; captured: number;
}) {
  const done = captured >= count;
  const pct  = Math.min(captured / count, 1);
  return (
    <View style={{ alignItems: "center", width: 70, marginRight: 10, opacity: done ? 1 : 0.5 }}>
      <View style={{
        width: 46, height: 46, borderRadius: 23,
        backgroundColor: done ? "#FFD70020" : "#1F1F38",
        borderWidth: 2, borderColor: done ? "#FFD700" : "#2a2a4a",
        alignItems: "center", justifyContent: "center", marginBottom: 4,
      }}>
        <Text style={{ fontSize: 20 }}>{done ? emoji : "🔒"}</Text>
      </View>
      <View style={{ height: 3, width: 46, backgroundColor: "#1F1F38", borderRadius: 2, overflow: "hidden", marginBottom: 3 }}>
        <View style={{ height: 3, width: `${pct * 100}%` as any, backgroundColor: "#FFD700", borderRadius: 2 }} />
      </View>
      <Text style={{ color: "#9090AA", fontSize: 9, textAlign: "center" }} numberOfLines={2}>
        {count}種{"\n"}{label}
      </Text>
    </View>
  );
}

// ---- Pokedex Card ----
function PokedexCard({ definition, captured, ownedMonster, onPress }: {
  definition: MonsterDefinition; captured: boolean;
  ownedMonster?: OwnedMonster; onPress: () => void;
}) {
  const color    = RARITY_COLOR[definition.rarity];
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (definition.rarity === "UR" && captured) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0,  duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, []);

  return (
    <Pressable
      onPress={captured ? onPress : undefined}
      style={{
        width: "31%", margin: "1%", borderRadius: 14,
        backgroundColor: "#161628",
        borderWidth: 1, borderColor: captured ? `${color}40` : "#1F1F38",
        overflow: "hidden", opacity: captured ? 1 : 0.6,
      }}
    >
      <View style={{ height: 3, backgroundColor: captured ? color : "#1F1F38" }} />
      <Animated.View style={{ padding: 8, alignItems: "center", transform: [{ scale: pulseAnim }] }}>
        <View style={{
          width: 48, height: 48, borderRadius: 12,
          backgroundColor: captured ? `${color}18` : "#0D0D1A",
          alignItems: "center", justifyContent: "center", marginBottom: 5,
        }}>
          {captured ? (
            <Text style={{ fontSize: 26 }}>{ELEMENT_EMOJI[definition.element]}</Text>
          ) : (
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: "#1A1A28" }} />
          )}
        </View>
        <Text style={{ color: "#505060", fontSize: 9, marginBottom: 1 }}>
          #{String(definition.id).padStart(3, "0")}
        </Text>
        <Text style={{
          color: captured ? "#F0F0FF" : "#2A2A40",
          fontWeight: "700", fontSize: 10, textAlign: "center",
        }} numberOfLines={1}>
          {captured ? definition.name : "???"}
        </Text>
        <View style={{
          marginTop: 3, paddingHorizontal: 5, paddingVertical: 1,
          borderRadius: 6, backgroundColor: captured ? `${color}22` : "#0D0D1A",
        }}>
          <Text style={{ color: captured ? color : "#2A2A40", fontSize: 9, fontWeight: "700" }}>
            {captured ? definition.rarity : "???"}
          </Text>
        </View>
        {captured && ownedMonster && (
          <Text style={{ color: "#606080", fontSize: 9, marginTop: 2 }}>
            Lv.{ownedMonster.level}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

// ---- Owned Card ----
function OwnedCard({ monster, onPress }: { monster: OwnedMonster; onPress: () => void }) {
  const def = MONSTER_POOL.find((m) => m.id === monster.definitionId);
  if (!def) return null;
  const color = RARITY_COLOR[def.rarity];
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row", alignItems: "center",
        padding: 12, marginBottom: 8, borderRadius: 16,
        backgroundColor: "#161628", borderWidth: 1,
        borderColor: monster.isFavorite ? `${color}50` : "#1F1F38",
      }}
    >
      <View style={{
        width: 52, height: 52, borderRadius: 12,
        backgroundColor: `${color}18`,
        alignItems: "center", justifyContent: "center",
        marginRight: 12, borderWidth: 1, borderColor: `${color}30`,
      }}>
        <Text style={{ fontSize: 28 }}>{ELEMENT_EMOJI[def.element]}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <Text style={{ color: "#F0F0FF", fontWeight: "900", fontSize: 14 }}>
            {monster.nickname ?? def.name}
          </Text>
          <View style={{ paddingHorizontal: 5, paddingVertical: 1, borderRadius: 7, backgroundColor: `${color}22` }}>
            <Text style={{ color, fontSize: 9, fontWeight: "700" }}>{def.rarity}</Text>
          </View>
          {monster.isFavorite && <Text style={{ fontSize: 11 }}>⭐</Text>}
        </View>
        <Text style={{ color: "#9090AA", fontSize: 11, marginBottom: 5 }}>
          Lv.{monster.level} · {ELEMENT_EMOJI[def.element]} {ELEMENT_LABEL[def.element]}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Text style={{ color: "#505060", fontSize: 9 }}>HP</Text>
          <View style={{ flex: 1, height: 3, backgroundColor: "#1F1F38", borderRadius: 2, overflow: "hidden" }}>
            <View style={{ height: 3, width: "100%", backgroundColor: "#00C9A7", borderRadius: 2 }} />
          </View>
          <Text style={{ color: "#505060", fontSize: 9 }}>HP —</Text>
        </View>
      </View>
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <Text style={{ color: "#9090AA", fontSize: 10 }}>Lv.{monster.level}</Text>
        <View style={{ flexDirection: "row", gap: 2 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} style={{
              width: 8, height: 8, borderRadius: 4,
              backgroundColor: i < monster.level ? "#00C9A7" : "#1F1F38"
            }} />
          ))}
        </View>
        <Text style={{ color: "#404060" }}>›</Text>
      </View>
    </Pressable>
  );
}

// ---- Sort Modal ----
type SortKey = "id" | "level" | "rarity" | "captured";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "id",       label: "図鑑番号順" },
  { key: "level",    label: "レベル高い順" },
  { key: "rarity",   label: "レアリティ高い順" },
  { key: "captured", label: "捕獲日時順" },
];

function SortModal({ visible, current, onSelect, onClose }: {
  visible: boolean; current: SortKey;
  onSelect: (k: SortKey) => void; onClose: () => void;
}) {
  return (
    <Modal transparent animationType="slide" visible={visible}>
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}
        onPress={onClose}
      >
        <View style={{
          backgroundColor: "#161628",
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          padding: 20, paddingBottom: 36,
        }}>
          <Text style={{ color: "#F0F0FF", fontWeight: "900", fontSize: 16, marginBottom: 16 }}>
            並び替え
          </Text>
          {SORT_OPTIONS.map((opt) => (
            <Pressable
              key={opt.key}
              onPress={() => { onSelect(opt.key); onClose(); }}
              style={{
                flexDirection: "row", justifyContent: "space-between", alignItems: "center",
                paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#1F1F38",
              }}
            >
              <Text style={{ color: current === opt.key ? "#00C9A7" : "#F0F0FF", fontSize: 14 }}>
                {opt.label}
              </Text>
              {current === opt.key && <Text style={{ color: "#00C9A7" }}>✓</Text>}
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

// ============================================================
// Main Screen
// ============================================================
export default function MonstersScreen() {
  const { monsters } = usePlayerStore();

  const [tab,            setTab]            = useState<"owned" | "pokedex">("owned");
  const [search,         setSearch]         = useState("");
  const [filterRarity,   setFilterRarity]   = useState<RarityType | null>(null);
  const [filterElement,  setFilterElement]  = useState<ElementType | null>(null);
  const [filterUncaught, setFilterUncaught] = useState(false);
  const [sortKey,        setSortKey]        = useState<SortKey>("id");
  const [showSort,       setShowSort]       = useState(false);
  const [showFilters,    setShowFilters]    = useState(false);

  const capturedIds    = useMemo(() => new Set(monsters.map((m) => m.definitionId)), [monsters]);
  const capturedCount  = capturedIds.size;
  const hasFilter      = !!(filterRarity || filterElement || filterUncaught || search);

  const elements: ElementType[] = ["forest", "aqua", "flare", "bolt", "shadow", "lumina"];
  const rarities: RarityType[]  = ["N", "R", "SR", "SSR", "UR"];

  // Pokedex list
  const pokedexData = useMemo(() => {
    let pool = MONSTER_POOL;
    if (search)         pool = pool.filter((m) => m.name.includes(search) || String(m.id).includes(search));
    if (filterRarity)   pool = pool.filter((m) => m.rarity === filterRarity);
    if (filterElement)  pool = pool.filter((m) => m.element === filterElement);
    if (filterUncaught) pool = pool.filter((m) => !capturedIds.has(m.id));
    return pool.sort((a, b) => {
      if (sortKey === "rarity") return RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity);
      return a.id - b.id;
    });
  }, [search, filterRarity, filterElement, filterUncaught, sortKey, capturedIds]);

  // Owned list
  const ownedData = useMemo(() => {
    let list = [...monsters];
    if (search) list = list.filter((m) => {
      const def = MONSTER_POOL.find((d) => d.id === m.definitionId);
      return (m.nickname ?? "").includes(search) || (def?.name ?? "").includes(search);
    });
    if (filterRarity) list = list.filter((m) => {
      const def = MONSTER_POOL.find((d) => d.id === m.definitionId);
      return def?.rarity === filterRarity;
    });
    if (filterElement) list = list.filter((m) => {
      const def = MONSTER_POOL.find((d) => d.id === m.definitionId);
      return def?.element === filterElement;
    });
    return list.sort((a, b) => {
      if (sortKey === "level")    return b.level - a.level;
      if (sortKey === "rarity")   {
        const ra = MONSTER_POOL.find((d) => d.id === a.definitionId)?.rarity ?? "N";
        const rb = MONSTER_POOL.find((d) => d.id === b.definitionId)?.rarity ?? "N";
        return RARITY_ORDER.indexOf(rb) - RARITY_ORDER.indexOf(ra);
      }
      if (sortKey === "captured") return new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime();
      return a.definitionId - b.definitionId;
    });
  }, [monsters, search, filterRarity, filterElement, sortKey]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0D0D1A" }} edges={["top"]}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <Text style={{ color: "#F0F0FF", fontSize: 22, fontWeight: "900", flex: 1 }}>
            モンスター
          </Text>
          <Pressable
            onPress={() => setShowSort(true)}
            style={{
              flexDirection: "row", alignItems: "center", gap: 4,
              paddingHorizontal: 10, paddingVertical: 6,
              borderRadius: 14, backgroundColor: "#161628",
              borderWidth: 1, borderColor: "#1F1F38",
            }}
          >
            <Text style={{ color: "#9090AA", fontSize: 11 }}>⇅ 並び替え</Text>
          </Pressable>
        </View>

        {/* Tab */}
        <View style={{
          flexDirection: "row", backgroundColor: "#161628",
          borderRadius: 14, padding: 3, marginBottom: 10,
        }}>
          {(["owned", "pokedex"] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={{
                flex: 1, paddingVertical: 9, borderRadius: 11,
                alignItems: "center",
                backgroundColor: tab === t ? "#00C9A7" : "transparent",
              }}
            >
              <Text style={{ fontWeight: "900", fontSize: 12, color: tab === t ? "#0D0D1A" : "#9090AA" }}>
                {t === "owned" ? `手持ち (${monsters.length})` : `図鑑 (${capturedCount}/100)`}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Search */}
        <View style={{
          flexDirection: "row", alignItems: "center",
          backgroundColor: "#161628", borderRadius: 12,
          paddingHorizontal: 12, paddingVertical: 9,
          borderWidth: 1, borderColor: "#1F1F38", marginBottom: 8,
        }}>
          <Text style={{ color: "#505060", marginRight: 8 }}>🔍</Text>
          <TextInput
            placeholder="名前・番号で検索..."
            placeholderTextColor="#404060"
            value={search}
            onChangeText={setSearch}
            style={{ flex: 1, color: "#F0F0FF", fontSize: 13 }}
          />
          {search !== "" && (
            <Pressable onPress={() => setSearch("")}>
              <Text style={{ color: "#606080" }}>×</Text>
            </Pressable>
          )}
        </View>

        {/* Filter toggle */}
        <Pressable
          onPress={() => setShowFilters((v) => !v)}
          style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}
        >
          <Text style={{ color: hasFilter ? "#00C9A7" : "#9090AA", fontSize: 11, fontWeight: "700" }}>
            🎛 フィルター {hasFilter ? "●" : ""}  {showFilters ? "▲" : "▼"}
          </Text>
        </Pressable>

        {showFilters && (
          <View style={{ marginBottom: 8 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 6 }}>
              <FilterChip label="全属性" active={!filterElement} onPress={() => setFilterElement(null)} />
              {elements.map((el) => (
                <FilterChip
                  key={el}
                  label={`${ELEMENT_EMOJI[el]} ${ELEMENT_LABEL[el]}`}
                  active={filterElement === el}
                  onPress={() => setFilterElement(filterElement === el ? null : el)}
                />
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 6 }}>
              <FilterChip label="全レア" active={!filterRarity} onPress={() => setFilterRarity(null)} />
              {rarities.map((r) => (
                <FilterChip
                  key={r} label={r} active={filterRarity === r}
                  color={RARITY_COLOR[r]}
                  onPress={() => setFilterRarity(filterRarity === r ? null : r)}
                />
              ))}
            </ScrollView>
            {tab === "pokedex" && (
              <FilterChip
                label="未捕獲のみ"
                active={filterUncaught}
                onPress={() => setFilterUncaught((v) => !v)}
              />
            )}
          </View>
        )}
      </View>

      {/* Achievement banner */}
      {tab === "pokedex" && (
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#1F1F38", maxHeight: 120 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10 }}
        >
          {ACHIEVEMENTS.map((a) => (
            <AchievementBadge key={a.count} {...a} captured={capturedCount} />
          ))}
        </ScrollView>
      )}

      {/* Content */}
      {tab === "owned" ? (
        <FlatList
          data={ownedData}
          keyExtractor={(m) => m.uuid}
          renderItem={({ item }) => (
            <OwnedCard monster={item} onPress={() => router.push(`/monster/${item.uuid}`)} />
          )}
          contentContainerStyle={{ padding: 20, paddingTop: 10, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Text style={{ fontSize: 48 }}>👾</Text>
              <Text style={{ color: "#9090AA", marginTop: 12, fontSize: 14 }}>
                {hasFilter ? "条件に一致するモンスターなし" : "まだモンスターがいません"}
              </Text>
              <Text style={{ color: "#606080", marginTop: 4, fontSize: 12 }}>
                歩いてエンカウントしよう！
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={pokedexData}
          keyExtractor={(d) => String(d.id)}
          numColumns={3}
          renderItem={({ item }) => {
            const owned = monsters.find((m) => m.definitionId === item.id);
            return (
              <PokedexCard
                definition={item}
                captured={capturedIds.has(item.id)}
                ownedMonster={owned}
                onPress={() => owned ? router.push(`/monster/${owned.uuid}`) : undefined}
              />
            );
          }}
          contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Text style={{ fontSize: 48 }}>📖</Text>
              <Text style={{ color: "#9090AA", marginTop: 12 }}>
                条件に一致するモンスターがいません
              </Text>
            </View>
          }
        />
      )}

      <SortModal
        visible={showSort} current={sortKey}
        onSelect={setSortKey} onClose={() => setShowSort(false)}
      />
    </SafeAreaView>
  );
}
