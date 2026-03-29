import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_900Black,
} from "@expo-google-fonts/nunito";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "../global.css"; // NativeWind

// Notification & background task setup
import { setupNotificationHandlers } from "@/services/notificationService";
import {
  registerBackgroundTask,
  resetDailyBackgroundState,
  BACKGROUND_STEP_TASK,
} from "@/services/backgroundTaskService";
import { useNotifications } from "@/hooks/useNotifications";
import { useNotificationStore } from "@/store/notificationStore";
import { useAuth } from "@/hooks/useAuth";
import { useSync } from "@/hooks/useSync";
import { seedDemoData } from "@/lib/demoSeed";

// backgroundTaskService はトップレベルで import することで
// TaskManager.defineTask を確実に登録する
import "@/services/backgroundTaskService";

// Notification handler をアプリ起動時に即座にセットアップ
setupNotificationHandlers();

// Keep splash visible while loading
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

// ---- Inner component (needs to be inside QueryClientProvider) ----
function AppInit() {
  const { resetDailyMilestonesIfNeeded } = useNotificationStore();

  // 通知権限・トークン取得・リスナー登録
  useNotifications();

  // 認証状態の監視（サインイン後に自動同期）
  useAuth();

  // バックグラウンド同期（5分間隔 + フォアグラウンド復帰時）
  useSync();

  useEffect(() => {
    (async () => {
      resetDailyMilestonesIfNeeded();
      await resetDailyBackgroundState();
      await registerBackgroundTask();
      seedDemoData(); // デモ用プレイヤー・エンカウントを自動セットアップ
    })();
  }, []);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AppInit />
        <StatusBar style="light" backgroundColor="#0D0D1A" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name="login"
            options={{ animation: "fade" }}
          />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="scout/[id]"
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="monster/[uuid]"
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="gacha/index"
            options={{ animation: "slide_from_bottom" }}
          />
          <Stack.Screen
            name="shop/index"
            options={{ animation: "slide_from_bottom" }}
          />
          <Stack.Screen
            name="quests/index"
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="settings/notifications"
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="ranking/index"
            options={{ animation: "slide_from_right" }}
          />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
