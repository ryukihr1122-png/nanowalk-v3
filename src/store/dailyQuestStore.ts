/**
 * NanoWalk — デイリークエスト
 *
 * 毎日0:00にリセット。
 * 全10種から5つをランダム選出。
 * 達成でアイテム・ジェム・ボール報酬。
 * 全5種クリアでボーナス報酬。
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ---- クエスト定義テンプレート ----

export type QuestTrigger =
  | "steps"
  | "capture"
  | "battle_win"
  | "battle_any"
  | "evolve"
  | "use_item"
  | "walk_morning"   // 早朝（5-8時）に歩く
  | "capture_rare"   // SR以上を捕獲
  | "login"
  | "companion_walk"; // 相棒と5,000歩

export interface QuestTemplate {
  id: string;
  title: string;
  description: string;
  emoji: string;
  trigger: QuestTrigger;
  target: number;
  reward: QuestReward;
  difficulty: "easy" | "normal" | "hard";
}

export interface QuestReward {
  type: "gems" | "item" | "ball" | "ne";
  value: number | string;
  quantity: number;
  label: string;
  emoji: string;
}

export const QUEST_TEMPLATES: QuestTemplate[] = [
  {
    id: "q_steps_3k",
    title: "軽くお散歩",
    description: "今日3,000歩歩く",
    emoji: "👟",
    trigger: "steps",
    target: 3000,
    reward: { type: "item", value: "stay_extend_s", quantity: 1, label: "おやつ（小）×1", emoji: "🍪" },
    difficulty: "easy",
  },
  {
    id: "q_steps_7k",
    title: "しっかりウォーク",
    description: "今日7,000歩歩く",
    emoji: "🚶",
    trigger: "steps",
    target: 7000,
    reward: { type: "gems", value: 40, quantity: 1, label: "40ジェム", emoji: "💎" },
    difficulty: "normal",
  },
  {
    id: "q_steps_10k",
    title: "１万歩チャレンジ",
    description: "今日10,000歩歩く",
    emoji: "🏃",
    trigger: "steps",
    target: 10000,
    reward: { type: "item", value: "ne_boost_m", quantity: 1, label: "エナジードリンク（大）×1", emoji: "⚡" },
    difficulty: "hard",
  },
  {
    id: "q_capture_3",
    title: "ナノン捕獲",
    description: "モンスターを3体捕獲する",
    emoji: "⚪",
    trigger: "capture",
    target: 3,
    reward: { type: "stone", value: "glow", quantity: 2, label: "グローストーン×2", emoji: "💎" },
    difficulty: "easy",
  },
  {
    id: "q_capture_5",
    title: "ハンター",
    description: "モンスターを5体捕獲する",
    emoji: "🎯",
    trigger: "capture",
    target: 5,
    reward: { type: "item", value: "scout_jam", quantity: 1, label: "ナノジャム×1", emoji: "🫙" },
    difficulty: "normal",
  },
  {
    id: "q_battle_5",
    title: "バトル練習",
    description: "バトルを5回行う（勝敗問わず）",
    emoji: "⚔️",
    trigger: "battle_any",
    target: 5,
    reward: { type: "item", value: "scout_brush", quantity: 2, label: "なでなでブラシ×2", emoji: "🪮" },
    difficulty: "easy",
  },
  {
    id: "q_battle_win_3",
    title: "バトルマスター",
    description: "バトルに3回勝利する",
    emoji: "🏆",
    trigger: "battle_win",
    target: 3,
    reward: { type: "gems", value: 30, quantity: 1, label: "30ジェム", emoji: "💎" },
    difficulty: "normal",
  },
  {
    id: "q_morning_walk",
    title: "朝のお散歩",
    description: "早朝（5〜8時）に2,000歩歩く",
    emoji: "🌅",
    trigger: "walk_morning",
    target: 2000,
    reward: { type: "item", value: "encounter_up_s", quantity: 1, label: "ナノホイッスル×1", emoji: "📯" },
    difficulty: "normal",
  },
  {
    id: "q_capture_rare",
    title: "レアハンター",
    description: "SR以上のモンスターを1体捕獲する",
    emoji: "🌟",
    trigger: "capture_rare",
    target: 1,
    reward: { type: "item", value: "rare_up_s", quantity: 1, label: "キラキラスプレー×1", emoji: "✨" },
    difficulty: "hard",
  },
  {
    id: "q_companion_walk",
    title: "相棒と一緒に",
    description: "相棒モンスターと5,000歩歩く",
    emoji: "💖",
    trigger: "companion_walk",
    target: 5000,
    reward: { type: "item", value: "stay_extend_m", quantity: 1, label: "おやつ（中）×1", emoji: "🍰" },
    difficulty: "normal",
  },
];

// 全5問クリアのボーナス報酬
export const DAILY_CLEAR_BONUS: QuestReward = {
  type: "item",
  value: "super_magnet",
  quantity: 1,
  label: "スーパーマグネット×1",
  emoji: "🧲",
};

// ---- Active Quest ----

export interface ActiveQuest {
  templateId: string;
  current: number;
  completed: boolean;
  claimed: boolean;
}

// ---- Store ----

interface DailyQuestStore {
  date: string;                        // "YYYY-MM-DD"
  quests: ActiveQuest[];               // 今日の5クエスト
  allClearClaimed: boolean;

  // Actions
  refreshIfNeeded: () => void;
  progress: (trigger: QuestTrigger, amount?: number) => string[]; // 達成したtemplateIdリスト
  claimReward: (templateId: string) => QuestReward | null;
  claimAllClearBonus: () => QuestReward | null;
  getTemplate: (templateId: string) => QuestTemplate | undefined;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function pickDailyQuests(): ActiveQuest[] {
  // シード: 日付文字列のハッシュ（同じ日は同じ選出）
  const today = todayStr();
  let seed = today.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const prng = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return Math.abs(seed) / 0xffffffff;
  };

  const pool = [...QUEST_TEMPLATES];
  const selected: QuestTemplate[] = [];
  // easy×2, normal×2, hard×1
  const diffCounts: Record<string, number> = { easy: 2, normal: 2, hard: 1 };

  for (const [diff, count] of Object.entries(diffCounts)) {
    const candidates = pool.filter((q) => q.difficulty === diff && !selected.includes(q));
    for (let i = 0; i < count && candidates.length > 0; i++) {
      const idx = Math.floor(prng() * candidates.length);
      selected.push(candidates.splice(idx, 1)[0]);
    }
  }

  return selected.map((t) => ({
    templateId: t.id,
    current: 0,
    completed: false,
    claimed: false,
  }));
}

export const useDailyQuestStore = create<DailyQuestStore>()(
  persist(
    (set, get) => ({
      date: "",
      quests: [],
      allClearClaimed: false,

      refreshIfNeeded: () => {
        const today = todayStr();
        if (get().date !== today) {
          set({
            date: today,
            quests: pickDailyQuests(),
            allClearClaimed: false,
          });
        }
      },

      progress: (trigger, amount = 1) => {
        const newly: string[] = [];
        set((s) => ({
          quests: s.quests.map((q) => {
            if (q.completed) return q;
            const tmpl = QUEST_TEMPLATES.find((t) => t.id === q.templateId);
            if (!tmpl || tmpl.trigger !== trigger) return q;

            const newCurrent = Math.min(q.current + amount, tmpl.target);
            const completed = newCurrent >= tmpl.target;
            if (completed && !q.completed) newly.push(q.templateId);
            return { ...q, current: newCurrent, completed };
          }),
        }));
        return newly;
      },

      claimReward: (templateId) => {
        const quest = get().quests.find((q) => q.templateId === templateId);
        if (!quest || !quest.completed || quest.claimed) return null;

        set((s) => ({
          quests: s.quests.map((q) =>
            q.templateId === templateId ? { ...q, claimed: true } : q
          ),
        }));

        return QUEST_TEMPLATES.find((t) => t.id === templateId)?.reward ?? null;
      },

      claimAllClearBonus: () => {
        const { quests, allClearClaimed } = get();
        if (allClearClaimed) return null;
        const allDone = quests.every((q) => q.completed && q.claimed);
        if (!allDone) return null;
        set({ allClearClaimed: true });
        return DAILY_CLEAR_BONUS;
      },

      getTemplate: (templateId) =>
        QUEST_TEMPLATES.find((t) => t.id === templateId),
    }),
    {
      name: "nanowalk-daily-quests",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
