import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { GachaHistory, PurchaseState, SubscriptionStatus } from "@/types/monetization";
import type { RarityType } from "@/types";

// ---- Gacha ticket inventory ----
interface TicketInventory {
  any:  number;
  R:    number;
  SR:   number;
  SSR:  number;
  UR:   number;
}

interface MonetizationStore {
  // Resources
  nanoGems: number;
  tickets: TicketInventory;

  // Gacha history per banner (bannerId → history)
  gachaHistories: Record<string, GachaHistory>;

  // Season pass
  isPremium: boolean;
  premiumExpiresAt: string | null;   // ISO string
  seasonPoints: number;
  seasonPassLevel: number;
  claimedTiers: number[];            // claimed tier levels

  // Starter pack
  starterPackPurchased: boolean;

  // Actions
  addGems: (amount: number) => void;
  spendGems: (amount: number) => boolean;
  addTicket: (rarity: RarityType | "any", count?: number) => void;
  useTicket: (rarity: RarityType | "any") => boolean;
  getGachaHistory: (bannerId: string) => GachaHistory;
  updateGachaHistory: (bannerId: string, history: GachaHistory) => void;
  setPremium: (expiresAt: Date) => void;
  clearPremium: () => void;
  addSeasonPoints: (points: number) => void;
  claimTier: (tierLevel: number) => void;
  markStarterPackPurchased: () => void;
  getPurchaseState: () => PurchaseState;
}

const DEFAULT_TICKETS: TicketInventory = { any: 0, R: 0, SR: 0, SSR: 0, UR: 0 };

const DEFAULT_GACHA_HISTORY = (bannerId: string): GachaHistory => ({
  bannerId,
  pullCount:    0,
  ssrPityCount: 0,
  totalPulls:   0,
});

export const useMonetizationStore = create<MonetizationStore>()(
  persist(
    (set, get) => ({
      nanoGems: 0,
      tickets: { ...DEFAULT_TICKETS },
      gachaHistories: {},
      isPremium: false,
      premiumExpiresAt: null,
      seasonPoints: 0,
      seasonPassLevel: 0,
      claimedTiers: [],
      starterPackPurchased: false,

      addGems: (amount) =>
        set((s) => ({ nanoGems: s.nanoGems + amount })),

      spendGems: (amount) => {
        if (get().nanoGems < amount) return false;
        set((s) => ({ nanoGems: s.nanoGems - amount }));
        return true;
      },

      addTicket: (rarity, count = 1) =>
        set((s) => ({
          tickets: {
            ...s.tickets,
            [rarity]: (s.tickets[rarity as keyof TicketInventory] ?? 0) + count,
          },
        })),

      useTicket: (rarity) => {
        const count = get().tickets[rarity as keyof TicketInventory] ?? 0;
        if (count <= 0) return false;
        set((s) => ({
          tickets: {
            ...s.tickets,
            [rarity]: Math.max(0, (s.tickets[rarity as keyof TicketInventory] ?? 0) - 1),
          },
        }));
        return true;
      },

      getGachaHistory: (bannerId) =>
        get().gachaHistories[bannerId] ?? DEFAULT_GACHA_HISTORY(bannerId),

      updateGachaHistory: (bannerId, history) =>
        set((s) => ({
          gachaHistories: { ...s.gachaHistories, [bannerId]: history },
        })),

      setPremium: (expiresAt) =>
        set({ isPremium: true, premiumExpiresAt: expiresAt.toISOString() }),

      clearPremium: () =>
        set({ isPremium: false, premiumExpiresAt: null }),

      addSeasonPoints: (points) =>
        set((s) => {
          const newPoints = s.seasonPoints + points;
          // レベルアップ判定（1レベル = 100pt）
          const newLevel = Math.floor(newPoints / 100);
          return {
            seasonPoints: newPoints,
            seasonPassLevel: Math.max(s.seasonPassLevel, Math.min(newLevel, 30)),
          };
        }),

      claimTier: (tierLevel) =>
        set((s) => ({
          claimedTiers: s.claimedTiers.includes(tierLevel)
            ? s.claimedTiers
            : [...s.claimedTiers, tierLevel],
        })),

      markStarterPackPurchased: () =>
        set({ starterPackPurchased: true }),

      getPurchaseState: (): PurchaseState => {
        const { isPremium, premiumExpiresAt } = get();
        const expiresAt = premiumExpiresAt ? new Date(premiumExpiresAt) : null;
        const now = new Date();

        const isActive = isPremium && expiresAt !== null && expiresAt > now;
        const status: SubscriptionStatus = isActive
          ? "active"
          : isPremium
          ? "expired"
          : "none";

        return {
          isPremium: isActive,
          subscriptionStatus: status,
          expiresAt,
          neBonusPercent: isActive ? 25 : 0,
        };
      },
    }),
    {
      name: "nanowalk-monetization",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
