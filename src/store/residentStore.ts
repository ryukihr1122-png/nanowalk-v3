import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ResidentMonster } from "@/types";
import {
  evictExpired,
  makeRoomForNew,
  MAX_RESIDENTS,
} from "@/services/residencyService";

interface ResidentStore {
  residents: ResidentMonster[];

  // Actions
  addResident: (r: ResidentMonster) => { added: boolean; reason?: string };
  removeResident: (id: string) => void;
  purgeExpired: () => ResidentMonster[];   // 期限切れを削除して返す
  hasResident: (monsterId: number) => boolean;
}

export const useResidentStore = create<ResidentStore>()(
  persist(
    (set, get) => ({
      residents: [],

      addResident: (r) => {
        const current = get().residents;

        // 重複チェック
        if (current.some((x) => x.id === r.id)) {
          return { added: false, reason: "already_exists" };
        }

        // 期限切れを除去
        const { active } = evictExpired(current);

        // スロット確保
        const made = active.length >= MAX_RESIDENTS
          ? makeRoomForNew(active)
          : active;

        set({ residents: [...made, r] });
        return { added: true };
      },

      removeResident: (id) =>
        set((s) => ({ residents: s.residents.filter((r) => r.id !== id) })),

      purgeExpired: () => {
        const { active, evicted } = evictExpired(get().residents);
        if (evicted.length > 0) set({ residents: active });
        return evicted;
      },

      hasResident: (monsterId) =>
        get().residents.some((r) => r.monsterId === monsterId),
    }),
    {
      name: "nanowalk-residents",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
