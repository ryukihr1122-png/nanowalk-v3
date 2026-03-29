/**
 * デモ用シードデータ
 * アプリ起動時にプレイヤー・エンカウントカードを自動セットアップ
 */

import { useEncounterStore } from "@/store/encounterStore";
import { usePlayerStore } from "@/store/playerStore";
import { MONSTER_POOL } from "@/constants/monsters";

const DEMO_MONSTER_IDS = [
  { id: 95 },  // ナノゴッド (UR)
  { id: 20 },  // ピカトン (SR)
  { id: 7  },  // メロメロン (R)
  { id: 1  },  // ナノバナナ (N)
  { id: 86 },  // ドラゴナノン (SSR)
];

export function seedDemoData() {
  const playerStore = usePlayerStore.getState();
  const encounterStore = useEncounterStore.getState();

  // ---- プレイヤーが未初期化なら作成 ----
  if (!playerStore.player) {
    playerStore.initPlayer("demo_user", "デモトレーナー");
  }

  // ---- 仲間（ナノバナナ）を未所持なら追加 ----
  const monsters = playerStore.monsters;
  if (monsters.length === 0) {
    playerStore.addOrLevelUp(1, "nano_plains"); // ナノバナナを追加
    // 追加後に相棒に設定
    setTimeout(() => {
      const updated = usePlayerStore.getState();
      const nanoBanana = updated.monsters.find((m) => m.definitionId === 1);
      if (nanoBanana && !updated.player?.companionId) {
        usePlayerStore.setState((s) => ({
          player: s.player ? { ...s.player, companionId: nanoBanana.uuid } : s.player,
        }));
      }
    }, 100);
  }

  // ---- エンカウントカードが空なら追加 ----
  if (encounterStore.cards.length === 0) {
    for (const { id } of DEMO_MONSTER_IDS) {
      const monster = MONSTER_POOL.find((m) => m.id === id);
      if (monster) {
        encounterStore.addMonsterCard(monster, "nano_plains", "sunny");
      }
    }
  }
}
