/**
 * NanoWalk Monster Pool — v2.0
 * コレクション特化設計
 *
 * 変更点:
 * - baseStats / growthStats / skills 廃止
 * - baseScoutRate / traits / favoriteAreas / favoriteWeather 追加
 * - maxLevel はレアリティから自動計算（MAX_LEVEL_BY_RARITY）
 */

import type { MonsterDefinition } from "@/types";

export const MONSTER_POOL: MonsterDefinition[] = [

  // ============================================================
  // N レアリティ (最大 Lv.5)
  // ============================================================

  {
    id: 1, name: "ナノバナナ", element: "forest", rarity: "N",
    description: "バナナの皮をまとった小型生命体。滑り攻撃が得意。",
    spriteUrl: "", baseScoutRate: 0.70, captureRate: 0.70, maxLevel: 5,
    evolvesTo: 36, evolutionLevel: 5,
    favoriteAreas: ["nano_plains"],
    favoriteWeather: ["sunny", "cloudy"],
    traits: [
      { id: "banana_slip", name: "バナナスリップ", description: "同じエリアでのスカウト率+10%",
        trigger: "on_own", effect: "scout_rate_up", value: 0.10, unlockLevel: 1 },
      { id: "sweet_scent", name: "あまいかおり", description: "エンカウント頻度+20%",
        trigger: "on_field", effect: "encounter_up", value: 0.20, unlockLevel: 3 },
    ],
  },
  {
    id: 2, name: "コケモス", element: "forest", rarity: "N",
    description: "苔に擬態する。動くとき胞子を撒く。",
    spriteUrl: "", baseScoutRate: 0.70, captureRate: 0.70, maxLevel: 5,
    evolvesTo: 37, evolutionLevel: 5,
    favoriteAreas: ["nano_plains", "neon_jungle"],
    favoriteWeather: ["rainy", "cloudy"],
    traits: [
      { id: "spore_cloud", name: "胞子の雲", description: "雨天時スカウト率+15%",
        trigger: "weather_rainy", effect: "scout_rate_up", value: 0.15, unlockLevel: 1 },
      { id: "camouflage", name: "擬態", description: "レア出現率+5%",
        trigger: "on_field", effect: "rare_rate_up", value: 0.05, unlockLevel: 3 },
    ],
  },
  {
    id: 3, name: "チビキノン", element: "forest", rarity: "N",
    description: "きのこ頭の小悪党。傘から胞子を飛ばす。",
    spriteUrl: "", baseScoutRate: 0.70, captureRate: 0.70, maxLevel: 5,
    evolvesTo: 66, evolutionLevel: 5,
    favoriteAreas: ["nano_plains", "neon_jungle"],
    favoriteWeather: ["rainy"],
    traits: [
      { id: "poison_spore", name: "どくほうし", description: "forest属性スカウト率+10%",
        trigger: "same_element", effect: "same_element_up", value: 0.10, unlockLevel: 1 },
      { id: "night_mushroom", name: "夜光きのこ", description: "夜間エンカウント+15%",
        trigger: "night", effect: "encounter_up", value: 0.15, unlockLevel: 3 },
    ],
  },
  {
    id: 4, name: "ハネムシン", element: "forest", rarity: "N",
    description: "葉っぱ翅の小虫。風に乗って長距離を移動する。",
    spriteUrl: "", baseScoutRate: 0.70, captureRate: 0.70, maxLevel: 5,
    favoriteAreas: ["nano_plains"],
    favoriteWeather: ["sunny"],
    traits: [
      { id: "wind_rider", name: "かぜのり", description: "晴天時エンカウント+15%",
        trigger: "weather_sunny", effect: "encounter_up", value: 0.15, unlockLevel: 1 },
    ],
  },
  {
    id: 5, name: "クサリス", element: "forest", rarity: "N",
    description: "蔦が体に絡まった植物人。動きは遅いが粘り強い。",
    spriteUrl: "", baseScoutRate: 0.70, captureRate: 0.70, maxLevel: 5,
    favoriteAreas: ["nano_plains", "neon_jungle"],
    favoriteWeather: ["rainy", "cloudy"],
    traits: [
      { id: "vine_grip", name: "つるのきずな", description: "NE獲得量+10%",
        trigger: "on_own", effect: "ne_gain_up", value: 0.10, unlockLevel: 1 },
    ],
  },
  {
    id: 8, name: "ナミコロ", element: "aqua", rarity: "N",
    description: "波が丸まった小さな水の塊。転がって移動する。",
    spriteUrl: "", baseScoutRate: 0.70, captureRate: 0.70, maxLevel: 5,
    evolvesTo: 40, evolutionLevel: 5,
    favoriteAreas: ["deep_ocean"],
    favoriteWeather: ["rainy"],
    traits: [
      { id: "tidal_sense", name: "しおのかおり", description: "雨天時スカウト率+15%",
        trigger: "weather_rainy", effect: "scout_rate_up", value: 0.15, unlockLevel: 1 },
      { id: "wave_rider", name: "なみのり", description: "aqua属性スカウト率+10%",
        trigger: "same_element", effect: "same_element_up", value: 0.10, unlockLevel: 3 },
    ],
  },
  {
    id: 9, name: "バブルット", element: "aqua", rarity: "N",
    description: "泡の集合体。触ると弾けるが、またすぐ集まる。",
    spriteUrl: "", baseScoutRate: 0.70, captureRate: 0.70, maxLevel: 5,
    evolvesTo: 41, evolutionLevel: 5,
    favoriteAreas: ["deep_ocean"],
    favoriteWeather: ["rainy", "cloudy"],
    traits: [
      { id: "bubble_shield", name: "あわのたて", description: "ボール未消費確率+10%",
        trigger: "on_scout", effect: "ball_save", value: 0.10, unlockLevel: 1 },
    ],
  },
  {
    id: 11, name: "プルプルン", element: "aqua", rarity: "N",
    description: "ゼリー状のスライム。水に溶けて移動する。",
    spriteUrl: "", baseScoutRate: 0.70, captureRate: 0.70, maxLevel: 5,
    favoriteAreas: ["deep_ocean", "nano_plains"],
    favoriteWeather: ["rainy"],
    traits: [
      { id: "absorb", name: "きゅうしゅう", description: "スカウト率+8%（常時）",
        trigger: "on_own", effect: "scout_rate_up", value: 0.08, unlockLevel: 1 },
    ],
  },
  {
    id: 12, name: "シズクン", element: "aqua", rarity: "N",
    description: "雨雫型の生物。雨の日に大量発生する。",
    spriteUrl: "", baseScoutRate: 0.70, captureRate: 0.70, maxLevel: 5,
    favoriteAreas: ["nano_plains"],
    favoriteWeather: ["rainy"],
    traits: [
      { id: "rain_call", name: "あめよび", description: "雨天時スカウト率+20%",
        trigger: "weather_rainy", effect: "scout_rate_up", value: 0.20, unlockLevel: 1 },
      { id: "drop_sense", name: "しずくセンサー", description: "雨天エンカウント+15%",
        trigger: "weather_rainy", effect: "encounter_up", value: 0.15, unlockLevel: 3 },
    ],
  },
  {
    id: 14, name: "チビフレア", element: "flare", rarity: "N",
    description: "火の玉が固まって生まれた小さな炎の塊。",
    spriteUrl: "", baseScoutRate: 0.70, captureRate: 0.70, maxLevel: 5,
    evolvesTo: 43, evolutionLevel: 5,
    favoriteAreas: ["flare_valley"],
    favoriteWeather: ["sunny"],
    traits: [
      { id: "flame_body", name: "ほのおのからだ", description: "晴天時スカウト率+15%",
        trigger: "weather_sunny", effect: "scout_rate_up", value: 0.15, unlockLevel: 1 },
      { id: "fire_friend", name: "ほのおなかま", description: "flare属性スカウト率+10%",
        trigger: "same_element", effect: "same_element_up", value: 0.10, unlockLevel: 3 },
    ],
  },
  {
    id: 15, name: "スパーキン", element: "flare", rarity: "N",
    description: "火花が固まった生物。興奮すると爆発する。",
    spriteUrl: "", baseScoutRate: 0.70, captureRate: 0.70, maxLevel: 5,
    evolvesTo: 44, evolutionLevel: 5,
    favoriteAreas: ["flare_valley"],
    favoriteWeather: ["sunny"],
    traits: [
      { id: "spark_shower", name: "スパークシャワー", description: "NE獲得量+15%",
        trigger: "on_own", effect: "ne_gain_up", value: 0.15, unlockLevel: 1 },
    ],
  },
  {
    id: 20, name: "ピカトン", element: "bolt", rarity: "N",
    description: "静電気を帯びた丸い生物。触ると小さくビリッとする。",
    spriteUrl: "", baseScoutRate: 0.70, captureRate: 0.70, maxLevel: 5,
    evolvesTo: 47, evolutionLevel: 5,
    favoriteAreas: ["crystal_cave"],
    favoriteWeather: ["cloudy"],
    traits: [
      { id: "static", name: "せいでんき", description: "bolt属性スカウト率+10%",
        trigger: "same_element", effect: "same_element_up", value: 0.10, unlockLevel: 1 },
      { id: "charge_up", name: "チャージ", description: "エンカウント+10%",
        trigger: "on_field", effect: "encounter_up", value: 0.10, unlockLevel: 3 },
    ],
  },
  {
    id: 26, name: "クロモチン", element: "shadow", rarity: "N",
    description: "影のもち。光のないところに現れる謎の生物。",
    spriteUrl: "", baseScoutRate: 0.70, captureRate: 0.70, maxLevel: 5,
    evolvesTo: 52, evolutionLevel: 5,
    favoriteAreas: ["crystal_cave"],
    favoriteWeather: ["cloudy", "rainy"],
    traits: [
      { id: "shadow_walk", name: "かげあるき", description: "夜間スカウト率+20%",
        trigger: "night", effect: "scout_rate_up", value: 0.20, unlockLevel: 1 },
      { id: "dark_sense", name: "やみのちかく", description: "shadow属性スカウト率+10%",
        trigger: "same_element", effect: "same_element_up", value: 0.10, unlockLevel: 3 },
    ],
  },
  {
    id: 31, name: "ルミロン", element: "lumina", rarity: "N",
    description: "光の玉生物。明るい場所を好み、暗闇を嫌がる。",
    spriteUrl: "", baseScoutRate: 0.70, captureRate: 0.70, maxLevel: 5,
    evolvesTo: 57, evolutionLevel: 5,
    favoriteAreas: ["nano_plains"],
    favoriteWeather: ["sunny"],
    traits: [
      { id: "light_body", name: "ひかりのからだ", description: "晴天時スカウト率+15%",
        trigger: "weather_sunny", effect: "scout_rate_up", value: 0.15, unlockLevel: 1 },
      { id: "illuminate", name: "てらす", description: "レア出現率+5%",
        trigger: "on_field", effect: "rare_rate_up", value: 0.05, unlockLevel: 3 },
    ],
  },

  // ============================================================
  // R レアリティ (最大 Lv.7)
  // ============================================================

  {
    id: 36, name: "モリバナナン", element: "forest", rarity: "R",
    description: "ナノバナナが成熟した姿。バナナの木を背負って歩く。",
    spriteUrl: "", baseScoutRate: 0.40, captureRate: 0.40, maxLevel: 7,
    favoriteAreas: ["nano_plains", "neon_jungle"],
    favoriteWeather: ["sunny", "cloudy"],
    traits: [
      { id: "banana_grove", name: "バナナのはやし", description: "forest属性スカウト率+15%",
        trigger: "same_element", effect: "same_element_up", value: 0.15, unlockLevel: 1 },
      { id: "ripe_scent", name: "じゅくしたかおり", description: "エンカウント+20%",
        trigger: "on_field", effect: "encounter_up", value: 0.20, unlockLevel: 3 },
      { id: "forest_king", name: "もりのおう", description: "レア出現率+10%",
        trigger: "area_match", effect: "rare_rate_up", value: 0.10, unlockLevel: 5 },
    ],
  },
  {
    id: 37, name: "グランモス", element: "forest", rarity: "R",
    description: "コケモスが大型化した姿。古い石像のような風格。",
    spriteUrl: "", baseScoutRate: 0.40, captureRate: 0.40, maxLevel: 7,
    favoriteAreas: ["nano_plains", "neon_jungle"],
    favoriteWeather: ["rainy", "cloudy"],
    traits: [
      { id: "ancient_moss", name: "たいこのこけ", description: "雨天スカウト率+20%",
        trigger: "weather_rainy", effect: "scout_rate_up", value: 0.20, unlockLevel: 1 },
      { id: "stone_skin", name: "いわはだ", description: "ボール節約率+15%",
        trigger: "on_scout", effect: "ball_save", value: 0.15, unlockLevel: 3 },
    ],
  },
  {
    id: 40, name: "タイダルコロ", element: "aqua", rarity: "R",
    description: "波紋模様の甲羅を持つ小型ウミガメ。海流を読む能力がある。",
    spriteUrl: "", baseScoutRate: 0.40, captureRate: 0.40, maxLevel: 7,
    favoriteAreas: ["deep_ocean"],
    favoriteWeather: ["rainy", "cloudy"],
    traits: [
      { id: "tidal_read", name: "かいりゅうよみ", description: "aqua属性スカウト率+20%",
        trigger: "same_element", effect: "same_element_up", value: 0.20, unlockLevel: 1 },
      { id: "shell_shield", name: "こうらのたて", description: "雨天スカウト率+15%",
        trigger: "weather_rainy", effect: "scout_rate_up", value: 0.15, unlockLevel: 3 },
      { id: "ocean_guide", name: "うみのみちびき", description: "deep_oceanエリアスカウト率+20%",
        trigger: "area_match", effect: "scout_rate_up", value: 0.20, unlockLevel: 5 },
    ],
  },
  {
    id: 43, name: "フレアボム", element: "flare", rarity: "R",
    description: "チビフレアが成熟した姿。体内にマグマを蓄える。",
    spriteUrl: "", baseScoutRate: 0.40, captureRate: 0.40, maxLevel: 7,
    favoriteAreas: ["flare_valley"],
    favoriteWeather: ["sunny"],
    traits: [
      { id: "magma_core", name: "マグマコア", description: "晴天スカウト率+20%",
        trigger: "weather_sunny", effect: "scout_rate_up", value: 0.20, unlockLevel: 1 },
      { id: "explosion_aura", name: "ばくはつのオーラ", description: "NE獲得量+20%",
        trigger: "on_own", effect: "ne_gain_up", value: 0.20, unlockLevel: 3 },
    ],
  },
  {
    id: 44, name: "インフェルノン", element: "flare", rarity: "R",
    description: "炎の鱗を持つ小型サラマンダー。炎の中でも平然と歩く。",
    spriteUrl: "", baseScoutRate: 0.40, captureRate: 0.40, maxLevel: 7,
    favoriteAreas: ["flare_valley"],
    favoriteWeather: ["sunny"],
    traits: [
      { id: "fire_scale", name: "ほのおのうろこ", description: "flare属性スカウト率+20%",
        trigger: "same_element", effect: "same_element_up", value: 0.20, unlockLevel: 1 },
      { id: "heat_tracker", name: "ねつのついせき", description: "フレアバレーエリアスカウト率+20%",
        trigger: "area_match", effect: "scout_rate_up", value: 0.20, unlockLevel: 5 },
    ],
  },
  {
    id: 47, name: "サンダーピカ", element: "bolt", rarity: "R",
    description: "ピカトンが成長した高速電撃獣。走ると稲妻が走る。",
    spriteUrl: "", baseScoutRate: 0.40, captureRate: 0.40, maxLevel: 7,
    favoriteAreas: ["crystal_cave"],
    favoriteWeather: ["cloudy"],
    traits: [
      { id: "thunder_run", name: "かみなりはしり", description: "bolt属性スカウト率+20%",
        trigger: "same_element", effect: "same_element_up", value: 0.20, unlockLevel: 1 },
      { id: "speed_sense", name: "スピードセンサー", description: "エンカウント+20%",
        trigger: "on_field", effect: "encounter_up", value: 0.20, unlockLevel: 3 },
    ],
  },
  {
    id: 52, name: "シャドウモチン", element: "shadow", rarity: "R",
    description: "クロモチンが暗黒エネルギーを吸って成長した姿。",
    spriteUrl: "", baseScoutRate: 0.40, captureRate: 0.40, maxLevel: 7,
    favoriteAreas: ["crystal_cave", "neon_jungle"],
    favoriteWeather: ["cloudy", "rainy"],
    traits: [
      { id: "shadow_blend", name: "かげのまぎれ", description: "夜間スカウト率+25%",
        trigger: "night", effect: "scout_rate_up", value: 0.25, unlockLevel: 1 },
      { id: "void_touch", name: "むのふれあい", description: "shadow属性スカウト率+20%",
        trigger: "same_element", effect: "same_element_up", value: 0.20, unlockLevel: 3 },
      { id: "darkness_lord", name: "やみのりょうしゅ", description: "レア出現率+10%",
        trigger: "night", effect: "rare_rate_up", value: 0.10, unlockLevel: 5 },
    ],
  },
  {
    id: 57, name: "ブライトロン", element: "lumina", rarity: "R",
    description: "ルミロンが成長した治癒の光球。近づくと温かくなる。",
    spriteUrl: "", baseScoutRate: 0.40, captureRate: 0.40, maxLevel: 7,
    favoriteAreas: ["nano_plains"],
    favoriteWeather: ["sunny"],
    traits: [
      { id: "heal_light", name: "いやしのひかり", description: "スカウト率+10%（常時）",
        trigger: "on_own", effect: "scout_rate_up", value: 0.10, unlockLevel: 1 },
      { id: "bright_aura", name: "ひかりのオーラ", description: "レア出現率+10%（晴天）",
        trigger: "weather_sunny", effect: "rare_rate_up", value: 0.10, unlockLevel: 5 },
    ],
  },

  // ============================================================
  // SR レアリティ (最大 Lv.8)
  // ============================================================

  {
    id: 66, name: "マッシュキング", element: "forest", rarity: "SR",
    description: "毒キノコの王。その胞子は数十メートル先まで届く。",
    spriteUrl: "", baseScoutRate: 0.20, captureRate: 0.20, maxLevel: 8,
    evolvesTo: undefined,
    favoriteAreas: ["neon_jungle"],
    favoriteWeather: ["rainy"],
    traits: [
      { id: "spore_king", name: "ほうしのおう", description: "雨天スカウト率+25%",
        trigger: "weather_rainy", effect: "scout_rate_up", value: 0.25, unlockLevel: 1 },
      { id: "toxic_aura", name: "どくのオーラ", description: "forest属性スカウト率+20%",
        trigger: "same_element", effect: "same_element_up", value: 0.20, unlockLevel: 3 },
      { id: "jungle_master", name: "ジャングルマスター", description: "ネオンジャングルスカウト率+30%",
        trigger: "area_match", effect: "scout_rate_up", value: 0.30, unlockLevel: 5 },
      { id: "mycelium", name: "菌糸ネットワーク", description: "相手の特性を事前に確認できる",
        trigger: "on_scout", effect: "trait_reveal", value: 1, unlockLevel: 7 },
    ],
  },
  {
    id: 67, name: "フォレスタルン", element: "forest", rarity: "SR",
    description: "古木の精霊が宿る鹿。枝角に四季の花が咲く。",
    spriteUrl: "", baseScoutRate: 0.20, captureRate: 0.20, maxLevel: 8,
    favoriteAreas: ["nano_plains", "neon_jungle"],
    favoriteWeather: ["sunny", "cloudy"],
    traits: [
      { id: "ancient_spirit", name: "たいこのせいれい", description: "エリア属性一致スカウト率+25%",
        trigger: "area_match", effect: "scout_rate_up", value: 0.25, unlockLevel: 1 },
      { id: "four_seasons", name: "しきのはな", description: "天候ボーナスが1.5倍になる",
        trigger: "on_own", effect: "weather_boost", value: 1.5, unlockLevel: 3 },
      { id: "forest_guardian", name: "もりのばんにん", description: "forest属性スカウト率+25%",
        trigger: "same_element", effect: "same_element_up", value: 0.25, unlockLevel: 5 },
    ],
  },
  {
    id: 76, name: "ダークネスキング", element: "shadow", rarity: "SR",
    description: "闇の王冠を戴く吸血鬼公爵。夜に最も力を発揮する。",
    spriteUrl: "", baseScoutRate: 0.20, captureRate: 0.20, maxLevel: 8,
    favoriteAreas: ["crystal_cave"],
    favoriteWeather: ["cloudy", "rainy"],
    traits: [
      { id: "night_lord", name: "よるのりょうしゅ", description: "夜間スカウト率+30%",
        trigger: "night", effect: "scout_rate_up", value: 0.30, unlockLevel: 1 },
      { id: "dark_crown", name: "やみのおうかん", description: "shadow属性スカウト率+25%",
        trigger: "same_element", effect: "same_element_up", value: 0.25, unlockLevel: 3 },
      { id: "vampire_charm", name: "きゅうけつきのみりょく", description: "レア出現率+15%（夜間）",
        trigger: "night", effect: "rare_rate_up", value: 0.15, unlockLevel: 5 },
    ],
  },

  // ============================================================
  // SSR レアリティ (最大 Lv.9)
  // ============================================================

  {
    id: 86, name: "ドラゴナノン", element: "flare", rarity: "SSR",
    description: "ナノドラゴンの幼体。小さくても全属性に影響を与える力を秘める。",
    spriteUrl: "", baseScoutRate: 0.08, captureRate: 0.08, maxLevel: 9,
    favoriteAreas: ["flare_valley", "nano_core"],
    favoriteWeather: ["sunny"],
    traits: [
      { id: "dragon_aura", name: "ドラゴンオーラ", description: "全属性スカウト率+15%",
        trigger: "on_own", effect: "scout_rate_up", value: 0.15, unlockLevel: 1 },
      { id: "flame_breath", name: "ほのおのいぶき", description: "flare属性スカウト率+30%",
        trigger: "same_element", effect: "same_element_up", value: 0.30, unlockLevel: 3 },
      { id: "dragon_sight", name: "ドラゴンのめ", description: "レア出現率+20%",
        trigger: "on_field", effect: "rare_rate_up", value: 0.20, unlockLevel: 5 },
      { id: "nano_core_call", name: "ナノコアのよびごえ", description: "ナノコアエリアスカウト率+40%",
        trigger: "area_match", effect: "scout_rate_up", value: 0.40, unlockLevel: 7 },
    ],
  },

  // ============================================================
  // UR レアリティ (最大 Lv.10)
  // ============================================================

  {
    id: 96, name: "ガイアノヴァ", element: "forest", rarity: "UR",
    description: "大地の意志の顕現。六属性の紋様が全身に刻まれた古代石像。",
    spriteUrl: "", baseScoutRate: 0.03, captureRate: 0.03, maxLevel: 10,
    favoriteAreas: ["nano_core"],
    favoriteWeather: ["sunny", "rainy", "cloudy", "snowy"],
    traits: [
      { id: "gaia_will", name: "ガイアのいし", description: "全属性スカウト率+20%",
        trigger: "on_own", effect: "scout_rate_up", value: 0.20, unlockLevel: 1 },
      { id: "earth_pulse", name: "だいちのどうき", description: "エンカウント+30%",
        trigger: "on_field", effect: "encounter_up", value: 0.30, unlockLevel: 3 },
      { id: "six_elements", name: "ろくぞくせい", description: "全天候でスカウト率ボーナス発生",
        trigger: "on_own", effect: "weather_boost", value: 2.0, unlockLevel: 5 },
      { id: "world_tree", name: "せかいじゅ", description: "レア出現率+25%",
        trigger: "on_field", effect: "rare_rate_up", value: 0.25, unlockLevel: 7 },
      { id: "gaia_mastery", name: "ガイアマスタリー", description: "全スカウト率+30%",
        trigger: "on_own", effect: "scout_rate_up", value: 0.30, unlockLevel: 9 },
    ],
  },
  {
    id: 100, name: "ナノウォーカー", element: "forest", rarity: "UR",
    description: "100万歩の歩行意志が具現化した旅人。光の粒子で出来た体。",
    spriteUrl: "", baseScoutRate: 0.03, captureRate: 0.03, maxLevel: 10,
    favoriteAreas: ["nano_core"],
    favoriteWeather: ["sunny", "cloudy"],
    traits: [
      { id: "million_steps", name: "ひゃくまんぽのきずな", description: "歩数が多い日ほどスカウト率アップ",
        trigger: "on_own", effect: "scout_rate_up", value: 0.25, unlockLevel: 1 },
      { id: "walker_spirit", name: "ウォーカーのたましい", description: "NE獲得量+30%",
        trigger: "on_own", effect: "ne_gain_up", value: 0.30, unlockLevel: 3 },
      { id: "path_finder", name: "みちをひらく", description: "全エリアスカウト率+20%",
        trigger: "on_own", effect: "scout_rate_up", value: 0.20, unlockLevel: 5 },
      { id: "endless_road", name: "かぎりなきみち", description: "レア出現率+30%",
        trigger: "on_field", effect: "rare_rate_up", value: 0.30, unlockLevel: 7 },
      { id: "walker_legend", name: "ウォーカーでんせつ", description: "全スカウト率+40%",
        trigger: "on_own", effect: "scout_rate_up", value: 0.40, unlockLevel: 9 },
    ],
  },
];

export function getMonsterById(id: number): MonsterDefinition | undefined {
  return MONSTER_POOL.find((m) => m.id === id);
}
