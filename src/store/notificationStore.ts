import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface NotificationStore {
  pushToken: string | null;
  dailyReminderScheduled: boolean;
  notifiedMilestones: number[];   // 今日通知済みのマイルストーン歩数
  lastMilestoneResetDate: string; // "YYYY-MM-DD"

  // Actions
  setPushToken: (token: string) => void;
  setDailyReminderScheduled: (v: boolean) => void;
  addNotifiedMilestone: (steps: number) => void;
  resetDailyMilestonesIfNeeded: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      pushToken: null,
      dailyReminderScheduled: false,
      notifiedMilestones: [],
      lastMilestoneResetDate: "",

      setPushToken: (token) => set({ pushToken: token }),

      setDailyReminderScheduled: (v) => set({ dailyReminderScheduled: v }),

      addNotifiedMilestone: (steps) =>
        set((s) => ({
          notifiedMilestones: s.notifiedMilestones.includes(steps)
            ? s.notifiedMilestones
            : [...s.notifiedMilestones, steps],
        })),

      /**
       * 日付が変わっていたらマイルストーン記録をリセット（毎朝リセット）
       */
      resetDailyMilestonesIfNeeded: () => {
        const today = new Date().toISOString().slice(0, 10);
        const { lastMilestoneResetDate } = get();
        if (lastMilestoneResetDate !== today) {
          set({ notifiedMilestones: [], lastMilestoneResetDate: today });
        }
      },
    }),
    {
      name: "nanowalk-notifications",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
